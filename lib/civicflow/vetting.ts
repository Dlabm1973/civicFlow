import {env} from 'cloudflare:workers';
import {Zip, ZipPassThrough, strToU8} from 'fflate';
import {database, isoNow, updateCase, audit} from './repository';
import {invalid} from './review';
export async function handoff(caseId: string, actor: string, body: any) {
 const db=database(); const now=isoNow();
 if(body.action==='PREPARE') {
  if(!['INDYREACH','MANUAL','THIRD_PARTY'].includes(body.target)) invalid('Choose a vetting destination');
  const row=await db.prepare('SELECT * FROM cases WHERE id = ?').bind(caseId).first<any>();
  if(!row?.submitted_at || row.current_state !== 'READY_FOR_VETTING') invalid('Submit the application and pass all basic document checks first');
  const requirements=(await db.prepare('SELECT * FROM document_requirements WHERE case_id = ?').bind(caseId).all<any>()).results || [];
  if(!requirements.length || requirements.some(r=>r.mandatory && r.status!=='BASIC_CHECK_PASSED')) invalid('Every required document must pass its basic check');
  const documents=[];
  for(const requirement of requirements) {
   const doc=await db.prepare('SELECT * FROM documents WHERE requirement_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1').bind(requirement.id).first<any>();
   if(doc) { const {object_key,...safe}=doc; documents.push(safe); }
  }
  const people=(await db.prepare('SELECT * FROM persons WHERE case_id = ?').bind(caseId).all()).results;
  const incomes=(await db.prepare('SELECT * FROM income_items WHERE case_id = ?').bind(caseId).all()).results;
  const reviews=(await db.prepare('SELECT * FROM document_reviews WHERE case_id = ? ORDER BY created_at').bind(caseId).all()).results;
  const packet={scope:'Basic completeness and legibility checks only. Identity validity, authenticity, legal vetting and decisions must be performed by the receiving reviewer.', prepared_at:now,destination:body.target,case:row,people,incomes,requirements,documents,reviews};
  const id=crypto.randomUUID();
  await db.prepare("INSERT INTO vetting_handoffs (id,case_id,target,status,packet_json,created_by,created_at,updated_at) VALUES (?,?,?,'PREPARED',?,?,?,?)").bind(id,caseId,body.target,JSON.stringify(packet),actor,now,now).run();
  await audit({caseId,actorType:'STAFF_USER',actorId:actor,eventCode:'VETTING_PACKET_PREPARED',entityType:'HANDOFF',entityId:id,detail:{target:body.target}});
  return {id};
 }
 const entry=await db.prepare('SELECT * FROM vetting_handoffs WHERE id = ? AND case_id = ?').bind(body.handoffId || '',caseId).first<any>();
 if(!entry) invalid('Prepare a handoff first');
 if(body.action==='SENT') {
  const state=await db.prepare('SELECT current_state FROM cases WHERE id=?').bind(caseId).first<any>();
  if(state?.current_state!=='READY_FOR_VETTING') invalid('The application is not ready for forwarding');
  if(entry.status!=='PREPARED' || !body.externalReference?.trim()) invalid('Enter the receiving reviewer’s reference and confirm the packet was actually forwarded');
  const packet=JSON.parse(entry.packet_json);
  const requirements=(await db.prepare('SELECT * FROM document_requirements WHERE case_id = ?').bind(caseId).all<any>()).results || [];
  if(requirements.some(r=>r.mandatory && r.status!=='BASIC_CHECK_PASSED')) invalid('The basic checks have changed; prepare a new packet');
  for(const doc of packet.documents) {
   const latest=await db.prepare('SELECT id FROM documents WHERE requirement_id = ? ORDER BY created_at DESC,rowid DESC LIMIT 1').bind(doc.requirement_id).first<any>();
   if(latest?.id!==doc.id) invalid('A document has changed; prepare a new packet');
  }
  await db.prepare("UPDATE vetting_handoffs SET status='SENT', external_reference=?, updated_at=? WHERE id=?").bind(body.externalReference.trim(),now,entry.id).run();
  await updateCase(caseId,{state:'VETTING_IN_PROGRESS',assignedQueue:'EXTERNAL_VETTING'});
 } else if(body.action==='OUTCOME') {
  if(entry.status!=='SENT') invalid('Record a returned result only after forwarding the application');
  const states:Record<string,string>={UNDER_REVIEW:'VETTING_IN_PROGRESS',APPROVED:'OUTCOME_APPROVED',DECLINED:'OUTCOME_DECLINED',INFORMATION_REQUIRED:'OUTCOME_INFORMATION_REQUIRED'};
  if(!states[body.outcome] || !body.reason?.trim()) invalid('Choose the returned outcome and record the reviewer’s reason or evidence reference');
  await db.prepare('INSERT INTO vetting_outcomes (id,handoff_id,outcome,reason,actor,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),entry.id,body.outcome,body.reason.trim(),actor,now).run();
  if(body.outcome!=='UNDER_REVIEW') await db.prepare("UPDATE vetting_handoffs SET status='RETURNED',updated_at=? WHERE id=?").bind(now,entry.id).run();
  await updateCase(caseId,{state:states[body.outcome],assignedQueue:body.outcome==='INFORMATION_REQUIRED'?'RESIDENT_RESPONSE':'EXTERNAL_VETTING'});
 } else invalid('Unsupported handoff action');
 await audit({caseId,actorType:'STAFF_USER',actorId:actor,eventCode:'VETTING_'+body.action,entityType:'HANDOFF',entityId:entry.id,detail:{destination:entry.target,outcome:body.outcome || null,reason:body.reason || null,externalReference:body.externalReference || entry.external_reference}});
 return {id:entry.id};
}
export async function handoffArchive(caseId:string, id:string) {
 const entry=await database().prepare('SELECT * FROM vetting_handoffs WHERE id=? AND case_id=?').bind(id,caseId).first<any>();
 if(!entry) invalid('Handoff not found');
 const packet=JSON.parse(entry.packet_json); const files: {doc:any;object:R2ObjectBody}[]=[];
 for(const doc of packet.documents) {
  const row=await database().prepare('SELECT object_key FROM documents WHERE id=? AND case_id=?').bind(doc.id,caseId).first<any>();
  const object=row && await env.BUCKET?.get(row.object_key);
  if(!object) invalid('A document file is missing; the bundle cannot be downloaded');
  files.push({doc,object});
 }
 let release:(()=>void)|undefined; let cancelled=false;
 const stream=new ReadableStream<Uint8Array>({
  start(controller) {
   const zip=new Zip((error,data,final)=>{if(cancelled)return;if(error){controller.error(error);cancelled=true;}else{controller.enqueue(data);if(final)controller.close();}});
   void (async()=>{
    const manifest=new ZipPassThrough('application.json');zip.add(manifest);manifest.push(strToU8(JSON.stringify(packet,null,2)),true);
    for(const {doc,object} of files) {
     const file=new ZipPassThrough(`documents/${doc.id}-${doc.original_filename.replace(/[^a-zA-Z0-9._-]/g,'-')}`);zip.add(file);
     const reader=object.body.getReader();
     try { while(!cancelled) {if((controller.desiredSize ?? 1)<=0)await new Promise<void>(resolve=>{release=resolve;});if(cancelled)break;const chunk=await reader.read();if(chunk.done){file.push(new Uint8Array(),true);break;}file.push(chunk.value);} } finally {await reader.cancel();}
    }
    if(!cancelled)zip.end();
   })().catch(error=>{if(!cancelled)controller.error(error);});
  },pull(){release?.();release=undefined;},cancel(){cancelled=true;release?.();}
 });
 return new Response(stream,{headers:{'Content-Type':'application/zip','Content-Disposition':`attachment; filename="civicflow-${id}.zip"`,'Cache-Control':'private, no-store'}});
}

import { database, audit, isoNow, updateCase } from './repository';
export function checklist(code: string): string[] {
  const common = ['All required pages are present', 'Text and relevant details are clear and legible', 'The uploaded document matches the requested document type'];
  if (/IDENTITY|ID_|PASSPORT/.test(code)) return [...common, 'Name and identity reference are visible', 'Photograph is visible where the document includes one'];
  if (/AFFIDAVIT/.test(code)) return [...common, 'Declarant, declaration and date are visible', 'Required signature and commissioner fields are present and readable'];
  if (/DIVORCE/.test(code)) return [...common, 'Parties, court or issuing authority and date are visible', 'Pages recording the property award are present and legible'];
  if (/LEASE/.test(code)) return [...common, 'Parties, property description and agreement dates are visible', 'Required signature fields or source confirmation are visible'];
  if (/AUTHORITY|GUARDIAN/.test(code)) return [...common, 'Appointed person, subject or estate and reference are visible', 'Issuing authority, date and appointment details are readable'];
  if (/INCOME|PAY|BANK|GRANT|PENSION/.test(code)) return [...common, 'Person or account holder is visible', 'Source, relevant date or period and amount are visible'];

  return [...common, 'Relevant names, dates and document reference are visible', 'Required issuer or signature fields are visible where applicable'];
}
export function invalid(message: string): never { throw new Response(JSON.stringify({error: message}), {status: 400, headers: {'Content-Type':'application/json'}}); }
export async function reviewDocument(id: string, actor: string, body: {pass?: boolean; checked?: string[]; reason?: string}) {
  const db = database();
  const doc = await db.prepare('SELECT d.*, r.requirement_code FROM documents d JOIN document_requirements r ON r.id = d.requirement_id WHERE d.id = ?').bind(id).first<any>();
  if (!doc) invalid('A linked document is required');
  const current = await db.prepare('SELECT id FROM documents WHERE requirement_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1').bind(doc.requirement_id).first<any>();
  if (current?.id !== id) invalid('Review the latest upload');
  const state = await db.prepare('SELECT current_state FROM cases WHERE id=?').bind(doc.case_id).first<any>();
  if (['OUTCOME_APPROVED','OUTCOME_DECLINED'].includes(state?.current_state)) invalid('This application already has a returned decision');
  const active = await db.prepare("SELECT id FROM vetting_handoffs WHERE case_id = ? AND status = 'SENT'").bind(doc.case_id).first();
  if (active) invalid('The documents have been forwarded; record the returned result first');
  const checks = checklist(doc.requirement_code);
  if (body.pass && !checks.every(c => body.checked?.includes(c))) invalid('Confirm every basic check before passing');
  if (!body.pass && !body.reason?.trim()) invalid('Explain which details need a clearer or complete upload');
  const status = body.pass ? 'BASIC_CHECK_PASSED' : 'BASIC_REUPLOAD_REQUIRED';
  await db.batch([
    db.prepare('INSERT INTO document_reviews (id, document_id, case_id, status, checklist_json, reason, reviewer, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(),id,doc.case_id,status,JSON.stringify(body.checked || []),body.reason || null,actor,isoNow()),
    db.prepare('UPDATE documents SET status = ? WHERE id = ?').bind(status,id),
    db.prepare('UPDATE document_requirements SET status = ? WHERE id = ?').bind(status,doc.requirement_id)
  ]);
  const outstanding = await db.prepare("SELECT count(*) AS n FROM document_requirements WHERE case_id = ? AND mandatory = 1 AND status != 'BASIC_CHECK_PASSED'").bind(doc.case_id).first<any>();
  const caseRow = await db.prepare('SELECT submitted_at FROM cases WHERE id = ?').bind(doc.case_id).first<any>();
  await updateCase(doc.case_id,{state: !body.pass ? 'DOCUMENT_REUPLOAD_REQUIRED' : outstanding.n === 0 && caseRow.submitted_at ? 'READY_FOR_VETTING' : 'DOCUMENTS_UNDER_REVIEW', assignedQueue:'DOCUMENT_BASIC_REVIEW'});
  await audit({caseId:doc.case_id,actorType:'STAFF_USER',actorId:actor,eventCode:'DOCUMENT_BASIC_REVIEW',entityType:'DOCUMENT',entityId:id,detail:{status,reason:body.reason || null,scope:'Completeness and legibility only; no authenticity, ID validity or legal vetting'}});
}

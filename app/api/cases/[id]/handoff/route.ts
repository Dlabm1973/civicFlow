import {requireStaff} from '@/lib/civicflow/staff-auth';
import {handoff,handoffArchive} from '@/lib/civicflow/vetting';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
 try {const actor=requireStaff(request);const {id}=await params;return Response.json(await handoff(id,actor,await request.json()));}
 catch(error){if(error instanceof Response)return error;return Response.json({error:'Unable to update vetting handoff'},{status:500});}
}
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
 try {requireStaff(request);const {id}=await params;return await handoffArchive(id,new URL(request.url).searchParams.get('handoffId') || '');}
 catch(error){if(error instanceof Response)return error;return Response.json({error:'Unable to download handoff'},{status:500});}
}

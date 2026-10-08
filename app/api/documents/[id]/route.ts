import { env } from "cloudflare:workers";
import { database } from "@/lib/civicflow/repository";
import { requireStaff } from "@/lib/civicflow/staff-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireStaff(request);
    const { id } = await params;
    const document = await database()
      .prepare(
        "SELECT object_key, original_filename, mime_type FROM documents WHERE id = ? LIMIT 1"
      )
      .bind(id)
      .first<{ object_key: string; original_filename: string; mime_type: string }>();
    if (!document) return new Response("Document not found", { status: 404 });
    const object = await env.BUCKET?.get(document.object_key);
    if (!object) return new Response("Document file not found", { status: 404 });
    return new Response(object.body, {
      headers: {
        "Content-Type": document.mime_type,
        "Content-Disposition": `inline; filename="${document.original_filename.replace(/[\"\r\n]/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("document_read_failed", error);
    return new Response("Unable to open document", { status: 500 });
  }
}


export async function PATCH(request: Request, {params}: {params: Promise<{id:string}>}) {
  try {
    const actor = requireStaff(request);
    const {id} = await params;
    const {reviewDocument} = await import('@/lib/civicflow/review');
    await reviewDocument(id, actor, await request.json());
    return Response.json({ok:true});
  } catch(error) {
    if(error instanceof Response) return error;
    return Response.json({error:'Unable to save basic review'}, {status:500});
  }
}

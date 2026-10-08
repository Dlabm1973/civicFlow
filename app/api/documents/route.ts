import { NextResponse } from "next/server";
import { database } from "@/lib/civicflow/repository";
import { storeDocument } from "@/lib/civicflow/documents";
import { requireStaff } from "@/lib/civicflow/staff-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireStaff(request);
    const form = await request.formData();
    const file = form.get("file");
    const caseId = String(form.get("caseId") || "");
    const requirementId = String(form.get("requirementId") || "");
    const sessionId = String(form.get("sessionId") || "");
    if (!(file instanceof File) || !caseId || !requirementId || !sessionId) {
      return NextResponse.json({ error: "File, case, requirement and session are required" }, { status: 400 });
    }
    const owner = await database()
      .prepare("SELECT id FROM sessions WHERE id = ? AND case_id = ? LIMIT 1")
      .bind(sessionId, caseId)
      .first<{ id: string }>();
    if (!owner) return NextResponse.json({ error: "This session cannot upload to that case" }, { status: 403 });
    const result = await storeDocument({
      caseId,
      requirementId,
      filename: file.name,
      mimeType: file.type,
      bytes: await file.arrayBuffer(),
      sourceChannel: "WEB",
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("document_upload_failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}

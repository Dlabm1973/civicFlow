import { env } from "cloudflare:workers";
import { audit, database, isoNow } from "./repository";

const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_BYTES = 10 * 1024 * 1024;

function cleanFilename(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return cleaned.slice(-120) || "document";
}

async function hashBytes(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function storeDocument(input: {
  caseId: string;
  requirementId?: string | null;
  filename: string;
  mimeType: string;
  bytes: ArrayBuffer;
  sourceChannel: string;
  personId?: string | null;
}) {
  if (!env.BUCKET) throw new Error("CivicFlow document storage is unavailable");
  if (!ALLOWED.has(input.mimeType)) {
    throw new Error("Upload a PDF, JPEG or PNG file");
  }
  if (input.bytes.byteLength < 1 || input.bytes.byteLength > MAX_BYTES) {
    throw new Error("The file must be between 1 byte and 10 MB");
  }
  const caseRow = await database()
    .prepare("SELECT id FROM cases WHERE id = ? LIMIT 1")
    .bind(input.caseId)
    .first<{ id: string }>();
  if (!caseRow) throw new Error("Case not found");

  let personId = input.personId ?? null;
  if (input.requirementId) {
    const requirement = await database()
      .prepare(
        "SELECT id, person_id FROM document_requirements WHERE id = ? AND case_id = ? LIMIT 1"
      )
      .bind(input.requirementId, input.caseId)
      .first<{ id: string; person_id: string | null }>();
    if (!requirement) throw new Error("Document requirement not found");
    personId = personId || requirement.person_id;
  }

  const documentId = crypto.randomUUID();
  const objectKey = `${input.caseId}/${documentId}-${cleanFilename(input.filename)}`;
  const contentHash = await hashBytes(input.bytes);
  await env.BUCKET.put(objectKey, input.bytes, {
    httpMetadata: { contentType: input.mimeType },
    customMetadata: {
      caseId: input.caseId,
      documentId,
      sourceChannel: input.sourceChannel,
    },
  });
  await database()
    .prepare(
      "INSERT INTO documents (id, case_id, requirement_id, person_id, object_key, original_filename, mime_type, file_size, content_hash, status, source_channel, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'UPLOADED_PENDING_REVIEW', ?, ?)"
    )
    .bind(
      documentId,
      input.caseId,
      input.requirementId ?? null,
      personId,
      objectKey,
      input.filename,
      input.mimeType,
      input.bytes.byteLength,
      contentHash,
      input.sourceChannel,
      isoNow()
    )
    .run();
  if (input.requirementId) {
    await database()
      .prepare(
        "UPDATE document_requirements SET status = 'UPLOADED_PENDING_REVIEW' WHERE id = ? AND case_id = ?"
      )
      .bind(input.requirementId, input.caseId)
      .run();
  }
  await audit({
    caseId: input.caseId,
    actorType: input.sourceChannel === "WHATSAPP" ? "RESIDENT" : "USER",
    eventCode: "DOCUMENT_RECEIVED",
    entityType: "DOCUMENT",
    entityId: documentId,
    detail: {
      requirementId: input.requirementId,
      mimeType: input.mimeType,
      size: input.bytes.byteLength,
      contentHash,
    },
  });
  return { documentId, status: "UPLOADED_PENDING_REVIEW" };
}


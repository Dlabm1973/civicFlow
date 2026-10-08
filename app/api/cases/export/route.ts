import { database, audit } from "@/lib/civicflow/repository";
import { requireStaff } from "@/lib/civicflow/staff-auth";
import { csvRow } from "@/lib/civicflow/export";

export const dynamic = "force-dynamic";

const columns: Record<string, string[]> = {
  cases: ["reference", "applicant_name", "current_state", "language", "property_label", "mobile_masked", "assigned_queue", "priority", "channel", "progress", "adult_count", "gross_monthly_income_rand", "documents_received", "created_at", "updated_at", "submitted_at"],
  households: ["reference", "full_name", "role", "identity_type", "identity_masked", "income_status", "created_at"],
  incomes: ["reference", "person_name", "income_type", "gross_monthly_amount_rand", "frequency", "verification_status", "created_at"],
};
const filter = "(? = '' OR c.reference LIKE ? OR c.applicant_name LIKE ? OR c.property_label LIKE ?) AND (? = '' OR c.current_state = ?)";
const select: Record<string, string> = {
  cases: `SELECT c.*, (SELECT COUNT(*) FROM persons WHERE case_id = c.id) AS adult_count,
    COALESCE((SELECT SUM(gross_amount_cents) FROM income_items WHERE case_id = c.id), 0) / 100.0 AS gross_monthly_income_rand,
    (SELECT COUNT(*) FROM documents WHERE case_id = c.id) AS documents_received FROM cases c`,
  households: "SELECT c.reference, p.* FROM persons p JOIN cases c ON c.id = p.case_id",
  incomes: "SELECT c.reference, p.full_name AS person_name, i.*, i.gross_amount_cents / 100.0 AS gross_monthly_amount_rand FROM income_items i JOIN cases c ON c.id = i.case_id LEFT JOIN persons p ON p.id = i.person_id",
};
const aliases: Record<string, string> = { cases: "c", households: "p", incomes: "i" };

export async function GET(request: Request) {
  try {
    const actorId = requireStaff(request);
    const url = new URL(request.url);
    const dataset = url.searchParams.get("dataset") || "cases";
    if (!["cases", "households", "incomes", "full"].includes(dataset)) return new Response("Unknown export dataset", { status: 400 });
    const query = (url.searchParams.get("query") || "").trim();
    const state = (url.searchParams.get("state") || "").trim();
    const search = `%${query}%`;
    const exportedAt = new Date().toISOString();
    await audit({ actorType: "STAFF_USER", actorId, eventCode: "BULK_EXPORT_REQUESTED", entityType: "EXPORT", detail: { dataset, query, state, exportedAt } });
    const db = database();
    const bindings = [query, search, search, search, state, state];

    async function* records() {
      if (dataset !== "full") yield "\uFEFF" + csvRow(columns[dataset]);
      else yield `{"exportedAt":${JSON.stringify(exportedAt)},"cases":[`;
      const alias = aliases[dataset] || "c";
      let after = "";
      let first = true;
      for (;;) {
        const sql = `${select[dataset] || "SELECT c.* FROM cases c"} WHERE ${filter} AND ${alias}.id > ? ORDER BY ${alias}.id LIMIT 100`;
        const page = await db.prepare(sql).bind(...bindings, after).all<Record<string, unknown>>();
        const rows = page.results || [];
        if (!rows.length) break;
        for (const row of rows) {
          if (dataset !== "full") yield csvRow(columns[dataset].map(key => row[key]));
          else {
            const id = String(row.id);
            const [people, incomes, requirements, documents, tasks, notifications] = await Promise.all([
              db.prepare("SELECT * FROM persons WHERE case_id = ? ORDER BY created_at").bind(id).all(),
              db.prepare("SELECT * FROM income_items WHERE case_id = ? ORDER BY created_at").bind(id).all(),
              db.prepare("SELECT * FROM document_requirements WHERE case_id = ? ORDER BY created_at").bind(id).all(),
              db.prepare("SELECT id, requirement_id, original_filename, mime_type, file_size, status, source_channel, created_at FROM documents WHERE case_id = ? ORDER BY created_at").bind(id).all(),
              db.prepare("SELECT * FROM tasks WHERE case_id = ? ORDER BY created_at").bind(id).all(),
              db.prepare("SELECT id, case_state, status, error, created_at, updated_at FROM whatsapp_notifications WHERE case_id = ? ORDER BY created_at").bind(id).all(),
            ]);
            yield (first ? "" : ",") + JSON.stringify({ case: row, people: people.results || [], incomes: incomes.results || [], requirements: requirements.results || [], documents: documents.results || [], tasks: tasks.results || [], notifications: notifications.results || [] });
            first = false;
          }
        }
        after = String(rows[rows.length - 1].id);
      }
      if (dataset === "full") yield "]}";
    }
    const iterator = records();
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async pull(controller) {
        try { const item = await iterator.next(); if (item.done) controller.close(); else controller.enqueue(encoder.encode(item.value)); }
        catch (error) { controller.error(error); }
      },
      async cancel() { await iterator.return(undefined); },
    });
    const extension = dataset === "full" ? "json" : "csv";
    return new Response(stream, { headers: {
      "Content-Type": dataset === "full" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="civicflow-${dataset}-${exportedAt.slice(0, 10)}.${extension}"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("bulk_export_failed", error);
    return new Response("Unable to export the records", { status: 500 });
  }
}

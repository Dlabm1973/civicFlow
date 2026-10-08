import { NextResponse } from "next/server";
import { database } from "@/lib/civicflow/repository";
import { requireStaff } from "@/lib/civicflow/staff-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireStaff(request);
    const url = new URL(request.url);
    const query = (url.searchParams.get("query") || "").trim();
    const state = (url.searchParams.get("state") || "").trim();
    const search = `%${query}%`;
    const result = await database()
      .prepare(
        "SELECT id, reference, applicant_name, case_type, current_state, progress, property_label, assigned_queue, priority, channel, updated_at, created_at FROM cases WHERE (? = '' OR reference LIKE ? OR applicant_name LIKE ? OR property_label LIKE ?) AND (? = '' OR current_state = ?) ORDER BY updated_at DESC LIMIT 100"
      )
      .bind(query, search, search, search, state, state)
      .all<Record<string, unknown>>();
    const stats = await database()
      .prepare(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN current_state IN ('SUBMITTED','OFFICIAL_CERTIFICATION_REQUIRED','VERIFICATION','UNDER_ASSESSMENT') THEN 1 ELSE 0 END) AS under_review, SUM(CASE WHEN current_state = 'DOCUMENTS_OUTSTANDING' THEN 1 ELSE 0 END) AS documents_outstanding, SUM(CASE WHEN current_state = 'SITE_VISIT_REQUIRED' THEN 1 ELSE 0 END) AS site_visits, SUM(CASE WHEN current_state = 'INFORMATION_REQUIRED' THEN 1 ELSE 0 END) AS information_required, SUM(CASE WHEN current_state = 'IMPLEMENTATION_FAILED' THEN 1 ELSE 0 END) AS integration_failures FROM cases"
      )
      .first<Record<string, number>>();
    return NextResponse.json({ cases: result.results ?? [], stats: stats ?? {} });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("case_list_failed", error);
    return NextResponse.json({ error: "Unable to load cases" }, { status: 500 });
  }
}


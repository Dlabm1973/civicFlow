import { NextResponse } from "next/server";
import { addTask, audit, database, updateCase } from "@/lib/civicflow/repository";
import { requireStaff } from "@/lib/civicflow/staff-auth";

export const dynamic = "force-dynamic";

async function details(id: string) {
  const db = database();
  const [caseRow, people, incomes, requirements, documents, tasks, events] = await Promise.all([
    db.prepare("SELECT * FROM cases WHERE id = ? LIMIT 1").bind(id).first<Record<string, unknown>>(),
    db.prepare("SELECT * FROM persons WHERE case_id = ? ORDER BY created_at").bind(id).all<Record<string, unknown>>(),
    db.prepare("SELECT income_items.*, persons.full_name AS person_name FROM income_items LEFT JOIN persons ON persons.id = income_items.person_id WHERE income_items.case_id = ? ORDER BY income_items.created_at").bind(id).all<Record<string, unknown>>(),
    db.prepare("SELECT * FROM document_requirements WHERE case_id = ? ORDER BY created_at").bind(id).all<Record<string, unknown>>(),
    db.prepare("SELECT id, requirement_id, original_filename, mime_type, file_size, status, source_channel, created_at FROM documents WHERE case_id = ? ORDER BY created_at DESC").bind(id).all<Record<string, unknown>>(),
    db.prepare("SELECT * FROM tasks WHERE case_id = ? ORDER BY created_at DESC").bind(id).all<Record<string, unknown>>(),
    db.prepare("SELECT * FROM audit_events WHERE case_id = ? ORDER BY created_at DESC LIMIT 100").bind(id).all<Record<string, unknown>>(),
  ]);
  return {
    case: caseRow,
    people: people.results ?? [],
    incomes: incomes.results ?? [],
    requirements: requirements.results ?? [],
    documents: documents.results ?? [],
    tasks: tasks.results ?? [],
    events: events.results ?? [],
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireStaff(request);
    const { id } = await params;
    const result = await details(id);
    if (!result.case) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("case_detail_failed", error);
    return NextResponse.json({ error: "Unable to load the case" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actorId = requireStaff(request);
    const { id } = await params;
    const body = (await request.json()) as { action?: string; reason?: string };
    const action = body.action || "";
    const actionMap: Record<string, { state: string; queue: string; event: string }> = {
      REQUEST_INFORMATION: { state: "INFORMATION_REQUIRED", queue: "CASEWORK", event: "INFORMATION_REQUESTED" },
      ORDER_SITE_VISIT: { state: "SITE_VISIT_REQUIRED", queue: "FIELD_VERIFICATION", event: "SITE_VISIT_REQUESTED" },
      RECOMMEND_APPROVAL: { state: "RECOMMENDED_APPROVAL", queue: "DECISION_AUTHORITY", event: "RECOMMENDATION_RECORDED" },
      RECOMMEND_DECLINE: { state: "RECOMMENDED_DECLINE", queue: "DECISION_AUTHORITY", event: "RECOMMENDATION_RECORDED" },
      RETURN_ASSESSMENT: { state: "UNDER_ASSESSMENT", queue: "CASEWORK", event: "CASE_RETURNED_TO_ASSESSMENT" },
    };
    const target = actionMap[action];
    if (!target) return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    await updateCase(id, { state: target.state, assignedQueue: target.queue });
    if (action === "REQUEST_INFORMATION") {
      await addTask({ caseId: id, type: "INFORMATION_REQUEST", title: body.reason || "Additional information required", queue: "RESIDENT_RESPONSE", priority: "HIGH" });
    }
    if (action === "ORDER_SITE_VISIT") {
      await addTask({ caseId: id, type: "SITE_VISIT", title: body.reason || "Verify residence and property use", queue: "FIELD_VERIFICATION", priority: "HIGH" });
    }
    await audit({
      caseId: id,
      actorType: "STAFF_USER",
      actorId,
      eventCode: target.event,
      entityType: action.startsWith("RECOMMEND") ? "RECOMMENDATION" : "CASE",
      entityId: id,
      detail: { action, reason: body.reason || null },
    });
    return NextResponse.json(await details(id));
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("case_action_failed", error);
    return NextResponse.json({ error: "Unable to update the case" }, { status: 500 });
  }
}


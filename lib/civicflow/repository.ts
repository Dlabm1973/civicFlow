import { env } from "cloudflare:workers";
import type { RequirementView, SessionRecord, WorkflowContext } from "./types";

function db() {
  if (!env.DB) throw new Error("CivicFlow database is unavailable");
  return env.DB;
}

export function isoNow() {
  return new Date().toISOString();
}

export function maskValue(value: string, visible = 4) {
  const compact = value.replace(/\s+/g, "");
  if (compact.length <= visible) return "•".repeat(compact.length);
  return `${"•".repeat(Math.min(8, compact.length - visible))}${compact.slice(-visible)}`;
}

export async function findSession(input: {
  sessionId?: string;
  channelType: string;
  channelIdentifier: string;
}) {
  if (input.sessionId) {
    const byId = await db()
      .prepare("SELECT * FROM sessions WHERE id = ? AND channel_type = ? AND channel_identifier = ? LIMIT 1")
      .bind(input.sessionId, input.channelType, input.channelIdentifier)
      .first<SessionRecord>();
    if (byId) return byId;
  }
  return db()
    .prepare(
      "SELECT * FROM sessions WHERE channel_type = ? AND channel_identifier = ? LIMIT 1"
    )
    .bind(input.channelType, input.channelIdentifier)
    .first<SessionRecord>();
}

export async function createSession(input: {
  id: string;
  channelType: string;
  channelIdentifier: string;
}) {
  const now = isoNow();
  await db()
    .prepare(
      "INSERT INTO sessions (id, channel_type, channel_identifier, case_id, workflow_step, language, auth_level, context_json, created_at, updated_at) VALUES (?, ?, ?, NULL, 'LANGUAGE', 'en', 0, '{}', ?, ?)"
    )
    .bind(input.id, input.channelType, input.channelIdentifier, now, now)
    .run();
  return findSession({
    sessionId: input.id,
    channelType: input.channelType,
    channelIdentifier: input.channelIdentifier,
  });
}

export async function saveSession(
  sessionId: string,
  values: {
    workflowStep: string;
    language: string;
    authLevel: number;
    caseId?: string | null;
    context: WorkflowContext;
  }
) {
  await db()
    .prepare(
      "UPDATE sessions SET workflow_step = ?, language = ?, auth_level = ?, case_id = ?, context_json = ?, updated_at = ? WHERE id = ?"
    )
    .bind(
      values.workflowStep,
      values.language,
      values.authLevel,
      values.caseId ?? null,
      JSON.stringify(values.context),
      isoNow(),
      sessionId
    )
    .run();
}

export async function createCase(input: {
  id: string;
  reference: string;
  channel: string;
  language: string;
  applicantName: string;
  mobileMasked?: string;
}) {
  const now = isoNow();
  await db()
    .prepare(
      "INSERT INTO cases (id, reference, municipality_code, case_type, channel, language, current_state, workflow_step, progress, applicant_name, mobile_masked, assigned_queue, priority, source_version, created_at, updated_at) VALUES (?, ?, 'GMM', 'INDIGENT_NEW_APPLICATION', ?, ?, 'APPLICATION_IN_PROGRESS', 'IDENTITY_TYPE', 30, ?, ?, 'INTAKE', 'NORMAL', 'GMM-WORKING-DRAFT-2026-09', ?, ?)"
    )
    .bind(
      input.id,
      input.reference,
      input.channel,
      input.language,
      input.applicantName,
      input.mobileMasked ?? null,
      now,
      now
    )
    .run();
}

export async function updateCase(
  caseId: string,
  values: {
    state?: string;
    step?: string;
    progress?: number;
    applicantName?: string;
    propertyLabel?: string;
    classificationCandidate?: string;
    assignedQueue?: string;
    submitted?: boolean;
  }
) {
  const current = await db()
    .prepare("SELECT * FROM cases WHERE id = ? LIMIT 1")
    .bind(caseId)
    .first<Record<string, unknown>>();
  if (!current) return;
  await db()
    .prepare(
      "UPDATE cases SET current_state = ?, workflow_step = ?, progress = ?, applicant_name = ?, property_label = ?, classification_candidate = ?, assigned_queue = ?, submitted_at = ?, updated_at = ? WHERE id = ?"
    )
    .bind(
      values.state ?? current.current_state,
      values.step ?? current.workflow_step,
      values.progress ?? current.progress,
      values.applicantName ?? current.applicant_name,
      values.propertyLabel ?? current.property_label,
      values.classificationCandidate ?? current.classification_candidate,
      values.assignedQueue ?? current.assigned_queue,
      values.submitted ? isoNow() : current.submitted_at,
      isoNow(),
      caseId
    )
    .run();
}

export async function addPerson(input: {
  id: string;
  caseId: string;
  role: string;
  fullName: string;
  identityType?: string;
  identityMasked?: string;
}) {
  await db()
    .prepare(
      "INSERT OR REPLACE INTO persons (id, case_id, role, full_name, identity_type, identity_masked, adult_for_policy, income_status, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, COALESCE((SELECT income_status FROM persons WHERE id = ?), 'OUTSTANDING'), COALESCE((SELECT created_at FROM persons WHERE id = ?), ?))"
    )
    .bind(
      input.id,
      input.caseId,
      input.role,
      input.fullName,
      input.identityType ?? null,
      input.identityMasked ?? null,
      input.id,
      input.id,
      isoNow()
    )
    .run();
}

export async function setPersonIncomeStatus(personId: string, status: string) {
  await db()
    .prepare("UPDATE persons SET income_status = ? WHERE id = ?")
    .bind(status, personId)
    .run();
}

export async function addIncome(input: {
  id: string;
  caseId: string;
  personId: string;
  type: string;
  amountCents: number;
}) {
  await db()
    .prepare(
      "INSERT INTO income_items (id, case_id, person_id, income_type, gross_amount_cents, frequency, verification_status, created_at) VALUES (?, ?, ?, ?, ?, 'MONTHLY', 'DECLARED_ONLY', ?)"
    )
    .bind(input.id, input.caseId, input.personId, input.type, input.amountCents, isoNow())
    .run();
}

export async function addRequirement(input: {
  id: string;
  caseId: string;
  personId?: string;
  code: string;
  label: string;
}) {
  await db()
    .prepare(
      "INSERT INTO document_requirements (id, case_id, person_id, requirement_code, label, mandatory, status, acceptable_types_json, created_at) VALUES (?, ?, ?, ?, ?, 1, 'OUTSTANDING', '[\"application/pdf\",\"image/jpeg\",\"image/png\"]', ?)"
    )
    .bind(input.id, input.caseId, input.personId ?? null, input.code, input.label, isoNow())
    .run();
}

export async function getRequirements(caseId: string): Promise<RequirementView[]> {
  const result = await db()
    .prepare(
      "SELECT id, label, requirement_code AS code, status, mandatory, person_id AS personId FROM document_requirements WHERE case_id = ? ORDER BY created_at ASC"
    )
    .bind(caseId)
    .all<RequirementView>();
  return (result.results ?? []).map((row) => ({
    ...row,
    mandatory: Boolean(row.mandatory),
  }));
}

export async function addTask(input: {
  caseId: string;
  type: string;
  title: string;
  queue: string;
  priority?: string;
}) {
  const id = crypto.randomUUID();
  await db()
    .prepare(
      "INSERT INTO tasks (id, case_id, task_type, title, status, owner_queue, priority, created_at) VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?)"
    )
    .bind(
      id,
      input.caseId,
      input.type,
      input.title,
      input.queue,
      input.priority ?? "NORMAL",
      isoNow()
    )
    .run();
  return id;
}

export async function audit(input: {
  caseId?: string | null;
  actorType: string;
  actorId?: string;
  eventCode: string;
  entityType: string;
  entityId?: string;
  detail?: Record<string, unknown>;
  correlationId?: string;
}) {
  await db()
    .prepare(
      "INSERT INTO audit_events (id, case_id, actor_type, actor_id, event_code, entity_type, entity_id, detail_json, correlation_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      crypto.randomUUID(),
      input.caseId ?? null,
      input.actorType,
      input.actorId ?? null,
      input.eventCode,
      input.entityType,
      input.entityId ?? null,
      JSON.stringify(input.detail ?? {}),
      input.correlationId ?? crypto.randomUUID(),
      isoNow()
    )
    .run();
}

export async function addMessage(input: {
  sessionId: string;
  caseId?: string | null;
  direction: "INBOUND" | "OUTBOUND";
  body?: string;
  providerMessageId?: string;
  messageType?: string;
}) {
  await db()
    .prepare(
      "INSERT OR IGNORE INTO messages (id, session_id, case_id, direction, body, provider_message_id, message_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      crypto.randomUUID(),
      input.sessionId,
      input.caseId ?? null,
      input.direction,
      input.body ?? null,
      input.providerMessageId ?? null,
      input.messageType ?? "text",
      isoNow()
    )
    .run();
}

export function parseContext(session: SessionRecord): WorkflowContext {
  try {
    return JSON.parse(session.context_json || "{}") as WorkflowContext;
  } catch {
    return {};
  }
}

export async function caseReference(caseId?: string | null) {
  if (!caseId) return null;
  const row = await db()
    .prepare("SELECT reference FROM cases WHERE id = ? LIMIT 1")
    .bind(caseId)
    .first<{ reference: string }>();
  return row?.reference ?? null;
}

export function database() {
  return db();
}

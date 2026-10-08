import { env } from "cloudflare:workers";
import { addMessage, audit, database } from "./repository";
import { sendPayload, sendReply } from "./whatsapp";
import { translate } from "./languages";

export type NotificationRecord = {
  id: string; case_id: string; session_id: string | null; case_state: string;
  status: string; provider_message_id: string | null; error: string | null;
  created_at: string; updated_at: string;
};
export const recommendationLabels: Record<string, string> = {
  APPLICATION_IN_PROGRESS: "Application in progress", DOCUMENTS_OUTSTANDING: "Documents requested",
  DOCUMENT_REUPLOAD_REQUIRED: "Clearer or complete documents requested", DOCUMENTS_UNDER_REVIEW: "Documents under basic review",
  READY_FOR_SUBMISSION: "Ready for submission", READY_FOR_VETTING: "Ready for external vetting", VETTING_IN_PROGRESS: "External vetting in progress",
  OUTCOME_APPROVED: "Approved", OUTCOME_DECLINED: "Declined", OUTCOME_INFORMATION_REQUIRED: "Further information required by the vetting reviewer",
  RECOMMENDED_APPROVAL: "Approved", RECOMMENDED_DECLINE: "Declined", UNDER_ASSESSMENT: "Under review",
  INFORMATION_REQUIRED: "Information required", SITE_VISIT_REQUIRED: "Site visit required", OFFICIAL_CERTIFICATION_REQUIRED: "Under review",
};
export function notificationHeading(state: string, language: string) {
  const prefix = state.startsWith("RECOMMENDED_") ? "Recommendation" : state.startsWith("OUTCOME_") ? "Outcome" : "Application status";
  return `${translate(prefix, language)}: ${translate(recommendationLabels[state] || state.toLowerCase().replaceAll("_", " "), language)}`;
}
export function notificationExplanation(state: string, language: string) {
  const explanation = state.startsWith("RECOMMENDED_")
    ? "This is a recommendation, not a final municipal decision. An authorised official must still decide."
    : state.startsWith("OUTCOME_")
      ? "This outcome was returned by the external vetting system or authorised manual reviewer. CivicFlow is reporting that result."
      : "CivicFlow checks document completeness and readability. Legal vetting and the application decision are handled separately.";
  return translate(explanation, language);
}
export function recommendationText(state: string, language: string) {
  return `${notificationHeading(state, language)}\n\n${notificationExplanation(state, language)}`;
}

export async function latestNotification(caseId: string) {
  return database().prepare("SELECT * FROM whatsapp_notifications WHERE case_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1").bind(caseId).first<NotificationRecord>();
}

export async function queueRecommendation(caseId: string, state: string) {
  const now = new Date().toISOString();
  const session = await database().prepare("SELECT id FROM sessions WHERE case_id = ? AND channel_type = 'WHATSAPP' ORDER BY updated_at DESC LIMIT 1").bind(caseId).first<{ id: string }>();
  // Preserve every transition, including updates awaiting a resident reply.
  const id = crypto.randomUUID();
  await database().prepare("INSERT INTO whatsapp_notifications (id, case_id, session_id, case_state, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, caseId, session?.id || null, state, session ? "PENDING" : "NO_WHATSAPP_SESSION", now, now).run();
  return dispatchRecommendation(id);
}

export async function dispatchRecommendation(id: string) {
  const db = database();
  const record = await db.prepare("SELECT * FROM whatsapp_notifications WHERE id = ?").bind(id).first<NotificationRecord>();
  if (!record || !["PENDING", "FAILED", "WAITING_FOR_REPLY", "NO_WHATSAPP_SESSION"].includes(record.status)) return record;
  const caseRow = await db.prepare("SELECT reference, current_state FROM cases WHERE id = ?").bind(record.case_id).first<{ reference: string; current_state: string }>();
  if (!caseRow) return record;
  const session = await db.prepare("SELECT id, channel_identifier, language FROM sessions WHERE case_id = ? AND channel_type = 'WHATSAPP' ORDER BY updated_at DESC LIMIT 1")
    .bind(record.case_id).first<{ id: string; channel_identifier: string; language: string }>();
  if (!session) return record;
  const inbound = await db.prepare("SELECT created_at FROM messages WHERE session_id = ? AND direction = 'INBOUND' AND provider_message_id IS NOT NULL ORDER BY created_at DESC LIMIT 1")
    .bind(session.id).first<{ created_at: string }>();
  const inWindow = Boolean(inbound && Date.now() - Date.parse(inbound.created_at) < 24 * 60 * 60 * 1000);
  const template = env.WHATSAPP_STATUS_TEMPLATE || (record.case_state.startsWith("RECOMMENDED_") ? env.WHATSAPP_RECOMMENDATION_TEMPLATE : undefined);
  if (!inWindow && !template) {
    await db.prepare("UPDATE whatsapp_notifications SET status = 'WAITING_FOR_REPLY', error = ?, updated_at = ? WHERE id = ?")
      .bind("The WhatsApp reply window is closed. An approved notification template is required, or the resident must message Khula again.", new Date().toISOString(), id).run();
    return db.prepare("SELECT * FROM whatsapp_notifications WHERE id = ?").bind(id).first<NotificationRecord>();
  }
  const claim = await db.prepare("UPDATE whatsapp_notifications SET status = 'SENDING', session_id = ?, error = NULL, updated_at = ? WHERE id = ? AND status IN ('PENDING','FAILED','WAITING_FOR_REPLY','NO_WHATSAPP_SESSION')")
    .bind(session.id, new Date().toISOString(), id).run();
  if (!claim.meta.changes) return latestNotification(record.case_id);
  try {
    let providerId: string | undefined;
    const text = recommendationText(record.case_state, session.language) + `\n\n${translate("Status recorded", session.language)}: ${record.created_at}`;
    if (inWindow) {
      providerId = await sendReply(session.channel_identifier, {
        sessionId: session.id, caseId: record.case_id, caseReference: caseRow.reference,
        language: session.language, localized: true, step: "NOTIFICATION", progress: 0, message: text,
      });
    } else {
      // Approved utility template: three body parameters and one Main menu quick-reply button.
      // Template wording is configured in Meta; the supplied explanation must remain visible.
      providerId = await sendPayload({ messaging_product: "whatsapp", to: session.channel_identifier, type: "template",
        template: { name: template, language: { code: env.WHATSAPP_STATUS_TEMPLATE_LANGUAGE || env.WHATSAPP_RECOMMENDATION_TEMPLATE_LANGUAGE || "en_US" }, components: [
          { type: "body", parameters: [
            { type: "text", text: env.WHATSAPP_STATUS_TEMPLATE ? notificationHeading(record.case_state, "en") : recommendationLabels[record.case_state] || "Under review" },
            { type: "text", text: caseRow.reference },
            { type: "text", text: notificationExplanation(record.case_state, "en") },
          ] },
          { type: "button", sub_type: "quick_reply", index: "0", parameters: [{ type: "payload", payload: "MENU_HOME" }] },
        ] } });
    }
    await db.prepare("UPDATE whatsapp_notifications SET status = 'ACCEPTED', provider_message_id = ?, updated_at = ? WHERE id = ?")
      .bind(providerId || null, new Date().toISOString(), id).run();
    await addMessage({ sessionId: session.id, caseId: record.case_id, direction: "OUTBOUND", body: text, providerMessageId: providerId, messageType: "application_status" });
    await audit({ caseId: record.case_id, actorType: "SYSTEM", eventCode: "WHATSAPP_STATUS_ACCEPTED", entityType: "NOTIFICATION", entityId: id, detail: { state: record.case_state } });
  } catch (error) {
    await db.prepare("UPDATE whatsapp_notifications SET status = 'FAILED', error = ?, updated_at = ? WHERE id = ?")
      .bind(error instanceof Error ? error.message : "Unable to send the WhatsApp notification", new Date().toISOString(), id).run();
  }
  return db.prepare("SELECT * FROM whatsapp_notifications WHERE id = ?").bind(id).first<NotificationRecord>();
}

export async function retryCaseNotifications(caseId: string) {
  const pending = await database().prepare("SELECT id FROM whatsapp_notifications WHERE case_id = ? AND status IN ('PENDING','WAITING_FOR_REPLY','FAILED','NO_WHATSAPP_SESSION') ORDER BY created_at, rowid")
    .bind(caseId).all<{ id: string }>();
  for (const item of pending.results || []) {
    const result = await dispatchRecommendation(item.id);
    if (!result || ['FAILED', 'WAITING_FOR_REPLY', 'NO_WHATSAPP_SESSION'].includes(result.status)) break;
  }
}
export async function flushRecommendations(sessionId: string) {
  const session = await database().prepare("SELECT case_id FROM sessions WHERE id = ?").bind(sessionId).first<{ case_id: string | null }>();
  if (session?.case_id) await retryCaseNotifications(session.case_id);
}

export async function receiveDeliveryStatus(status: { id?: string; status?: string; errors?: { code?: number }[] }) {
  if (!status.id || !["sent", "delivered", "read", "failed"].includes(status.status || "")) return;
  const current = await database().prepare("SELECT id, status FROM whatsapp_notifications WHERE provider_message_id = ?").bind(status.id).first<{ id: string; status: string }>();
  if (!current) return;
  const target = { sent: "ACCEPTED", delivered: "DELIVERED", read: "READ", failed: "FAILED" }[status.status as "sent" | "delivered" | "read" | "failed"];
  const rank: Record<string, number> = { SENDING: 0, ACCEPTED: 1, DELIVERED: 2, READ: 3, FAILED: 0 };
  if (target !== "FAILED" && (rank[current.status] || 0) > rank[target]) return;
  if (target === "FAILED" && ["DELIVERED", "READ"].includes(current.status)) return;
  await database().prepare("UPDATE whatsapp_notifications SET status = ?, error = ?, updated_at = ? WHERE id = ?")
    .bind(target, target === "FAILED" ? `Meta delivery failed (code ${status.errors?.[0]?.code || "unknown"}).` : null, new Date().toISOString(), current.id).run();
}

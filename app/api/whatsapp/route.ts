import { localizeReply, translate } from "@/lib/civicflow/languages";
import { env } from "cloudflare:workers";
import { processChat } from "@/lib/civicflow/workflow";
import { addMessage, database, findSession, getRequirements, parseContext, saveSession } from "@/lib/civicflow/repository";
import { storeDocument } from "@/lib/civicflow/documents";
import type { ChatReply } from "@/lib/civicflow/types";

export const dynamic = "force-dynamic";

function graphOrigin() {
  const version = env.WHATSAPP_GRAPH_VERSION;
  if (!version || !/^v\d+\.\d+$/.test(version)) {
    throw new Error("WHATSAPP_GRAPH_VERSION is not configured");
  }
  return `https://graph.facebook.com/${version}`;
}

async function verifySignature(raw: ArrayBuffer, signature: string | null) {
  if (!env.META_APP_SECRET) return false;
  if (!signature?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.META_APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const supplied = signature.slice(7);
  if (!/^[0-9a-f]{64}$/i.test(supplied)) return false;
  const bytes = new Uint8Array(supplied.match(/.{2}/g)!.map((part) => Number.parseInt(part, 16)));
  return crypto.subtle.verify("HMAC", key, bytes, raw);
}

function withReference(reply: ChatReply) {
  const summary = reply.summary
    ? "\n\n" + Object.entries(reply.summary).map(([label, value]) => `${label}: ${value ?? translate("Not supplied", reply.language)}`).join("\n")
    : "";
  const text = reply.message + summary;
  return reply.caseReference ? `${text}\n\n${translate("Reference", reply.language)}: ${reply.caseReference}` : text;
}

async function sendReply(to: string, reply: ChatReply) {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("WhatsApp sending credentials are not configured");
  }
  reply = localizeReply(reply);
  const fullText = withReference(reply);
  const hasChoices = Boolean(reply.choices?.length);
  // Keep the complete review and instructions visible before a short interactive menu.
  if (fullText.length > (hasChoices ? 1024 : 4096)) {
    for (let start = 0; start < fullText.length; start += 4000) {
      await sendPayload({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { body: fullText.slice(start, start + 4000) } });
    }
    if (!hasChoices) return;
  }
  const text = fullText.length > 1024 && hasChoices ? translate("Choose an option to continue.", reply.language) : fullText;
  let payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { body: text },
  };
  if (reply.choices?.length && reply.choices.length <= 3) {
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: text.slice(0, 1024) },
        action: {
          buttons: reply.choices.map((choice) => ({
            type: "reply",
            reply: { id: choice.id, title: choice.label.slice(0, 20) },
          })),
        },
      },
    };
  } else if (reply.choices?.length) {
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: text.slice(0, 1024) },
        action: {
          button: translate("Choose an option", reply.language),
          sections: [
            {
              title: "Khula",
              rows: reply.choices.slice(0, 10).map((choice) => ({
                id: choice.id,
                title: choice.label.slice(0, 24),
                description: (choice.description || choice.label).slice(0, 72),
              })),
            },
          ],
        },
      },
    };
  }
  await sendPayload(payload);
}

async function sendPayload(payload: Record<string, unknown>) {
  const response = await fetch(
    `${graphOrigin()}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
  if (!response.ok) {
    throw new Error(`WhatsApp send failed with status ${response.status}`);
  }
}

async function downloadMedia(mediaId: string) {
  if (!env.WHATSAPP_ACCESS_TOKEN) throw new Error("WhatsApp access token is unavailable");
  const metadataResponse = await fetch(`${graphOrigin()}/${mediaId}`, {
    headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
  });
  if (!metadataResponse.ok) throw new Error("Unable to retrieve WhatsApp media metadata");
  const metadata = (await metadataResponse.json()) as {
    url?: string;
    mime_type?: string;
    file_size?: number;
  };
  if (!metadata.url) throw new Error("WhatsApp media URL is missing");
  if ((metadata.file_size || 0) > 10 * 1024 * 1024) throw new Error("WhatsApp file exceeds 10 MB");
  const fileResponse = await fetch(metadata.url, {
    headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
  });
  if (!fileResponse.ok) throw new Error("Unable to download WhatsApp media");
  return {
    bytes: await fileResponse.arrayBuffer(),
    mimeType: metadata.mime_type || fileResponse.headers.get("content-type") || "application/octet-stream",
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && env.WHATSAPP_VERIFY_TOKEN && token === env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge || "", { status: 200 });
  }
  return new Response("Verification failed", { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.arrayBuffer();
  if (!(await verifySignature(raw, request.headers.get("x-hub-signature-256")))) {
    return new Response("Invalid webhook signature", { status: 401 });
  }
  let body: any;
  try {
    body = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  try {
    const changes = (body.entry || []).flatMap((entry: any) => entry.changes || []);
    for (const change of changes) {
      if (!env.WHATSAPP_PHONE_NUMBER_ID || change.value?.metadata?.phone_number_id !== env.WHATSAPP_PHONE_NUMBER_ID) continue;
      const messages = change.value?.messages || [];
      for (const message of messages) {
        const from = String(message.from || "");
        const providerMessageId = String(message.id || "");
        if (!from || !providerMessageId) continue;
        const seen = await database()
          .prepare("SELECT id FROM messages WHERE provider_message_id = ? LIMIT 1")
          .bind(providerMessageId)
          .first<{ id: string }>();
        if (seen) continue;

        if (message.type === "document" || message.type === "image") {
          const session = await findSession({ channelType: "WHATSAPP", channelIdentifier: from });
          if (!session?.case_id) {
            const reply = await processChat({
              channelType: "WHATSAPP",
              channelIdentifier: from,
              text: "",
            });
            await sendReply(from, { ...reply, message: translate("Start or resume an application before uploading a document.", reply.language) + " " + reply.message });
            continue;
          }
          const requirements = await getRequirements(session.case_id);
          const outstanding = requirements.filter((item) => item.status === "OUTSTANDING");
          const context = parseContext(session);
          const requirement = context.selectedRequirementId
            ? outstanding.find((item) => item.id === context.selectedRequirementId)
            : outstanding.length === 1
              ? outstanding[0]
              : undefined;
          if (!requirement && outstanding.length > 1) {
            await sendReply(from, {
              sessionId: session.id,
              language: session.language,
              caseId: session.case_id,
              caseReference: await database().prepare("SELECT reference FROM cases WHERE id = ?").bind(session.case_id).first<string>("reference"),
              step: session.workflow_step,
              progress: 92,
              message: "Choose which outstanding requirement this file satisfies, then upload it again.",
              choices: outstanding.slice(0, 10).map((item) => ({ id: `REQ_${item.id}`, label: item.label })),
            });
            continue;
          }
          if (!requirement) {
            await sendReply(from, {
              sessionId: session.id,
              language: session.language,
              caseId: session.case_id,
              caseReference: await database().prepare("SELECT reference FROM cases WHERE id = ?").bind(session.case_id).first<string>("reference"),
              step: session.workflow_step,
              progress: 92,
              message: "There is no outstanding document requirement to attach this file to. Choose the requested-information route if the municipality asked for something new.",
            });
            continue;
          }
          const media = message.document || message.image;
          const downloaded = await downloadMedia(String(media.id));
          await storeDocument({
            caseId: session.case_id,
            requirementId: requirement.id,
            filename: media.filename || `${message.type}-${media.id}`,
            mimeType: downloaded.mimeType,
            bytes: downloaded.bytes,
            sourceChannel: "WHATSAPP",
            personId: requirement.personId,
          });
          await addMessage({
            sessionId: session.id,
            caseId: session.case_id,
            direction: "INBOUND",
            body: media.filename || message.type,
            providerMessageId,
            messageType: message.type,
          });
          delete context.selectedRequirementId;
          await saveSession(session.id, {
            workflowStep: session.workflow_step,
            language: session.language,
            authLevel: session.auth_level,
            caseId: session.case_id,
            context,
          });
          const reply = await processChat({
            sessionId: session.id,
            channelType: "WHATSAPP",
            channelIdentifier: from,
            providerMessageId,
          });
          await sendReply(from, {
            ...reply,
            localized: false,
            message: translate(`Received: ${translate(requirement.label, reply.language)}.`, reply.language) + " " + reply.message,
            requirements: await getRequirements(session.case_id),
          });
          continue;
        }

        const text =
          message.text?.body ||
          message.interactive?.button_reply?.id ||
          message.interactive?.list_reply?.id ||
          "";
        const action =
          message.interactive?.button_reply?.id || message.interactive?.list_reply?.id;
        const reply = await processChat({
          channelType: "WHATSAPP",
          channelIdentifier: from,
          text: action ? undefined : text,
          action,
          providerMessageId,
        });
        await sendReply(from, reply);
      }
    }
  } catch (error) {
    console.error("whatsapp_webhook_failed", error);
  }
  return new Response("EVENT_RECEIVED", { status: 200 });
}

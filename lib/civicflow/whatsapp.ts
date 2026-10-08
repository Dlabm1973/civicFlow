import { env } from "cloudflare:workers";
import { localizeReply, translate } from "./languages";
import type { ChatReply } from "./types";

export function graphOrigin() {
  const version = env.WHATSAPP_GRAPH_VERSION;
  if (!version || !/^v\d+\.\d+$/.test(version)) {
    throw new Error("WHATSAPP_GRAPH_VERSION is not configured");
  }
  return `https://graph.facebook.com/${version}`;
}

function withReference(reply: ChatReply) {
  const summary = reply.summary
    ? "\n\n" + Object.entries(reply.summary).map(([label, value]) => `${label}: ${value ?? translate("Not supplied", reply.language)}`).join("\n")
    : "";
  const text = reply.message + summary;
  return reply.caseReference ? `${text}\n\n${translate("Reference", reply.language)}: ${reply.caseReference}` : text;
}

export async function sendReply(to: string, reply: ChatReply) {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("WhatsApp sending credentials are not configured");
  }
  reply = localizeReply(reply);
  const home = { id: "MENU_HOME", label: translate("Main menu", reply.language) };
  const choices = (reply.choices || []).filter(choice => choice.id !== "MENU_HOME");
  const separateHome = choices.length >= 10;
  reply = { ...reply, choices: separateHome ? choices : [...choices, home] };
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
  const sent = await sendPayload(payload);
  if (separateHome) await sendPayload({ messaging_product: "whatsapp", to, type: "interactive", interactive: { type: "button", body: { text: translate("Return to main menu", reply.language) }, action: { buttons: [{ type: "reply", reply: { id: home.id, title: home.label.slice(0, 20) } }] } } });
  return sent;
}

export async function sendPayload(payload: Record<string, unknown>) {
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
  const body = await response.json() as { messages?: { id: string }[]; error?: { code?: number } };
  if (!response.ok) throw new Error(`Meta rejected the message (HTTP ${response.status}, code ${body.error?.code || "unknown"}). Check the WhatsApp token, recipient and permissions.`);
  if (!body.messages?.[0]?.id) throw new Error("Meta did not return a message ID");
  return body.messages[0].id;
}


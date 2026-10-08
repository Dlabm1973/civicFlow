import CivicFlowWorkspace from "./workspace";
import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { requireStaff } from "@/lib/civicflow/staff-auth";
import { chatGPTSignInPath, chatGPTSignOutPath } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const requestHeaders = await headers();
  try {
    requireStaff(new Request("https://civicflow.local", { headers: requestHeaders }));
  } catch (error) {
    if (!(error instanceof Response)) throw error;
    const signedIn = Boolean(requestHeaders.get("oai-authenticated-user-id"));
    return <main className="min-h-screen bg-[#edf3f4] p-8 text-[#0a2b3a]"><div className="mx-auto max-w-xl"><h1 className="text-2xl font-bold">CivicFlow staff access required</h1><p className="mt-4 text-base">Residents apply and send supporting documents through WhatsApp. This website is for approved staff accounts.</p><p className="mt-4 text-base">{signedIn ? "This account does not have staff access. Sign in with your approved staff account." : "Sign in with your approved staff account to open CivicFlow Desk."}</p><a href={signedIn ? chatGPTSignOutPath("/") : chatGPTSignInPath("/")} target="_top" className="mt-6 inline-flex rounded-lg bg-[#087f83] px-5 py-3 text-base font-semibold text-white">{signedIn ? "Switch account" : "Sign in with ChatGPT"}</a></div></main>;
  }
  const connection = {
    configured: Boolean(env.WHATSAPP_VERIFY_TOKEN && env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID && env.META_APP_SECRET && /^v\d+\.\d+$/.test(env.WHATSAPP_GRAPH_VERSION || "")),
    businessNumber: (env.WHATSAPP_BUSINESS_NUMBER || "").replace(/\D/g, ""),
  };
  return <CivicFlowWorkspace connection={connection} />;
}

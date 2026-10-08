import { NextResponse } from "next/server";
import { processChat } from "@/lib/civicflow/workflow";
import type { ChatInput } from "@/lib/civicflow/types";
import { requireStaff } from "@/lib/civicflow/staff-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireStaff(request);
    const input = (await request.json()) as ChatInput;
    if (!input.channelType || !["WEB", "ASSISTED"].includes(input.channelType)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }
    const reply = await processChat(input);
    return NextResponse.json(reply, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("chat_request_failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to continue this application" },
      { status: 500 }
    );
  }
}

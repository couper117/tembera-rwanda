import { NextRequest, NextResponse } from "next/server";
import {
  generateChatbotResponse,
  getChatbotConfig,
  type ChatMessage,
} from "@/lib/ai/chatbot";

export const dynamic = "force-dynamic";

/** Longest single message accepted, in characters. */
const MAX_CONTENT = 2_000;
/** Most messages accepted in one request, counting the whole history. */
const MAX_MESSAGES = 40;

/** Whether the widget should render at all. */
export async function GET() {
  const config = await getChatbotConfig();
  return NextResponse.json({ enabled: config.enabled });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json(
      { error: "'messages' must be a non-empty array." },
      { status: 400 },
    );
  }

  // Trust nothing about the shape: this endpoint is unauthenticated, so the
  // body is whatever anyone chose to post. The cap is applied before the
  // history slice so a large payload cannot be used to run up a model bill.
  const messages: ChatMessage[] = raw
    .slice(-MAX_MESSAGES)
    .filter(
      (m): m is { role?: unknown; content: string } =>
        !!m &&
        typeof m === "object" &&
        typeof (m as { content?: unknown }).content === "string" &&
        (m as { content: string }).content.trim() !== "",
    )
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content.trim().slice(0, MAX_CONTENT),
    }));

  if (messages.length === 0) {
    return NextResponse.json({ error: "No usable messages." }, { status: 400 });
  }

  try {
    const response = await generateChatbotResponse(messages);
    return NextResponse.json(response);
  } catch (error) {
    // generateChatbotResponse already falls back to the catalogue on a provider
    // failure, so reaching here means something closer to home — the database,
    // most likely. Log the detail, return none of it.
    console.error("chat route: unrecoverable error", error);
    return NextResponse.json(
      { error: "The assistant is unavailable right now." },
      { status: 503 },
    );
  }
}

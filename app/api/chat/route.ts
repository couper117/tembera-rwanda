import { NextRequest, NextResponse } from "next/server";
import {
  generateChatbotResponse,
  getChatbotConfig,
  type ChatMessage,
} from "@/lib/ai/chatbot";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getChatbotConfig();
  return NextResponse.json({ enabled: config.enabled });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { messages?: unknown[] };
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. 'messages' array is required." },
        { status: 400 },
      );
    }

    const cleanMessages: ChatMessage[] = messages
      .filter(
        (message): message is { role?: string; content?: unknown } =>
          !!message && typeof message === "object" && typeof (message as { content?: unknown }).content === "string" && (message as { content: string }).content.trim() !== "",
      )
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: String(message.content).slice(0, 4000),
      }));

    if (cleanMessages.length === 0) {
      return NextResponse.json(
        { error: "No valid messages found." },
        { status: 400 },
      );
    }

    const config = await getChatbotConfig();
    const response = await generateChatbotResponse(cleanMessages);
    return NextResponse.json({
      ...response,
      enabled: config.enabled,
    });
  } catch (error: unknown) {
    console.error("Chat API route error:", error);
    return NextResponse.json(
      { error: "Internal server error processing chat message." },
      { status: 500 },
    );
  }
}

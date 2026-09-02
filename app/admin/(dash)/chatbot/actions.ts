"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { saveChatbotConfig, type ChatbotConfig } from "@/lib/ai/chatbot";

export interface ChatbotFormState {
  error?: string;
  ok?: boolean;
  message?: string;
}

export async function saveChatbotSettingsAction(
  _prev: ChatbotFormState,
  formData: FormData,
): Promise<ChatbotFormState> {
  await requireAdmin();

  const provider = (formData.get("provider") as ChatbotConfig["provider"]) || "gemini";
  const apiKey = (formData.get("apiKey") as string)?.trim() || "";
  const model = (formData.get("model") as string)?.trim() || "gemini-2.0-flash";
  const customEndpoint = (formData.get("customEndpoint") as string)?.trim() || "";
  const systemPrompt = (formData.get("systemPrompt") as string)?.trim() || "";
  const enabled = formData.get("enabled") === "on";

  try {
    await saveChatbotConfig({
      provider,
      apiKey,
      model,
      customEndpoint,
      systemPrompt,
      enabled,
    });

    revalidatePath("/admin/chatbot");
    revalidatePath("/admin/settings");
    return { ok: true, message: "AI Chatbot settings successfully saved." };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save settings.";
    return { error: message };
  }
}

export async function testChatbotApiAction(
  provider: string,
  apiKey: string,
  model: string,
  customEndpoint?: string,
): Promise<{ success: boolean; message: string }> {
  await requireAdmin();

  if (!apiKey || apiKey.trim() === "") {
    return {
      success: false,
      message: "Please enter an API key before testing.",
    };
  }

  try {
    if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model || "gemini-2.0-flash")}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Ping test: Reply with 'Connection successful!'" }] }],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, message: `Gemini API returned status ${res.status}: ${err}` };
      }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return { success: true, message: `Gemini Connected! Response: "${text?.trim()}"` };
    } else {
      const endpoint = customEndpoint || "https://api.openai.com/v1/chat/completions";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "gpt-4o-mini",
          messages: [{ role: "user", content: "Ping test: Reply with 'Connection successful!'" }],
          max_tokens: 20,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, message: `API returned status ${res.status}: ${err}` };
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      return { success: true, message: `Connected successfully! Response: "${text?.trim()}"` };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown connection error";
    return { success: false, message: `Connection test failed: ${message}` };
  }
}

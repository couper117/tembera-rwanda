"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  DEFAULT_SYSTEM_PROMPT,
  getChatbotConfig,
  saveChatbotConfig,
} from "@/lib/ai/chatbot";
import {
  DEFAULT_MODELS,
  describeUpstreamError,
  endpointFor,
  fetchWithTimeout,
  geminiUrl,
  isProvider,
  listGeminiModels,
  redactSecrets,
  KEEP_EXISTING_KEY,
} from "@/lib/ai/providers";

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

  const rawProvider = String(formData.get("provider") ?? "");
  if (!isProvider(rawProvider)) {
    return { error: "Choose one of the listed providers." };
  }

  const submittedKey = String(formData.get("apiKey") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim() || DEFAULT_MODELS[rawProvider];
  const customEndpoint = String(formData.get("customEndpoint") ?? "").trim();
  const systemPrompt = String(formData.get("systemPrompt") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  if (rawProvider === "custom" && customEndpoint) {
    try {
      const url = new URL(customEndpoint);
      if (url.protocol !== "https:" && url.hostname !== "localhost") {
        return { error: "The custom endpoint must use https." };
      }
    } catch {
      return { error: "The custom endpoint is not a valid URL." };
    }
  }

  try {
    const current = await getChatbotConfig();
    const apiKey =
      submittedKey === KEEP_EXISTING_KEY || submittedKey === ""
        ? current.apiKey
        : submittedKey;

    await saveChatbotConfig({
      provider: rawProvider,
      apiKey,
      model,
      customEndpoint,
      systemPrompt: systemPrompt || DEFAULT_SYSTEM_PROMPT,
      enabled,
    });

    revalidatePath("/admin/chatbot");
    return { ok: true, message: "Saved. The assistant picks this up on its next message." };
  } catch (error) {
    console.error("chatbot: save failed", error);
    return { error: "Could not save the settings. Check the server log." };
  }
}

/** Forget the stored key entirely and fall back to offline answers. */
export async function clearChatbotKeyAction(): Promise<ChatbotFormState> {
  await requireAdmin();
  try {
    await saveChatbotConfig({ apiKey: "" });
    revalidatePath("/admin/chatbot");
    return { ok: true, message: "API key removed. The assistant now answers from the catalogue." };
  } catch (error) {
    console.error("chatbot: could not clear key", error);
    return { error: "Could not remove the key." };
  }
}

export interface TestResult {
  success: boolean;
  message: string;
}

/**
 * Send one real message to the configured provider and report what came back.
 *
 * `apiKey` is optional: when the admin has not retyped it, the stored key is
 * used server-side rather than round-tripping the secret through the browser
 * so it can be sent straight back. That also means the button works on a fresh
 * page load of an already-configured install, which it previously did not —
 * the field was empty, so the button was disabled.
 */
export async function testChatbotApiAction(
  provider: string,
  apiKey: string,
  model: string,
  customEndpoint?: string,
): Promise<TestResult> {
  await requireAdmin();

  if (!isProvider(provider)) {
    return { success: false, message: "Unknown provider." };
  }

  const stored = await getChatbotConfig();
  const submitted = apiKey.trim();
  const key =
    submitted === "" || submitted === KEEP_EXISTING_KEY ? stored.apiKey : submitted;

  if (!key) {
    return { success: false, message: "No API key to test — enter one first." };
  }

  const prompt = "Reply with exactly: Connection OK";
  const endpoint = endpointFor(provider, customEndpoint || stored.customEndpoint);

  try {
    if (endpoint === null) {
      const res = await fetchWithTimeout(geminiUrl(model, key), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 20 },
        }),
      });

      if (!res.ok) {
        return {
          success: false,
          message: redactSecrets(describeUpstreamError(res.status, await res.text())),
        };
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      return text
        ? { success: true, message: `Connected to ${model}. It replied: "${text}"` }
        : { success: false, message: "Connected, but the model returned no text." };
    }

    const res = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODELS[provider],
        messages: [{ role: "user", content: prompt }],
        max_tokens: 20,
      }),
    });

    if (!res.ok) {
      return {
        success: false,
        message: redactSecrets(describeUpstreamError(res.status, await res.text())),
      };
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text
      ? { success: true, message: `Connected to ${model}. It replied: "${text}"` }
      : { success: false, message: "Connected, but the model returned no text." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown connection error";
    return { success: false, message: redactSecrets(message) };
  }
}

/**
 * The Gemini models the configured key can reach.
 *
 * The admin used to type a model name blind, and a name that had since been
 * retired failed as a 404 in the chat rather than in the form — so the site
 * quietly answered from the catalogue while the dashboard said "Live".
 */
export async function listGeminiModelsAction(
  apiKey: string,
): Promise<{ models?: string[]; error?: string }> {
  await requireAdmin();

  const stored = await getChatbotConfig();
  const submitted = apiKey.trim();
  const key = submitted === "" || submitted === KEEP_EXISTING_KEY ? stored.apiKey : submitted;
  if (!key) return { error: "Enter an API key first." };

  try {
    const models = await listGeminiModels(key);
    return models.length ? { models } : { error: "The key reached Google but returned no chat models." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reach Google.";
    return { error: redactSecrets(message) };
  }
}

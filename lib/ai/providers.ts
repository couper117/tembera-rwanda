/**
 * Where each provider lives, and how long we wait for it.
 *
 * The runtime path and the admin's "Test connection" button both resolve an
 * endpoint from the same saved config. They used to do it independently, and
 * disagreed: the test button sent every non-Gemini provider to OpenAI, so an
 * admin could paste a valid Groq key, see "Connected successfully!" fail
 * against api.openai.com, and conclude the key was bad. One function now.
 */

export type Provider = "gemini" | "openai" | "groq" | "openrouter" | "custom";

export const PROVIDERS: readonly Provider[] = [
  "gemini",
  "openai",
  "groq",
  "openrouter",
  "custom",
];

export function isProvider(value: unknown): value is Provider {
  return typeof value === "string" && (PROVIDERS as readonly string[]).includes(value);
}

/** The model each provider gets when an admin switches to it. */
export const DEFAULT_MODELS: Record<Provider, string> = {
  gemini: "gemini-2.0-flash",
  openai: "gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
  openrouter: "google/gemini-2.0-flash",
  custom: "",
};

const OPENAI_COMPATIBLE: Partial<Record<Provider, string>> = {
  openai: "https://api.openai.com/v1/chat/completions",
  groq: "https://api.groq.com/openai/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
};

/**
 * The chat-completions URL for a provider, or null for Gemini, which does not
 * speak the OpenAI shape and is called separately.
 *
 * `custom` is the only provider that may supply its own URL. The others ignore
 * `customEndpoint` deliberately — leaving it live for them means a stale value
 * from an earlier "custom" selection silently keeps routing requests somewhere
 * the admin can no longer see in the form.
 */
export function endpointFor(
  provider: Provider,
  customEndpoint?: string,
): string | null {
  if (provider === "gemini") return null;
  if (provider === "custom") {
    const url = customEndpoint?.trim();
    return url || OPENAI_COMPATIBLE.openai!;
  }
  return OPENAI_COMPATIBLE[provider] ?? OPENAI_COMPATIBLE.openai!;
}

export function geminiUrl(model: string, apiKey: string): string {
  const name = model.trim() || DEFAULT_MODELS.gemini;
  return (
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(name)}:generateContent?key=${encodeURIComponent(apiKey)}`
  );
}

/**
 * A provider that never answers must not hold the request open forever: the
 * widget has no way to cancel, and a Next server action that never returns
 * leaves the user looking at a spinner until they reload.
 */
export const REQUEST_TIMEOUT_MS = 20_000;

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`The AI provider did not respond within ${timeoutMs / 1000}s.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Provider errors are quoted back to admins in the test panel, so they carry
 * whatever the upstream body said. Two rules: never include the request we
 * sent (it holds the key), and cap the length so a provider returning an HTML
 * error page does not paste a document into the UI.
 */
export function describeUpstreamError(status: number, body: string): string {
  const trimmed = body.trim().replace(/\s+/g, " ").slice(0, 300);
  return trimmed ? `HTTP ${status}: ${trimmed}` : `HTTP ${status}`;
}

/**
 * Redact anything that looks like a key before a message reaches a log or a
 * screen. Providers echo the key back in some error bodies, and the admin
 * panel prints those bodies verbatim.
 */
export function redactSecrets(text: string): string {
  return text
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, "AIza…redacted")
    .replace(/sk-[0-9A-Za-z_-]{10,}/g, "sk-…redacted")
    .replace(/gsk_[0-9A-Za-z_-]{10,}/g, "gsk_…redacted")
    .replace(/(key=)[^&\s]+/gi, "$1…redacted")
    .replace(/(Bearer\s+)[A-Za-z0-9._-]{10,}/gi, "$1…redacted");
}

/**
 * Submitted in the admin form's key field when the admin has not retyped it.
 *
 * Lives here rather than beside the action that reads it: a "use server"
 * module may only export async functions, so exporting a constant from
 * actions.ts fails the whole module graph at build time — and takes unrelated
 * pages down with it.
 */
export const KEEP_EXISTING_KEY = "__keep__";

/**
 * A key rendered for a screen: enough to tell two keys apart, never enough to
 * use one. Short values collapse entirely rather than revealing most of
 * themselves — masking "abc" as "abc…abc" would be worse than useless.
 */
export function maskKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return "";
  if (trimmed.length < 12) return "•".repeat(8);
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}

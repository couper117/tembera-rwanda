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

/**
 * The model each provider gets when an admin switches to it.
 *
 * These are pinned names, and pinned names retire: gemini-1.5-flash went first,
 * then gemini-2.0-flash, each time turning every default install into a 404
 * that only shows up when somebody asks the assistant a question. Google's
 * moving alias `gemini-flash-latest` avoids the pinning problem but points at
 * whatever is busiest — it answered 503 "high demand" while gemini-3.6-flash
 * answered fine — so it is a worse default, not a better one.
 *
 * The durable fix is not a cleverer constant: it is listGeminiModels() below,
 * which lets the admin page offer what the key can actually reach. Treat these
 * as a starting point, and expect to move them again.
 */
export const DEFAULT_MODELS: Record<Provider, string> = {
  gemini: "gemini-3.6-flash",
  openai: "gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
  openrouter: "google/gemini-3.6-flash",
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
 *
 * 45s, not the 20s this started at, because a reasoning model is genuinely
 * slow: measured against gemini-3.6-flash, "where should I eat in Kigali"
 * took 14s and "two days in Kigali and I love coffee" took 28s. At 20s the
 * short questions worked and the interesting ones silently fell back to the
 * catalogue — which looked like the model ignoring the question rather than
 * like a timeout.
 *
 * Note for deployment: a platform with its own function timeout below this
 * (Vercel Hobby cuts off at 10s) will kill the request first, and the visitor
 * gets the catalogue answer no matter what this says.
 */
export const REQUEST_TIMEOUT_MS = 45_000;

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

  // The three that actually happen get a first line somebody can act on. The
  // provider's own text still follows, because it names the model or the
  // quota and that is the part worth reading.
  const hint =
    status === 429
      ? "Rate limited by the provider. The free tier allows only a few requests a minute; this clears on its own."
      : status === 404
        ? "The provider does not have that model. Model names retire — use List models to see what this key can reach."
        : status === 401 || status === 403
          ? "The provider rejected the key."
          : "";

  const detail = trimmed ? `HTTP ${status}: ${trimmed}` : `HTTP ${status}`;
  return hint ? `${hint} (${detail})` : detail;
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

/**
 * The Gemini models this key can actually call, newest-looking first.
 *
 * Added because a retired model is the single failure this integration keeps
 * hitting, and the admin had no way to discover the replacement except by
 * reading a 404 body. Only Gemini for now: it is where the failure happens,
 * and the OpenAI-compatible providers each shape /models differently enough
 * that guessing one URL from a chat-completions URL is its own bug.
 */
export async function listGeminiModels(apiKey: string): Promise<string[]> {
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
    { method: "GET" },
  );
  if (!res.ok) {
    throw new Error(describeUpstreamError(res.status, await res.text()));
  }

  const data = (await res.json()) as {
    models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
  };

  return (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => (m.name ?? "").replace(/^models\//, ""))
    // Image, audio, video and research models answer generateContent but are
    // not chat models; offering them as a default invites a confusing bill.
    .filter((n) => n.startsWith("gemini-") && !/image|tts|audio|transcribe|robotics|computer-use|research/.test(n))
    .sort((a, b) => b.localeCompare(a, "en", { numeric: true }));
}

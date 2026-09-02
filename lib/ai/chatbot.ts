import { prisma } from "@/lib/prisma";
import {
  DEFAULT_MODELS,
  endpointFor,
  fetchWithTimeout,
  geminiUrl,
  isProvider,
  maskKey,
  redactSecrets,
  describeUpstreamError,
  type Provider,
} from "./providers";
import {
  KIGALI_DISTRICTS,
  categoryHints,
  followUpSuggestions,
  placesContext,
  rankPlaces,
  searchTerms,
  type RetrievedPlace,
} from "./retrieval";

export interface ChatbotConfig {
  provider: Provider;
  apiKey: string;
  model: string;
  customEndpoint?: string;
  systemPrompt?: string;
  enabled: boolean;
}

export const DEFAULT_SYSTEM_PROMPT = `You are Tembera AI, a tourism guide for Rwanda, answering inside the Tembera app.

How to answer
- Be concise and concrete. Two or three short paragraphs, or a short list. This is a chat bubble on a phone, not an article.
- Lead with the answer. No preamble, no restating the question, no "Great question!".
- Use markdown: **bold** for names, "- " for lists, ### only when an answer genuinely needs sections.
- Never claim a place is open, priced, or bookable unless the catalogue block below says so. If you do not know, say so and point to the listing.
- Answer in the language the user wrote in. Kinyarwanda, French and English are all expected.

What you can point people to
- /explore to browse everything, /map for the live map, /calendar for public holidays and Umuganda.
- /booking to request an experience, /business for listing or claiming a business.
- A specific listing as [Name](/place/id), using only ids given to you.

Rwanda specifics
- Umuganda is the last Saturday of each month, 08:00–11:00. Most businesses pause; movement is restricted.
- Kwibuka, the genocide commemoration period, begins 7 April and the first week is one of national mourning.
- Genocide memorials are places of mourning. Describe them with dignity, explain how to visit respectfully, and never rate, rank, or market them, or list them among "top attractions".
- Plastic bags are banned at the border. Photographing government or military installations is not allowed.

If a question is not about Rwanda, travel, or this app, say briefly that it is outside what you cover and offer something you can help with.`;

export const DEFAULT_CHATBOT_CONFIG: ChatbotConfig = {
  provider: "gemini",
  apiKey: "",
  model: DEFAULT_MODELS.gemini,
  customEndpoint: "",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  enabled: true,
};

const CONFIG_KEY = "chatbot_config";

/**
 * The number of past turns sent upstream.
 *
 * A conversation left open all afternoon otherwise resends its entire history
 * on every message: cost and latency climb with no cap, and the oldest turns
 * are the least useful. Ten messages is roughly five exchanges, which is more
 * than enough for the follow-ups this widget actually gets.
 */
const MAX_HISTORY = 10;

/* -------------------------------------------------------------- config */

function coerceConfig(raw: unknown): ChatbotConfig {
  const parsed = (raw ?? {}) as Partial<ChatbotConfig>;
  const provider = isProvider(parsed.provider) ? parsed.provider : DEFAULT_CHATBOT_CONFIG.provider;

  return {
    provider,
    apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
    model: (typeof parsed.model === "string" && parsed.model.trim()) || DEFAULT_MODELS[provider],
    customEndpoint: typeof parsed.customEndpoint === "string" ? parsed.customEndpoint : "",
    systemPrompt:
      (typeof parsed.systemPrompt === "string" && parsed.systemPrompt.trim()) ||
      DEFAULT_SYSTEM_PROMPT,
    enabled: parsed.enabled !== false,
  };
}

/**
 * The saved configuration, or one derived from the environment.
 *
 * The environment is the fallback rather than the override so an admin can
 * change providers from the dashboard on a host they cannot redeploy — which
 * is the entire reason this configuration lives in the database.
 */
export async function getChatbotConfig(): Promise<ChatbotConfig> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key: CONFIG_KEY } });
    if (row?.value) return coerceConfig(JSON.parse(row.value));
  } catch (error) {
    console.error("chatbot: could not read saved config, falling back to env", error);
  }

  const provider: Provider = process.env.OPENAI_API_KEY ? "openai" : "gemini";
  const model =
    provider === "openai"
      ? process.env.OPENAI_MODEL || DEFAULT_MODELS.openai
      : process.env.GEMINI_MODEL || DEFAULT_MODELS.gemini;

  return {
    ...DEFAULT_CHATBOT_CONFIG,
    provider,
    model,
    apiKey:
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.AI_API_KEY ||
      "",
  };
}

/**
 * The config minus the key, for anything that crosses to the browser.
 *
 * The admin form is a client component, so whatever the page hands it is
 * serialised into the RSC payload and sits in the page source. The key never
 * goes; the form shows whether one is set and offers to replace it.
 */
export type PublicChatbotConfig = Omit<ChatbotConfig, "apiKey"> & {
  hasApiKey: boolean;
  apiKeyHint: string;
};

export function toPublicConfig(config: ChatbotConfig): PublicChatbotConfig {
  const { apiKey, ...rest } = config;
  return {
    ...rest,
    hasApiKey: apiKey.trim() !== "",
    apiKeyHint: maskKey(apiKey),
  };
}

export async function saveChatbotConfig(
  config: Partial<ChatbotConfig>,
): Promise<ChatbotConfig> {
  const current = await getChatbotConfig();
  const updated = coerceConfig({ ...current, ...config });

  await prisma.systemSetting.upsert({
    where: { key: CONFIG_KEY },
    update: { value: JSON.stringify(updated) },
    create: { key: CONFIG_KEY, value: JSON.stringify(updated) },
  });

  return updated;
}

/* -------------------------------------------------------------- chatting */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  reply: string;
  suggestions: string[];
  places: Array<{
    id: string;
    name: string;
    city: string;
    subcategory: string;
    rating: number | null;
  }>;
  /** True when the reply came from the built-in guide rather than a model. */
  offline: boolean;
}

/**
 * Candidate listings for a question.
 *
 * Two rules the previous version broke, both of which the rest of this codebase
 * already follows:
 *
 * - only `published` rows exist as far as the public is concerned, so a draft
 *   an editor is still writing must not be recommended by the assistant;
 * - memorials are never ranked or promoted (see isSensitivePlace and the
 *   sensitive-category exclusion in topRated/featured). They are retrieved when
 *   asked about directly, and flagged so the prompt can say how to treat them.
 */
async function findPlaces(query: string): Promise<RetrievedPlace[]> {
  const terms = searchTerms(query);

  const select = {
    id: true,
    name: true,
    city: true,
    subcategory: true,
    categoryId: true,
    rating: true,
    description: true,
    sensitive: true,
  } as const;

  try {
    if (terms.length === 0) {
      const rows = await prisma.place.findMany({
        where: { status: "published", sensitive: false, categoryId: { not: "memorials" } },
        orderBy: [{ featured: "desc" }, { rating: "desc" }],
        take: 5,
        select,
      });
      return rows;
    }

    // Over-fetch, then rank in memory. Postgres can tell us which rows contain
    // a term but not which of them best answers the question, and the ordering
    // is what decides whether the model sees the right six.
    //
    // The category clause is what makes "hotels in Musanze" work: no row there
    // contains the word "hotel", but the ones the asker means are all in the
    // "stays" category. Kigali is widened the same way, because the column
    // holds the three districts rather than the name people type.
    const hints = categoryHints(terms);
    const cities = terms.includes("kigali") ? KIGALI_DISTRICTS : [];

    const rows = await prisma.place.findMany({
      where: {
        status: "published",
        OR: [
          ...terms.flatMap((t) => [
            { name: { contains: t, mode: "insensitive" as const } },
            { city: { contains: t, mode: "insensitive" as const } },
            { subcategory: { contains: t, mode: "insensitive" as const } },
            { categoryId: { contains: t, mode: "insensitive" as const } },
            { keywords: { has: t } },
          ]),
          ...(hints.length ? [{ categoryId: { in: hints } }] : []),
          ...(cities.length ? [{ city: { in: cities } }] : []),
        ],
      },
      take: 200,
      select,
    });

    return rankPlaces(rows, terms);
  } catch (error) {
    console.error("chatbot: place lookup failed", error);
    return [];
  }
}

function isMemorial(place: RetrievedPlace): boolean {
  return place.sensitive || place.categoryId === "memorials";
}

/**
 * Shorten a blurb at a word boundary, and end it with a full stop rather than
 * an ellipsis mid-word. "Sells premium Rwandan coffee beans and brewing
 * equipment…" reads as a sentence; "…brewing equipm…" reads as a bug.
 */
function trimSentence(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, "")}…`;
}

/* ------------------------------------------------------- provider calls */

async function callGemini(
  apiKey: string,
  model: string,
  systemInstruction: string,
  messages: ChatMessage[],
): Promise<string> {
  const response = await fetchWithTimeout(geminiUrl(model, apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      generationConfig: { temperature: 0.6, maxOutputTokens: 800 },
    }),
  });

  if (!response.ok) {
    throw new Error(describeUpstreamError(response.status, await response.text()));
  }

  const data = await response.json();

  // Gemini returns 200 with no candidate when a safety filter fires, and 200
  // with a truncated candidate when the token budget runs out. Both used to
  // surface as the generic "I could not generate a response".
  const blocked = data.promptFeedback?.blockReason;
  if (blocked) throw new Error(`blocked by the provider's safety filter (${blocked})`);

  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error(
      candidate?.finishReason
        ? `no text returned (finishReason: ${candidate.finishReason})`
        : "no text returned",
    );
  }

  return text;
}

async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  systemInstruction: string,
  messages: ChatMessage[],
): Promise<string> {
  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODELS.openai,
      messages: [
        { role: "system", content: systemInstruction },
        ...messages.filter((m) => m.role !== "system"),
      ],
      temperature: 0.6,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    throw new Error(describeUpstreamError(response.status, await response.text()));
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("no text returned");
  return text;
}

/* --------------------------------------------------------- offline guide */

/**
 * What the widget says when no key is configured, or when the provider is
 * down. It is deliberately not an apology: with 499 listings in the database,
 * a real answer is available for most questions without a model at all.
 */
function offlineReply(
  query: string,
  places: RetrievedPlace[],
): { reply: string; suggestions: string[] } {
  const q = query.toLowerCase();

  // "hello" carries no search terms, so the ranked list is just whatever is
  // featured — and answering a greeting with "From the Tembera catalogue:"
  // followed by five shops reads as a broken bot, not a helpful one.
  if (searchTerms(query).length === 0) {
    return {
      reply: `Muraho! Ask me for somewhere to eat or stay, a national park, or how to list a business.

You can also browse **[Explore](/explore)**, open the **[Map](/map)**, or check the **[Calendar](/calendar)** for holidays and Umuganda.`,
      suggestions: ["Where should I eat in Kigali?", "Plan a 3-day trip", "What is Umuganda?"],
    };
  }

  if (/business|claim|partner|listing|pricing|plan/.test(q)) {
    return {
      reply: `**Listing a business on Tembera**

1. Open **[For Business](/business)** and search for your business.
2. Claim it if it is already listed, or add it if it is not.
3. Pick a plan — the tiers are on **[Pricing](/business/pricing)**.
4. An admin reviews the claim before it goes live.`,
      suggestions: ["What do the paid plans include?", "Show me the map", "Plan a 3-day trip"],
    };
  }

  if (/umuganda|holiday|closed|calendar|kwibuka|etiquette/.test(q)) {
    return {
      reply: `**Umuganda** is the last Saturday of every month, 08:00–11:00. Most businesses pause and movement is restricted until it ends.

**Kwibuka**, the genocide commemoration, begins on 7 April; the first week is a period of national mourning and many venues close or scale back.

Public holidays are listed on the **[Calendar](/calendar)**.`,
      suggestions: ["What is closed during Umuganda?", "Show me the map", "Plan a 3-day trip"],
    };
  }

  const memorials = places.filter(isMemorial);
  const recommendable = places.filter((p) => !isMemorial(p));

  // Asked about a memorial directly: answer it, on its own, never mixed into a
  // "top places" list.
  if (memorials.length > 0 && /memorial|genocide|kwibuka|remember/.test(q)) {
    const list = memorials.map((p) => `- **[${p.name}](/place/${p.id})**, ${p.city}`).join("\n");
    return {
      reply: `These are places of mourning, and visitors are asked to dress modestly, keep phones away, and follow the guides' instructions.

${list}

Entry is generally free; guided tours are offered at the larger sites.`,
      suggestions: ["How should I prepare for a memorial visit?", "What is Umuganda?", "Show me the map"],
    };
  }

  if (recommendable.length > 0) {
    const list = recommendable
      .slice(0, 5)
      .map((p) => {
        const rating = p.rating ? ` · ${p.rating.toFixed(1)}★` : "";
        // One line per listing, with the blurb after a full stop. Splitting it
        // onto an indented continuation line rendered as "…in Musanze Luxury
        // eco-lodge beside…", with no punctuation between the two halves.
        const blurb = p.description
          ? ` ${trimSentence(p.description, 110)}`
          : "";
        return `- **[${p.name}](/place/${p.id})** — ${p.subcategory} in ${p.city}${rating}.${blurb}`;
      })
      .join("\n");

    return {
      reply: `From the Tembera catalogue:\n\n${list}\n\nBrowse everything in **[Explore](/explore)** or open the **[Map](/map)**.`,
      suggestions: followUpSuggestions(query, recommendable),
    };
  }

  return {
    reply: `I did not find a listing for that. You can browse by category in **[Explore](/explore)**, open the **[Map](/map)**, or check the **[Calendar](/calendar)** for holidays and Umuganda.

Ask me about somewhere to eat, a place to stay, the national parks, or listing a business.`,
    suggestions: ["Plan a 3-day trip", "Show me the map", "What is Umuganda?"],
  };
}

/* ---------------------------------------------------------------- entry */

export async function generateChatbotResponse(
  messages: ChatMessage[],
): Promise<ChatResponse> {
  const config = await getChatbotConfig();
  const lastUserMessage =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  if (!config.enabled) {
    return {
      reply: "The travel assistant is switched off at the moment.",
      suggestions: [],
      places: [],
      offline: true,
    };
  }

  const found = await findPlaces(lastUserMessage);

  // Only non-memorial rows become cards under the reply — the cards carry a
  // rating and a "recommended" framing that a memorial must never be given.
  const cards = found
    .filter((p) => !isMemorial(p))
    .map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city,
      subcategory: p.subcategory,
      rating: p.rating,
    }));

  if (!config.apiKey.trim()) {
    const offline = offlineReply(lastUserMessage, found);
    return { ...offline, places: cards, offline: true };
  }

  const systemInstruction =
    (config.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT) + placesContext(found);
  const history = messages.slice(-MAX_HISTORY);

  try {
    const endpoint = endpointFor(config.provider, config.customEndpoint);
    const reply =
      endpoint === null
        ? await callGemini(config.apiKey, config.model, systemInstruction, history)
        : await callOpenAICompatible(
            endpoint,
            config.apiKey,
            config.model,
            systemInstruction,
            history,
          );

    return {
      reply,
      suggestions: followUpSuggestions(lastUserMessage, found),
      places: cards,
      offline: false,
    };
  } catch (error) {
    // The upstream detail goes to the server log for whoever is on call. The
    // visitor gets a real answer from the catalogue instead of an apology and
    // an HTTP status they can do nothing with — the previous version pasted
    // the raw provider error into the chat bubble.
    console.error(
      "chatbot: provider call failed, answering from the catalogue instead:",
      redactSecrets(error instanceof Error ? error.message : String(error)),
    );

    const offline = offlineReply(lastUserMessage, found);
    return { ...offline, places: cards, offline: true };
  }
}

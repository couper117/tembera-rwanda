import { prisma } from "@/lib/prisma";

export interface ChatbotConfig {
  provider: "gemini" | "openai" | "groq" | "openrouter" | "custom";
  apiKey: string;
  model: string;
  customEndpoint?: string;
  systemPrompt?: string;
  enabled: boolean;
}

export const DEFAULT_CHATBOT_CONFIG: ChatbotConfig = {
  provider: "gemini",
  apiKey: "",
  model: "gemini-1.5-flash",
  customEndpoint: "",
  systemPrompt: `You are Tembera AI, an intelligent and knowledgeable tourism guide for Rwanda.
Your goal is to help visitors and locals explore Rwanda with clear, respectful, useful guidance.
- Recommend places, categories, attractions, nature, cultural sites, hotels, dining, transport, and activities.
- Explain Rwanda's values and practical guidance, including Umuganda timing, memorial respect, and public holidays.
- Discuss memorial sites with dignity and respect. Never rate or market them commercially.
- Help users understand Tembera features such as /explore, /map, /booking, and /business.
- When referring to real places, use markdown links like [Place Name](/place/place-id) or [Category](/c/category-id) if relevant.
- Keep answers concise, warm, and helpful in markdown.`,
  enabled: true,
};

const CONFIG_KEY = "chatbot_config";

export async function getChatbotConfig(): Promise<ChatbotConfig> {
  try {
    const row = await prisma.systemSetting.findUnique({
      where: { key: CONFIG_KEY },
    });

    if (row?.value) {
      const parsed = JSON.parse(row.value);
      return {
        ...DEFAULT_CHATBOT_CONFIG,
        ...parsed,
      };
    }
  } catch (error) {
    console.error("Failed to read chatbot config from DB:", error);
  }

  const envKey =
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.AI_API_KEY ||
    "";

  const provider = process.env.OPENAI_API_KEY ? "openai" : "gemini";
  const model =
    provider === "openai"
      ? process.env.OPENAI_MODEL || "gpt-4o-mini"
      : process.env.GEMINI_MODEL || "gemini-1.5-flash";

  return {
    ...DEFAULT_CHATBOT_CONFIG,
    provider,
    apiKey: envKey,
    model,
  };
}

export async function saveChatbotConfig(
  config: Partial<ChatbotConfig>,
): Promise<ChatbotConfig> {
  const current = await getChatbotConfig();
  const updated: ChatbotConfig = {
    ...current,
    ...config,
  };

  await prisma.systemSetting.upsert({
    where: { key: CONFIG_KEY },
    update: { value: JSON.stringify(updated) },
    create: { key: CONFIG_KEY, value: JSON.stringify(updated) },
  });

  return updated;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  reply: string;
  suggestions: string[];
  places?: Array<{
    id: string;
    name: string;
    city: string;
    subcategory: string;
    rating?: number | null;
  }>;
}

async function getRelevantPlaces(query: string) {
  try {
    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

    if (terms.length === 0) {
      return await prisma.place.findMany({
        take: 5,
        orderBy: { rating: "desc" },
        select: {
          id: true,
          name: true,
          city: true,
          subcategory: true,
          rating: true,
          description: true,
        },
      });
    }

    const places = await prisma.place.findMany({
      where: {
        OR: [
          ...terms.map((t) => ({ name: { contains: t, mode: "insensitive" as const } })),
          ...terms.map((t) => ({ city: { contains: t, mode: "insensitive" as const } })),
          ...terms.map((t) => ({ subcategory: { contains: t, mode: "insensitive" as const } })),
          ...terms.map((t) => ({ categoryId: { contains: t, mode: "insensitive" as const } })),
        ],
      },
      take: 6,
      select: {
        id: true,
        name: true,
        city: true,
        subcategory: true,
        rating: true,
        description: true,
      },
    });

    return places;
  } catch {
    return [];
  }
}

async function callGemini(
  apiKey: string,
  model: string,
  systemInstruction: string,
  messages: ChatMessage[],
): Promise<string> {
  const modelName = model || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const contents = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "I could not generate a response. Please try again."
  );
}

async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  systemInstruction: string,
  messages: ChatMessage[],
): Promise<string> {
  const url = endpoint || "https://api.openai.com/v1/chat/completions";

  const formattedMessages = [
    { role: "system", content: systemInstruction },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return (
    data.choices?.[0]?.message?.content ||
    "I could not generate a response. Please try again."
  );
}

function generateOfflineGuideResponse(
  userQuery: string,
  places: Array<{
    id: string;
    name: string;
    city: string;
    subcategory: string;
    rating?: number | null;
    description?: string | null;
  }>,
): { reply: string; suggestions: string[] } {
  const q = userQuery.toLowerCase();

  if (q.includes("business") || q.includes("claim") || q.includes("partner") || q.includes("listing")) {
    return {
      reply: `### Partnering with Tembera for Business

Tembera helps businesses get found, verified, and managed in Rwanda's travel ecosystem.

**How to claim or list your business:**
1. Visit the **[For Business page](/business)**.
2. Search for your business or add it to the directory.
3. Choose a plan and submit the claim form.
4. Our team reviews the listing and helps it go live.

**[Go to For Business](/business)**`,
      suggestions: [
        "What plans are available for businesses?",
        "How do I update opening hours?",
        "Explore dining in Kigali",
      ],
    };
  }

  if (q.includes("umuganda") || q.includes("holiday") || q.includes("closed") || q.includes("calendar") || q.includes("etiquette")) {
    return {
      reply: `### Rwanda Cultural Guidelines & Calendar

**Umuganda** happens on the **last Saturday of every month** from **8:00 AM to 11:00 AM**.
Most businesses slow down or pause during that period.

**Kwibuka** is held from **April 7 to April 13** and is a solemn period of remembrance.

**Public holidays** and observances can be viewed on the **[Calendar page](/calendar)**.`,
      suggestions: [
        "View the Rwanda Calendar",
        "Memorial sites in Rwanda",
        "Top attractions in Kigali",
      ],
    };
  }

  if (q.includes("book") || q.includes("trip") || q.includes("tour") || q.includes("experience") || q.includes("gorilla") || q.includes("itinerary")) {
    return {
      reply: `### Trip Bookings & Top Rwandan Experiences

Rwanda offers unforgettable experiences, including:
- **Volcanoes National Park** for gorilla tracking and hiking.
- **Nyungwe National Park** for rainforest adventures and chimpanzee tracking.
- **Akagera National Park** for safari drives and boat cruises.
- **Lake Kivu** for lakefront stays, kayaking, and relaxation.

You can request trip reservations on the **[Experience Booking page](/booking)**.`,
      suggestions: [
        "Book a Rwandan experience",
        "Explore Lake Kivu resorts",
        "Best coffee shops in Kigali",
      ],
    };
  }

  if (places.length > 0) {
    const list = places
      .map((p) => {
        const rating = p.rating ? ` • ${p.rating.toFixed(1)}` : "";
        const description = p.description
          ? `\n  _${p.description.slice(0, 120)}${p.description.length > 120 ? "..." : ""}_`
          : "";
        return `- **[${p.name}](/place/${p.id})** (${p.subcategory} in *${p.city}*)${rating}${description}`;
      })
      .join("\n\n");

    return {
      reply: `### Recommended Places in Rwanda

Here are curated places from our catalog matching your request:

${list}

You can also browse by category in **[Explore](/explore)** or open the live **[Map](/map)**.`,
      suggestions: [
        "Show places near me",
        "Best hotels and stays in Rwanda",
        "How do I claim my business?",
      ],
    };
  }

  return {
    reply: `### Welcome to Tembera! Your Rwanda Travel Guide

I can help you discover Rwanda with practical suggestions for:
- **[Dining & Cafes](/c/dining)**
- **[Stays & Lodges](/c/stays)**
- **[Nature & Parks](/c/nature)**
- **[Interactive Map](/map)**
- **[For Business](/business)**

What would you like to explore today?`,
    suggestions: [
      "Top coffee shops in Kigali",
      "Gorilla trekking & Volcanoes",
      "Umuganda rules & timing",
      "For business & listing claims",
    ],
  };
}

export async function generateChatbotResponse(
  messages: ChatMessage[],
): Promise<ChatResponse> {
  const config = await getChatbotConfig();
  const lastUserMessage =
    [...messages].reverse().find((m) => m.role === "user")?.content || "";

  const relevantPlaces = await getRelevantPlaces(lastUserMessage);

  if (!config.enabled) {
    return {
      reply: "The AI Travel Assistant is currently paused by the administrator.",
      suggestions: ["Browse Explore", "View Map", "For Business"],
    };
  }

  if (!config.apiKey || config.apiKey.trim() === "") {
    const offlineResult = generateOfflineGuideResponse(lastUserMessage, relevantPlaces);
    return {
      reply: offlineResult.reply,
      suggestions: offlineResult.suggestions,
      places: relevantPlaces.map((p) => ({
        id: p.id,
        name: p.name,
        city: p.city,
        subcategory: p.subcategory,
        rating: p.rating,
      })),
    };
  }

  const placesContext =
    relevantPlaces.length > 0
      ? `\n\nReal places currently in Tembera database matching user interest:\n` +
        relevantPlaces
          .map(
            (p) =>
              `- Place Name: "${p.name}", ID: "${p.id}", Category/Subcategory: "${p.subcategory}", City: "${p.city}", Rating: ${p.rating ?? "N/A"}. Description: "${p.description || ""}"`,
          )
          .join("\n") +
        `\nWhen referring to any of these places, format the link as [Place Name](/place/place-id).`
      : "";

  const systemInstruction = `${config.systemPrompt || DEFAULT_CHATBOT_CONFIG.systemPrompt}\n${placesContext}`;

  try {
    let replyText = "";

    if (config.provider === "gemini") {
      replyText = await callGemini(
        config.apiKey,
        config.model,
        systemInstruction,
        messages,
      );
    } else {
      const endpoint =
        config.provider === "groq"
          ? "https://api.groq.com/openai/v1/chat/completions"
          : config.provider === "openrouter"
            ? "https://openrouter.ai/api/v1/chat/completions"
            : config.customEndpoint || "https://api.openai.com/v1/chat/completions";

      replyText = await callOpenAICompatible(
        endpoint,
        config.apiKey,
        config.model,
        systemInstruction,
        messages,
      );
    }

    const suggestions = [
      "Top places near Kigali",
      "Plan a 3-day itinerary",
      "How to claim a business listing",
    ];

    return {
      reply: replyText,
      suggestions,
      places: relevantPlaces.map((p) => ({
        id: p.id,
        name: p.name,
        city: p.city,
        subcategory: p.subcategory,
        rating: p.rating,
      })),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Network issue";
    console.error("AI API call failed, falling back to smart guide engine:", error);
    const offlineResult = generateOfflineGuideResponse(lastUserMessage, relevantPlaces);
    return {
      reply: `${offlineResult.reply}\n\n_(Note: Live AI API returned an error: ${message}, rendered using local intelligence engine.)_`,
      suggestions: offlineResult.suggestions,
      places: relevantPlaces.map((p) => ({
        id: p.id,
        name: p.name,
        city: p.city,
        subcategory: p.subcategory,
        rating: p.rating,
      })),
    };
  }
}

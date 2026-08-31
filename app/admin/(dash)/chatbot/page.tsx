import { PageHead, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { getChatbotConfig } from "@/lib/ai/chatbot";
import ChatbotConfigForm from "./ChatbotConfigForm";

export const dynamic = "force-dynamic";

export default async function AdminChatbotPage() {
  await requireAdmin();
  const config = await getChatbotConfig();

  return (
    <>
      <PageHead
        title="AI Travel Assistant"
        sub="Configure the model, API key, and behavior of the Tembera visitor chatbot."
      />

      <div className="a-cols">
        <div>
          <Panel title="AI Model & API Key Configuration">
            <ChatbotConfigForm initialConfig={config} />
          </Panel>
        </div>

        <div>
          <Panel title="How Tembera AI Works">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--t-3)",
                fontSize: "13px",
                color: "var(--t-ink-2)",
                lineHeight: "1.6",
              }}
            >
              <p>
                The <strong>Tembera AI Assistant</strong> provides a guided travel and local information experience directly on the site.
              </p>

              <div
                style={{
                  padding: "var(--t-3)",
                  background: "var(--t-surface-2)",
                  borderRadius: "var(--t-radius-sm)",
                }}
              >
                <strong style={{ color: "var(--t-ink)", display: "block", marginBottom: 4 }}>
                  Live catalog grounding
                </strong>
                The assistant reads live place, category, and city data so recommendations are current and linked to real listings.
              </div>

              <div
                style={{
                  padding: "var(--t-3)",
                  background: "var(--t-surface-2)",
                  borderRadius: "var(--t-radius-sm)",
                }}
              >
                <strong style={{ color: "var(--t-ink)", display: "block", marginBottom: 4 }}>
                  Cultural sensitivity and etiquette
                </strong>
                It is encouraged to give respectful guidance on memorial sites and to explain Umuganda timing and Rwanda public observances clearly.
              </div>

              <div
                style={{
                  padding: "var(--t-3)",
                  background: "var(--t-surface-2)",
                  borderRadius: "var(--t-radius-sm)",
                }}
              >
                <strong style={{ color: "var(--t-ink)", display: "block", marginBottom: 4 }}>
                  Business and booking integration
                </strong>
                It can route users to the business claim flow and booking pages for tourism experiences.
              </div>
            </div>
          </Panel>

          <Panel title="Supported Providers">
            <ul
              style={{
                paddingLeft: "var(--t-4)",
                fontSize: "13px",
                color: "var(--t-ink-2)",
                lineHeight: "1.7",
              }}
            >
              <li>
                <strong>Google Gemini:</strong> Fast, generous free-tier access via Google AI Studio.
              </li>
              <li>
                <strong>OpenAI:</strong> gpt-4o-mini or gpt-4o.
              </li>
              <li>
                <strong>Groq:</strong> Fast open models for low-latency chats.
              </li>
              <li>
                <strong>OpenRouter / Custom:</strong> Any OpenAI-compatible endpoint.
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

import { PageHead, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { getChatbotConfig, toPublicConfig } from "@/lib/ai/chatbot";
import ChatbotConfigForm from "./ChatbotConfigForm";

export const dynamic = "force-dynamic";

export default async function AdminChatbotPage() {
  await requireAdmin();

  // toPublicConfig, not the config itself: the form is a client component, so
  // anything passed here is serialised into the page and would put the API key
  // in the HTML source of every admin session.
  const config = toPublicConfig(await getChatbotConfig());

  return (
    <>
      <PageHead
        title="Travel assistant"
        sub="The chat widget visitors see on the public site — which model answers, and what it is told."
      />

      <div className="a-cols">
        <div>
          <Panel title="Model and API key">
            <ChatbotConfigForm config={config} />
          </Panel>
        </div>

        <div>
          <Panel title="What it can answer">
            <div className="a-note">
              <p>
                Every question is matched against the live catalogue first. Listings that
                match are given to the model with their real ids, so the answer links to
                pages that exist rather than to invented ones.
              </p>
              <p>
                <strong>Memorials are never recommended.</strong> They are excluded from
                the ranked suggestions, exactly as they are from the home page rows, and
                the model is told to describe them without ratings or marketing.
              </p>
              <p>
                <strong>Without an API key it still works.</strong> The assistant falls
                back to catalogue search plus the built-in guidance on Umuganda, Kwibuka
                and business listings. The same fallback catches a provider outage, so
                visitors never see an error.
              </p>
            </div>
          </Panel>

          <Panel title="Getting a key">
            <div className="a-note">
              <ul>
                <li>
                  <strong>Gemini</strong> — free tier at{" "}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                    aistudio.google.com
                  </a>
                  . Model <code>gemini-2.0-flash</code>.
                </li>
                <li>
                  <strong>OpenAI</strong> —{" "}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                    platform.openai.com
                  </a>
                  . Model <code>gpt-4o-mini</code>.
                </li>
                <li>
                  <strong>Groq</strong> —{" "}
                  <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">
                    console.groq.com
                  </a>
                  . Fast, open models.
                </li>
                <li>
                  <strong>OpenRouter</strong> — one key across vendors; name the model as{" "}
                  <code>vendor/model</code>.
                </li>
              </ul>
              <p>
                Use <strong>Test connection</strong> after saving. It sends one real message
                to the provider you selected and shows exactly what came back.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

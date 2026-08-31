import Icon from "@/components/Icon";
import { PageHead, Panel, SampleNotice } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();

  return (
    <>
      <PageHead title="Settings" sub="How this deployment of Tembera behaves." />

      <SampleNotice what="Configurable settings" />

      <div className="a-cols">
        <div>
          <Panel title="Organisation">
            <div className="a-form">
              <div className="a-grid2">
                <div className="a-field">
                  <label className="a-label" htmlFor="orgName">
                    Name
                  </label>
                  <input id="orgName" className="a-input" defaultValue="Tembera Rwanda" disabled />
                </div>
                <div className="a-field">
                  <label className="a-label" htmlFor="orgContact">
                    Public contact
                  </label>
                  <input
                    id="orgContact"
                    className="a-input"
                    defaultValue="hello@tembera.rw"
                    disabled
                  />
                </div>
              </div>
              <div className="a-field">
                <label className="a-label" htmlFor="orgBlurb">
                  Description
                </label>
                <textarea
                  id="orgBlurb"
                  className="a-textarea"
                  defaultValue="The official guide to places across Rwanda."
                  disabled
                />
              </div>
            </div>
          </Panel>

          <Panel title="Submissions">
            <div className="a-form">
              <div className="a-checkrow">
                <input type="checkbox" defaultChecked disabled />
                <span className="a-hint">
                  Require an admin decision before a business listing goes live.
                </span>
              </div>
              <div className="a-checkrow">
                <input type="checkbox" defaultChecked disabled />
                <span className="a-hint">
                  Require a written reason when turning a submission down.
                </span>
              </div>
              <div className="a-checkrow">
                <input type="checkbox" disabled />
                <span className="a-hint">
                  Let verified businesses publish without review.
                </span>
              </div>
            </div>
          </Panel>
        </div>

        <div>
          <Panel title="Your account">
            <div className="t-facts">
              <div className="t-fact">
                <span className="t-fact__icon t-fact__icon--accent">
                  <Icon name="user" size={17} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="t-fact__label">Signed in as</span>
                  <span className="t-fact__value" style={{ display: "block" }}>
                    {admin.name}
                  </span>
                </span>
              </div>
              <div className="t-fact">
                <span className="t-fact__icon">
                  <Icon name="mail" size={17} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="t-fact__label">Email</span>
                  <span className="t-fact__value" style={{ display: "block" }}>
                    {admin.email}
                  </span>
                </span>
              </div>
              <div className="t-fact">
                <span className="t-fact__icon">
                  <Icon name="lock" size={17} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="t-fact__label">Role</span>
                  <span className="t-fact__value" style={{ display: "block" }}>
                    {admin.role}
                  </span>
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="AI Travel Assistant">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--t-2)" }}>
              <p className="t-small t-muted">
                Configure LLM providers (Gemini, OpenAI, Groq), API keys, and custom guidance prompts for the visitor AI chatbot.
              </p>
              <a
                href="/admin/chatbot"
                className="a-btn a-btn--accent"
                style={{ alignSelf: "flex-start", marginTop: "var(--t-1)" }}
              >
                Configure AI Assistant →
              </a>
            </div>
          </Panel>

          <Panel title="Sessions">
            <p className="t-small t-muted">
              Sessions are signed cookies valid for 30 days. There is no server-side
              session table, so an issued cookie cannot be revoked individually — only
              by rotating <code>ADMIN_SESSION_SECRET</code>, which signs every session
              out at once.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}

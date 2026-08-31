import Icon from "@/components/Icon";
import { PageHead, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data/settings";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const settings = await getSettings();

  return (
    <>
      <PageHead title="Settings" sub="How this deployment of Tembera behaves." />

      <div className="a-cols">
        <div>
          <Panel title="Organisation">
            <SettingsForm values={settings} />
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

          <Panel title="Sessions">
            <p className="t-small t-muted">
              Sign-in issues a signed cookie valid for 30 days. Changing your
              password invalidates every cookie issued before it, on every
              device — so a session you think was stolen dies with the password
              it outlived.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}

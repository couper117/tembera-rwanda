import Icon from "@/components/Icon";
import { PageHead, Panel, SampleNotice } from "@/components/admin/ui";
import { CURRENT_ADMIN } from "@/lib/admin/placeholder";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = CURRENT_ADMIN;

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

          <Panel title="Sessions">
            <p className="t-small t-muted">
              There are no sessions in this build. Sign-in has no backend behind it,
              so the admin screens are open and read-only — nothing here can be
              changed, and there is nothing to sign out of.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}

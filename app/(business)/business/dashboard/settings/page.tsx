import Icon from "@/components/Icon";
import { PageHead, Panel } from "@/components/admin/ui";
import BusinessSettingsForm from "@/components/business/BusinessSettingsForm";
import { PLANS } from "@/lib/business/plans";
import { requireBusiness } from "@/lib/auth";
import { getMyBusiness } from "@/lib/data/business";
import { getCities } from "@/lib/data/cities";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  const user = await requireBusiness();
  const business = await getMyBusiness(user.id);
  if (!business) return null;

  const cities = await getCities();
  const plan = PLANS.find((p) => p.id === business.plan);

  return (
    <>
      <PageHead title="Business details" sub="How Tembera reaches you, and who you are." />

      <div className="a-cols">
        <div>
          <Panel title="Details">
            <BusinessSettingsForm
              values={{
                name: business.name,
                contactName: business.contactName,
                email: business.email,
                phone: business.phone,
                city: business.city,
                tin: business.tin ?? "",
              }}
              cities={cities.map((c) => c.name)}
              canEdit={business.owner}
            />
          </Panel>
        </div>

        <div>
          <Panel title="Standing">
            <div className="t-facts">
              <div className="t-fact">
                <span className="t-fact__icon t-fact__icon--accent">
                  <Icon name="check" size={17} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="t-fact__label">Account</span>
                  <span className="t-fact__value" style={{ display: "block" }}>
                    {business.status}
                  </span>
                </span>
              </div>
              <div className="t-fact">
                <span className="t-fact__icon">
                  <Icon name="basket" size={17} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="t-fact__label">Plan</span>
                  <span className="t-fact__value" style={{ display: "block" }}>
                    {plan?.name ?? business.plan}
                  </span>
                </span>
              </div>
            </div>

            {business.status === "unverified" && (
              <p className="a-hint" style={{ marginTop: "var(--t-3)" }}>
                Add your RRA taxpayer number and Tembera can verify the account.
                Verified businesses publish changes without waiting for review.
              </p>
            )}

            {/* Nothing here charges anybody: a plan is what a business asked
                for, and money is a conversation had afterwards. Saying so
                beats a billing screen that does not bill. */}
            <p className="a-hint" style={{ marginTop: "var(--t-3)" }}>
              Plans are not billed through this site. Tembera will contact you.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}

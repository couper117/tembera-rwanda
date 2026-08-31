import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import PageHeader from "@/components/app/PageHeader";
import {
  PLANS,
  PLAN_FEATURES,
  formatRwf,
  formatUsd,
  type PlanId,
} from "@/lib/business/plans";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Three monthly plans for businesses on Tembera, in Rwandan francs and US dollars.",
};

/**
 * The plans side by side.
 *
 * Francs lead and dollars follow: this is a Rwandan product sold to Rwandan
 * businesses, and a visitor converting in their head is the secondary reader.
 *
 * The table scrolls inside its own container rather than widening the page —
 * three plan columns do not fit a 390px phone, and the body must never scroll
 * sideways.
 */

/**
 * Icons in this app are always `aria-hidden`, so a tick alone tells a screen
 * reader nothing. Each cell carries its own hidden word instead. Declared here
 * rather than as a utility class so this page adds nothing to the shared
 * stylesheet.
 */
const VISUALLY_HIDDEN: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

function Cell({ on }: { on: boolean }) {
  return (
    <>
      {on ? (
        <Icon name="check" size={16} />
      ) : (
        <span className="t-muted" aria-hidden="true">
          —
        </span>
      )}
      <span style={VISUALLY_HIDDEN}>{on ? "included" : "not included"}</span>
    </>
  );
}

function value(feature: (typeof PLAN_FEATURES)[number], plan: PlanId): boolean {
  return plan === "free" ? feature.free : plan === "checked" ? feature.checked : feature.top;
}

export default function PricingPage() {
  return (
    <>
      <PageHeader title="Pricing" fallbackHref="/business" revealTitleOnScroll />

      <main className="t-main">
        <div className="t-page" style={{ maxWidth: 680 }}>
          <div className="t-section">
            <h1 className="t-display">What it costs</h1>
            <p className="t-body" style={{ marginTop: "var(--t-3)", lineHeight: 1.6 }}>
              Three plans, paid every month. Being listed is always free.
            </p>
          </div>

          <section className="t-section">
            <div style={{ overflowX: "auto" }}>
              <table
                style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}
              >
                <thead>
                  <tr>
                    <th scope="col" style={{ textAlign: "left", padding: "var(--t-2)" }}>
                      <span className="t-small t-muted">Plan</span>
                    </th>
                    {PLANS.map((plan) => (
                      <th
                        key={plan.id}
                        scope="col"
                        style={{ textAlign: "center", padding: "var(--t-2)" }}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLAN_FEATURES.map((feature) => (
                    <tr key={feature.label}>
                      <th
                        scope="row"
                        style={{
                          textAlign: "left",
                          padding: "var(--t-2)",
                          fontWeight: 400,
                        }}
                      >
                        <span className="t-small">{feature.label}</span>
                      </th>
                      {PLANS.map((plan) => (
                        <td
                          key={plan.id}
                          style={{ textAlign: "center", padding: "var(--t-2)" }}
                        >
                          <Cell on={value(feature, plan.id)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th
                      scope="row"
                      style={{ textAlign: "left", padding: "var(--t-2)" }}
                    >
                      <strong>Every month</strong>
                    </th>
                    {PLANS.map((plan) => (
                      <td
                        key={plan.id}
                        style={{ textAlign: "center", padding: "var(--t-2)" }}
                      >
                        <strong>{formatRwf(plan.rwf)}</strong>
                        {formatUsd(plan.usd) && (
                          <div className="t-small t-muted">{formatUsd(plan.usd)}</div>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="t-section">
            <Link href="/business#claim" className="t-btn t-btn--primary t-btn--block">
              Claim your listing
            </Link>
            <p className="t-small t-muted" style={{ marginTop: "var(--t-3)", textAlign: "center" }}>
              We call you to check it is your business. Nothing is charged today.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

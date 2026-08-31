import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import PageHeader from "@/components/app/PageHeader";
import ClaimForm from "@/components/business/ClaimForm";
import { PLANS, formatRwf, formatUsd } from "@/lib/business/plans";

export const metadata: Metadata = {
  title: "For business",
  description:
    "Are you a hotel, restaurant, shop or tour guide? Claim your listing on Tembera and get found by visitors.",
};

/**
 * The paid side of Tembera, and the only screen that says out loud how the
 * product earns. Everything else in the app is built for a visitor; this one
 * is built for the owner of a place the visitor is reading about.
 *
 * Kept to one screen on purpose: what you get, what it costs, and the form.
 * The full comparison table lives at /business/pricing so this page can stay
 * short enough to read.
 */

const BENEFITS: { icon: "shield" | "image" | "clock" | "star"; title: string; body: string }[] = [
  {
    icon: "shield",
    title: "A checked listing",
    body: "We confirm the details with you, then mark the listing as checked so visitors know it is current.",
  },
  {
    icon: "clock",
    title: "Your own hours and photos",
    body: "Change your opening hours, phone number and pictures yourself. No waiting for us.",
  },
  {
    icon: "star",
    title: "A badge, and a last checked date",
    body: "Visitors see when the listing was last confirmed. A dated listing is a trusted one.",
  },
  {
    icon: "image",
    title: "Higher in Recommended",
    body: "On the Top plan your place surfaces in the Recommended row, marked as sponsored.",
  },
];

export default function BusinessPage() {
  return (
    <>
      <PageHeader title="For business" fallbackHref="/" revealTitleOnScroll />

      <main className="t-main">
        <div className="t-page" style={{ maxWidth: 680 }}>
          <div className="t-section">
            <h1 className="t-display">
              Are you a hotel, restaurant, shop or tour guide?
            </h1>
            <p className="t-body" style={{ marginTop: "var(--t-3)", lineHeight: 1.6 }}>
              Get found by visitors looking for places like yours in Rwanda.
            </p>
          </div>

          {/* ------------------------------------------------ benefits --- */}
          <section className="t-section">
            <h2 className="t-heading">What you get</h2>
            <div className="t-stack-3" style={{ marginTop: "var(--t-3)" }}>
              {BENEFITS.map((b) => (
                <div key={b.title} className="t-card" style={{ padding: "var(--t-4)" }}>
                  <div className="t-inline" style={{ gap: "var(--t-2)" }}>
                    <Icon name={b.icon} size={18} />
                    <strong>{b.title}</strong>
                  </div>
                  <p className="t-small t-muted" style={{ marginTop: "var(--t-2)" }}>
                    {b.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* --------------------------------------------------- plans --- */}
          <section className="t-section">
            <h2 className="t-heading">What it costs</h2>
            <p className="t-small t-muted" style={{ marginTop: "var(--t-2)" }}>
              Paid every month. Cancel whenever you like.
            </p>

            <div className="t-stack-3" style={{ marginTop: "var(--t-3)" }}>
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="t-card"
                  style={{ padding: "var(--t-4)" }}
                >
                  <div
                    className="t-inline"
                    style={{ justifyContent: "space-between", gap: "var(--t-2)" }}
                  >
                    <strong>{plan.name}</strong>
                    {plan.featured && <span className="t-badge t-badge--accent">Most chosen</span>}
                  </div>
                  <div className="t-display" style={{ marginTop: "var(--t-2)" }}>
                    {formatRwf(plan.rwf)}
                  </div>
                  {formatUsd(plan.usd) && (
                    <div className="t-small t-muted">{formatUsd(plan.usd)} a month</div>
                  )}
                  <p className="t-small t-muted" style={{ marginTop: "var(--t-2)" }}>
                    {plan.tagline}
                  </p>
                </div>
              ))}
            </div>

            <p className="t-small" style={{ marginTop: "var(--t-3)" }}>
              <Link href="/business/pricing">Compare the plans side by side</Link>
            </p>
          </section>

          {/* --------------------------------------------------- claim --- */}
          <section className="t-section" id="claim">
            <div className="t-card" style={{ padding: "var(--t-4)" }}>
              <h2 className="t-heading">Claim your listing</h2>
              <p className="t-small t-muted" style={{ marginTop: "var(--t-2)", marginBottom: "var(--t-4)" }}>
                Tell us which business is yours. We call you to check, then it
                is yours to look after. You don&apos;t need an account.
              </p>
              <ClaimForm />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

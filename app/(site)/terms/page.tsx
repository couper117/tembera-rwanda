import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/app/PageHeader";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "What Tembera promises, what it doesn't, and how to get something corrected.",
};

const LAST_UPDATED = "31 August 2026";

/**
 * Deliberately short and readable. A wall of legal boilerplate nobody reads
 * protects nobody — the two things that actually matter here are that the
 * listings are a guide rather than a guarantee, and that there is a real route
 * to get something corrected.
 */
export default function TermsPage() {
  return (
    <>
      <PageHeader title="Terms of use" fallbackHref="/settings" revealTitleOnScroll />

      <main className="t-main">
        <div className="t-page" style={{ maxWidth: 680 }}>
          <div className="t-section">
            <h1 className="t-display">Terms of use</h1>
            <p className="t-small t-muted" style={{ marginTop: "var(--t-2)" }}>
              Last updated {LAST_UPDATED}
            </p>
            <p className="t-body" style={{ marginTop: "var(--t-3)", lineHeight: 1.6 }}>
              Tembera is a free guide to places in Rwanda. These are the rules
              for using it, in plain language.
            </p>
          </div>

          <Section title="This is a guide, not a guarantee">
            <P>
              We work to keep listings accurate, but places change. Opening
              hours move, phone numbers change, and businesses close. Some of
              our entries record only a district rather than an exact address,
              and we mark those clearly.
            </P>
            <P>
              <B>
                Always confirm with the place itself before you travel,
              </B>{" "}
              especially for a long journey. We are not responsible for a wasted
              trip, and we do not accept liability for decisions made on the
              basis of a listing.
            </P>
          </Section>

          <Section title="We don't run these places">
            <P>
              Being listed on Tembera does not mean we endorse, inspect or have
              any relationship with a business. Ratings, where shown, come from
              our own records or from users — never from the business paying us.
            </P>
            <P>
              Memorial sites are listed as places of remembrance. They are never
              rated, reviewed or promoted.
            </P>
          </Section>

          <Section title="Tell us when something is wrong">
            <P>
              Every listing has a <B>&ldquo;Report a problem&rdquo;</B> button at
              the bottom of its page. It is not connected yet — this build has no
              backend, and the form says so when you submit it. If the listing is
              your business and something is wrong, or you would rather not be
              listed at all, contact us directly and we will put it right.
            </P>
          </Section>

          <Section title="Your account">
            <P>
              You can browse all of Tembera without an account. If you create
              one, keep your password to yourself — you are responsible for what
              happens under your account. If you think someone else has got in,
              change your password: that signs out every other device.
            </P>
            <P>
              You can delete your account at any time in Settings. See the{" "}
              <Link href="/privacy">privacy policy</Link> for what we store and
              what happens when you delete it.
            </P>
          </Section>

          <Section title="Photographs">
            <P>
              Listing photographs come from a range of sources and remain the
              property of whoever took them. Where a photograph requires
              credit, we show it beneath the image. If you own a photograph and
              want it removed, contact us directly.
            </P>
          </Section>

          <Section title="Changes">
            <P>
              If these terms change in a way that affects you, the date at the
              top of this page changes with it.
            </P>
          </Section>
        </div>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="t-section">
      <h2 className="t-heading" style={{ marginBottom: "var(--t-3)" }}>
        {title}
      </h2>
      <div className="t-stack-3">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="t-body" style={{ lineHeight: 1.6 }}>
      {children}
    </p>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <strong style={{ fontWeight: 600 }}>{children}</strong>;
}

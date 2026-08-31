import type { Metadata } from "next";
import PageHeader from "@/components/app/PageHeader";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Tembera stores about you, why, and how to get it back or erase it.",
};

// Written to satisfy Rwanda's Law No. 058/2021 relating to the protection of
// personal data and privacy: say what is collected, why, how long it is kept,
// and how the data subject exercises their rights.
//
// The contact address comes from the environment so it can be corrected
// without a code change. There is deliberately no plausible-looking default:
// if PRIVACY_CONTACT_EMAIL is unset the page says so plainly, because a policy
// that points at a mailbox nobody reads is worse than one that admits the gap.
const CONTACT_EMAIL = process.env.PRIVACY_CONTACT_EMAIL?.trim() || null;
const LAST_UPDATED = "31 August 2026";

function Contact() {
  if (!CONTACT_EMAIL) {
    return (
      <strong style={{ fontWeight: 600 }}>
        [no contact address configured &mdash; set PRIVACY_CONTACT_EMAIL]
      </strong>
    );
  }
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} style={{ fontWeight: 600 }}>
      {CONTACT_EMAIL}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Privacy" fallbackHref="/settings" revealTitleOnScroll />

      <main className="t-main">
        <div className="t-page" style={{ maxWidth: 680 }}>
          <div className="t-section">
            <h1 className="t-display">Privacy policy</h1>
            <p className="t-small t-muted" style={{ marginTop: "var(--t-2)" }}>
              Last updated {LAST_UPDATED}
            </p>
            <p className="t-body" style={{ marginTop: "var(--t-3)", lineHeight: 1.6 }}>
              Tembera is a directory of places in Rwanda. It has no accounts
              and no server-side storage of any kind: nothing you do here is
              recorded about you. This page explains exactly what that means.
            </p>
          </div>

          <Section title="What we store">
            <P>
              <B>Nothing.</B> Tembera has no database. There is no account
              system, no sign-in, and nowhere for us to put information about
              you even if we wanted to.
            </P>
            <P>
              <B>What stays in your browser:</B> your saved places, your visit
              history, your recent searches and your chosen city. These are held
              in your own browser&apos;s storage on this device, are never sent
              to us, and are gone when you clear your browsing data.
            </P>
            <P>
              <B>The sign-in and review forms</B> are part of a design that is
              not connected yet. They accept what you type and then tell you
              plainly that nothing was sent, because nothing was.
            </P>
          </Section>

          <Section title="What we do not do">
            <P>
              We do not sell your data, share it with advertisers, or use it to
              build an advertising profile. There are no third-party analytics
              or tracking scripts on this site.
            </P>
            <P>
              We do not track your location. If you use &ldquo;near me&rdquo;,
              your browser asks your permission and the coordinates are used to
              sort the list for that request only — they are never stored.
            </P>
          </Section>

          <Section title="Who else can see it">
            <P>
              The map is served by Google Maps, so loading a map page means your
              browser contacts Google and is subject to Google&apos;s own privacy
              policy. Place photos are loaded from the sites that host them.
            </P>
            <P>
              Nobody at Tembera can see anything about you, because nothing
              about you leaves your browser.
            </P>
          </Section>

          <Section title="How long we keep it">
            <P>
              There is nothing to keep. What your browser stores stays there for
              as long as you leave it there.
            </P>
          </Section>

          <Section title="Your rights">
            <P>
              Rwanda&apos;s Law N&deg; 058/2021 relating to the protection of
              personal data and privacy gives you the right to see the data an
              organisation holds about you, correct it, and have it erased. We
              hold none, so there is nothing to request — and no request could
              return anything.
            </P>
            <P>
              The one store of anything is your own browser. Clearing this
              site&apos;s data in your browser settings erases your saved places
              and history completely and immediately.
            </P>
            <P>
              If you have a question about any of this, write to <Contact />.
            </P>
          </Section>

          <Section title="Security">
            <P>
              There are no passwords, no sign-in cookies and no personal data at
              rest, so there is nothing here for an attacker to take.
            </P>
            <P>
              No system is perfect. If you find a security problem, please report
              it to <Contact /> rather than posting it publicly, and
              we will fix it.
            </P>
          </Section>

          <Section title="Changes">
            <P>
              If this policy changes in a way that affects you, the date at the
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

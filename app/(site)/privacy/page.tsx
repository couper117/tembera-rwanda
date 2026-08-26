import type { Metadata } from "next";
import Link from "next/link";
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
const LAST_UPDATED = "19 August 2026";

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
              Tembera is a directory of places in Rwanda. You can browse the
              whole thing without an account. This page explains what we store
              if you do create one, and how to get it back or erase it.
            </p>
          </div>

          <Section title="What we store">
            <P>
              <B>If you browse without an account:</B> nothing is stored about
              you on our servers. Your saved places, recent searches and chosen
              city are kept in your own browser and never sent to us.
            </P>
            <P>
              <B>If you create an account:</B> your name, email address, chosen
              handle, and optionally a short bio and home city. Your password is
              stored only as a scrambled hash — nobody at Tembera can read it,
              including us.
            </P>
            <P>
              <B>As you use the site:</B> the places you save, the places you
              open (so your profile can show your history), and any reviews you
              write. Reviews are public and show your name and handle.
            </P>
            <P>
              <B>If you request a booking:</B> the name, email, date and party
              size you enter, plus the calculated price.
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
              Tembera administrators can see account names, emails and bookings
              in order to run the service. Nobody else has access.
            </P>
          </Section>

          <Section title="How long we keep it">
            <P>
              Account information is kept until you delete your account. Booking
              records are kept for up to seven years after the booking date,
              because they are commercial records — but once you delete your
              account they are no longer linked to you.
            </P>
          </Section>

          <Section title="Your rights">
            <P>
              Under Rwanda&apos;s Law N&deg; 058/2021 relating to the protection
              of personal data and privacy, you can see the data we hold about
              you, correct it, and have it erased. You do not need to ask us to
              do any of it:
            </P>
            <ul className="t-stack-2" style={{ paddingLeft: "1.1rem", lineHeight: 1.6 }}>
              <li>
                <B>See and correct it</B> — edit your details any time on your{" "}
                <Link href="/profile" className="t-link">
                  profile
                </Link>
                .
              </li>
              <li>
                <B>Download it</B> — Settings has a button that gives you
                everything we hold as a file.
              </li>
              <li>
                <B>Erase it</B> — Settings can delete your account and everything
                attached to it. This cannot be undone.
              </li>
            </ul>
            <P>
              If something is wrong and you cannot fix it yourself, write to{" "}
              <Contact /> and we will put it right.
            </P>
          </Section>

          <Section title="Security">
            <P>
              Passwords are hashed with bcrypt. Sign-in sessions use a signed,
              server-verified cookie that expires after 30 days. Repeated failed
              sign-in attempts are blocked automatically.
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

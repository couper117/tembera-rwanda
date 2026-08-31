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
              Tembera is a directory of places in Rwanda. You can browse all of
              it without an account. This page explains what we store if you
              create one, why, how long we keep it, and how to get it back or
              erase it.
            </p>
          </div>

          <Section title="What we store">
            <P>
              <B>If you browse without an account:</B> nothing about you is
              stored on our servers. Your saved places, recent searches and
              chosen city are kept in your own browser and never sent to us.
            </P>
            <P>
              <B>If you create an account:</B> your name, email address, chosen
              handle, and optionally a short bio and home city. Your password is
              never stored — only a bcrypt hash of it, which cannot be turned
              back into the password by us or by anyone who obtained the
              database.
            </P>
            <P>
              <B>As you use the site while signed in:</B> the places you save,
              the places you open, and any review you write. Reviews are public
              and show your name and handle.
            </P>
            <P>
              <B>If you report a problem with a listing:</B> what you wrote and,
              only if you choose to give it, a way to reach you. You do not need
              an account to report an error.
            </P>
            <P>
              <B>Briefly, to stop abuse:</B> your IP address is counted against
              a short-lived limit on sign-in and sign-up attempts. It is held in
              memory for minutes and never written to the database.
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
              Tembera administrators can see account names, emails and reported
              problems in order to run the service. Nobody else has access.
            </P>
            <P>
              The service runs on <B>Neon</B> (database hosting) and{" "}
              <B>Vercel</B> (application hosting). They process data on our
              instructions in order to run the service, and for no purpose of
              their own.
            </P>
          </Section>

          <Section title="How long we keep it">
            <P>
              Account information is kept until you delete your account, which
              you can do yourself at any time. Deleting it removes your
              profile, your saved places, your visit history and your reviews.
            </P>
            <P>
              A problem report you send about a listing is kept after the
              correction is made, because it is the record of why a listing was
              changed. It carries only what you typed and the contact detail you
              chose to give.
            </P>
          </Section>

          <Section title="Your rights">
            <P>
              Under Rwanda&apos;s Law N&deg; 058/2021 relating to the protection
              of personal data and privacy, you can see the data we hold about
              you, correct it, and have it erased. You do not have to ask us to
              do any of it:
            </P>
            <ul className="t-stack-2" style={{ paddingLeft: "1.1rem", lineHeight: 1.6 }}>
              <li>
                <B>See and correct it</B> — edit your details any time on your
                profile.
              </li>
              <li>
                <B>Download it</B> — Settings gives you everything we hold as a
                file you can keep or take elsewhere.
              </li>
              <li>
                <B>Erase it</B> — Settings deletes your account and everything
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
              Passwords are hashed with bcrypt and never stored in a readable
              form. Sign-in uses a signed, httpOnly session cookie that expires
              after 30 days and can be revoked: changing your password signs out
              every other device, so a stolen session dies with the password it
              outlived. Repeated failed sign-in attempts are throttled.
            </P>
            <P>
              No system is perfect. If you find a security problem, please
              report it to <Contact /> rather than posting it publicly, and we
              will fix it.
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

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Icon from "@/components/Icon";
import { findResetTarget } from "@/lib/actions/password-reset";
import { getCurrentUser } from "@/lib/auth";
import ResetForm from "./ResetForm";

export const metadata: Metadata = {
  title: "Set a new password — Tembera",
  robots: { index: false, follow: false },
};

export default async function ResetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/settings");

  const { token } = await params;
  const target = await findResetTarget(token);

  // A dead link gets its own screen rather than a redirect to /forgot. The
  // difference matters to the reader: "this link is stale, here is a fresh
  // start" is a different message from silently landing back on a form they
  // have already filled in once, wondering whether it worked the first time.
  if (!target) {
    return (
      <main className="t-main">
        <div className="t-auth-container">
          <div className="t-auth-form-wrapper">
            <div className="t-authcard">
              <div className="t-authcard__header">
                <div className="t-authcard__brand-icon">
                  <Icon name="alert" size={24} />
                </div>
                <div>
                  <h1 className="t-authcard__title">This link has expired</h1>
                  <p className="t-authcard__sub">
                    Reset links last an hour and can only be used once. This one
                    has been used already, or it has run out.
                  </p>
                </div>
              </div>

              <Link
                href="/forgot"
                className="t-btn t-btn--primary t-btn--block t-btn--lg"
              >
                Send me a new link
              </Link>

              <div className="t-authcard__divider">
                <span>Remembered it?</span>
              </div>

              <Link href="/login" className="t-btn t-btn--secondary t-btn--block">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <ResetForm token={token} name={target.name} email={target.email} />;
}

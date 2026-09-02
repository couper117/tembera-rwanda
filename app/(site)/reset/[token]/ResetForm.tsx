"use client";

import Link from "next/link";
import { useActionState } from "react";
import AuthHero from "@/components/auth/AuthHero";
import Icon from "@/components/Icon";
import { consumeResetAction, type ResetState } from "@/lib/actions/password-reset";

const initial: ResetState = {};

export default function ResetForm({
  token,
  name,
  email,
}: {
  token: string;
  name: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(consumeResetAction, initial);

  return (
    <main className="t-main">
      <div className="t-auth-container">
        <AuthHero
          image="/assets/images/rwanda_lake_kivu_sunset.jpg"
          credit="Photo: Rwejo / Wikimedia Commons, CC BY-SA 4.0"
          badge="Account recovery"
          title="Choose a new password."
          description="Setting it will sign you out everywhere else — including anyone who should not have been there."
          fallbackHref="/login"
        />

        <div className="t-auth-form-wrapper">
          {state.ok ? (
            <div className="t-authcard">
              <div className="t-authcard__header">
                <div className="t-authcard__brand-icon">
                  <Icon name="check" size={24} />
                </div>
                <div>
                  <h1 className="t-authcard__title">Password changed</h1>
                  <p className="t-authcard__sub">
                    Every other session has been signed out. Sign in with your
                    new password.
                  </p>
                </div>
              </div>

              <Link
                href={`/login?email=${encodeURIComponent(email)}`}
                className="t-btn t-btn--primary t-btn--block t-btn--lg"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <form action={action} className="t-authcard">
              {/* The token travels with the submission rather than being read
                  from the URL server-side: the action is a POST endpoint in its
                  own right and must carry everything it needs to authorise
                  itself. It is re-checked there regardless of this page's
                  verdict. */}
              <input type="hidden" name="token" value={token} />

              <div className="t-authcard__header">
                <div className="t-authcard__brand-icon">
                  <Icon name="lock" size={24} />
                </div>
                <div>
                  <h1 className="t-authcard__title">Hello {name}</h1>
                  <p className="t-authcard__sub">
                    Set a new password for {email}.
                  </p>
                </div>
              </div>

              {state.error && (
                <div className="t-notice t-notice--danger" role="alert">
                  <span className="t-notice__icon">
                    <Icon name="alert" size={18} />
                  </span>
                  <div className="t-notice__body">{state.error}</div>
                </div>
              )}

              <div className="t-authfield">
                <span className="t-label">New password</span>
                <label className="t-field">
                  <Icon name="lock" size={18} />
                  <input
                    className="t-field__input"
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                    autoFocus
                  />
                </label>
              </div>

              <div className="t-authfield">
                <span className="t-label">Confirm new password</span>
                <label className="t-field">
                  <Icon name="lock" size={18} />
                  <input
                    className="t-field__input"
                    type="password"
                    name="confirm"
                    autoComplete="new-password"
                    placeholder="Type it once more"
                    minLength={8}
                    required
                  />
                </label>
              </div>

              <button
                className="t-btn t-btn--primary t-btn--block t-btn--lg"
                type="submit"
                disabled={pending}
                style={{ marginTop: "var(--t-2)" }}
              >
                {pending ? "Saving…" : "Set new password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

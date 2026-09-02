"use client";

import Link from "next/link";
import { useActionState } from "react";
import AuthHero from "@/components/auth/AuthHero";
import Icon from "@/components/Icon";
import { requestResetAction, type ResetState } from "@/lib/actions/password-reset";

const initial: ResetState = {};

export default function ForgotForm({ email }: { email?: string }) {
  const [state, action, pending] = useActionState(requestResetAction, initial);

  return (
    <main className="t-main">
      <div className="t-auth-container">
        <AuthHero
          image="/assets/images/rwanda_lake_kivu_sunset.jpg"
          credit="Photo: Rwejo / Wikimedia Commons, CC BY-SA 4.0"
          badge="Account recovery"
          title="Locked out? It happens."
          description="We'll email you a link to set a new password. It works once, and only for the next hour."
          fallbackHref="/login"
        />

        <div className="t-auth-form-wrapper">
          {/* Once the request is in, the form is replaced rather than left
              sitting under a success notice. Leaving it would invite a second
              submission, which retires the link the first one just sent. */}
          {state.sent ? (
            <div className="t-authcard">
              <div className="t-authcard__header">
                <div className="t-authcard__brand-icon">
                  <Icon name="mail" size={24} />
                </div>
                <div>
                  <h1 className="t-authcard__title">Check your inbox</h1>
                  <p className="t-authcard__sub">
                    If that address has an account, a reset link is on its way.
                    It expires in an hour.
                  </p>
                </div>
              </div>

              <p className="t-muted" style={{ margin: 0 }}>
                Nothing arrived? Check the spam folder, and make sure the
                address you typed is the one you signed up with.
              </p>

              <Link
                href="/login"
                className="t-btn t-btn--primary t-btn--block t-btn--lg"
                style={{ marginTop: "var(--t-2)" }}
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form action={action} className="t-authcard">
              <div className="t-authcard__header">
                <div className="t-authcard__brand-icon">
                  <Icon name="lock" size={24} />
                </div>
                <div>
                  <h1 className="t-authcard__title">Reset your password</h1>
                  <p className="t-authcard__sub">
                    Enter the email address on your account and we&apos;ll send
                    you a link.
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
                <span className="t-label">Email address</span>
                <label className="t-field">
                  <Icon name="mail" size={18} />
                  <input
                    className="t-field__input"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    defaultValue={email}
                    required
                    autoFocus
                  />
                </label>
              </div>

              <button
                className="t-btn t-btn--primary t-btn--block t-btn--lg"
                type="submit"
                disabled={pending}
                style={{ marginTop: "var(--t-2)" }}
              >
                {pending ? "Sending…" : "Email me a reset link"}
              </button>

              <div className="t-authcard__divider">
                <span>Remembered it?</span>
              </div>

              <Link href="/login" className="t-btn t-btn--secondary t-btn--block">
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

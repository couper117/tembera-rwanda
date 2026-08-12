"use client";

import Link from "next/link";
import { useActionState } from "react";
import PageHeader from "@/components/app/PageHeader";
import Icon from "@/components/Icon";
import { registerAction, type AuthState } from "@/lib/actions/auth";

const initial: AuthState = {};

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <>
      <PageHeader title="Create account" fallbackHref="/" />
      <main className="t-main">
        <div className="t-auth">
          <form action={action} className="t-authcard">
            <div>
              <h1 className="t-authcard__title">Create your account</h1>
              <p className="t-authcard__sub">
                Save places, track where you&apos;ve been, and leave reviews.
              </p>
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
              <span className="t-label">Name</span>
              <label className="t-field">
                <Icon name="user" size={18} />
                <input
                  className="t-field__input"
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                  required
                />
              </label>
            </div>

            <div className="t-authfield">
              <span className="t-label">Email</span>
              <label className="t-field">
                <Icon name="external" size={18} />
                <input
                  className="t-field__input"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </label>
            </div>

            <div className="t-authfield">
              <span className="t-label">Password</span>
              <label className="t-field">
                <Icon name="lock" size={18} />
                <input
                  className="t-field__input"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="At least 8 characters"
                  required
                />
              </label>
              <span className="t-authfield__hint">At least 8 characters.</span>
            </div>

            <button
              className="t-btn t-btn--primary t-btn--block"
              type="submit"
              disabled={pending}
            >
              {pending ? "Creating…" : "Create account"}
            </button>

            <p className="t-authcard__foot">
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}

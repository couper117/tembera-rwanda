"use client";

import Link from "next/link";
import { useActionState } from "react";
import PageHeader from "@/components/app/PageHeader";
import Icon from "@/components/Icon";
import { loginAction, type AuthState } from "@/lib/actions/auth";

const initial: AuthState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <>
      <PageHeader title="Sign in" fallbackHref="/" />
      <main className="t-main">
        <div className="t-auth">
          <form action={action} className="t-authcard">
            <div>
              <h1 className="t-authcard__title">Welcome back</h1>
              <p className="t-authcard__sub">
                Sign in to sync your saved places and reviews.
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
                  autoComplete="current-password"
                  placeholder="Your password"
                  required
                />
              </label>
            </div>

            <button
              className="t-btn t-btn--primary t-btn--block"
              type="submit"
              disabled={pending}
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>

            <p className="t-authcard__foot">
              New here? <Link href="/register">Create an account</Link>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}

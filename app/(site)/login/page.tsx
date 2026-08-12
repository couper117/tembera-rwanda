"use client";

import Link from "next/link";
import { useActionState } from "react";
import PageHeader from "@/components/app/PageHeader";
import { loginAction, type AuthState } from "@/lib/actions/auth";

const initial: AuthState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <>
      <PageHeader title="Sign in" />
      <div className="t-auth">
        <form action={action} className="t-authcard">
          <h1 className="t-authcard__title">Welcome back</h1>
          <p className="t-authcard__sub">
            Sign in to sync your saved places and reviews.
          </p>

          {state.error && <p className="t-authcard__error">{state.error}</p>}

          <label className="t-field">
            <span className="t-field__label">Email</span>
            <input
              className="t-input"
              type="email"
              name="email"
              autoComplete="email"
              required
            />
          </label>

          <label className="t-field">
            <span className="t-field__label">Password</span>
            <input
              className="t-input"
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button className="t-btn t-btn--primary" type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>

          <p className="t-authcard__foot">
            New here? <Link href="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </>
  );
}

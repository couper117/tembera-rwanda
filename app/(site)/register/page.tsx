"use client";

import Link from "next/link";
import { useActionState } from "react";
import PageHeader from "@/components/app/PageHeader";
import { registerAction, type AuthState } from "@/lib/actions/auth";

const initial: AuthState = {};

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <>
      <PageHeader title="Create account" />
      <div className="t-auth">
        <form action={action} className="t-authcard">
          <h1 className="t-authcard__title">Create your account</h1>
          <p className="t-authcard__sub">
            Save places, track where you&apos;ve been, and leave reviews.
          </p>

          {state.error && <p className="t-authcard__error">{state.error}</p>}

          <label className="t-field">
            <span className="t-field__label">Name</span>
            <input className="t-input" type="text" name="name" autoComplete="name" required />
          </label>

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
              autoComplete="new-password"
              minLength={8}
              required
            />
            <span className="t-field__hint">At least 8 characters.</span>
          </label>

          <button className="t-btn t-btn--primary" type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create account"}
          </button>

          <p className="t-authcard__foot">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </>
  );
}

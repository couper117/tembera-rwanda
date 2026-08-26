"use client";

import Link from "next/link";
import { useActionState } from "react";
import Icon from "@/components/Icon";
import { login, type LoginState } from "../actions";

const initialState: LoginState = {};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="a-login">
      <div className="a-login__card">
        <div className="a-brand" style={{ marginBottom: "var(--t-5)" }}>
          <span className="a-brand__mark">
            <Icon name="pin" size={18} />
          </span>
          <span className="a-brand__text">
            Tembera
            <span className="a-brand__sub">Admin</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * @param signedInEmail  The email of a NON-admin who is already signed in, or
 *   null. When set, we don't show the login form — the visitor already has an
 *   account, it just isn't an admin, so we say so and offer a way out.
 */
export default function AdminLoginForm({
  signedInEmail,
}: {
  signedInEmail: string | null;
}) {
  const [state, formAction, pending] = useActionState(login, initialState);

  if (signedInEmail) {
    return (
      <Shell>
        <div className="t-notice t-notice--danger" style={{ marginBottom: "var(--t-4)" }}>
          <span className="t-notice__icon">
            <Icon name="lock" size={16} />
          </span>
          <div className="t-notice__body">
            You&apos;re signed in as <strong>{signedInEmail}</strong>, but this account
            doesn&apos;t have admin access.
          </div>
        </div>

        <Link href="/" className="t-btn t-btn--primary t-btn--block">
          Back to Tembera
        </Link>

        <form action="/logout" method="post" style={{ marginTop: "var(--t-2)" }}>
          <input type="hidden" name="redirectTo" value="/admin/login" />
          <button type="submit" className="t-btn t-btn--secondary t-btn--block">
            Sign out and use an admin account
          </button>
        </form>
      </Shell>
    );
  }

  return (
    <Shell>
      <form action={formAction} className="a-form">
        <div className="a-field">
          <label className="a-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            className="a-input"
            autoComplete="username"
            required
          />
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            className="a-input"
            autoComplete="current-password"
            required
          />
        </div>

        {state?.error && (
          <div className="t-notice t-notice--danger">
            <span className="t-notice__icon">
              <Icon name="alert" size={16} />
            </span>
            <div className="t-notice__body">{state.error}</div>
          </div>
        )}

        <button
          type="submit"
          className="t-btn t-btn--primary t-btn--block"
          disabled={pending}
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="t-small t-muted" style={{ marginTop: "var(--t-4)", textAlign: "center" }}>
        <Link href="/">← Back to Tembera</Link>
      </p>
    </Shell>
  );
}

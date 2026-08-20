"use client";

import Link from "next/link";
import { useActionState } from "react";
import AuthHero from "@/components/auth/AuthHero";
import Icon from "@/components/Icon";
import { loginAction, type AuthState } from "@/lib/actions/auth";

const initial: AuthState = {};

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <main className="t-main">
      <div className="t-auth-container">
        <AuthHero
          image="/assets/images/rwanda_lake_kivu_sunset.jpg"
          credit="Photo: Rwejo / Wikimedia Commons, CC BY-SA 4.0"
          badge="Explore Rwanda"
          title="Welcome back to the Land of a Thousand Hills."
          description="Sign in to sync your saved places, visits and reviews across every device."
          stats={[
            { value: "500+", label: "Curated places" },
            { value: "30", label: "Districts" },
            { value: "100%", label: "Authentic experience" },
          ]}
        />

        <div className="t-auth-form-wrapper">
          <form action={action} className="t-authcard">
            <div className="t-authcard__header">
              <div className="t-authcard__brand-icon">
                <Icon name="pin" size={24} />
              </div>
              <div>
                <h1 className="t-authcard__title">Welcome back</h1>
                <p className="t-authcard__sub">
                  Sign in to sync your saved places, visits and preferences.
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
                  required
                />
              </label>
            </div>

            <div className="t-authfield">
              <div className="t-authfield__top">
                <span className="t-label">Password</span>
              </div>
              <label className="t-field">
                <Icon name="lock" size={18} />
                <input
                  className="t-field__input"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
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
              {pending ? "Signing in…" : "Sign in to Tembera"}
            </button>

            <div className="t-authcard__divider">
              <span>Don&apos;t have an account yet?</span>
            </div>

            <Link href="/register" className="t-btn t-btn--secondary t-btn--block">
              Create a free account
            </Link>
          </form>
        </div>
      </div>
    </main>
  );
}

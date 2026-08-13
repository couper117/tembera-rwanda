"use client";

import Link from "next/link";
import { useActionState } from "react";
import PageHeader from "@/components/app/PageHeader";
import Icon from "@/components/Icon";
import { loginAction, type AuthState } from "@/lib/actions/auth";

const initial: AuthState = {};

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <>
      <PageHeader title="Sign in" fallbackHref="/" />
      <main className="t-main">
        <div className="t-auth-container">
          {/* Side Hero Showcase (Desktop & Tablet) */}
          <div className="t-auth-hero">
            <div className="t-auth-hero__overlay" />
            <div className="t-auth-hero__content">
              <div className="t-auth-hero__badge">
                <Icon name="pin" size={18} />
                <span>Explore Rwanda</span>
              </div>
              <h2 className="t-auth-hero__title">
                Your journey through the Land of a Thousand Hills starts here.
              </h2>
              <p className="t-auth-hero__desc">
                Save your favorite destinations, track places you&apos;ve visited, write reviews, and access your curated Rwanda travel guide anywhere.
              </p>

              <div className="t-auth-hero__stats">
                <div className="t-auth-hero__stat">
                  <span className="t-auth-hero__stat-val">500+</span>
                  <span className="t-auth-hero__stat-lbl">Curated Places</span>
                </div>
                <div className="t-auth-hero__stat">
                  <span className="t-auth-hero__stat-val">30</span>
                  <span className="t-auth-hero__stat-lbl">Districts</span>
                </div>
                <div className="t-auth-hero__stat">
                  <span className="t-auth-hero__stat-val">100%</span>
                  <span className="t-auth-hero__stat-lbl">Authentic Experience</span>
                </div>
              </div>
            </div>
          </div>

          {/* Login Form Section */}
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
                  <Icon name="external" size={18} />
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

              <Link
                href="/register"
                className="t-btn t-btn--secondary t-btn--block"
              >
                Create a free account
              </Link>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

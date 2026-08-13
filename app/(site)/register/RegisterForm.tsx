"use client";

import Link from "next/link";
import { useActionState } from "react";
import PageHeader from "@/components/app/PageHeader";
import Icon from "@/components/Icon";
import { registerAction, type AuthState } from "@/lib/actions/auth";

const initial: AuthState = {};

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <>
      <PageHeader title="Create account" fallbackHref="/" />
      <main className="t-main">
        <div className="t-auth-container">
          {/* Side Hero Showcase */}
          <div className="t-auth-hero">
            <div className="t-auth-hero__overlay" />
            <div className="t-auth-hero__content">
              <div className="t-auth-hero__badge">
                <Icon name="pin" size={18} />
                <span>Discover Rwanda</span>
              </div>
              <h2 className="t-auth-hero__title">
                Join thousands of travelers exploring Rwanda.
              </h2>
              <p className="t-auth-hero__desc">
                Create your account to sync your saved places across devices, write reviews, and customize your travel experience.
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
                  <span className="t-auth-hero__stat-lbl">Free Access</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form wrapper */}
          <div className="t-auth-form-wrapper">
            <form action={action} className="t-authcard">
              <div className="t-authcard__header">
                <div className="t-authcard__brand-icon">
                  <Icon name="pin" size={24} />
                </div>
                <div>
                  <h1 className="t-authcard__title">Create an account</h1>
                  <p className="t-authcard__sub">
                    Save places, track visits, and leave authentic reviews.
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
                <span className="t-label">Full name</span>
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
                <span className="t-authfield__hint">Must be at least 8 characters long.</span>
              </div>

              <button
                className="t-btn t-btn--primary t-btn--block t-btn--lg"
                type="submit"
                disabled={pending}
                style={{ marginTop: "var(--t-2)" }}
              >
                {pending ? "Creating account…" : "Create account"}
              </button>

              <div className="t-authcard__divider">
                <span>Already have an account?</span>
              </div>

              <Link
                href="/login"
                className="t-btn t-btn--secondary t-btn--block"
              >
                Sign in instead
              </Link>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

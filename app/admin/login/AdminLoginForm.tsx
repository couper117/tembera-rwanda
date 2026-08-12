"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type LoginState } from "../actions";
import styles from "../admin.module.css";

const initialState: LoginState = {};

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
      <div className={styles.loginWrap}>
        <div className={styles.loginCard}>
          <h1 className={styles.loginBrand}>Tembera</h1>
          <p className={styles.loginSub}>Admin access</p>

          <p className={styles.error}>
            You&apos;re signed in as <strong>{signedInEmail}</strong>, but this
            account doesn&apos;t have admin access.
          </p>

          <Link
            href="/"
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ justifyContent: "center", textDecoration: "none" }}
          >
            Back to Tembera
          </Link>

          <form action="/logout" method="post">
            <input type="hidden" name="redirectTo" value="/admin/login" />
            <button
              type="submit"
              className={styles.btn}
              style={{ justifyContent: "center", width: "100%", marginTop: 8 }}
            >
              Sign out and use an admin account
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <h1 className={styles.loginBrand}>Tembera</h1>
        <p className={styles.loginSub}>Admin sign in</p>

        <form action={formAction} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              className={styles.input}
              autoComplete="username"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              className={styles.input}
              autoComplete="current-password"
              required
            />
          </div>

          {state?.error && <p className={styles.error}>{state.error}</p>}

          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={pending}
            style={{ justifyContent: "center" }}
          >
            {pending ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className={styles.loginSub} style={{ marginTop: 16 }}>
          <Link href="/" style={{ color: "inherit" }}>
            ← Back to Tembera
          </Link>
        </p>
      </div>
    </div>
  );
}

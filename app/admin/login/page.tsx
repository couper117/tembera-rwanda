"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";
import styles from "../admin.module.css";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

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
      </div>
    </div>
  );
}

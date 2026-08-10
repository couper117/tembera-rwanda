"use client";

import { useActionState } from "react";
import { login } from "../actions";

const initialState: { error?: string } = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <h3 className="mb-1">VisitRwanda</h3>
        <p className="text-muted mb-4">Admin sign in</p>

        <form action={formAction}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              autoComplete="username"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              autoComplete="current-password"
              required
            />
          </div>

          {state?.error && (
            <p style={{ color: "#c0392b", fontWeight: 600 }}>{state.error}</p>
          )}

          <button type="submit" className="btn btn-success w-100" disabled={pending}>
            {pending ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import Icon from "@/components/Icon";
import Spinner from "@/components/ui/Spinner";
import {
  changePasswordAction,
  deleteMyAccountAction,
  exportMyDataAction,
  signOutEverywhereAction,
} from "@/lib/actions/user";

/**
 * The data-rights controls: change password, download everything, delete
 * everything. Kept out of SettingsScreen because each one carries its own
 * form state, and only the delete flow needs a confirmation step.
 *
 * Rendered only when signed in — there is nothing on the server to export or
 * erase for a guest.
 */
export default function AccountDataSection() {
  return (
    <>
      <section className="t-section">
        <h2 className="t-label" style={{ marginBottom: "var(--t-2)" }}>
          Password
        </h2>
        <ChangePassword />
      </section>

      <section className="t-section">
        <h2 className="t-label" style={{ marginBottom: "var(--t-2)" }}>
          Signed-in devices
        </h2>
        <SignOutEverywhere />
      </section>

      <section className="t-section">
        <h2 className="t-label" style={{ marginBottom: "var(--t-2)" }}>
          Your data
        </h2>
        <ExportData />
      </section>

      <section className="t-section">
        <h2 className="t-label" style={{ marginBottom: "var(--t-2)" }}>
          Delete account
        </h2>
        <DeleteAccount />
      </section>
    </>
  );
}

function ErrorNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="t-notice t-notice--danger" role="alert">
      <span className="t-notice__icon">
        <Icon name="alert" size={18} />
      </span>
      <div className="t-notice__body">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------- change password */

function ChangePassword() {
  const [state, action, pending] = useActionState(changePasswordAction, {});

  return (
    <div className="t-card" style={{ padding: "var(--t-4)" }}>
      <form action={action} className="t-stack-3">
        {state.error && <ErrorNotice>{state.error}</ErrorNotice>}
        {state.ok && (
          <p className="t-small" role="status" style={{ color: "var(--t-accent)" }}>
            Password changed. Any other device signed in to this account has
            been signed out.
          </p>
        )}

        <div className="t-authfield">
          <span className="t-label">Current password</span>
          <label className="t-field">
            <Icon name="lock" size={18} />
            <input
              className="t-field__input"
              type="password"
              name="current"
              autoComplete="current-password"
              placeholder="Your current password"
              required
            />
          </label>
        </div>

        <div className="t-authfield">
          <span className="t-label">New password</span>
          <label className="t-field">
            <Icon name="lock" size={18} />
            <input
              className="t-field__input"
              type="password"
              name="next"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </label>
        </div>

        <button
          type="submit"
          className="t-btn t-btn--secondary t-btn--sm t-btn--block"
          disabled={pending}
        >
          {pending ? (
            <>
              <Spinner size={16} tone="current" label="Changing password" />
              Changing…
            </>
          ) : (
            "Change password"
          )}
        </button>
      </form>
    </div>
  );
}

/* -------------------------------------------------- sign out everywhere */

function SignOutEverywhere() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOutAll() {
    setBusy(true);
    setError(null);
    // On success this redirects, so nothing after it runs.
    const result = await signOutEverywhereAction();
    setBusy(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="t-card" style={{ padding: "var(--t-4)" }}>
      <p className="t-small t-muted" style={{ marginBottom: "var(--t-3)" }}>
        Sign out of Tembera on every device, including this one. Use this if you
        have lost a phone or used a shared computer. You will need to sign in
        again.
      </p>

      {error && (
        <div style={{ marginBottom: "var(--t-3)" }}>
          <ErrorNotice>{error}</ErrorNotice>
        </div>
      )}

      <button
        type="button"
        className="t-btn t-btn--secondary t-btn--sm t-btn--block"
        onClick={signOutAll}
        disabled={busy}
      >
        {busy ? (
          <>
            <Spinner size={16} tone="current" label="Signing out" />
            Signing out…
          </>
        ) : (
          <>
            <Icon name="lock" size={16} />
            Sign out on all devices
          </>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------ export */

function ExportData() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    const result = await exportMyDataAction();
    setBusy(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    // Built in the browser: the data is already here, and this avoids writing a
    // copy of someone's personal data to a file on the server.
    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tembera-my-data-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="t-card" style={{ padding: "var(--t-4)" }}>
      <p className="t-small t-muted" style={{ marginBottom: "var(--t-3)" }}>
        Download everything Tembera holds about you — your account details,
        saved places, visit history, reviews and bookings — as a file you can
        keep or take elsewhere.
      </p>

      {error && (
        <div style={{ marginBottom: "var(--t-3)" }}>
          <ErrorNotice>{error}</ErrorNotice>
        </div>
      )}

      <button
        type="button"
        className="t-btn t-btn--secondary t-btn--sm t-btn--block"
        onClick={download}
        disabled={busy}
      >
        {busy ? (
          <>
            <Spinner size={16} tone="current" label="Preparing your data" />
            Preparing…
          </>
        ) : (
          <>
            <Icon name="external" size={16} />
            Download my data
          </>
        )}
      </button>

      <p className="t-small t-muted" style={{ marginTop: "var(--t-3)" }}>
        See the <Link href="/privacy">privacy policy</Link> for what we store and
        why.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ delete */

function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(deleteMyAccountAction, {});

  if (!confirming) {
    return (
      <div className="t-card" style={{ padding: "var(--t-4)" }}>
        <p className="t-small t-muted" style={{ marginBottom: "var(--t-3)" }}>
          Permanently erase your account, saved places, visit history and
          reviews. Past bookings are kept as business records but are no longer
          linked to you. This cannot be undone.
        </p>
        <button
          type="button"
          className="t-btn t-btn--ghost t-btn--sm t-btn--block"
          onClick={() => setConfirming(true)}
          style={{ color: "var(--t-danger)" }}
        >
          Delete my account
        </button>
      </div>
    );
  }

  return (
    <div
      className="t-card"
      style={{ padding: "var(--t-4)", borderColor: "var(--t-danger)" }}
    >
      <form action={action} className="t-stack-3">
        <p className="t-small" style={{ fontWeight: 600 }}>
          This permanently deletes your account. There is no way to get it back.
        </p>

        {state.error && <ErrorNotice>{state.error}</ErrorNotice>}

        <div className="t-authfield">
          <span className="t-label">Your password</span>
          <label className="t-field">
            <Icon name="lock" size={18} />
            <input
              className="t-field__input"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Confirm with your password"
              required
            />
          </label>
        </div>

        <div className="t-authfield">
          <span className="t-label">Type DELETE to confirm</span>
          <label className="t-field">
            <Icon name="alert" size={18} />
            <input
              className="t-field__input"
              type="text"
              name="confirm"
              autoComplete="off"
              placeholder="DELETE"
              required
            />
          </label>
        </div>

        <button
          type="submit"
          className="t-btn t-btn--sm t-btn--block"
          disabled={pending}
          style={{ background: "var(--t-danger)", color: "#fff" }}
        >
          {pending ? (
            <>
              <Spinner size={16} tone="current" label="Deleting account" />
              Deleting…
            </>
          ) : (
            "Delete my account permanently"
          )}
        </button>
        <button
          type="button"
          className="t-btn t-btn--secondary t-btn--sm t-btn--block"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import Icon from "@/components/Icon";
import { useAccount } from "@/lib/client/account";
import { INTERESTS } from "@/lib/profile/interests";
import {
  CURRENCIES,
  LANGUAGES,
  UNITS,
  type Preferences,
} from "@/lib/profile/preferences";
import { updateInterestsAction, updatePreferencesAction } from "@/lib/actions/user";

/**
 * How the app should behave for one reader.
 *
 * Its own screen rather than a block on the overview: nobody comes to a
 * profile to set their distance units, and putting six selects next to
 * somebody's photo is what made the old page read as a settings form with an
 * avatar stuck on top.
 *
 * Saved on submit rather than on every keystroke, so a half-changed set of
 * choices is never written — and the button says which of the three states it
 * is in, because a save that changes nothing visible looks like a failure.
 */
export default function PreferencesScreen({
  initial,
  initialInterests,
}: {
  initial: Preferences;
  initialInterests: string[];
}) {
  const { authed } = useAccount();
  const [prefs, setPrefs] = useState<Preferences>(initial);
  const [interests, setInterests] = useState<string[]>(initialInterests);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function toggleInterest(id: string) {
    setInterests((list) => (list.includes(id) ? list.filter((i) => i !== id) : [...list, id]));
    setSaved(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!authed) {
      setError("Sign in to save preferences to your account.");
      return;
    }
    setSaving(true);
    setError(null);
    const [a, b] = await Promise.all([
      updatePreferencesAction(prefs),
      updateInterestsAction(interests),
    ]);
    setSaving(false);
    const failed = [a, b].find((r) => "error" in r);
    if (failed && "error" in failed) {
      setError(failed.error);
      return;
    }
    setSaved(true);
  }

  return (
    <>
      <PageHeader title="Preferences" fallbackHref="/profile" />

      <main className="t-main">
        <div className="t-page">
          <form onSubmit={submit} className="t-prof__editwrap">
            {!authed && (
              <p className="t-notice" style={{ marginBottom: "var(--t-5)" }}>
                <span className="t-notice__icon">
                  <Icon name="info" size={16} />
                </span>
                <span className="t-notice__body">
                  You are browsing as a guest. <Link href="/login">Sign in</Link> to keep
                  these across devices.
                </span>
              </p>
            )}

            <section className="t-prof__section">
              <h2 className="t-prof__h2">Language & region</h2>
              <div className="t-formgrid">
                <Row label="Language" htmlFor="pf-lang">
                  <select
                    id="pf-lang"
                    className="t-input"
                    value={prefs.language}
                    onChange={(e) => set("language", e.target.value as Preferences["language"])}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                        {l.note ? ` — ${l.note}` : ""}
                      </option>
                    ))}
                  </select>
                </Row>

                <Row label="Currency" htmlFor="pf-cur">
                  <select
                    id="pf-cur"
                    className="t-input"
                    value={prefs.currency}
                    onChange={(e) => set("currency", e.target.value as Preferences["currency"])}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Row>

                <Row label="Distance" htmlFor="pf-units">
                  <select
                    id="pf-units"
                    className="t-input"
                    value={prefs.units}
                    onChange={(e) => set("units", e.target.value as Preferences["units"])}
                  >
                    {UNITS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </Row>
              </div>
            </section>

            <section className="t-prof__section">
              <h2 className="t-prof__h2">Travel interests</h2>
              <p className="t-small t-muted" style={{ marginBottom: "var(--t-3)" }}>
                We will use these to suggest places worth your time.
              </p>
              <div className="t-pills">
                {INTERESTS.map((interest) => {
                  const on = interests.includes(interest.id);
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      className={`t-pill${on ? " t-pill--on" : ""}`}
                      aria-pressed={on}
                      onClick={() => toggleInterest(interest.id)}
                    >
                      <Icon name={interest.icon} size={15} />
                      {interest.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="t-prof__section">
              <h2 className="t-prof__h2">Email</h2>
              <ul className="t-switches">
                <Switch
                  label="Replies and decisions"
                  note="A reply to your review, or an answer about a listing you claimed."
                  checked={prefs.emailUpdates}
                  onChange={(v) => set("emailUpdates", v)}
                />
                <Switch
                  label="New places near you"
                  note="Occasional. Off unless you ask for it."
                  checked={prefs.emailDigest}
                  onChange={(v) => set("emailDigest", v)}
                />
              </ul>
            </section>

            {error && (
              <div className="t-notice t-notice--danger" role="alert">
                <span className="t-notice__icon">
                  <Icon name="alert" size={16} />
                </span>
                <div className="t-notice__body">{error}</div>
              </div>
            )}

            <div className="t-prof__actions">
              <button type="submit" className="t-btn t-btn--primary" disabled={saving}>
                {saving ? "Saving…" : "Save preferences"}
              </button>
              <Link href="/profile" className="t-btn t-btn--ghost">
                Back to profile
              </Link>
              <span className="t-prof__status" role="status">
                {saved && (
                  <>
                    <Icon name="check" size={15} /> Saved
                  </>
                )}
              </span>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

function Row({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="t-formfield">
      <label htmlFor={htmlFor} className="t-formfield__label">
        {label}
      </label>
      {children}
    </div>
  );
}

/** A labelled boolean. Uses the product's existing switch, not a bare checkbox. */
function Switch({
  label,
  note,
  checked,
  onChange,
}: {
  label: string;
  note: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <li className="t-switchrow">
      <span className="t-switchrow__body">
        <span className="t-switchrow__label">{label}</span>
        <span className="t-switchrow__note">{note}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className="t-toggle"
        onClick={() => onChange(!checked)}
      >
        <span className="t-toggle__knob" />
      </button>
    </li>
  );
}

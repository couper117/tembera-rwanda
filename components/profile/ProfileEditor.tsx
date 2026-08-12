"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/Icon";
import { DEMO_ACCOUNT, initialsOf, useAccount, type AccountEdits } from "@/lib/client/account";
import { DISTRICT_CENTRES } from "@/lib/places/geo";

interface Props {
  onDone: () => void;
}

type Errors = Partial<Record<keyof AccountEdits, string>>;

const MAX_BIO = 240;

/** Only ever a-z, 0-9 and underscores, so the handle can be shown as @name. */
function cleanHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
}

function validate(edits: AccountEdits): Errors {
  const errors: Errors = {};

  if (!edits.name.trim()) errors.name = "Add a name so the profile has something to show.";
  else if (edits.name.trim().length > 50) errors.name = "Keep the name under 50 characters.";

  if (!edits.handle) errors.handle = "Pick a username — letters, numbers and underscores.";

  // Loose on purpose: this is a local demo profile, not a delivery address.
  if (edits.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(edits.email.trim())) {
    errors.email = "That doesn't look like an email address.";
  }

  if (edits.bio.length > MAX_BIO) errors.bio = `Keep the bio under ${MAX_BIO} characters.`;

  return errors;
}

/**
 * Inline profile editing. A form rather than a modal: the profile is short
 * enough that swapping the card in place keeps the whole thing on one screen,
 * and there is nothing behind it worth keeping visible.
 */
export default function ProfileEditor({ onDone }: Props) {
  const { account, update, reset } = useAccount();

  const [draft, setDraft] = useState<AccountEdits>({
    name: account.name,
    handle: account.handle,
    email: account.email,
    bio: account.bio,
    homeCity: account.homeCity,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cities = useMemo(() => {
    const districts = Object.keys(DISTRICT_CENTRES).sort((a, b) => a.localeCompare(b));
    // Kigali isn't a district — it's the three of them — but it's how people
    // answer "where are you based", so it leads the list.
    return ["Kigali", ...districts.filter((name) => name !== "Kigali")];
  }, []);

  function set<K extends keyof AccountEdits>(key: K, value: AccountEdits[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    // Clear the message as soon as the field is touched; re-checked on submit.
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const cleaned: AccountEdits = {
      ...draft,
      name: draft.name.trim(),
      handle: cleanHandle(draft.handle),
      email: draft.email.trim(),
      bio: draft.bio.trim(),
    };

    const found = validate(cleaned);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setSaving(true);
    setFormError(null);
    const { error } = await update(cleaned);
    setSaving(false);
    if (error) {
      setFormError(error);
      return;
    }
    onDone();
  }

  function restoreDemo() {
    reset();
    onDone();
  }

  const bioLeft = MAX_BIO - draft.bio.length;

  return (
    <form className="t-card t-profile" onSubmit={submit} noValidate>
      <div className="t-profile__top">
        <span className="t-avatar" aria-hidden="true">
          {initialsOf(draft.name || DEMO_ACCOUNT.name)}
        </span>
        <div className="t-profile__id">
          <h1 className="t-title">Edit profile</h1>
          <p className="t-small t-muted">Saved on this device only.</p>
        </div>
      </div>

      <div className="t-formgrid">
        <Field label="Name" error={errors.name} htmlFor="pf-name">
          <input
            id="pf-name"
            className="t-field__input"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="name"
            maxLength={60}
          />
        </Field>

        <Field label="Username" error={errors.handle} htmlFor="pf-handle" prefixed>
          <span className="t-field__prefix" aria-hidden="true">
            @
          </span>
          <input
            id="pf-handle"
            className="t-field__input"
            value={draft.handle}
            onChange={(e) => set("handle", cleanHandle(e.target.value))}
            autoComplete="username"
            inputMode="text"
          />
        </Field>

        <Field label="Email" error={errors.email} htmlFor="pf-email" hint="Optional">
          <input
            id="pf-email"
            type="email"
            className="t-field__input"
            value={draft.email}
            onChange={(e) => set("email", e.target.value)}
            autoComplete="email"
          />
        </Field>

        <div className="t-formrow">
          <label className="t-formrow__label" htmlFor="pf-city">
            Home city
          </label>
          <select
            id="pf-city"
            className="t-select"
            value={draft.homeCity}
            onChange={(e) => set("homeCity", e.target.value)}
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="t-formrow t-formrow--wide">
          <label className="t-formrow__label" htmlFor="pf-bio">
            Bio
          </label>
          <div className={`t-field t-field--area${errors.bio ? " t-field--error" : ""}`}>
            <textarea
              id="pf-bio"
              className="t-field__input"
              rows={3}
              value={draft.bio}
              onChange={(e) => set("bio", e.target.value)}
              maxLength={MAX_BIO + 40}
            />
          </div>
          <p className={`t-small ${bioLeft < 0 ? "t-danger" : "t-muted"}`}>
            {errors.bio ?? `${bioLeft} characters left`}
          </p>
        </div>
      </div>

      {formError && (
        <p className="t-small t-danger" role="alert">
          {formError}
        </p>
      )}

      <div className="t-inline t-profile__actions">
        <button type="submit" className="t-btn t-btn--primary t-btn--sm" disabled={saving}>
          <Icon name="check" size={16} />
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button type="button" className="t-btn t-btn--secondary t-btn--sm" onClick={onDone}>
          Cancel
        </button>
        <button
          type="button"
          className="t-btn t-btn--ghost t-btn--sm"
          onClick={restoreDemo}
          style={{ marginLeft: "auto" }}
        >
          Reset to demo
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  htmlFor,
  prefixed,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  htmlFor: string;
  /** Tightens the gap for fields that lead with a character, not an icon. */
  prefixed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="t-formrow">
      <label className="t-formrow__label" htmlFor={htmlFor}>
        {label}
        {hint && <span className="t-muted"> · {hint}</span>}
      </label>
      <div
        className={`t-field${prefixed ? " t-field--prefixed" : ""}${
          error ? " t-field--error" : ""
        }`}
      >
        {children}
      </div>
      {error && (
        <p className="t-small t-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

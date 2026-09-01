"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import Icon from "@/components/Icon";
import AvatarPicker from "@/components/profile/AvatarPicker";
import { useAccount, type AccountEdits } from "@/lib/client/account";
import { DISTRICT_CENTRES } from "@/lib/places/geo";

/**
 * Editing, on its own screen.
 *
 * The old profile put every field on the overview, so the page a person opened
 * to *look at themselves* was a form. Splitting them means the overview can be
 * calm and this can be plain: labelled fields, two columns where the screen
 * allows, one where it does not.
 *
 * The photo sits at the top and saves on its own, because it is the one field
 * with its own flow — cropping, then a round trip — and making somebody press
 * "Save changes" afterwards to commit a photo that has already been stored
 * would be a lie about what happened.
 */

const MAX_BIO = 240;

type Errors = Partial<Record<keyof AccountEdits, string>>;

function cleanHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
}

function validate(edits: AccountEdits): Errors {
  const errors: Errors = {};
  if (!edits.name.trim()) errors.name = "Add a name so the profile has something to show.";
  else if (edits.name.trim().length > 50) errors.name = "Keep the name under 50 characters.";
  if (!edits.handle) errors.handle = "Pick a username — letters, numbers and underscores.";
  if (edits.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(edits.email.trim())) {
    errors.email = "That doesn't look like an email address.";
  }
  if (edits.bio.length > MAX_BIO) errors.bio = `Keep the bio under ${MAX_BIO} characters.`;
  return errors;
}

export default function ProfileEditScreen({ initialImage }: { initialImage: string | null }) {
  const { account, update, ready } = useAccount();

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
  const [saved, setSaved] = useState(false);

  const cities = useMemo(() => {
    const districts = Object.keys(DISTRICT_CENTRES).sort((a, b) => a.localeCompare(b));
    // Kigali is not a district — it is three of them — but it is how people
    // answer "where are you based", so it leads.
    return ["Kigali", ...districts.filter((n) => n !== "Kigali")];
  }, []);

  /** Anything typed and not yet saved, so leaving can warn rather than lose it. */
  const dirty =
    draft.name !== account.name ||
    draft.handle !== account.handle ||
    draft.email !== account.email ||
    draft.bio !== account.bio ||
    draft.homeCity !== account.homeCity;

  function set<K extends keyof AccountEdits>(key: K, value: AccountEdits[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next = { ...draft, handle: cleanHandle(draft.handle), name: draft.name.trim() };
    const found = validate(next);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setFormError(null);
    const result = await update(next);
    setSaving(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }
    setDraft(next);
    setSaved(true);
  }

  return (
    <>
      <PageHeader title="Edit profile" fallbackHref="/profile" />

      <main className="t-main">
        <div className="t-page">
          <div className="t-prof__editwrap">
            <section className="t-prof__section">
              <h2 className="t-prof__h2">Profile photo</h2>
              <p className="t-small t-muted" style={{ marginBottom: "var(--t-4)" }}>
                Square works best. Drag to reposition and use the slider to zoom.
              </p>
              <AvatarPicker initial={initialImage} name={account.name} />
            </section>

            <form onSubmit={submit} className="t-prof__section">
              <h2 className="t-prof__h2">Details</h2>

              {formError && (
                <div className="t-notice t-notice--danger" role="alert">
                  <span className="t-notice__icon">
                    <Icon name="alert" size={16} />
                  </span>
                  <div className="t-notice__body">{formError}</div>
                </div>
              )}

              <div className="t-formgrid">
                <Field label="Name" error={errors.name} htmlFor="p-name">
                  <input
                    id="p-name"
                    className="t-input"
                    value={draft.name}
                    onChange={(e) => set("name", e.target.value)}
                    disabled={!ready}
                    maxLength={50}
                  />
                </Field>

                <Field
                  label="Username"
                  error={errors.handle}
                  htmlFor="p-handle"
                  hint="Letters, numbers and underscores."
                >
                  <span className="t-inputwrap">
                    <span className="t-inputwrap__prefix">@</span>
                    <input
                      id="p-handle"
                      className="t-input t-input--prefixed"
                      value={draft.handle}
                      onChange={(e) => set("handle", e.target.value)}
                      onBlur={() => set("handle", cleanHandle(draft.handle))}
                      disabled={!ready}
                    />
                  </span>
                </Field>

                <Field label="Email" error={errors.email} htmlFor="p-email">
                  <input
                    id="p-email"
                    type="email"
                    className="t-input"
                    value={draft.email}
                    onChange={(e) => set("email", e.target.value)}
                    disabled={!ready}
                  />
                </Field>

                <Field label="Home city" htmlFor="p-city">
                  <select
                    id="p-city"
                    className="t-input"
                    value={draft.homeCity}
                    onChange={(e) => set("homeCity", e.target.value)}
                    disabled={!ready}
                  >
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Bio"
                  error={errors.bio}
                  htmlFor="p-bio"
                  hint={`${draft.bio.length}/${MAX_BIO}`}
                  wide
                >
                  <textarea
                    id="p-bio"
                    className="t-input t-textarea"
                    rows={3}
                    value={draft.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    disabled={!ready}
                    maxLength={MAX_BIO + 40}
                  />
                </Field>
              </div>

              <div className="t-prof__actions">
                <button type="submit" className="t-btn t-btn--primary" disabled={saving || !dirty}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <Link href="/profile" className="t-btn t-btn--ghost">
                  {dirty ? "Discard" : "Back to profile"}
                </Link>

                {/* One line, three states. A save that changes nothing on
                    screen is indistinguishable from one that failed. */}
                <span className="t-prof__status" role="status">
                  {saved && !dirty && (
                    <>
                      <Icon name="check" size={15} /> Saved
                    </>
                  )}
                  {dirty && !saving && "Unsaved changes"}
                </span>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  wide,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  /** Spans both columns — a bio in a half-width box is a bad place to write. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`t-formfield${wide ? " t-formfield--wide" : ""}`}>
      <label htmlFor={htmlFor} className="t-formfield__label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="t-formfield__error">{error}</p>
      ) : hint ? (
        <p className="t-formfield__hint">{hint}</p>
      ) : null}
    </div>
  );
}

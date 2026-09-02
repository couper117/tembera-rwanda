/**
 * How the app should behave for one reader.
 *
 * Stored as JSON on the user rather than as columns: the list will grow, none
 * of it is ever queried, and each new switch would otherwise be a migration.
 * Everything is optional and everything has a default, so a row written by an
 * older version of this file still reads cleanly.
 */

export type Language = "en" | "rw" | "fr";
export type Currency = "RWF" | "USD" | "EUR";
export type Units = "km" | "mi";

export interface Preferences {
  language: Language;
  currency: Currency;
  units: Units;
  /** Email about a reply to a review, a claim decision, that sort of thing. */
  emailUpdates: boolean;
  /** Occasional "new places near you" mail. Off unless asked for. */
  emailDigest: boolean;
}

/**
 * English and francs, because that is what the catalogue is written in today.
 * Kinyarwanda and French are listed as choices and reserved in the schema —
 * the i18n columns exist — so the preference is honest about being a
 * preference rather than pretending the translation is already there.
 *
 * Marketing mail defaults to OFF. A default that opts somebody in is a
 * decision made on their behalf that they did not ask for.
 */
export const DEFAULT_PREFERENCES: Preferences = {
  language: "en",
  currency: "RWF",
  units: "km",
  emailUpdates: true,
  emailDigest: false,
};

export const LANGUAGES: { id: Language; label: string; note?: string }[] = [
  { id: "en", label: "English" },
  { id: "rw", label: "Kinyarwanda", note: "Coming soon" },
  { id: "fr", label: "Français", note: "Coming soon" },
];

export const CURRENCIES: { id: Currency; label: string }[] = [
  { id: "RWF", label: "Rwandan franc (RWF)" },
  { id: "USD", label: "US dollar (USD)" },
  { id: "EUR", label: "Euro (EUR)" },
];

export const UNITS: { id: Units; label: string }[] = [
  { id: "km", label: "Kilometres" },
  { id: "mi", label: "Miles" },
];

/** Read whatever is in the column back into a Preferences, defaulting field by
 *  field so an older or partial row is never a render error. */
export function parsePreferences(raw: unknown): Preferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_PREFERENCES;
  const v = raw as Record<string, unknown>;
  const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T): T =>
    typeof v[key] === "string" && (allowed as readonly string[]).includes(v[key] as string)
      ? (v[key] as T)
      : fallback;

  return {
    language: pick("language", ["en", "rw", "fr"] as const, DEFAULT_PREFERENCES.language),
    currency: pick("currency", ["RWF", "USD", "EUR"] as const, DEFAULT_PREFERENCES.currency),
    units: pick("units", ["km", "mi"] as const, DEFAULT_PREFERENCES.units),
    emailUpdates:
      typeof v.emailUpdates === "boolean" ? v.emailUpdates : DEFAULT_PREFERENCES.emailUpdates,
    emailDigest:
      typeof v.emailDigest === "boolean" ? v.emailDigest : DEFAULT_PREFERENCES.emailDigest,
  };
}

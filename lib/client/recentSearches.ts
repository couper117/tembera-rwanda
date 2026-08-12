"use client";

// Recent searches, kept on the device. Read lazily so the search screen can
// render its suggestions immediately and fill this in on mount.

const KEY = "tembera.recent";
const MAX = 6;

export function readRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string").slice(0, MAX)
      : [];
  } catch {
    return [];
  }
}

/** Adds a query to the front, de-duplicated case-insensitively. */
export function pushRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return readRecentSearches();

  const existing = readRecentSearches().filter(
    (q) => q.toLowerCase() !== trimmed.toLowerCase(),
  );
  const next = [trimmed, ...existing].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Non-fatal.
  }
  return next;
}

export function clearRecentSearches(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Non-fatal.
  }
}

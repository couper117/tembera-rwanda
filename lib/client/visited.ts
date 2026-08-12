"use client";

// Places you've opened, kept on the device.
//
// Recorded from real behaviour rather than seeded, so the count on the profile
// means something: it is the number of distinct places whose page you've
// actually opened. A repeat visit moves the place to the front instead of
// counting twice.

const KEY = "tembera.visited";
const MAX = 60;

export interface Visit {
  id: string;
  /** Epoch ms of the most recent visit. */
  at: number;
}

export function readVisited(): Visit[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (v): v is Visit =>
          !!v && typeof v.id === "string" && typeof v.at === "number" && Number.isFinite(v.at),
      )
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function pushVisit(id: string): Visit[] {
  if (!id) return readVisited();
  const next = [{ id, at: Date.now() }, ...readVisited().filter((v) => v.id !== id)].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Non-fatal: the visit just isn't remembered.
  }
  return next;
}

export function clearVisited(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Non-fatal.
  }
}

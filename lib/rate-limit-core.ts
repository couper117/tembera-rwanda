// Fixed-window rate limiting, with no dependency on the request or the Next
// runtime — the same "pure logic takes its data as arguments" split the places
// engine uses, and for the same reason: this is the part worth testing.
//
// This is deliberately not Redis. A single Next.js instance is what Tembera
// runs on today, and an in-process counter costs nothing and needs no
// infrastructure. The trade-off is real and worth stating: counters reset on
// deploy, and each instance counts separately, so behind more than one server
// the effective limit is (limit × instances). If Tembera ever scales out, move
// `hits` into Redis and keep this interface unchanged.

interface Window {
  count: number;
  resetAt: number;
}

const hits = new Map<string, Window>();

// Windows are only dropped when their key is next touched, so a flood of
// one-off keys would otherwise grow the map forever. Sweep periodically.
const SWEEP_EVERY_MS = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweep(now: number): void {
  if (now - lastSweep < SWEEP_EVERY_MS) return;
  lastSweep = now;
  for (const [key, window] of hits) {
    if (window.resetAt <= now) hits.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the caller may try again. Only meaningful when `ok` is false. */
  retryAfter: number;
}

/**
 * Count one attempt against `key`. Returns `ok: false` once `limit` attempts
 * have been made inside `windowMs`.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const window = hits.get(key);
  if (!window || window.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  window.count += 1;
  if (window.count > limit) {
    // Note the window's end is NOT extended here. Extending it on every attempt
    // would let a determined caller hold themselves blocked forever, and — worse
    // — resetting it would let them clear the limit just by trying again.
    return { ok: false, retryAfter: Math.max(1, Math.ceil((window.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

/** Forget a key — called after a successful login so one bad guess doesn't linger. */
export function clearRateLimit(key: string): void {
  hits.delete(key);
}

/** "3 minutes" / "45 seconds" — for user-facing messages. */
export function formatRetryAfter(seconds: number): string {
  if (seconds >= 60) {
    const mins = Math.ceil(seconds / 60);
    return `${mins} minute${mins === 1 ? "" : "s"}`;
  }
  return `${seconds} second${seconds === 1 ? "" : "s"}`;
}

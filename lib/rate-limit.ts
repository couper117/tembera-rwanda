import "server-only";
import { headers } from "next/headers";

// The server-side face of the limiter. The counting itself lives in
// rate-limit-core.ts so it can be unit-tested without the Next runtime; this
// file adds the one piece that genuinely needs a request.

export {
  rateLimit,
  clearRateLimit,
  formatRetryAfter,
  type RateLimitResult,
} from "./rate-limit-core";

/**
 * Best-effort client address, for keying the limiter.
 *
 * `x-forwarded-for` is client-supplied and trivially spoofed, so this is a
 * speed bump against naive scripted guessing, not an identity. The per-account
 * limit is the one that actually protects a specific user's password.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip")?.trim() || "unknown";
}

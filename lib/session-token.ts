import crypto from "crypto";

// The session cookie's format and cryptography, with no dependency on the
// request, the database or the Next runtime — so the security-critical part
// can be unit tested. lib/auth.ts wraps this with cookies and Prisma.
//
// Payload format: `${userId}:${tokenVersion}:${issuedAt}`, signed as
// `${payload}.${hmac}`. `tokenVersion` is what makes a stateless cookie
// revocable — see the note on User.tokenVersion in schema.prisma.

export interface SessionPayload {
  userId: number;
  tokenVersion: number;
  issuedAt: number;
}

export function signToken(payload: string, secret: string): string {
  const mac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${mac}`;
}

/** The payload if the signature is ours, otherwise null. */
export function verifyToken(
  signed: string | undefined,
  secret: string,
): string | null {
  if (!signed) return null;

  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;

  const payload = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  // Length must be compared first: timingSafeEqual throws on a mismatch.
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return payload;
}

export function encodeSession(
  userId: number,
  tokenVersion: number,
  issuedAt: number = Date.now(),
): string {
  return `${userId}:${tokenVersion}:${issuedAt}`;
}

/**
 * Parse a verified payload and apply expiry.
 *
 * Expiry is enforced here rather than left to the cookie's `maxAge`, because a
 * stolen cookie is replayed by a client that has no reason to honour maxAge.
 * Returns null for anything malformed, including the two-part payloads issued
 * before `tokenVersion` existed.
 */
export function decodeSession(
  payload: string,
  maxAgeMs: number,
  now: number = Date.now(),
): SessionPayload | null {
  const parts = payload.split(":");
  if (parts.length !== 3) return null;

  const userId = Number(parts[0]);
  const tokenVersion = Number(parts[1]);
  const issuedAt = Number(parts[2]);

  if (!Number.isInteger(userId) || userId <= 0) return null;
  if (!Number.isInteger(tokenVersion) || tokenVersion < 0) return null;
  if (!Number.isFinite(issuedAt)) return null;

  // A cookie stamped in the future is either a clock problem or a forgery
  // attempt at extending its own life. Neither is a session.
  if (issuedAt > now) return null;
  if (now - issuedAt > maxAgeMs) return null;

  return { userId, tokenVersion, issuedAt };
}

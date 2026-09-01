/**
 * Checkout session lifetime.
 *
 * Pure and free of `server-only`, so the rules below can be unit-tested. They
 * are the difference between a payer reaching a working checkout and reaching
 * "This payment link has expired. Please contact the merchant", which reads as
 * a broken integration rather than as a link that timed out.
 */

/** Measured against the live API: `expires_at` is 30 minutes after creation. */
export const SESSION_LIFETIME_MS = 30 * 60 * 1000;

/**
 * Treat a session as spent this long before it actually dies.
 *
 * A session with forty seconds left is expired for anybody who has to read a
 * page and reach for their phone, and handing them one is the same dead end as
 * handing them an expired one.
 */
export const SESSION_MARGIN_MS = 3 * 60 * 1000;

export function sessionUsable(
  expiresAt: Date | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() - now > SESSION_MARGIN_MS;
}

/**
 * A gateway-facing id for a retry of an existing sign-up.
 *
 * `tx_ref` must be globally unique — reusing one is refused with a 409 — but
 * our own reference has to stay stable, because that is what ties a payment
 * back to the sign-up. So a retry gets a suffix rather than a new identity,
 * which also keeps it legible to whoever is reading a statement.
 */
export function retryTxRef(reference: string, at: number = Date.now()): string {
  return `${reference}-R${at.toString(36).toUpperCase().slice(-4)}`;
}

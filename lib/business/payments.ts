import { randomBytes } from "node:crypto";

/**
 * Taking money for a paid plan.
 *
 * There is no payment provider wired up, and pretending otherwise would be the
 * worst outcome — a fake "Pay now" button that grants a paid account is exactly
 * the hole this module exists to close. So this is the honest version of the
 * flow, and it is a real one: the payer sends mobile money to a published
 * number quoting a reference, and a member of staff matches that reference
 * against the statement and confirms it.
 *
 * That is how a great many Rwandan businesses already pay each other, it needs
 * no merchant account to start, and it puts a human between "somebody typed
 * their name into a form" and "somebody has a verified account".
 *
 * **The seam.** When MTN MoMo Collections, Airtel Money or a gateway
 * (Flutterwave, Paystack) is available, it slots in here:
 *   - `paymentInstructions()` is replaced by a redirect to the provider,
 *   - the provider's webhook calls the same `confirmPayment` path the admin
 *     screen calls today,
 *   - `reference` becomes the provider's transaction id.
 * Nothing outside this file and the confirm action needs to change, because
 * nothing outside them knows how money arrives.
 */

/** Where the money goes. Configured, not hardcoded: this is a real number. */
export interface PayTo {
  /** The MoMo number or merchant code, as it should be dialled. */
  number: string;
  /** The name that will appear on the payer's confirmation, so they can check. */
  name: string;
}

export function payTo(): PayTo | null {
  const number = process.env.TEMBERA_MOMO_NUMBER?.trim();
  const name = process.env.TEMBERA_MOMO_NAME?.trim();
  // Both or neither. Half a set of payment details is worse than none: it
  // reads as configured while sending money somewhere nobody can confirm.
  if (!number || !name) return null;
  return { number, name };
}

/**
 * The code a payer quotes and an admin matches.
 *
 * Deliberately short, upper-case and free of the characters people confuse
 * when reading them off a screen into a phone keypad: no O/0, no I/1, no S/5.
 * It is typed by hand under mild pressure, so every character it does not have
 * is a reconciliation problem it does not cause.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRTUVWXYZ2346789";

export function newReference(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return `TB-${out.slice(0, 4)}-${out.slice(4, 8)}`;
}

/** How long a reference is worth chasing before it is swept up. */
export const REFERENCE_VALID_DAYS = 14;

export function referenceExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + REFERENCE_VALID_DAYS * 24 * 60 * 60 * 1000);
}

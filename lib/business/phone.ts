/**
 * Rwandan mobile numbers, in the one form the payment gateway accepts.
 *
 * Pure and free of `server-only` on purpose: it is the kind of fiddly string
 * handling that is worth unit tests, and a module the test runner cannot
 * import is a module nobody tests.
 *
 * The gateway rejects the international form the sign-up form asks people for
 * ("+250 788 123 456") with a 422, and wants the local ten-digit one
 * ("0788123456"). Confirmed against the live test API, not read off the docs.
 */

/**
 * "+250 788 123 456", "250788123456", "788123456" → "0788123456".
 *
 * Returns null rather than a guess when the input is not a Rwandan mobile
 * number, so the caller fails loudly instead of opening a checkout nobody can
 * pay. Rwandan mobiles are nine digits beginning 7, after the leading zero.
 */
export function toLocalPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local = digits.startsWith("250")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  if (!/^7\d{8}$/.test(local)) return null;
  return `0${local}`;
}

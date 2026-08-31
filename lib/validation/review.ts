import { z } from "zod";

/**
 * Shared rules for posting a review.
 *
 * The review form and `submitReviewAction` both validate against these, so a
 * review can never be stored without text no matter which one is bypassed.
 * They live here rather than beside the action because `lib/actions/user.ts`
 * is a `"use server"` module — it may only export async functions, so a client
 * component cannot import a schema from it.
 */

/** A review has to actually say something; this rejects "ok" / "." filler. */
export const REVIEW_BODY_MIN = 10;
export const REVIEW_BODY_MAX = 1000;

const RATING_REQUIRED = "Pick a rating first.";
const BODY_REQUIRED = "Write a few words about this place.";
const BODY_TOO_SHORT = `Tell us a little more — at least ${REVIEW_BODY_MIN} characters.`;
const BODY_TOO_LONG = `Keep your review under ${REVIEW_BODY_MAX} characters.`;

/**
 * The single source of truth for review text. Returns the message to show the
 * user, or null when the body is acceptable. Whitespace never counts as input.
 */
export function reviewBodyError(body: string): string | null {
  const trimmed = body.trim();
  if (trimmed === "") return BODY_REQUIRED;
  if (trimmed.length < REVIEW_BODY_MIN) return BODY_TOO_SHORT;
  if (trimmed.length > REVIEW_BODY_MAX) return BODY_TOO_LONG;
  return null;
}

/** Same contract as `reviewBodyError`, for the star picker. */
export function reviewRatingError(rating: number): string | null {
  const ok = Number.isInteger(rating) && rating >= 1 && rating <= 5;
  return ok ? null : RATING_REQUIRED;
}

/** Server-side gate. Body arrives trimmed, so nothing is stored padded. */
export const reviewSchema = z.object({
  placeId: z.string().min(1, "Unknown place."),
  rating: z.coerce
    .number({ invalid_type_error: RATING_REQUIRED })
    .int(RATING_REQUIRED)
    .min(1, RATING_REQUIRED)
    .max(5, RATING_REQUIRED),
  body: z
    .string({ required_error: BODY_REQUIRED, invalid_type_error: BODY_REQUIRED })
    .transform((v) => v.trim())
    .superRefine((value, ctx) => {
      const message = reviewBodyError(value);
      if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }),
});

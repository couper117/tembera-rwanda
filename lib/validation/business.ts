import { z } from "zod";
import { placeSchema } from "./admin";

/**
 * What a BUSINESS may change on a listing it owns.
 *
 * A whitelist, not a blacklist: the schema simply has no keys for the fields a
 * business must not touch, so a forged form field has nowhere to land. Picking
 * from the admin schema keeps the rules — the URL check, the Rwanda bounding
 * box, the loose phone pattern — identical on both sides rather than drifting.
 *
 * Deliberately absent, and why:
 *
 *   name, categoryId, subcategory, city  — change what the listing IS and
 *     where it files. Those go through a submission an admin reviews.
 *   rating      — it is the average of visitors' reviews, not a self-assessment.
 *   sensitive   — a place of remembrance is not a marketing decision.
 *   status      — publishing is the catalogue's call, not the subject's.
 *   featured    — editorial promotion. Obviously not.
 *   businessId  — a business could otherwise hand itself somebody else's listing.
 */
export const businessPlaceSchema = placeSchema.pick({
  description: true,
  hours: true,
  hoursJson: true,
  phone: true,
  website: true,
  image: true,
  images: true,
  highlights: true,
  priceFrom: true,
  area: true,
  mapLink: true,
  lat: true,
  lng: true,
  coordsPrecision: true,
  keywords: true,
  subtype: true,
});

export type BusinessPlaceInput = z.infer<typeof businessPlaceSchema>;

/** A listing a business is proposing that does not exist yet. */
export const businessNewPlaceSchema = businessPlaceSchema.extend({
  name: z.string().trim().min(1, "The listing needs a name."),
  categoryId: z.string().trim().min(1, "Choose a category."),
  subcategory: z.string().trim().min(1, "Choose a subcategory."),
  city: z.string().trim().min(1, "Choose a district."),
});

export const businessSignupSchema = z.object({
  businessName: z.string().trim().min(2, "What is the business called?").max(120),
  contactName: z.string().trim().min(2, "Who should we contact?").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9][0-9\s().-]{6,24}$/, "That does not look like a phone number."),
  city: z.string().trim().min(1, "Which district is it in?"),
  password: z.string().min(8, "Password must be at least 8 characters."),
  plan: z.enum(["free", "checked", "top"]).default("free"),
});

export const businessProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9][0-9\s().-]{6,24}$/, "That does not look like a phone number."),
  city: z.string().trim().min(1),
  tin: z
    .string()
    .trim()
    .regex(/^[0-9]{9}$/, "A TIN is nine digits.")
    .or(z.literal(""))
    .default(""),
});

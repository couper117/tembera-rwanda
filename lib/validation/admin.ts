import { z } from "zod";

/**
 * Zod schemas + helpers for the admin dashboard forms.
 *
 * FormData values arrive as strings. These helpers normalise the common cases
 * the brief calls for: empty string → null for optional/number fields, and
 * comma-separated strings → trimmed String[] with empties dropped.
 */

/** Trim, then treat "" as absent. */
const emptyToUndefined = (v: unknown): unknown =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

/** Parse an optional number field: "" → null, otherwise a finite number. */
const optionalNumber = z.preprocess((v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : NaN;
  }
  return v;
}, z.number().nullable());

/** Parse an optional integer field: "" → null. */
const optionalInt = z.preprocess((v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : NaN;
  }
  return v;
}, z.number().int().nullable());

/** Parse a required integer with a default. */
const intWithDefault = (def: number) =>
  z.preprocess((v) => {
    if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
      return def;
    }
    if (typeof v === "string") {
      const n = Number(v.trim());
      return Number.isFinite(n) ? n : NaN;
    }
    return v;
  }, z.number().int());

/** Comma-separated string → trimmed, de-empty String[]. */
const commaList = z.preprocess((v) => {
  if (Array.isArray(v)) return v;
  if (typeof v !== "string") return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}, z.array(z.string()));

/** Optional trimmed string → null when blank. */
const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).optional().nullable().transform((v) => v ?? null),
);

/* ------------------------------------------------------------------ auth */

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

/* ------------------------------------------------------- field validators */

/**
 * An optional URL. Accepts a bare domain and adds https://, because an editor
 * pasting "visitrwanda.com" is doing the reasonable thing and being told it is
 * invalid teaches them to distrust the form.
 */
const optionalUrl = z.preprocess(
  (v) => {
    if (typeof v !== "string") return v;
    const t = v.trim();
    if (t === "") return undefined;
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  },
  z
    .string()
    .url("Enter a valid web address.")
    .optional()
    .nullable()
    .transform((v) => v ?? null),
);

/**
 * A phone number, kept deliberately loose.
 *
 * Rwandan numbers are written every which way — +250 788 123 456,
 * 0788123456, (0788) 123-456. Rejecting a real business over punctuation is a
 * worse failure than storing an untidy string, so this only asserts that the
 * value looks like a phone number at all.
 */
const optionalPhone = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .regex(/^[+0-9][0-9\s().-]{6,24}$/, "That does not look like a phone number.")
    .optional()
    .nullable()
    .transform((v) => v ?? null),
);

/**
 * Rwanda's bounding box, with a little slack at the edges.
 *
 * A coordinate outside it is almost always a transposed pair or a stray minus
 * sign — the two mistakes that put a Kigali restaurant in the Indian Ocean.
 * Caught here rather than discovered on the map by a visitor.
 */
const RWANDA_BOUNDS = { minLat: -2.95, maxLat: -0.95, minLng: 28.8, maxLng: 31.0 };

const latitude = optionalNumber.refine(
  (v) => v === null || (v >= RWANDA_BOUNDS.minLat && v <= RWANDA_BOUNDS.maxLat),
  `Latitude should be between ${RWANDA_BOUNDS.minLat} and ${RWANDA_BOUNDS.maxLat} for a place in Rwanda.`,
);

const longitude = optionalNumber.refine(
  (v) => v === null || (v >= RWANDA_BOUNDS.minLng && v <= RWANDA_BOUNDS.maxLng),
  `Longitude should be between ${RWANDA_BOUNDS.minLng} and ${RWANDA_BOUNDS.maxLng} for a place in Rwanda.`,
);

/* ----------------------------------------------------------------- place */

export const coordsPrecisionSchema = z.enum(["exact", "district", "unknown"]);

export const placeStatusSchema = z.enum(["draft", "published", "archived"]);

export const placeSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  categoryId: z.string().trim().min(1, "Category is required."),
  subcategory: z.string().trim().min(1, "Subcategory is required."),
  subtype: optionalString,
  city: z.string().trim().min(1, "City is required."),
  area: optionalString,
  lat: latitude,
  lng: longitude,
  coordsPrecision: coordsPrecisionSchema.default("unknown"),
  rating: optionalNumber.refine(
    (v) => v === null || (v >= 0 && v <= 5),
    "Rating must be between 0 and 5.",
  ),
  image: optionalUrl,
  images: commaList,
  description: optionalString,
  hours: optionalString,
  phone: optionalPhone,
  mapLink: optionalUrl,
  website: optionalUrl,
  highlights: commaList,
  priceFrom: optionalInt.refine(
    (v) => v === null || v >= 0,
    "Price cannot be negative.",
  ),
  keywords: commaList,
  sensitive: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  status: placeStatusSchema.default("published"),
});

export type PlaceInput = z.infer<typeof placeSchema>;

/* -------------------------------------------------------------- category */

export const categorySchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "Id is required.")
    .regex(/^[a-z0-9-]+$/, "Id must be lowercase letters, numbers and dashes."),
  label: z.string().trim().min(1, "Label is required."),
  title: z.string().trim().min(1, "Title is required."),
  icon: z.string().trim().min(1, "Icon is required."),
  primary: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  sensitive: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  sortOrder: intWithDefault(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const subcategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  categoryId: z.string().trim().min(1),
  sortOrder: intWithDefault(0),
});

/* ------------------------------------------------------------------ city */

export const citySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  group: optionalString,
  province: optionalString,
  lat: latitude,
  lng: longitude,
  image: optionalUrl,
  sortOrder: intWithDefault(0),
});

export type CityInput = z.infer<typeof citySchema>;

/* --------------------------------------------------------------- helpers */

/** kebab-case a name for slug building. */
export function kebab(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .replace(/-{2,}/g, "-");
}

/** Flatten a ZodError into a single friendly message. */
export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Invalid input.";
}

/**
 * A ZodError as { field: message }, so a form can show each problem next to
 * the input that caused it.
 *
 * firstError() reports one issue at a time, which turns a form with three
 * mistakes into three round trips — the user fixes one, resubmits, and is told
 * about the next. Showing them together is the difference between a form that
 * helps and a form that plays twenty questions.
 */
export type FieldErrors = Record<string, string>;

export function fieldErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    // First message per field wins; later ones are usually consequences.
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

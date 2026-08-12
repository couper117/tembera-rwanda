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

/* ----------------------------------------------------------------- place */

export const coordsPrecisionSchema = z.enum(["exact", "district", "unknown"]);

export const placeSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  categoryId: z.string().trim().min(1, "Category is required."),
  subcategory: z.string().trim().min(1, "Subcategory is required."),
  subtype: optionalString,
  city: z.string().trim().min(1, "City is required."),
  area: optionalString,
  lat: optionalNumber,
  lng: optionalNumber,
  coordsPrecision: coordsPrecisionSchema.default("unknown"),
  rating: optionalNumber,
  image: optionalString,
  description: optionalString,
  hours: optionalString,
  phone: optionalString,
  mapLink: optionalString,
  highlights: commaList,
  priceFrom: optionalInt,
  keywords: commaList,
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
  lat: optionalNumber,
  lng: optionalNumber,
  image: optionalString,
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

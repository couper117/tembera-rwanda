"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireStaff } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { PLACES_TAG } from "@/lib/data/places";
import {
  fieldErrors,
  firstError,
  kebab,
  placeSchema,
  type FieldErrors,
} from "@/lib/validation/admin";

export interface PlaceFormState {
  /** A banner message. */
  error?: string;
  /** Per-field messages, keyed by input name, shown beside each input. */
  fields?: FieldErrors;
}

/**
 * Build a unique, URL-safe id from categoryId + name.
 *
 * This is the runtime twin of assignIds() in lib/places/catalog.ts, which
 * generated the ids for the 495 seeded places. Keeping the same shape means a
 * place added through the dashboard is indistinguishable from a seeded one —
 * and the -2/-3 suffix keeps two restaurants of the same name apart.
 */
async function uniquePlaceId(categoryId: string, name: string): Promise<string> {
  const base = kebab(`${categoryId}-${name}`) || "place";
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const existing = await prisma.place.findUnique({
      where: { id: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
}

function parse(formData: FormData) {
  return placeSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    subcategory: formData.get("subcategory"),
    subtype: formData.get("subtype"),
    city: formData.get("city"),
    area: formData.get("area"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    coordsPrecision: formData.get("coordsPrecision"),
    rating: formData.get("rating"),
    image: formData.get("image"),
    images: formData.get("images"),
    description: formData.get("description"),
    hours: formData.get("hours"),
    phone: formData.get("phone"),
    mapLink: formData.get("mapLink"),
    website: formData.get("website"),
    highlights: formData.get("highlights"),
    priceFrom: formData.get("priceFrom"),
    keywords: formData.get("keywords"),
    sensitive: formData.get("sensitive"),
    status: formData.get("status") ?? undefined,
  });
}

function invalid(error: Parameters<typeof fieldErrors>[0]): PlaceFormState {
  return { error: firstError(error), fields: fieldErrors(error) };
}

/**
 * A subcategory must belong to the category it is filed under, otherwise the
 * public category page filters it into a group nobody browses. The form uses a
 * datalist, which suggests but does not constrain.
 */
async function checkCategory(
  categoryId: string,
  subcategory: string,
): Promise<PlaceFormState | null> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { subcategories: { select: { name: true } } },
  });
  if (!category) {
    return { error: "That category no longer exists.", fields: { categoryId: "Unknown category." } };
  }
  const known = category.subcategories.some(
    (s) => s.name.toLowerCase() === subcategory.toLowerCase(),
  );
  if (!known) {
    return {
      error: `"${subcategory}" is not a subcategory of that category.`,
      fields: { subcategory: "Pick one of the listed subcategories." },
    };
  }
  return null;
}

export async function createPlace(
  _prev: PlaceFormState,
  formData: FormData,
): Promise<PlaceFormState> {
  const staff = await requireStaff();

  const parsed = parse(formData);
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;

  const badCategory = await checkCategory(d.categoryId, d.subcategory);
  if (badCategory) return badCategory;

  const id = await uniquePlaceId(d.categoryId, d.name);
  await prisma.place.create({ data: { id, ...d } });

  await recordAudit({
    actorId: staff.id,
    action: "place.create",
    entity: "place",
    entityId: id,
    meta: { name: d.name, categoryId: d.categoryId, status: d.status },
  });

  revalidateTag(PLACES_TAG);
  redirect(`/admin/places/${id}`);
}

export async function updatePlace(
  _prev: PlaceFormState,
  formData: FormData,
): Promise<PlaceFormState> {
  const staff = await requireStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing place id." };

  const parsed = parse(formData);
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;

  const badCategory = await checkCategory(d.categoryId, d.subcategory);
  if (badCategory) return badCategory;

  const before = await prisma.place.findUnique({ where: { id } });
  if (!before) return { error: "That place no longer exists." };

  // The id is immutable: it is the public URL and a foreign key from saves,
  // visits, reviews and reports. Renaming a place does not renumber it.
  await prisma.place.update({ where: { id }, data: d });

  // Record only what actually changed, so the trail reads as a history rather
  // than a series of identical full snapshots.
  //
  // Compared and stored as JSON: the audit column is JSON, and going through
  // it here means a Date or a string[] is written exactly as it will be read
  // back, rather than relying on the driver to guess.
  const changed: Record<string, { from: unknown; to: unknown }> = {};
  for (const [key, next] of Object.entries(d)) {
    const prevValue = (before as Record<string, unknown>)[key];
    if (JSON.stringify(prevValue) !== JSON.stringify(next)) {
      changed[key] = { from: prevValue ?? null, to: next ?? null };
    }
  }
  const changedJson = JSON.parse(JSON.stringify(changed)) as Prisma.InputJsonObject;

  if (Object.keys(changed).length > 0) {
    await recordAudit({
      actorId: staff.id,
      action: "place.update",
      entity: "place",
      entityId: id,
      meta: { changed: changedJson },
    });
  }

  revalidateTag(PLACES_TAG);
  revalidatePath(`/place/${id}`);
  return { error: undefined };
}

/**
 * Retire a listing without destroying it.
 *
 * A hard delete would break the place's public URL, orphan every save, visit
 * and review pointing at it, and lose the record of why it was ever listed.
 * Archiving hides it from the public catalogue while keeping all of that — and
 * unlike a delete, it can be undone by someone who did not mean it.
 */
export async function archivePlace(formData: FormData): Promise<void> {
  const staff = await requireStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const place = await prisma.place
    .update({ where: { id }, data: { status: "archived" }, select: { name: true } })
    .catch(() => null);
  if (!place) return;

  await recordAudit({
    actorId: staff.id,
    action: "place.archive",
    entity: "place",
    entityId: id,
    meta: { name: place.name },
  });

  revalidateTag(PLACES_TAG);
  revalidatePath(`/place/${id}`);
  redirect("/admin/places");
}

export async function restorePlace(formData: FormData): Promise<void> {
  const staff = await requireStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const place = await prisma.place
    .update({ where: { id }, data: { status: "published" }, select: { name: true } })
    .catch(() => null);
  if (!place) return;

  await recordAudit({
    actorId: staff.id,
    action: "place.restore",
    entity: "place",
    entityId: id,
    meta: { name: place.name },
  });

  revalidateTag(PLACES_TAG);
  revalidatePath(`/place/${id}`);
  redirect(`/admin/places/${id}`);
}

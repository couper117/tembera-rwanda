"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { CATEGORIES_TAG } from "@/lib/data/categories";
import { PLACES_TAG } from "@/lib/data/places";
import { categorySchema, subcategorySchema, firstError } from "@/lib/validation/admin";

export interface ActionState {
  error?: string;
  success?: string;
}

/**
 * The taxonomy: sixteen categories and the subcategories under them.
 *
 * Editing it is more consequential than editing a listing. A category id is a
 * public URL (/c/dining) and a foreign key on every place in it, and a
 * subcategory name is the string each place stores — so a rename here has to
 * carry the places with it, and a delete has to be refused while anything
 * still points at it.
 */

function parseCategory(formData: FormData) {
  return categorySchema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
    title: formData.get("title"),
    icon: formData.get("icon"),
    primary: formData.get("primary"),
    sensitive: formData.get("sensitive"),
    sortOrder: formData.get("sortOrder"),
  });
}

/** Bounce back to the screen with a message, for the plain (non-state) forms. */
function fail(message: string): never {
  redirect(`/admin/categories?error=${encodeURIComponent(message)}`);
}

export async function createCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = parseCategory(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const existing = await prisma.category.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (existing) {
    return { error: `A category with id "${parsed.data.id}" already exists.` };
  }

  await prisma.category.create({ data: parsed.data });
  await recordAudit({
    actorId: staff.id,
    action: "category.create",
    entity: "category",
    entityId: parsed.data.id,
    meta: { label: parsed.data.label },
  });

  revalidateTag(CATEGORIES_TAG);
  return { success: "Category created." };
}

export async function updateCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = parseCategory(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { id, ...rest } = parsed.data;
  const before = await prisma.category.findUnique({ where: { id } });
  if (!before) return { error: "That category no longer exists." };

  await prisma.category.update({ where: { id }, data: rest });
  await recordAudit({
    actorId: staff.id,
    action: "category.update",
    entity: "category",
    entityId: id,
    meta: {
      sensitive: rest.sensitive !== before.sensitive ? rest.sensitive : undefined,
      label: rest.label !== before.label ? rest.label : undefined,
    },
  });

  // The sensitive flag decides whether a whole category may be rated or
  // promoted, and getPlaces() strips those fields at the source — so the
  // catalogue has to be re-read, not just the taxonomy.
  revalidateTag(CATEGORIES_TAG);
  revalidateTag(PLACES_TAG);
  return { success: "Category updated." };
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Refused rather than cascaded. Place.categoryId is a required foreign key,
  // so deleting a category in use would either fail at the database or orphan
  // every listing in it — and "delete 102 places" is not what anybody means
  // when they tidy up a taxonomy.
  const placeCount = await prisma.place.count({ where: { categoryId: id } });
  if (placeCount > 0) {
    fail(
      `Cannot delete "${id}": ${placeCount} listing${placeCount === 1 ? "" : "s"} still use it. Move them first.`,
    );
  }

  await prisma.category.delete({ where: { id } }).catch(() => {});
  await recordAudit({
    actorId: staff.id,
    action: "category.delete",
    entity: "category",
    entityId: id,
  });

  revalidateTag(CATEGORIES_TAG);
  redirect("/admin/categories");
}

/* ------------------------------------------------------------ subcategories */

export async function addSubcategory(formData: FormData): Promise<void> {
  const staff = await requireStaff();

  const parsed = subcategorySchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) fail(firstError(parsed.error));

  const created = await prisma.subcategory.create({ data: parsed.data }).catch(() => null);
  if (!created) fail(`"${parsed.data.name}" already exists in that category.`);

  await recordAudit({
    actorId: staff.id,
    action: "subcategory.create",
    entity: "category",
    entityId: parsed.data.categoryId,
    meta: { name: parsed.data.name },
  });

  revalidateTag(CATEGORIES_TAG);
  redirect("/admin/categories");
}

/**
 * Renaming a subcategory renames it on every place filed under it, in one
 * transaction.
 *
 * Places store the subcategory as a string, not a foreign key. Renaming only
 * the row would leave every listing pointing at a name that no longer exists —
 * they would vanish from the category page's filter while still being in the
 * category, which is the kind of breakage nobody notices for a month.
 */
export async function renameSubcategory(formData: FormData): Promise<void> {
  const staff = await requireStaff();

  const id = Number(formData.get("subId"));
  const name = String(formData.get("name") ?? "").trim();
  const sortOrderRaw = Number(formData.get("sortOrder") ?? 0);
  const sortOrder = Number.isFinite(sortOrderRaw) ? sortOrderRaw : 0;

  if (!Number.isInteger(id) || !name) fail("A subcategory needs a name.");

  const before = await prisma.subcategory.findUnique({ where: { id } });
  if (!before) fail("That subcategory no longer exists.");

  const moved = await prisma
    .$transaction(async (tx) => {
      await tx.subcategory.update({ where: { id }, data: { name, sortOrder } });
      if (before.name === name) return 0;
      const { count } = await tx.place.updateMany({
        where: { categoryId: before.categoryId, subcategory: before.name },
        data: { subcategory: name },
      });
      return count;
    })
    .catch(() => null);

  if (moved === null) fail("That name is already taken in this category.");

  await recordAudit({
    actorId: staff.id,
    action: "subcategory.rename",
    entity: "category",
    entityId: before.categoryId,
    meta: { from: before.name, to: name, placesUpdated: moved },
  });

  revalidateTag(CATEGORIES_TAG);
  revalidateTag(PLACES_TAG);
  redirect("/admin/categories");
}

export async function deleteSubcategory(formData: FormData): Promise<void> {
  const staff = await requireStaff();

  const id = Number(formData.get("subId"));
  if (!Number.isInteger(id)) return;

  const before = await prisma.subcategory.findUnique({ where: { id } });
  if (!before) return;

  // Same reasoning as deleting a category: places name this subcategory, and
  // removing it would leave them filed under something that is not there.
  const inUse = await prisma.place.count({
    where: { categoryId: before.categoryId, subcategory: before.name },
  });
  if (inUse > 0) {
    fail(
      `Cannot remove "${before.name}": ${inUse} listing${inUse === 1 ? "" : "s"} still use it.`,
    );
  }

  await prisma.subcategory.delete({ where: { id } }).catch(() => {});
  await recordAudit({
    actorId: staff.id,
    action: "subcategory.delete",
    entity: "category",
    entityId: before.categoryId,
    meta: { name: before.name },
  });

  revalidateTag(CATEGORIES_TAG);
  redirect("/admin/categories");
}

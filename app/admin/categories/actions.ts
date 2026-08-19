"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { CATEGORIES_TAG } from "@/lib/data/categories";
import { categorySchema, subcategorySchema, firstError } from "@/lib/validation/admin";

export interface ActionState {
  error?: string;
  success?: string;
}

/* ------------------------------------------------------------ categories */

export async function createCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
    title: formData.get("title"),
    icon: formData.get("icon"),
    primary: formData.get("primary"),
    sensitive: formData.get("sensitive"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const existing = await prisma.category.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (existing) return { error: `A category with id "${parsed.data.id}" already exists.` };

  await prisma.category.create({ data: parsed.data });
  revalidateTag(CATEGORIES_TAG);
  return { success: "Category created." };
}

export async function updateCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
    title: formData.get("title"),
    icon: formData.get("icon"),
    primary: formData.get("primary"),
    sensitive: formData.get("sensitive"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { id, ...rest } = parsed.data;
  await prisma.category.update({ where: { id }, data: rest });
  revalidateTag(CATEGORIES_TAG);
  return { success: "Category updated." };
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const placeCount = await prisma.place.count({ where: { categoryId: id } });
  if (placeCount > 0) {
    // Blocked: places reference this category. Surface via redirect param.
    redirect(
      `/admin/categories?error=${encodeURIComponent(
        `Cannot delete "${id}": ${placeCount} place(s) still use it.`,
      )}`,
    );
  }

  await prisma.category.delete({ where: { id } }).catch(() => {});
  revalidateTag(CATEGORIES_TAG);
  redirect("/admin/categories");
}

/* --------------------------------------------------------- subcategories */

export async function addSubcategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = subcategorySchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) {
    redirect(`/admin/categories?error=${encodeURIComponent(firstError(parsed.error))}`);
  }
  const data = parsed.data;

  try {
    await prisma.subcategory.create({ data });
  } catch {
    redirect(
      `/admin/categories?error=${encodeURIComponent(
        `"${data.name}" already exists in that category.`,
      )}`,
    );
  }
  revalidateTag(CATEGORIES_TAG);
  redirect("/admin/categories");
}

export async function renameSubcategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("subId"));
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  if (!Number.isInteger(id) || !name) {
    redirect(`/admin/categories?error=${encodeURIComponent("Name is required.")}`);
  }
  try {
    await prisma.subcategory.update({
      where: { id },
      data: { name, sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0 },
    });
  } catch {
    redirect(
      `/admin/categories?error=${encodeURIComponent("That name is already taken in this category.")}`,
    );
  }
  revalidateTag(CATEGORIES_TAG);
  redirect("/admin/categories");
}

export async function deleteSubcategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("subId"));
  if (Number.isInteger(id)) {
    await prisma.subcategory.delete({ where: { id } }).catch(() => {});
    revalidateTag(CATEGORIES_TAG);
  }
  redirect("/admin/categories");
}

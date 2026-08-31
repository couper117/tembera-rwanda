"use server";

import { READ_ONLY_MESSAGE } from "@/lib/admin/readonly";
import { categorySchema, subcategorySchema, firstError } from "@/lib/validation/admin";

export interface ActionState {
  error?: string;
  success?: string;
}

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

export async function createCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseCategory(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };
  return { error: READ_ONLY_MESSAGE };
}

export async function updateCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseCategory(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };
  return { error: READ_ONLY_MESSAGE };
}

export async function deleteCategory(_formData: FormData): Promise<void> {}

export async function addSubcategory(formData: FormData): Promise<void> {
  subcategorySchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
  });
}

export async function renameSubcategory(_formData: FormData): Promise<void> {}

export async function deleteSubcategory(_formData: FormData): Promise<void> {}

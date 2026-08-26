"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { CITIES_TAG } from "@/lib/data/cities";
import { citySchema, firstError } from "@/lib/validation/admin";

export interface CityFormState {
  error?: string;
}

function parse(formData: FormData) {
  return citySchema.safeParse({
    name: formData.get("name"),
    group: formData.get("group"),
    province: formData.get("province"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    image: formData.get("image"),
    sortOrder: formData.get("sortOrder"),
  });
}

export async function createCity(
  _prev: CityFormState,
  formData: FormData,
): Promise<CityFormState> {
  await requireAdmin();
  const parsed = parse(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  try {
    await prisma.city.create({ data: parsed.data });
  } catch {
    return { error: `A city named "${parsed.data.name}" already exists.` };
  }
  revalidateTag(CITIES_TAG);
  redirect("/admin/cities");
}

export async function updateCity(
  _prev: CityFormState,
  formData: FormData,
): Promise<CityFormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing city id." };

  const parsed = parse(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  try {
    await prisma.city.update({ where: { id }, data: parsed.data });
  } catch {
    return { error: `A city named "${parsed.data.name}" already exists.` };
  }
  revalidateTag(CITIES_TAG);
  redirect("/admin/cities");
}

export async function deleteCity(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id)) {
    await prisma.city.delete({ where: { id } }).catch(() => {});
    revalidateTag(CITIES_TAG);
  }
  redirect("/admin/cities");
}

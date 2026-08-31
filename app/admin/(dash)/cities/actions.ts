"use server";

import { READ_ONLY_MESSAGE } from "@/lib/admin/readonly";
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
  const parsed = parse(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };
  return { error: READ_ONLY_MESSAGE };
}

export async function updateCity(
  _prev: CityFormState,
  formData: FormData,
): Promise<CityFormState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };
  return { error: READ_ONLY_MESSAGE };
}

export async function deleteCity(_formData: FormData): Promise<void> {}

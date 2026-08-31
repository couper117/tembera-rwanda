"use server";

import { READ_ONLY_MESSAGE } from "@/lib/admin/readonly";
import { placeSchema, firstError } from "@/lib/validation/admin";

export interface PlaceFormState {
  error?: string;
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
  });
}

export async function createPlace(
  _prev: PlaceFormState,
  formData: FormData,
): Promise<PlaceFormState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };
  return { error: READ_ONLY_MESSAGE };
}

export async function updatePlace(
  _prev: PlaceFormState,
  formData: FormData,
): Promise<PlaceFormState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };
  return { error: READ_ONLY_MESSAGE };
}

export async function deletePlace(_formData: FormData): Promise<void> {}

"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PLACES_TAG } from "@/lib/data/places";
import { placeSchema, kebab, firstError } from "@/lib/validation/admin";

export interface PlaceFormState {
  error?: string;
}

/** Build a unique, URL-safe id from categoryId + name (append -2, -3 … if taken). */
async function uniquePlaceId(categoryId: string, name: string): Promise<string> {
  const base = kebab(`${categoryId}-${name}`) || "place";
  // Walk base, base-2, base-3, … until a free id is found. Bounded in practice
  // by real collision counts.
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
  });
}

export async function createPlace(
  _prev: PlaceFormState,
  formData: FormData,
): Promise<PlaceFormState> {
  await requireAdmin();

  const parsed = parse(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;

  // Guard: category must exist (Place.categoryId is a FK).
  const cat = await prisma.category.findUnique({
    where: { id: d.categoryId },
    select: { id: true },
  });
  if (!cat) return { error: "Selected category no longer exists." };

  const id = await uniquePlaceId(d.categoryId, d.name);

  await prisma.place.create({
    data: {
      id,
      name: d.name,
      categoryId: d.categoryId,
      subcategory: d.subcategory,
      subtype: d.subtype,
      city: d.city,
      area: d.area,
      lat: d.lat,
      lng: d.lng,
      coordsPrecision: d.coordsPrecision,
      rating: d.rating,
      image: d.image,
      images: d.images,
      description: d.description,
      hours: d.hours,
      phone: d.phone,
      mapLink: d.mapLink,
      website: d.website,
      highlights: d.highlights,
      priceFrom: d.priceFrom,
      keywords: d.keywords,
      sensitive: d.sensitive,
    },
  });

  revalidateTag(PLACES_TAG);
  redirect("/admin/places");
}

export async function updatePlace(
  _prev: PlaceFormState,
  formData: FormData,
): Promise<PlaceFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing place id." };

  const parsed = parse(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;

  const cat = await prisma.category.findUnique({
    where: { id: d.categoryId },
    select: { id: true },
  });
  if (!cat) return { error: "Selected category no longer exists." };

  // id is immutable on edit — deliberately not updated here.
  await prisma.place.update({
    where: { id },
    data: {
      name: d.name,
      categoryId: d.categoryId,
      subcategory: d.subcategory,
      subtype: d.subtype,
      city: d.city,
      area: d.area,
      lat: d.lat,
      lng: d.lng,
      coordsPrecision: d.coordsPrecision,
      rating: d.rating,
      image: d.image,
      images: d.images,
      description: d.description,
      hours: d.hours,
      phone: d.phone,
      mapLink: d.mapLink,
      website: d.website,
      highlights: d.highlights,
      priceFrom: d.priceFrom,
      keywords: d.keywords,
      sensitive: d.sensitive,
    },
  });

  revalidateTag(PLACES_TAG);
  redirect("/admin/places");
}

export async function deletePlace(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.place.delete({ where: { id } }).catch(() => {});
    revalidateTag(PLACES_TAG);
  }
  redirect("/admin/places");
}

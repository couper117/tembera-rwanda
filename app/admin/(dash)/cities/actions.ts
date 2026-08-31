"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { CITIES_TAG } from "@/lib/data/cities";
import { PLACES_TAG } from "@/lib/data/places";
import { citySchema, firstError } from "@/lib/validation/admin";

export interface CityFormState {
  error?: string;
}

/**
 * The district directory: Rwanda's thirty districts, plus the group that makes
 * Kigali's three read as one city.
 *
 * Rarely edited — the districts have not changed since 2006 — so this is a
 * small table rather than a CRUD application. What it does need is the same
 * care as the taxonomy: places store the district as a string, so a rename has
 * to carry them with it.
 */

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
  const staff = await requireStaff();

  const parsed = parse(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const created = await prisma.city.create({ data: parsed.data }).catch(() => null);
  if (!created) return { error: `A district named "${parsed.data.name}" already exists.` };

  await recordAudit({
    actorId: staff.id,
    action: "city.create",
    entity: "city",
    entityId: String(created.id),
    meta: { name: created.name },
  });

  revalidateTag(CITIES_TAG);
  redirect("/admin/cities");
}

export async function updateCity(
  _prev: CityFormState,
  formData: FormData,
): Promise<CityFormState> {
  const staff = await requireStaff();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing district id." };

  const parsed = parse(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const before = await prisma.city.findUnique({ where: { id } });
  if (!before) return { error: "That district no longer exists." };

  // Places name their district as a string. Renaming the row alone would leave
  // every listing in it pointing at a district that no longer exists, and
  // /city/[name] would 404 for all of them.
  const moved = await prisma
    .$transaction(async (tx) => {
      await tx.city.update({ where: { id }, data: parsed.data });
      if (before.name === parsed.data.name) return 0;
      const { count } = await tx.place.updateMany({
        where: { city: before.name },
        data: { city: parsed.data.name },
      });
      return count;
    })
    .catch(() => null);

  if (moved === null) return { error: `A district named "${parsed.data.name}" already exists.` };

  await recordAudit({
    actorId: staff.id,
    action: "city.update",
    entity: "city",
    entityId: String(id),
    meta:
      before.name === parsed.data.name
        ? { name: parsed.data.name }
        : { from: before.name, to: parsed.data.name, placesUpdated: moved },
  });

  revalidateTag(CITIES_TAG);
  if (moved) revalidateTag(PLACES_TAG);
  redirect("/admin/cities");
}

export async function deleteCity(formData: FormData): Promise<void> {
  const staff = await requireStaff();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const before = await prisma.city.findUnique({ where: { id } });
  if (!before) return;

  const inUse = await prisma.place.count({ where: { city: before.name } });
  if (inUse > 0) {
    redirect(
      `/admin/cities?error=${encodeURIComponent(
        `Cannot delete ${before.name}: ${inUse} listing${inUse === 1 ? "" : "s"} are in it.`,
      )}`,
    );
  }

  await prisma.city.delete({ where: { id } }).catch(() => {});
  await recordAudit({
    actorId: staff.id,
    action: "city.delete",
    entity: "city",
    entityId: String(id),
    meta: { name: before.name },
  });

  revalidateTag(CITIES_TAG);
  redirect("/admin/cities");
}

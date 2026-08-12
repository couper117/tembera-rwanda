import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const CITIES_TAG = "cities";

export interface CityRecord {
  id: number;
  name: string;
  group: string | null;
  province: string | null;
  lat: number | null;
  lng: number | null;
  image: string | null;
  sortOrder: number;
}

/** The admin-managed city/district directory. */
export const getCities = unstable_cache(
  async (): Promise<CityRecord[]> => {
    return prisma.city.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  },
  ["cities-list"],
  { tags: [CITIES_TAG] },
);

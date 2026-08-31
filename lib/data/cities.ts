import { citySummaries } from "@/lib/places/catalog";

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

/**
 * The city/district directory, derived from the places catalog.
 *
 * There is no city table any more, so a city exists exactly as long as
 * something in the catalog sits in it. `id` and `sortOrder` are positional:
 * they keep the admin table's shape without pretending to be stable keys.
 * Province is unknown from the catalog alone and is left null rather than
 * guessed.
 */
export async function getCities(): Promise<CityRecord[]> {
  return citySummaries().map((city, index) => ({
    id: index + 1,
    name: city.name,
    group: null,
    province: null,
    lat: null,
    lng: null,
    image: city.image ?? null,
    sortOrder: index,
  }));
}

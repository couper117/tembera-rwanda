import type { Coords } from "./types";

/**
 * Approximate centres of Rwanda's 30 districts.
 *
 * Most legacy records carried a district or neighbourhood name but no
 * coordinates. Rather than invent a precise pin, we fall back to the district
 * centre and mark the place `coordsPrecision: "district"` so the UI can say
 * "~12 km" instead of pretending to a street address.
 */
export const DISTRICT_CENTRES: Record<string, Coords> = {
  // Kigali City
  Gasabo: { lat: -1.9403, lng: 30.0916 },
  Kicukiro: { lat: -1.9707, lng: 30.1027 },
  Nyarugenge: { lat: -1.9536, lng: 30.0606 },
  // Northern Province
  Burera: { lat: -1.4667, lng: 29.8 },
  Gakenke: { lat: -1.7, lng: 29.7833 },
  Gicumbi: { lat: -1.5833, lng: 30.1 },
  Musanze: { lat: -1.4995, lng: 29.6349 },
  Rulindo: { lat: -1.7667, lng: 30.05 },
  // Southern Province
  Gisagara: { lat: -2.6167, lng: 29.8333 },
  Huye: { lat: -2.5967, lng: 29.7402 },
  Kamonyi: { lat: -2.0167, lng: 29.9 },
  Muhanga: { lat: -2.0833, lng: 29.75 },
  Nyamagabe: { lat: -2.4667, lng: 29.5667 },
  Nyanza: { lat: -2.35, lng: 29.75 },
  Nyaruguru: { lat: -2.6333, lng: 29.5333 },
  Ruhango: { lat: -2.2167, lng: 29.7833 },
  // Eastern Province
  Bugesera: { lat: -2.2167, lng: 30.15 },
  Gatsibo: { lat: -1.5833, lng: 30.4167 },
  Kayonza: { lat: -1.95, lng: 30.5333 },
  Kirehe: { lat: -2.2833, lng: 30.7 },
  Ngoma: { lat: -2.15, lng: 30.5333 },
  Nyagatare: { lat: -1.3, lng: 30.3333 },
  Rwamagana: { lat: -1.95, lng: 30.4333 },
  // Western Province
  Karongi: { lat: -2.0, lng: 29.3833 },
  Ngororero: { lat: -1.8667, lng: 29.6167 },
  Nyabihu: { lat: -1.65, lng: 29.5167 },
  Nyamasheke: { lat: -2.3333, lng: 29.1333 },
  Rubavu: { lat: -1.6833, lng: 29.2667 },
  Rusizi: { lat: -2.4833, lng: 28.9 },
  Rutsiro: { lat: -1.9333, lng: 29.3333 },
};

/** Kigali city centre — the default view when we have no user location. */
export const KIGALI: Coords = { lat: -1.9441, lng: 30.0619 };

/**
 * Neighbourhoods and loose place names that appear in the legacy data, mapped
 * to the district that contains them. Lets an area-only record still resolve
 * to a sensible map position.
 */
const AREA_TO_DISTRICT: Record<string, string> = {
  // Gasabo
  remera: "Gasabo",
  kacyiru: "Gasabo",
  kimironko: "Gasabo",
  gisozi: "Gasabo",
  nyarutarama: "Gasabo",
  kimihurura: "Gasabo",
  gacuriro: "Gasabo",
  kibagabaga: "Gasabo",
  gaculiro: "Gasabo",
  ndera: "Gasabo",
  kabuga: "Gasabo",
  rusororo: "Gasabo",
  nyandungu: "Gasabo",
  // Nyarugenge
  nyamirambo: "Nyarugenge",
  "city center": "Nyarugenge",
  "city centre": "Nyarugenge",
  downtown: "Nyarugenge",
  nyabugogo: "Nyarugenge",
  kiyovu: "Nyarugenge",
  muhima: "Nyarugenge",
  gitega: "Nyarugenge",
  // Kicukiro
  gahanga: "Kicukiro",
  gikondo: "Kicukiro",
  kanombe: "Kicukiro",
  niboye: "Kicukiro",
  kagarama: "Kicukiro",
  // Elsewhere
  butare: "Huye",
  ruhengeri: "Musanze",
  kinigi: "Musanze",
  gisenyi: "Rubavu",
  kibuye: "Karongi",
  cyangugu: "Rusizi",
  nyamata: "Bugesera",
  rugezi: "Burera",
};

/** Districts that make up Kigali City. */
export const KIGALI_DISTRICTS = ["Gasabo", "Kicukiro", "Nyarugenge"];

/**
 * Last-resort fallback for records that name only a province. Each maps to a
 * central district of that province, so the pin lands in the right region even
 * though it is nowhere near street-accurate.
 */
const PROVINCE_TO_DISTRICT: Record<string, string> = {
  "eastern province": "Kayonza",
  "western province": "Karongi",
  "northern province": "Musanze",
  "southern province": "Muhanga",
  "kigali city": "Nyarugenge",
};

/**
 * Resolve a free-text location ("Kimironko Sector", "Western Province, Rusizi",
 * "Kimihurura & Downtown") to a known district name.
 */
export function resolveDistrict(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const text = raw.toLowerCase();

  // Exact district name wins over neighbourhood and province guesses.
  for (const district of Object.keys(DISTRICT_CENTRES)) {
    if (text.includes(district.toLowerCase())) return district;
  }
  for (const [area, district] of Object.entries(AREA_TO_DISTRICT)) {
    if (text.includes(area)) return district;
  }
  for (const [province, district] of Object.entries(PROVINCE_TO_DISTRICT)) {
    if (text.includes(province)) return district;
  }
  // "Kigali" with no finer detail: treat as the central district.
  if (text.includes("kigali")) return "Nyarugenge";
  return undefined;
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** "450 m" / "2.4 km" / "18 km" — tight enough for a card. */
export function formatDistance(km: number | undefined): string | undefined {
  if (km === undefined || !Number.isFinite(km)) return undefined;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/**
 * How far apart two district centres can be before a district-precision
 * distance carries real information.
 *
 * Kigali's districts all sit within a few kilometres of each other, so every
 * place pinned to a centroid inside the city reads as the same handful of
 * numbers — "~3.3 km away" repeated down a list is not three distances, it is
 * one centroid printed three times. Across the country the gap is an order of
 * magnitude larger (Musanze ~90 km, Huye ~130 km), where "~90 km" genuinely
 * tells you this is a different trip.
 *
 * 10 km sits in that gap: it swallows the intra-city noise and keeps the
 * cross-country signal.
 */
const DISTRICT_DISTANCE_FLOOR_KM = 10;

/**
 * Distance label that respects how well we actually know where a place is.
 *
 * District-precision records are pinned to their district centre, so a short
 * reading is not a measurement — it is the distance to the middle of a
 * neighbourhood we already name on the card. Below the floor we say nothing
 * and let the area line do the work; above it, the "~" marks the estimate.
 */
export function formatDistanceFor(
  km: number | undefined,
  precision: "exact" | "district" | "unknown",
): string | undefined {
  if (km === undefined || !Number.isFinite(km)) return undefined;
  if (precision === "exact") return formatDistance(km);
  if (km < DISTRICT_DISTANCE_FLOOR_KM) return undefined;
  return `~${formatDistance(km)}`;
}

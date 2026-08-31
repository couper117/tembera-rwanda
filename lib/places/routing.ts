// Turn-by-turn routing, shared by the map screen and the navigation screen.
//
// Routes come from the public OSRM server rather than Google's Directions API,
// which refuses to answer unless the Cloud project has billing enabled. OSRM
// needs no key and no account, and it routes on OpenStreetMap data, which
// covers Rwanda's roads by name.
//
// Two things to know about that server: it is a shared demo instance with no
// SLA, so callers should always offer a hand-off to Google Maps; and it
// publishes only the car network, which is why there is no walking mode —
// asking it for a walking route returns the driving one, to the metre.

import type { IconName } from "@/components/Icon";

const OSRM_ROUTE = "https://router.project-osrm.org/route/v1/driving";

export const ROUTE_ERRORS: Record<string, string> = {
  NoRoute: "No road route found between those two points.",
  UNKNOWN: "Couldn't reach the routing service just now.",
};

export interface LatLng {
  lat: number;
  lng: number;
}

/** Only the parts of OSRM's step object this module reads. */
interface OsrmStep {
  name?: string;
  distance?: number;
  maneuver?: {
    type?: string;
    modifier?: string;
    exit?: number;
    bearing_after?: number;
    /** [lng, lat] — GeoJSON order. */
    location?: [number, number];
  };
}

export interface RouteStep {
  text: string;
  /** Formatted for reading; empty on the final step. */
  distance: string;
  /** Metres, kept for the navigator's "in 200 m…" prompts. */
  metres: number;
  icon: IconName;
  /** Where the manoeuvre happens, so navigation can tell when it is done. */
  at: LatLng;
}

export interface Route {
  destination: string;
  distance: string;
  duration: string;
  /** Clock time you'd arrive, which is the number people actually plan by. */
  arriveAt: string;
  steps: RouteStep[];
  /** Full geometry, for drawing the line. */
  path: LatLng[];
}

/* ------------------------------------------------------------- formatting */

export function formatRouteDistance(metres: number): string {
  return metres < 950
    ? `${Math.round(metres / 10) * 10} m`
    : `${(metres / 1000).toFixed(1)} km`;
}

export function formatRouteDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

const COMPASS = [
  "north",
  "north-east",
  "east",
  "south-east",
  "south",
  "south-west",
  "west",
  "north-west",
];

/** "Head north on…" beats "Set off" — it tells you which way to point. */
function headingWord(bearing: number): string {
  return COMPASS[Math.round((((bearing % 360) + 360) % 360) / 45) % 8];
}

function ordinal(n: number): string {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/**
 * OSM abbreviates road types inconsistently — the same street arrives as both
 * "KN 5 Rd" and "KN 5 Road" within one route. Expanding them makes the text
 * read consistently and, more usefully, lets the merge pass below recognise
 * that two consecutive steps are on the same road.
 */
const ROAD_WORDS: Record<string, string> = {
  rd: "Road",
  ave: "Avenue",
  av: "Avenue",
  st: "Street",
  hwy: "Highway",
  blvd: "Boulevard",
  ln: "Lane",
  dr: "Drive",
};

function normaliseRoad(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      const bare = word.replace(/\.$/, "").toLowerCase();
      return ROAD_WORDS[bare] ?? word;
    })
    .join(" ");
}

/** Arrow that matches the manoeuvre, so a step reads before it is read. */
function stepIcon(type: string, modifier: string): IconName {
  if (type === "arrive") return "destination";
  if (type === "roundabout" || type === "rotary") return "roundabout";
  // OSRM hangs a turn modifier on the departure step describing which way the
  // road runs, not a turn to make. Taking it literally drew a left arrow next
  // to "Head east".
  if (type === "depart") return "goStraight";
  if (modifier.includes("uturn")) return "uturn";
  if (modifier.includes("slight")) {
    return modifier.includes("left") ? "slightLeft" : "slightRight";
  }
  if (modifier.includes("left")) return "turnLeft";
  if (modifier.includes("right")) return "turnRight";
  return "goStraight";
}

/**
 * OSRM describes a manoeuvre in parts — a type, a turn modifier, a bearing and
 * the road being joined — where Google shipped a ready-made sentence. This
 * composes the parts the way a navigator would say them out loud.
 */
function instructionFor(s: OsrmStep, destination: string): string {
  const type = s?.maneuver?.type ?? "";
  const modifier = s?.maneuver?.modifier ?? "";
  const road = normaliseRoad(s?.name ?? "");
  const onto = road ? ` onto ${road}` : "";
  const on = road ? ` on ${road}` : "";

  switch (type) {
    case "depart":
      return `Head ${headingWord(s?.maneuver?.bearing_after ?? 0)}${on}`;
    case "arrive":
      return `Arrive at ${destination}`;
    case "roundabout":
    case "rotary":
      return s?.maneuver?.exit
        ? `At the roundabout, take the ${ordinal(s.maneuver.exit)} exit${onto}`
        : `Enter the roundabout${onto}`;
    case "merge":
      return `Merge${onto}`;
    case "on ramp":
      return `Take the slip road${onto}`;
    case "off ramp":
      return `Take the exit${onto}`;
    case "fork":
      // "Keep uturn" is nonsense; a fork never doubles back.
      return modifier && modifier !== "uturn"
        ? `Keep ${modifier}${onto}`
        : `Keep straight${onto}`;
    case "end of road":
      return `At the end of the road, turn ${modifier || "left"}${onto}`;
    case "new name":
    case "continue":
    default:
      if (modifier === "uturn") return `Make a U-turn${onto}`;
      // "straight" is a direction to hold, not a turn to make — "Turn straight
      // onto KK 238 Street" is not something anyone says.
      if (!modifier || modifier === "straight") {
        return road ? `Continue on ${road}` : "Continue straight";
      }
      if (type === "new name" || type === "continue") return `Keep ${modifier}${onto}`;
      return `Turn ${modifier}${onto}`;
  }
}

/**
 * OSRM emits a step per geometry change, which is far more than a person needs
 * — a single roundabout can arrive as three identical instructions in a row,
 * and a long road split across several "continue"s. This collapses the list to
 * the manoeuvres a driver would actually be told about:
 *
 *  - consecutive steps reading identically become one, distances summed;
 *  - a step under 25 m is folded into the one before it, since nobody can act
 *    on an instruction that expires in five car lengths.
 *
 * The arrival step is never merged away — it is the point of the whole list.
 */
function condense(steps: RouteStep[]): RouteStep[] {
  const out: RouteStep[] = [];

  for (const step of steps) {
    const previous = out[out.length - 1];
    const isArrival = step.icon === "destination";
    const sameInstruction = previous && previous.text === step.text;
    const tooShortToAct = previous && !isArrival && step.metres < 25;

    if (previous && (sameInstruction || tooShortToAct)) {
      previous.metres += step.metres;
      previous.distance = formatRouteDistance(previous.metres);
      // Keep the later manoeuvre point: it is the one still ahead of you.
      previous.at = step.at;
      continue;
    }
    out.push({ ...step });
  }

  return out;
}

/* ---------------------------------------------------------------- fetching */

export async function fetchRoute(
  origin: LatLng,
  destination: { name: string; lat?: number; lng?: number },
): Promise<{ ok: true; route: Route } | { ok: false; error: string }> {
  if (destination.lat === undefined || destination.lng === undefined) {
    return { ok: false, error: ROUTE_ERRORS.UNKNOWN };
  }

  try {
    // OSRM takes lng,lat — the opposite order to everything else here.
    const url =
      `${OSRM_ROUTE}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
      "?overview=full&geometries=geojson&steps=true";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OSRM responded ${response.status}`);

    const data = await response.json();
    const found = data?.routes?.[0];
    if (data?.code !== "Ok" || !found) {
      return { ok: false, error: ROUTE_ERRORS[data?.code] ?? ROUTE_ERRORS.UNKNOWN };
    }

    // GeoJSON positions are [lng, lat]; Maps wants the reverse.
    const path: LatLng[] = (found.geometry?.coordinates ?? []).map(
      (c: [number, number]) => ({ lat: c[1], lng: c[0] }),
    );

    const raw: RouteStep[] = (found.legs?.[0]?.steps ?? [])
      // OSRM emits a "leave the roundabout" step straight after the one that
      // already said which exit to take; only the useful half survives.
      .filter(
        (s: OsrmStep) =>
          s?.maneuver?.type !== "exit roundabout" && s?.maneuver?.type !== "exit rotary",
      )
      .map((s: OsrmStep) => {
        const location: [number, number] = s?.maneuver?.location ?? [
          destination.lng!,
          destination.lat!,
        ];
        const metres: number = s?.distance ?? 0;
        return {
          text: instructionFor(s, destination.name),
          metres,
          distance: metres ? formatRouteDistance(metres) : "",
          icon: stepIcon(s?.maneuver?.type ?? "", s?.maneuver?.modifier ?? ""),
          at: { lat: location[1], lng: location[0] },
        };
      });

    return {
      ok: true,
      route: {
        destination: destination.name,
        distance: formatRouteDistance(found.distance ?? 0),
        duration: formatRouteDuration(found.duration ?? 0),
        arriveAt: new Date(Date.now() + (found.duration ?? 0) * 1000).toLocaleTimeString(
          [],
          { hour: "2-digit", minute: "2-digit" },
        ),
        steps: condense(raw),
        path,
      },
    };
  } catch {
    return { ok: false, error: ROUTE_ERRORS.UNKNOWN };
  }
}

/**
 * Hand the trip to Google Maps. The escape hatch for when OSRM is unreachable
 * — that server carries no SLA, so there has to be one.
 */
export function externalRoute(
  origin: LatLng,
  place: { lat?: number; lng?: number },
): string | null {
  if (place.lat === undefined || place.lng === undefined) return null;
  return (
    "https://www.google.com/maps/dir/?api=1" +
    `&origin=${origin.lat},${origin.lng}` +
    `&destination=${place.lat},${place.lng}`
  );
}

/** Metres between two points. Used to tell when a manoeuvre is behind you. */
export function metresBetween(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

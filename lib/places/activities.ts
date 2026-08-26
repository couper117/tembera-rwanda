// "Things to do" for the detail page. Most places never got a `highlights`
// list from their source data (only the old playground rows did), so this
// falls back to generic, subcategory-typical suggestions rather than leaving
// the section empty on the majority of places. Fallback copy is worded as
// "typical for this kind of place," never as a claim verified for the exact
// listing.

import type { IconName } from "@/components/Icon";
import type { Place } from "./types";

/** Keyed exactly against the subcategory strings in taxonomy.ts. */
export const SUBCATEGORY_ACTIVITY_HINTS: Partial<Record<string, string[]>> = {
  // sports
  Arenas: ["Watch a live event", "Courtside or rinkside seating", "Concessions & merchandise"],
  Stadiums: ["Watch a match", "Stadium tour", "Concessions"],
  "Sports Grounds": ["Watch or join a game", "Open-air seating"],
  "Event Venues": ["Live events & concerts", "Function hire"],

  // arts / memorials
  Museums: ["Guided exhibits", "Photography", "Gift shop"],
  "Art Galleries": ["Browse rotating exhibits", "Meet local artists"],
  "Cultural Centers": ["Cultural performances", "Craft workshops"],
  "Memorial Sites": ["Guided reflection walk", "Learn the site's history"],
  "Genocide Memorials": ["Guided tour", "Learn the site's history"],
  "Historical Sites": ["Guided tour", "Photography"],
  "Heritage Sites": ["Guided tour", "Photography"],

  // nature / wonders
  Parks: ["Walking trails", "Picnic spots", "Photography"],
  "Nature Reserves": ["Guided nature walks", "Wildlife spotting", "Photography"],
  Forests: ["Canopy walks", "Guided nature walks", "Birdwatching"],
  Lakes: ["Boat trips", "Lakeside walks", "Photography"],
  "Hiking Trails": ["Guided hikes", "Scenic viewpoints", "Photography"],
  Waterfalls: ["Photography", "Short hikes", "Swimming (where safe)"],
  "Natural Wonders": ["Guided tours", "Photography", "Wildlife spotting"],
  Landmarks: ["Photography", "Guided tours"],
  "Tourist Attractions": ["Guided tours", "Photography"],
  "Scenic Viewpoints": ["Photography", "Sunset/sunrise views"],
  Monuments: ["Photography", "Guided tours"],

  // dining
  Restaurants: ["Dine in", "Takeaway", "Private events"],
  "Resto Bars": ["Dine in", "Drinks", "Live music some nights"],
  Cafés: ["Coffee & pastries", "Free WiFi", "Outdoor seating"],
  Bars: ["Drinks", "Live music some nights"],
  "Fast Food": ["Dine in", "Takeaway", "Delivery"],

  // stays
  Hotels: ["Restaurant on-site", "Pool access", "Room service"],
  Lodges: ["Guided excursions", "Restaurant on-site", "Bonfire evenings"],
  "Guest Houses": ["Home-style breakfast", "Quiet stays"],
  Resorts: ["Pool access", "Spa & wellness", "Restaurant on-site"],
  Hostels: ["Shared common areas", "Budget stays"],

  // shopping
  Markets: ["Browse local goods", "Bargain for crafts", "Street food"],
  Supermarkets: ["Groceries", "Household goods"],
  "Shopping Centers": ["Shopping", "Dining options on-site"],
  Malls: ["Shopping", "Cinema & entertainment", "Dining options"],

  // recreation
  Gyms: ["Group classes", "Personal training", "Open gym"],
  "Fitness Centers": ["Group classes", "Personal training"],
  "Sports Clubs": ["Join a club session", "Facility hire"],
  "Swimming Pools": ["Lap swimming", "Lessons"],
  Playgrounds: ["Rides & attractions", "Family-friendly play areas"],
};

const ICON_KEYWORDS: [string[], IconName][] = [
  [["hik", "trek", "trail", "walk", "climb"], "mountain"],
  [["forest", "nature", "wildlife", "garden", "birdwatch"], "tree"],
  [["swim", "pool", "water", "lake", "waterfall", "boat"], "sparkle"],
  [["museum", "monument", "exhibit", "gallery", "history", "reflect"], "landmark"],
  [["art", "craft", "cultur"], "palette"],
  [["gym", "fitness", "training", "class"], "dumbbell"],
  [["event", "match", "concert", "game", "live"], "trophy"],
  [["tour", "ticket", "entry", "seating"], "ticket"],
  [["food", "dine", "cafe", "coffee", "drink", "takeaway", "breakfast"], "utensils"],
  [["shop", "market", "gift", "goods", "bargain"], "basket"],
  [["worship", "service", "prayer"], "worship"],
  [["room", "stay", "hotel", "lodge", "spa"], "bed"],
];

function iconFor(label: string): IconName {
  const needle = label.toLowerCase();
  for (const [keywords, icon] of ICON_KEYWORDS) {
    if (keywords.some((k) => needle.includes(k))) return icon;
  }
  return "sparkle";
}

export interface ThingToDo {
  label: string;
  icon: IconName;
}

/**
 * `highlights` when the source carried any (only ~20 legacy playground
 * places do), otherwise a generic suggestion list for the subcategory.
 */
export function getThingsToDo(place: Pick<Place, "highlights" | "subcategory">): ThingToDo[] {
  const items = place.highlights?.length
    ? place.highlights
    : SUBCATEGORY_ACTIVITY_HINTS[place.subcategory];
  return (items ?? []).map((label) => ({ label, icon: iconFor(label) }));
}

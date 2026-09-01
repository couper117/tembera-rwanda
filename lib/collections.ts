import "server-only";
import { getCategories, sensitiveCategoryIds } from "@/lib/data/categories";
import { getPlaces } from "@/lib/data/places";
import { isRenderableImage } from "@/lib/places/engine";
import type { Place } from "@/lib/places/types";

/**
 * The curated "Collections" row.
 *
 * It used to be the categories an admin had flagged `primary`, which meant a
 * collection was only ever "a category with a nicer picture" — four of them,
 * each duplicating a row the reader could already reach from the rail. A
 * collection earns its place by cutting the catalogue somewhere the navigation
 * does not: a cuisine, a lakeside, a thing to do on a Sunday.
 *
 * Each one is a real slice of the data with a real destination, so none of
 * them can be empty or lead somewhere that shrugs. Anything that cannot be
 * filled or illustrated is dropped rather than shown hollow.
 *
 * **No sensitive category ever appears here.** A collection is a promotional
 * frame — "worth the trip", "where to eat" — and a memorial is not something
 * to browse for a nice afternoon.
 */
export interface Collection {
  title: string;
  description: string;
  imageUrl: string;
  /** Relative to the site root, e.g. "c/dining". */
  pageLink: string;
  ctaText: string;
}

/** How a collection selects its places, and where tapping it goes. */
interface Recipe {
  title: string;
  /** What the reader gets, in their words. Count is appended. */
  blurb: string;
  categoryId?: string;
  /** Matched against subcategory OR subtype, so "Cafés" and "coffee" both hit. */
  types?: string[];
  city?: string;
  link: string;
}

const CURATED: Recipe[] = [
  {
    title: "Where to eat in Kigali",
    blurb: "Restaurants across the capital",
    categoryId: "dining",
    city: "Kigali",
    link: "c/dining?city=Kigali",
  },
  {
    title: "Coffee & cafés",
    blurb: "Rwanda grows it; these places pour it",
    categoryId: "dining",
    types: ["Cafés", "Coffee Shops", "coffee", "café"],
    link: "c/dining?type=Caf%C3%A9s",
  },
  {
    title: "Lakes & waterfalls",
    blurb: "Kivu, Muhazi and the water in between",
    categoryId: "nature",
    types: ["Lakes", "Waterfalls"],
    link: "c/nature",
  },
  {
    title: "Parks & wildlife",
    blurb: "Akagera, Nyungwe and the Virungas",
    categoryId: "nature",
    types: ["Parks", "Nature Reserves", "Forests"],
    link: "c/nature?type=Parks",
  },
  {
    title: "Museums & galleries",
    blurb: "Where the country keeps its story",
    categoryId: "arts",
    link: "c/arts",
  },
  {
    title: "Markets & crafts",
    blurb: "Imigongo, baskets and everything else",
    categoryId: "shopping",
    types: ["Markets", "Craft & Souvenir Shops", "craft"],
    link: "c/shopping?type=Markets",
  },
  {
    title: "Somewhere to stay",
    blurb: "Hotels, lodges and guest houses",
    categoryId: "stays",
    link: "c/stays",
  },
  {
    title: "Nightlife",
    blurb: "Bars and resto bars, once the sun goes",
    categoryId: "dining",
    types: ["Bars", "Resto Bars", "Nightclubs"],
    link: "c/dining?type=Bars",
  },
  {
    title: "Landmarks & viewpoints",
    blurb: "The views worth the climb",
    categoryId: "wonders",
    link: "c/wonders",
  },
  {
    title: "Active days",
    blurb: "Gyms, pools, courts and trails",
    categoryId: "recreation",
    link: "c/recreation",
  },
];

/**
 * The photograph that represents a collection.
 *
 * It used to be whichever place sorted first, so "Where to eat in Kigali" led
 * with a close-up of a teapot — a real photo of a real listing, and a terrible
 * advertisement for the row it was standing for. The best-rated listing is the
 * one somebody has actually vouched for, and its photo is usually the one
 * worth putting on the front.
 */
function coverImage(found: Place[]): string | undefined {
  const withPhoto = found.filter((p) => isRenderableImage(p.image));
  if (withPhoto.length === 0) return undefined;
  const best = withPhoto
    .slice()
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
  return best.image;
}

function matches(place: Place, recipe: Recipe): boolean {
  if (recipe.categoryId && place.categoryId !== recipe.categoryId) return false;
  if (recipe.city && !cityMatches(place, recipe.city)) return false;
  if (!recipe.types) return true;

  const haystack = `${place.subcategory} ${place.subtype ?? ""}`.toLowerCase();
  return recipe.types.some((t) => haystack.includes(t.toLowerCase()));
}

/** Kigali means its three districts, the way the city pages already treat it. */
function cityMatches(place: Place, city: string): boolean {
  if (city !== "Kigali") return place.city === city;
  return ["Gasabo", "Kicukiro", "Nyarugenge", "Kigali"].includes(place.city);
}

export async function getCollections(): Promise<Collection[]> {
  try {
    const [groups, places, sensitive] = await Promise.all([
      getCategories(),
      getPlaces(),
      sensitiveCategoryIds(),
    ]);

    const out: Collection[] = [];
    const used = new Set<string>();

    for (const recipe of CURATED) {
      if (recipe.categoryId && sensitive.has(recipe.categoryId)) continue;

      const found = places.filter((p) => !sensitive.has(p.categoryId) && matches(p, recipe));
      // A collection of two is a list, not a collection.
      if (found.length < 3) continue;

      const image = coverImage(found);
      if (!image) continue;

      used.add(recipe.link);
      out.push({
        title: recipe.title,
        description: `${recipe.blurb} · ${found.length} places`,
        imageUrl: image,
        pageLink: recipe.link,
        ctaText: "Explore",
      });
    }

    // Anything an admin has flagged primary that the curated set does not
    // already cover — so the row still follows the taxonomy screen.
    for (const group of groups.filter((g) => g.primary)) {
      const link = `c/${group.id}`;
      if (used.has(link) || sensitive.has(group.id)) continue;

      const inCategory = places.filter((p) => p.categoryId === group.id);
      const image = coverImage(inCategory);
      if (!image) continue;

      used.add(link);
      out.push({
        title: group.title,
        description: `${inCategory.length} place${inCategory.length === 1 ? "" : "s"} to explore`,
        imageUrl: image,
        pageLink: link,
        ctaText: "Explore",
      });
    }

    return out;
  } catch {
    return [];
  }
}

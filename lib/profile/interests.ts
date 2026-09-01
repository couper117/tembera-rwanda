import type { IconName } from "@/components/Icon";

/**
 * What a traveller is here for.
 *
 * Stable ids rather than the labels, because these are going to be joined
 * against categories by the recommendation work later and "Food" typed twice
 * with different capitalisation is a bug waiting to happen. The label is for
 * the reader; the id is for the machine.
 *
 * `categories` is the bridge to the catalogue: it is what turns "I like
 * wildlife" into "show me nature and wonders". Nothing reads it yet, and that
 * is fine — writing it down now is what makes the preference worth collecting
 * at all, rather than a set of pills that decorate a profile.
 */
export interface Interest {
  id: string;
  label: string;
  icon: IconName;
  /** Category ids this interest maps onto, for later recommendation. */
  categories: string[];
}

export const INTERESTS: Interest[] = [
  { id: "nature", label: "Nature", icon: "tree", categories: ["nature"] },
  { id: "food", label: "Food", icon: "utensils", categories: ["dining"] },
  { id: "culture", label: "Culture", icon: "palette", categories: ["arts", "worship"] },
  { id: "adventure", label: "Adventure", icon: "mountain", categories: ["nature", "recreation"] },
  { id: "wildlife", label: "Wildlife", icon: "tree", categories: ["nature"] },
  { id: "history", label: "History", icon: "landmark", categories: ["arts", "wonders"] },
  { id: "photography", label: "Photography", icon: "image", categories: ["wonders", "nature"] },
  { id: "nightlife", label: "Nightlife", icon: "sparkle", categories: ["dining"] },
  { id: "shopping", label: "Shopping", icon: "basket", categories: ["shopping"] },
];

const BY_ID = new Map(INTERESTS.map((i) => [i.id, i]));

export function interestById(id: string): Interest | undefined {
  return BY_ID.get(id);
}

/** Drop anything that is not a known id, so a stale row cannot break a render. */
export function cleanInterests(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out = raw.filter((id): id is string => typeof id === "string" && BY_ID.has(id));
  return [...new Set(out)];
}

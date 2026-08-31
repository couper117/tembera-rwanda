import { CATEGORY_GROUPS, type CategoryGroup } from "@/lib/places/taxonomy";

/**
 * The taxonomy, from the static list in lib/places/taxonomy.ts.
 *
 * Async for the same reason as lib/data/places.ts: every caller awaits it, so
 * the shape survives a real backend being wired in later.
 */
export async function getCategories(): Promise<CategoryGroup[]> {
  return CATEGORY_GROUPS;
}

/**
 * The ids of categories that must not be rated, priced or promoted.
 *
 * Returned as a Set because the ranking functions need a cheap membership test
 * on every place, and because passing the ids (rather than the whole taxonomy)
 * keeps `lib/places/engine.ts` pure.
 */
export async function sensitiveCategoryIds(): Promise<Set<string>> {
  const groups = await getCategories();
  return new Set(groups.filter((g) => g.sensitive).map((g) => g.id));
}

export async function getCategoryMap(): Promise<Map<string, CategoryGroup>> {
  const groups = await getCategories();
  return new Map(groups.map((g) => [g.id, g]));
}

export async function getGroup(id: string): Promise<CategoryGroup | undefined> {
  return (await getCategoryMap()).get(id);
}

export async function groupTitle(id: string): Promise<string> {
  return (await getGroup(id))?.title ?? id;
}

export async function groupLabel(id: string): Promise<string> {
  return (await getGroup(id))?.label ?? id;
}

/* ------------------------------------------------------------------ admin */

export interface AdminSubcategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface AdminCategory {
  id: string;
  label: string;
  title: string;
  icon: string;
  primary: boolean;
  sensitive: boolean;
  sortOrder: number;
  subcategories: AdminSubcategory[];
}

/**
 * The taxonomy in the shape the admin screen renders.
 *
 * The static taxonomy carries subcategories as bare strings and has no sort
 * column, so both are positional here — derived from array order rather than
 * invented. `id` on a subcategory is scoped to its parent so the rename and
 * remove forms still have something unique to submit.
 */
export async function adminCategories(): Promise<AdminCategory[]> {
  const groups = await getCategories();
  return groups.map((group, index) => ({
    id: group.id,
    label: group.label,
    title: group.title,
    icon: group.icon,
    primary: group.primary ?? false,
    sensitive: group.sensitive ?? false,
    sortOrder: index,
    subcategories: group.subcategories.map((name, subIndex) => ({
      id: `${group.id}:${name}`,
      name,
      sortOrder: subIndex,
    })),
  }));
}

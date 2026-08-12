import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { CategoryGroup } from "@/lib/places/taxonomy";

export const CATEGORIES_TAG = "categories";

/**
 * The taxonomy, from the database. Shaped exactly like the old static
 * CATEGORY_GROUPS array so every consumer keeps working — the difference is it
 * is now admin-editable. Cached until an admin edit revalidates the tag.
 */
export const getCategories = unstable_cache(
  async (): Promise<CategoryGroup[]> => {
    const rows = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { subcategories: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
    });
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      title: r.title,
      icon: r.icon,
      primary: r.primary,
      subcategories: r.subcategories.map((s) => s.name),
    }));
  },
  ["categories-list"],
  { tags: [CATEGORIES_TAG] },
);

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

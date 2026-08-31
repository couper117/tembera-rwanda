import "server-only";
import { getCategories } from "@/lib/data/categories";
import { getPlaces } from "@/lib/data/places";
import { isRenderableImage } from "@/lib/places/engine";

/**
 * The home screen's curated "Collections" row. Derived from the categories an
 * admin has flagged `primary`, illustrated with a real image drawn from that
 * category's own listings. Everything here is admin-driven — mark a category
 * primary (or edit its title) and this row follows.
 */
export interface Collection {
  title: string;
  description: string;
  imageUrl: string;
  /**
   * The category this collection stands for. Carried so a card whose image
   * fails to load still falls back to that category's own tint and glyph
   * rather than a flat grey box — `isRenderableImage` can only judge the shape
   * of a URL, not whether it still resolves, and several legacy ones no longer
   * do.
   */
  categoryId: string;
  /** Relative to the site root, e.g. "c/dining". */
  pageLink: string;
  ctaText: string;
}

export async function getCollections(): Promise<Collection[]> {
  try {
    const [groups, places] = await Promise.all([getCategories(), getPlaces()]);
    const out: Collection[] = [];

    for (const group of groups.filter((g) => g.primary)) {
      const inCategory = places.filter((p) => p.categoryId === group.id);
      const image = inCategory.find((p) => isRenderableImage(p.image))?.image;
      if (!image) continue; // only surface collections we can illustrate

      out.push({
        title: group.title,
        description: `${inCategory.length} place${inCategory.length === 1 ? "" : "s"} to explore`,
        imageUrl: image,
        categoryId: group.id,
        pageLink: `c/${group.id}`,
        ctaText: "Explore",
      });
    }

    return out;
  } catch {
    return [];
  }
}

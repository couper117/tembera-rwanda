import type { IconName } from "@/components/Icon";
import { CATEGORY_GROUPS } from "@/lib/places/taxonomy";

/** Category group id -> icon name. */
export function categoryIcon(categoryId: string): IconName {
  const icon = CATEGORY_GROUPS.find((group) => group.id === categoryId)?.icon;
  return (icon as IconName) ?? "pin";
}

/**
 * Per-category colour: a pale chip background with a saturated glyph.
 *
 * Colour here is wayfinding, not decoration — sixteen categories in a grid are
 * far quicker to scan by hue than by reading each label. The pairs are kept at
 * matched lightness so no single tile shouts, and every glyph clears 4.5:1 on
 * its own background.
 */
export interface CategoryColor {
  bg: string;
  fg: string;
}

const COLORS: Record<string, CategoryColor> = {
  dining: { bg: "#fdeee1", fg: "#b45f10" },
  stays: { bg: "#e7effc", fg: "#2159a8" },
  shopping: { bg: "#e4f3e9", fg: "#1d7a45" },
  finance: { bg: "#eeeafd", fg: "#5b3ab0" },
  worship: { bg: "#fdf2d9", fg: "#9a6b06" },
  education: { bg: "#fce8ea", fg: "#b23349" },
  health: { bg: "#dff3ed", fg: "#0d7a68" },
  arts: { bg: "#ddf0f2", fg: "#0f7480" },
  recreation: { bg: "#f0e9fd", fg: "#6c3fbe" },
  sports: { bg: "#e6eefb", fg: "#265f9c" },
  memorials: { bg: "#eaecf0", fg: "#4d5665" },
  safety: { bg: "#e7ebfa", fg: "#33499f" },
  nature: { bg: "#e5f2e4", fg: "#2c7a3c" },
  transport: { bg: "#fdeedd", fg: "#a96313" },
  airports: { bg: "#e2eff8", fg: "#1a6a92" },
  wonders: { bg: "#ebf2e0", fg: "#4a7a1c" },
};

const NEUTRAL: CategoryColor = { bg: "var(--t-surface-2)", fg: "var(--t-ink-2)" };

export function categoryColor(categoryId: string | undefined): CategoryColor {
  return (categoryId && COLORS[categoryId]) || NEUTRAL;
}

/**
 * Background for a place's image placeholder. Most directory entries have no
 * photo, and a grid of identical grey boxes reads as broken; this reuses the
 * category hue, washed out so it sits behind a glyph without competing with
 * the real photographs beside it.
 */
export function categoryTint(categoryId: string | undefined): string {
  return categoryColor(categoryId).bg;
}

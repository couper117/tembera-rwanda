import type { IconName } from "@/components/Icon";

/**
 * Resolve a category's stored icon key (from the DB `Category.icon` field) to a
 * known IconName, falling back to a neutral pin. Category records carry their
 * own icon now, so components pass `group.icon` here rather than looking a
 * hardcoded table up by id.
 */
export function resolveIconName(icon: string | undefined | null): IconName {
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

/* ------------------------------------------------- placeholder gradients */

/**
 * FNV-1a. Small, and — the part that matters — identical on the server and in
 * the browser, so a placeholder picked during SSR is the same one React finds
 * at hydration. Math.random() here would be a hydration mismatch on every
 * card without a photo, which is most of them.
 */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Blend two #rrggbb colours; t = 0 is all of `a`, t = 1 all of `b`. */
function mix(a: string, b: string, t: number): string {
  const channel = (hex: string, at: number) => parseInt(hex.slice(at, at + 2), 16);
  const out = [1, 3, 5]
    .map((at) => Math.round(channel(a, at) * (1 - t) + channel(b, at) * t))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
  return `#${out}`;
}

/** The glyph colour is a token on the neutral category; gradients need a hex. */
const NEUTRAL_HUE = "#55606e";

/**
 * A placeholder for a listing with no photograph.
 *
 * Only 53 of the 495 listings carry an image, so this is not an edge case —
 * it is what most of the grid looks like. A flat grey box with an icon read as
 * a broken image; this is a dark gradient in the category's own hue, angled
 * and shaded from a hash of the listing id so that neighbouring cards differ
 * from each other without anything being random. It stays dark in both themes
 * because the caption and badges sit on top of it in white.
 */
export function placeholderGradient(
  categoryId: string | undefined,
  seed: string,
): string {
  const { fg } = categoryColor(categoryId);
  const hue = fg.startsWith("#") ? fg : NEUTRAL_HUE;
  const h = hash(seed);

  const angle = 115 + (h % 6) * 25;
  const top = mix(hue, "#161b22", 0.46 + ((h >>> 4) % 4) * 0.05);
  const bottom = mix(hue, "#06090d", 0.84);

  return `linear-gradient(${angle}deg, ${top} 0%, ${bottom} 100%)`;
}

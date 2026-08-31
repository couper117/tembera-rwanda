/* eslint-disable @typescript-eslint/no-explicit-any */

/** Map configuration. A plain Google map, framed on Rwanda. */

/** Rwanda's bounding box — used once, to frame the country on first load. */
export const RWANDA_BOUNDS = {
  north: -1.0472,
  south: -2.8401,
  west: 28.8618,
  east: 30.8997,
};

/** Far enough out to see the region, no further. */
export const MIN_ZOOM = 6;
/** Zoom used when the map jumps to a single place. */
export const PLACE_ZOOM = 15;

/**
 * Google's default map, with only its own business pins turned off. Ours are
 * the content here, and two sets of pins on one map is unreadable — everything
 * else (roads, water, parks, place names) stays exactly as Google draws it.
 */
export const MAP_STYLE = [
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
];

/**
 * Marker glyphs, keyed by the same icon names components/Icon.tsx uses — so a
 * category's pin carries the identical symbol as its chip and tile.
 *
 * They are mirrored here rather than imported because Icon.tsx stores them as
 * React nodes, and a marker needs raw markup to inline into an SVG data URI.
 * Keep the two in step if an icon is redrawn. Anything missing falls back to
 * the plain dot below, so an unmapped icon degrades instead of rendering blank.
 */
const GLYPHS: Record<string, string> = {
  utensils:
    '<path d="M7 3.5v6.8a2.5 2.5 0 0 0 5 0V3.5"/><path d="M9.5 10.3V20.5"/><path d="M17.5 3.5c-1.6 1-2.5 2.8-2.5 5v4h4.5"/><path d="M17 12.5v8"/>',
  bed: '<path d="M3.5 19.5V7.5"/><path d="M3.5 12.5h12a5 5 0 0 1 5 5v2"/><path d="M3.5 19.5h17"/><circle cx="8" cy="9.6" r="2"/>',
  basket:
    '<path d="M4 9.5h16l-1.5 9.3a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7z"/><path d="m8.5 9.5 3.5-6 3.5 6"/><path d="M10 13.5v3M14 13.5v3"/>',
  bank: '<path d="m3.5 9.8 8.5-5.6 8.5 5.6"/><path d="M6.2 12v5.6M10 12v5.6M14 12v5.6M17.8 12v5.6"/><path d="M4 20.4h16"/><path d="M3.6 9.8h16.8"/>',
  worship:
    '<path d="M4.5 20.5V10.2L12 4.4l7.5 5.8v10.3"/><path d="M9.4 20.5v-4.7a2.6 2.6 0 0 1 5.2 0v4.7"/><path d="M3 20.5h18"/><path d="M12 1.8v2.6"/>',
  school:
    '<path d="M12 4 2.8 8.6 12 13.2l9.2-4.6z"/><path d="M6.4 10.6v5.2c0 1.7 2.5 3.2 5.6 3.2s5.6-1.5 5.6-3.2v-5.2"/><path d="M21.2 8.6v5.6"/>',
  hospital:
    '<rect x="3.8" y="4.5" width="16.4" height="15.8" rx="2.5"/><path d="M12 9v7M8.5 12.5h7"/>',
  pharmacy: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>',
  palette:
    '<path d="M12 3.4a8.6 8.6 0 0 0 0 17.2c1.3 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8h1.6a4.2 4.2 0 0 0 4.2-4.2c0-3.9-3.9-7-8.6-7z"/><path d="M7.4 12.2h.01M9.4 8.6h.01M13.4 7.8h.01M16.6 10.2h.01"/>',
  dumbbell:
    '<path d="M3.5 9.5v5M6.8 6.8v10.4M17.2 6.8v10.4M20.5 9.5v5"/><path d="M6.8 12h10.4"/>',
  trophy:
    '<path d="M8 4.5h8v4.8a4 4 0 0 1-8 0z"/><path d="M8 6.2H5.6a1 1 0 0 0-1 1v.7a3.4 3.4 0 0 0 3.4 3.4"/><path d="M16 6.2h2.4a1 1 0 0 1 1 1v.7a3.4 3.4 0 0 1-3.4 3.4"/><path d="M12 13.3v3.4"/><path d="M8.6 20.2h6.8l-.7-3.5H9.3z"/>',
  memorial:
    '<path d="M9 20.4V7.6a3 3 0 0 1 6 0v12.8"/><path d="M6 20.4h12"/><path d="M10.6 11.4h2.8"/>',
  shield:
    '<path d="M12 3.2 4.8 6v5.6c0 4.5 3 7.9 7.2 9.2 4.2-1.3 7.2-4.7 7.2-9.2V6z"/><path d="m9 12 2.2 2.2L15.2 10"/>',
  tree: '<path d="M12 3.2 7.2 10h2.6l-3.6 5.4h11.6L14.2 10h2.6z"/><path d="M12 15.4v5.4"/>',
  bus: '<rect x="4" y="4" width="16" height="12.5" rx="2.5"/><path d="M4 10.5h16"/><path d="M7 16.5v2.2M17 16.5v2.2"/><path d="M7.5 13.6h.01M16.5 13.6h.01"/>',
  plane:
    '<path d="M10.4 3.4a1.6 1.6 0 0 1 3.2 0v5.3l7.4 4.3v2.4l-7.4-2.2v4.2l2.4 1.8v1.6L12 19.6l-4 1.2v-1.6l2.4-1.8v-4.2L3 15.4V13l7.4-4.3z"/>',
  mountain:
    '<path d="m2.8 19.4 6.1-10.3 4 6.2 2.1-3.2 6.2 7.3z"/><path d="m8.9 9.1 2.6 4"/><circle cx="17.4" cy="6.4" r="2.1"/>',
  landmark:
    '<path d="m3.5 9.5 8.5-5.8 8.5 5.8"/><path d="M6 10.5v7.5M10 10.5v7.5M14 10.5v7.5M18 10.5v7.5"/><path d="M3.5 20.5h17"/>',
  ticket:
    '<path d="M3.5 8.6V6.8a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v1.8a3.4 3.4 0 0 0 0 6.8v1.8a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-1.8a3.4 3.4 0 0 0 0-6.8z"/><path d="M13.5 5.5v13"/>',
  fuel: '<path d="M4.5 20.5V6a2 2 0 0 1 2-2h4.6a2 2 0 0 1 2 2v14.5"/><path d="M3.5 20.5h11"/><path d="M6.8 7.5h4"/><path d="M13.1 10h3.2a1.8 1.8 0 0 1 1.8 1.8v4.6a1.7 1.7 0 0 0 3.4 0V9.2l-2.4-2.4"/>',
};

/** Neutral ink, for a place whose category carries no colour of its own. */
const FALLBACK_FILL = "#2f2b26";

/**
 * Built icons are shared across markers: there are only ever a couple of dozen
 * distinct combinations (one per category, times selected/not), against
 * hundreds of pins. Rebuilding the data URI per marker is pure waste.
 */
const iconCache = new Map<string, unknown>();

interface PinOptions {
  /** Icon name from the category, resolved by resolveIconName(). */
  icon?: string;
  /** The category's saturated hex. Non-hex values fall back to neutral. */
  color?: string;
  /** Selected, or pointed at from the card rail — drawn larger. */
  active?: boolean;
}

/**
 * A waypoint pin: teardrop in the category's colour, its glyph knocked out in
 * white, with a thin white keyline so pins stay legible where they crowd
 * together. The viewBox is inset by 1.5 on each side to give that keyline room
 * — hence the anchor sitting at 96.2% of the height rather than the bottom.
 */
export function pinIcon(google: any, { icon, color, active = false }: PinOptions) {
  // A CSS custom property means nothing inside a data URI, so anything that
  // isn't a literal hex is treated as "no colour".
  const fill = color?.startsWith("#") ? color : FALLBACK_FILL;
  const glyph = (icon && GLYPHS[icon]) || "";

  const key = `${icon ?? ""}|${fill}|${active}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  // The width/height are not optional: an SVG data URI with no intrinsic size
  // has none to scale from, so the browser falls back to the default 300x150
  // replaced-element box and the pin renders as a giant blob.
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="31" height="39" viewBox="-1.5 -1.5 31 39">' +
    `<path d="M14 0C6.3 0 0 6.3 0 14c0 10 14 22 14 22s14-12 14-22c0-7.7-6.3-14-14-14z" fill="${fill}" stroke="#ffffff" stroke-width="1.6"/>` +
    (glyph
      ? `<g transform="translate(6.5 6.3) scale(0.625)" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>`
      : '<circle cx="14" cy="14" r="5" fill="#ffffff"/>') +
    "</svg>";

  const width = active ? 34 : 26;
  const height = Math.round((width * 39) / 31);
  const built = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(width / 2, height * 0.962),
  };
  iconCache.set(key, built);
  return built;
}

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

/** Teardrop pin, tinted when it is the selected place. */
export function pinIcon(google: any, active: boolean) {
  const fill = active ? "#11694a" : "#2f2b26";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.3 0 0 6.3 0 14c0 10 14 22 14 22s14-12 14-22c0-7.7-6.3-14-14-14z" fill="${fill}"/>
    <circle cx="14" cy="14" r="5" fill="#ffffff"/>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(active ? 30 : 24, active ? 39 : 31),
    anchor: new google.maps.Point(active ? 15 : 12, active ? 39 : 31),
  };
}

/**
 * Loading placeholders shaped like the content they stand in for.
 *
 * These are the default for anything that resolves into a list or grid of
 * places — a shape that matches the result reads as "content is arriving"
 * rather than "something is happening somewhere". The spinner is reserved for
 * waits with no content shape yet (a third-party SDK, a form submission).
 */

export function SkeletonPlaceCard({ variant = "rail" }: { variant?: "rail" | "grid" }) {
  return (
    <div className={`t-place${variant === "grid" ? " t-place--grid" : ""}`} aria-hidden="true">
      <div className="t-skel t-skel--media" />
      <div className="t-place__body">
        <div className="t-skel t-skel--line" style={{ width: "72%" }} />
        <div className="t-skel t-skel--line" style={{ width: "48%", marginTop: 8 }} />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="t-row" aria-hidden="true">
      <div className="t-row__media t-skel" />
      <div className="t-row__body">
        <div className="t-skel t-skel--line" style={{ width: "60%" }} />
        <div className="t-skel t-skel--line" style={{ width: "40%", marginTop: 8 }} />
      </div>
    </div>
  );
}

export function SkeletonRail({ count = 4 }: { count?: number }) {
  return (
    <div className="t-scroller" aria-busy="true" aria-label="Loading places">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonPlaceCard key={i} />
      ))}
    </div>
  );
}

/**
 * Placeholders for the landing page's photo tiles. Same radius, same 16:10
 * box, same grid — so nothing moves when the real cards replace them.
 */
export function SkeletonTiles({ count = 5 }: { count?: number }) {
  return (
    <div className="t-tilegrid" aria-busy="true" aria-label="Loading places">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="t-tile t-skel" aria-hidden="true" />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="t-grid" aria-busy="true" aria-label="Loading places">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonPlaceCard key={i} variant="grid" />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="t-list" aria-busy="true" aria-label="Loading places">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

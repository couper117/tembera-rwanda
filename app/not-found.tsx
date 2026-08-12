import Link from "next/link";
import Icon from "@/components/Icon";

/** Global 404. Kept outside the app shell so it works for any bad URL. */
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "var(--t-6)",
      }}
    >
      <div className="t-state">
        <span className="t-state__icon">
          <Icon name="compass" size={26} />
        </span>
        <h1 className="t-title">We couldn&apos;t find that page</h1>
        <p className="t-state__text">
          The link may be out of date, or the place may no longer be listed.
        </p>
        <div className="t-state__actions">
          <Link href="/" className="t-btn t-btn--primary t-btn--sm">
            Go to Tembera
          </Link>
          <Link href="/search" className="t-btn t-btn--secondary t-btn--sm">
            Search places
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import BottomSheet from "@/components/ui/BottomSheet";
import { useAccount } from "@/lib/client/account";
import { useGroupSummaries } from "@/lib/client/catalogMeta";
import { useSaved } from "@/lib/client/saved";
import CategoryNav from "./CategoryNav";
import CityPicker from "./CityPicker";

/**
 * Compact app bar for top-level screens.
 *
 * Deliberately not a site nav: it carries the things you act on — where you
 * are, search, the category tree, and your saved list. Route navigation lives
 * in the tab bar and the rail.
 */
export default function AppHeader() {
  const scrolled = useScrolled();
  const pathname = usePathname();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const summaries = useGroupSummaries();
  const { ids, ready } = useSaved();
  const { authed, isAdmin } = useAccount();

  const savedCount = ready ? ids.length : 0;

  // Close on route change rather than on click. Unmounting the sheet in the
  // same tick as the click tears the anchor out mid-navigation, which cancels
  // it — the link looked dead on mobile.
  useEffect(() => {
    setCategoriesOpen(false);
  }, [pathname]);

  return (
    <>
      <header className={`t-header${scrolled ? " t-header--bordered" : ""}`}>
        <Link href="/" className="t-header__brand t-hide-desktop">
          <Icon name="pin" size={20} className="t-header__mark" />
          Tembera
        </Link>

        {/* Desktop gets a real search field here — the rail already carries
            the brand, so this is the most useful thing to put in the space. */}
        <Link href="/search" className="t-header__search t-show-desktop">
          <Icon name="search" size={18} />
          <span>Search places, restaurants, hotels…</span>
          <span className="t-searchlink__hint">/</span>
        </Link>

        <div className="t-header__actions">
          <CityPicker />

          <Link href="/search" className="t-iconbtn t-hide-desktop" aria-label="Search">
            <Icon name="search" size={21} />
          </Link>

          <button
            type="button"
            className="t-iconbtn"
            aria-label="Browse categories"
            aria-haspopup="dialog"
            onClick={() => setCategoriesOpen(true)}
          >
            <Icon name="grid" size={20} />
          </button>

          <Link href="/map" className="t-iconbtn t-show-desktop" aria-label="Map">
            <Icon name="map" size={21} />
          </Link>

          <Link
            href="/saved"
            className="t-iconbtn t-show-desktop"
            aria-label={savedCount > 0 ? `Saved (${savedCount})` : "Saved"}
            style={{ position: "relative" }}
          >
            <Icon name="bookmark" size={21} />
            {savedCount > 0 && <span className="t-dot" />}
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="t-iconbtn t-show-desktop"
              aria-label="Admin dashboard"
              title="Admin dashboard"
            >
              <Icon name="lock" size={20} />
            </Link>
          )}

          {authed ? (
            <Link href="/profile" className="t-iconbtn" aria-label="Profile">
              <Icon name="user" size={21} />
            </Link>
          ) : (
            <Link href="/login" className="t-btn t-btn--secondary t-btn--sm">
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* The rail is desktop-only, so this sheet is how phones reach the
          full category tree. */}
      <BottomSheet
        open={categoriesOpen}
        title="Browse categories"
        onClose={() => setCategoriesOpen(false)}
      >
        <CategoryNav summaries={summaries} />
      </BottomSheet>
    </>
  );
}

/** True once the page has scrolled, so the header can grow a hairline border. */
export function useScrolled(threshold = 4): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}

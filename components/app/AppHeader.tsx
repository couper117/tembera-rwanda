"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import BottomSheet from "@/components/ui/BottomSheet";
import Popover from "@/components/ui/Popover";
import { useAccount } from "@/lib/client/account";
import { useGroupSummaries } from "@/lib/client/catalogMeta";
import { useSaved } from "@/lib/client/saved";
import { useTheme } from "@/lib/client/theme";
import {
  EVENT_KIND_META,
  daysBetween,
  formatShortDate,
  getCalendarEvents,
  kindStyleVars,
  nowInKigali,
} from "@/lib/rwanda/events";
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
  const [catPopoverOpen, setCatPopoverOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const catButtonRef = useRef<HTMLButtonElement>(null);
  const summaries = useGroupSummaries();
  const { ids, ready } = useSaved();
  const { authed, isAdmin } = useAccount();
  const { theme, toggleTheme } = useTheme();

  const savedCount = ready ? ids.length : 0;
  const isLanding = pathname === "/";

  /**
   * On the landing page the header search waits until the hero's own search
   * box has scrolled away, then takes its place.
   *
   * Two identical boxes on one screen is one too many, but hiding it outright
   * meant that once you had scrolled past the hero there was no way to search
   * at all without going back up. The threshold is roughly the height of the
   * hero: far enough that the two are never both on screen, close enough that
   * the field is there the moment you want it.
   */
  const pastHero = useScrolled(260);
  const showHeaderSearch = !isLanding || pastHero;

  const today = nowInKigali();
  const upcoming = getCalendarEvents(today.year)
    .filter((e) => e.date >= today.iso)
    .slice(0, 3);
  const soon = upcoming[0] && daysBetween(today.iso, upcoming[0].date) <= 7;

  // Close on route change rather than on click. Unmounting the sheet in the
  // same tick as the click tears the anchor out mid-navigation, which cancels
  // it — the link looked dead on mobile.
  useEffect(() => {
    setCategoriesOpen(false);
    setCatPopoverOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  return (
    <>
      <header className={`t-header${scrolled ? " t-header--bordered" : ""}`}>
        <Link href="/" className="t-header__brand t-hide-desktop">
          <Icon name="pin" size={20} className="t-header__mark" />
          Tembera
        </Link>

        {/* Desktop gets a real search field here — the rail already carries
            the brand, so this is the most useful thing to put in the space.
            Except on the landing page, which has its own search under the
            headline: two identical boxes on one screen is one too many. The
            slot stays, holding a spacer, so the actions still sit right. */}
        {showHeaderSearch ? (
          <Link
            href="/search"
            className={`t-header__search t-show-desktop${
              isLanding ? " t-header__search--arrive" : ""
            }`}
          >
            <Icon name="search" size={18} />
            <span>Search places, restaurants, hotels…</span>
            <span className="t-searchlink__hint">/</span>
          </Link>
        ) : (
          /* The slot stays, holding a spacer, so the actions on the right do
             not jump sideways when the field arrives. */
          <span className="t-header__gap t-show-desktop" aria-hidden="true" />
        )}

        <div className="t-header__actions">
          <span className="t-show-desktop">
            <CityPicker />
          </span>

          <button
            type="button"
            className="t-iconbtn t-show-desktop"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            onClick={toggleTheme}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={20} />
          </button>

          <Link href="/search" className="t-iconbtn t-hide-desktop" aria-label="Search">
            <Icon name="search" size={20} />
          </Link>

          {/* Desktop: the rail already covers navigation, so this is a quick
              dropdown onto the full category tree (with subcategories) that
              the rail trims for space. Anchored under the button — location
              already has its own chip right next to it. */}
          <button
            ref={catButtonRef}
            type="button"
            className="t-iconbtn t-show-desktop"
            aria-label="Browse categories"
            aria-haspopup="dialog"
            aria-expanded={catPopoverOpen}
            onClick={() => setCatPopoverOpen((v) => !v)}
            title="Categories"
          >
            <Icon name="grid" size={20} />
          </button>

          {/* Mobile/tablet: no rail, so this is the only way in — bundles
              location and the full category tree into one sheet. */}
          <button
            type="button"
            className="t-iconbtn t-hide-desktop"
            aria-label="Browse categories and location"
            aria-haspopup="dialog"
            onClick={() => setCategoriesOpen(true)}
            title="Categories & location"
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

          <button
            type="button"
            className="t-iconbtn"
            aria-label="Notifications"
            aria-haspopup="dialog"
            onClick={() => setNotificationsOpen(true)}
            title="Notifications"
            style={{ position: "relative" }}
          >
            <Icon name="bell" size={20} />
            {soon && <span className="t-dot" />}
          </button>

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
              <Icon name="user" size={20} />
            </Link>
          ) : (
            <Link href="/login" className="t-btn t-btn--secondary t-btn--sm">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <Popover open={catPopoverOpen} anchorRef={catButtonRef} onClose={() => setCatPopoverOpen(false)} width={340}>
        <p className="t-label" style={{ marginBottom: "var(--t-3)" }}>
          Categories
        </p>
        <CategoryNav summaries={summaries} />
      </Popover>

      {/* The rail is desktop-only, so this sheet is how phones reach the
          full category tree. */}
      <BottomSheet
        open={categoriesOpen}
        title="Browse categories"
        onClose={() => setCategoriesOpen(false)}
      >
        <div style={{ marginBottom: "var(--t-4)" }}>
          <div className="t-label" style={{ marginBottom: "var(--t-2)" }}>Location</div>
          <CityPicker />
        </div>
        <CategoryNav summaries={summaries} />
      </BottomSheet>

      <BottomSheet
        open={notificationsOpen}
        title="Notifications"
        onClose={() => setNotificationsOpen(false)}
      >
        {upcoming.length === 0 ? (
          <div className="t-state" style={{ padding: "var(--t-6) 0" }}>
            <span className="t-state__icon">
              <Icon name="bell" size={22} />
            </span>
            <div className="t-state__title">You&apos;re all caught up</div>
            <div className="t-state__text">Nothing left on the calendar this year.</div>
          </div>
        ) : (
          <>
            <p className="t-small t-muted" style={{ marginBottom: "var(--t-2)" }}>
              From the Rwanda calendar
            </p>
            <div>
              {upcoming.map((e) => (
                <Link
                  key={e.id}
                  href="/calendar"
                  className="t-cal-event"
                  style={kindStyleVars(e.kind)}
                >
                  <span className="t-cal-event__icon">
                    <Icon name={EVENT_KIND_META[e.kind].icon} size={17} />
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="t-row__name">{e.title}</span>
                    <div className="t-small t-muted" style={{ marginTop: 2 }}>
                      {formatShortDate(e.date)} · {e.summary}
                    </div>
                  </span>
                  <span className="t-badge" style={{ flex: "none" }}>
                    {e.date === today.iso ? "Today" : `${daysBetween(today.iso, e.date)}d`}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
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

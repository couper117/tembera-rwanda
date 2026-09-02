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
import { daysBetween, getCalendarEvents, nowInKigali } from "@/lib/rwanda/events";
import CategoryNav from "./CategoryNav";
import CityPicker from "./CityPicker";
import NotificationsMenu from "./NotificationsMenu";
import SavedMenu from "./SavedMenu";

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
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const catButtonRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const savedButtonRef = useRef<HTMLButtonElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
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
    setAccountOpen(false);
    setSavedOpen(false);
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

          {/* A menu rather than a link: "did I save this place?" used to cost a
              page load and a trip back. The full screen is still one click in. */}
          <button
            ref={savedButtonRef}
            type="button"
            className="t-iconbtn t-show-desktop"
            aria-label={savedCount > 0 ? `Saved (${savedCount})` : "Saved"}
            aria-haspopup="menu"
            aria-expanded={savedOpen}
            title="Saved"
            style={{ position: "relative" }}
            onClick={() => setSavedOpen((v) => !v)}
          >
            <Icon name="bookmark" size={21} />
            {savedCount > 0 && <span className="t-dot" />}
          </button>

          <button
            ref={bellButtonRef}
            type="button"
            className="t-iconbtn"
            aria-label="Notifications"
            aria-haspopup="menu"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((v) => !v)}
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
            /* A menu rather than a link straight to the profile: signing out
               had no button anywhere in the product, and the one place people
               look for it is under their own avatar. */
            <button
              ref={accountButtonRef}
              type="button"
              className="t-iconbtn"
              aria-label="Your account"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((v) => !v)}
            >
              <Icon name="user" size={20} />
            </button>
          ) : (
            <Link href="/login" className="t-btn t-btn--secondary t-btn--sm">
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* Anchored under the avatar, not a centred modal — a sheet in the
          middle of the screen for four links reads as an interruption. */}
      <Popover
        open={accountOpen}
        anchorRef={accountButtonRef}
        onClose={() => setAccountOpen(false)}
        width={248}
      >
        <div className="t-menu" role="menu">
          <Link href="/profile" className="t-menu__item" role="menuitem" onClick={() => setAccountOpen(false)}>
            <Icon name="user" size={17} />
            Your profile
          </Link>
          <Link href="/saved" className="t-menu__item" role="menuitem" onClick={() => setAccountOpen(false)}>
            <Icon name="bookmark" size={17} />
            Saved places
          </Link>
          <Link href="/settings" className="t-menu__item" role="menuitem" onClick={() => setAccountOpen(false)}>
            <Icon name="settings" size={17} />
            Settings
          </Link>

          {/* A real form post, so signing out works without JavaScript and
              cannot be triggered by a link somebody else planted. */}
          <form action="/logout" method="post" className="t-menu__foot">
            <button type="submit" className="t-menu__item t-menu__item--quiet" role="menuitem">
              <Icon name="external" size={17} />
              Sign out
            </button>
          </form>
        </div>
      </Popover>

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

      <Popover
        open={notificationsOpen}
        anchorRef={bellButtonRef}
        onClose={() => setNotificationsOpen(false)}
        width={340}
      >
        <NotificationsMenu
          events={upcoming}
          todayIso={today.iso}
          onNavigate={() => setNotificationsOpen(false)}
        />
      </Popover>

      <Popover
        open={savedOpen}
        anchorRef={savedButtonRef}
        onClose={() => setSavedOpen(false)}
        width={320}
      >
        <SavedMenu onNavigate={() => setSavedOpen(false)} />
      </Popover>
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import { categoryColor, resolveIconName } from "@/components/ui/categoryIcon";
import { useAccount } from "@/lib/client/account";
import { useCategories } from "@/lib/client/categories";
import { useGroupSummaries } from "@/lib/client/catalogMeta";
import { useSaved } from "@/lib/client/saved";
import { useRail } from "./AppShell";

/** Destinations pinned above the category list. */
const PRIMARY: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/explore", label: "Explore", icon: "compass" },
  { href: "/map", label: "Map", icon: "map" },
];

/** …and the personal ones pinned to the bottom. */
const SECONDARY: { href: string; label: string; icon: IconName }[] = [
  { href: "/saved", label: "Saved", icon: "bookmark" },
  { href: "/profile", label: "Profile", icon: "user" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

/**
 * How many category rows are rendered. CSS height queries trim this further on
 * shorter viewports — the rail never scrolls, and whatever doesn't fit stays
 * reachable through "More categories".
 */
const MAX_ROWS = 12;

export default function DesktopRail() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const categories = useCategories();
  const summaries = useGroupSummaries();
  const { ids, ready } = useSaved();
  const { authed, isAdmin } = useAccount();
  const { collapsed, toggle } = useRail();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const counts = new Map(summaries.map((s) => [s.id, s.total]));
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="t-rail" aria-label="Primary">
      <div className="t-rail__brandrow">
        <Link href="/" className="t-rail__brand">
          <Icon name="pin" size={22} />
          <span className="t-rail__brandtext">Tembera</span>
        </Link>

        <button
          type="button"
          className="t-rail__toggle"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon name="panelLeft" size={19} />
        </button>
      </div>

      <nav className="t-rail__nav" aria-label="Main">
        {PRIMARY.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="t-railrow"
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              <span className="t-railrow__glyph">
                <Icon name={item.icon} size={19} />
              </span>
              <span className="t-railrow__label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="t-rail__sep" />

      <p className="t-label t-rail__sectionlabel">Browse categories</p>

      <div className="t-rail__cats">
        {categories.slice(0, MAX_ROWS).map((group) => {
          const color = categoryColor(group.id);
          const active = pathname === `/c/${group.id}`;
          return (
            <Link
              key={group.id}
              href={`/c/${group.id}`}
              className="t-railrow"
              aria-current={active ? "page" : undefined}
              title={collapsed ? group.label : undefined}
            >
              <span
                className="t-railrow__chip"
                style={{ background: color.bg, color: color.fg }}
              >
                <Icon name={resolveIconName(group.icon)} size={15} />
              </span>
              <span className="t-railrow__label">{group.label}</span>
              <span className="t-railrow__count">{counts.get(group.id) ?? 0}</span>
            </Link>
          );
        })}

        <Link
          href="/explore"
          className="t-railrow t-railmore"
          title={collapsed ? "More categories" : undefined}
        >
          <span className="t-railrow__glyph">
            <Icon name="plusDashed" size={18} />
          </span>
          <span className="t-railrow__label">More categories</span>
          <span className="t-railmore__chev">
            <Icon name="chevronRight" size={15} />
          </span>
        </Link>
      </div>

      <Link
        href="/map"
        className="t-railpromo"
        title={collapsed ? "Discover amazing places" : undefined}
      >
        <span className="t-railpromo__art">
          <MapArt />
        </span>
        <span className="t-railpromo__body" style={{ minWidth: 0 }}>
          <span className="t-railpromo__title">Discover amazing places</span>
          <span className="t-railpromo__text">Top-rated locations near you.</span>
        </span>
      </Link>

      <span className="t-rail__gap" />

      <div className="t-rail__foot">
        {SECONDARY.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="t-railrow"
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              <span className="t-railrow__glyph">
                <Icon
                  name={item.icon}
                  size={18}
                  filled={active && item.icon === "bookmark"}
                />
              </span>
              <span className="t-railrow__label">{item.label}</span>
              {mounted && item.href === "/saved" && ready && ids.length > 0 && (
                <span className="t-railrow__count">{ids.length}</span>
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className="t-railrow"
            title={collapsed ? "Admin dashboard" : undefined}
          >
            <span className="t-railrow__glyph">
              <Icon name="lock" size={18} />
            </span>
            <span className="t-railrow__label">Admin</span>
          </Link>
        )}

        {!authed && (
          <Link
            href="/login"
            className="t-railrow"
            title={collapsed ? "Sign in" : undefined}
          >
            <span className="t-railrow__glyph">
              <Icon name="user" size={18} />
            </span>
            <span className="t-railrow__label">Sign in</span>
          </Link>
        )}
      </div>
    </aside>
  );
}

/** Small folded-map illustration for the promo card. */
function MapArt() {
  return (
    <svg width="44" height="34" viewBox="0 0 52 42" fill="none" aria-hidden="true">
      <path d="M2 9.5 18 4v29L2 38.5z" fill="#dcece1" />
      <path d="M18 4l16 5.5v29L18 33z" fill="#c9e2d2" />
      <path d="M34 9.5 50 4v29l-16 5.5z" fill="#dcece1" />
      <g stroke="#ffffff" strokeWidth="1.2" opacity="0.9">
        <path d="M9 6.5v29M26 6.5v29M42 6.5v29" />
        <path d="M2.5 20h47" />
      </g>
      <path
        d="M26 9.5c-4 0-7.2 3.2-7.2 7.2 0 5.4 7.2 12.3 7.2 12.3s7.2-6.9 7.2-12.3c0-4-3.2-7.2-7.2-7.2z"
        fill="#11694a"
      />
      <circle cx="26" cy="16.6" r="2.6" fill="#fff" />
    </svg>
  );
}

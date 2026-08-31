"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Icon from "@/components/Icon";
import UserMenu from "@/components/admin/UserMenu";
import DashboardBottomNav from "@/components/admin/DashboardBottomNav";
import { useTheme } from "@/lib/client/theme";
import { ADMIN_NAV, adminPageTitle, adminSectionTitle } from "./adminNav";

const KEY = "tembera.adminrail";

interface ShellValue {
  collapsed: boolean;
  toggle: () => void;
}

const ShellContext = createContext<ShellValue>({ collapsed: false, toggle: () => {} });

export function useAdminRail(): ShellValue {
  return useContext(ShellContext);
}

interface Props {
  email: string;
  name: string;
  /** Drives which nav rows are shown. Not a permission — see adminNav.ts. */
  role: "ADMIN" | "EDITOR" | "USER" | "BUSINESS";
  /** Live counts for the queue badges. */
  counts: { submissions: number; reports: number };
  children: ReactNode;
}

/**
 * The admin chrome: a grouped sidebar and a topbar, mounted once by the
 * (dash) layout rather than re-wrapped by every page as the old shell was.
 *
 * The collapse behaviour and its storage key mirror the public app's rail
 * (components/app/AppShell.tsx) so the two halves of the product feel like one.
 */
export default function AdminShell({ email, name, role, counts, children }: Props) {
  const pathname = usePathname();

  // The nav group the current page sits in, so the bar says "Catalogue /
  // Places" rather than repeating the heading below it.
  const pageTitle = adminPageTitle(pathname);
  const sectionTitle = adminSectionTitle(pathname);
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) === "collapsed") setCollapsed(true);
    } catch {
      // Storage unavailable — start expanded.
    }
  }, []);

  // A route change means the drawer has done its job on mobile.
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(KEY, next ? "collapsed" : "expanded");
      } catch {
        // Non-fatal: the choice just won't persist.
      }
      return next;
    });
  }, []);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <ShellContext.Provider value={{ collapsed, toggle }}>
      <div className="a-shell" data-rail={collapsed ? "collapsed" : "expanded"}>
        {/* Tapping away closes the mobile drawer. */}
        {drawer && (
          <button
            type="button"
            className="a-scrim"
            aria-label="Close navigation"
            onClick={() => setDrawer(false)}
          />
        )}

        <aside className="a-side" data-open={drawer || undefined} aria-label="Admin">
          <div className="a-side__brand">
            <Link href="/admin" className="a-brand">
              <span className="a-brand__mark">
                <Icon name="pin" size={18} />
              </span>
              <span className="a-brand__text">
                Tembera
                <span className="a-brand__sub">Admin</span>
              </span>
            </Link>
            <button
              type="button"
              className="a-side__toggle t-show-desktop"
              onClick={toggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              <Icon name="panelLeft" size={18} />
            </button>
          </div>

          <nav className="a-side__nav">
            {ADMIN_NAV.map((group) => {
              const items = group.items.filter(
                (item) => !item.adminOnly || role === "ADMIN",
              );
              if (items.length === 0) return null;
              return (
              <div key={group.title} className="a-navgroup">
                <p className="a-navgroup__title">{group.title}</p>
                {items.map((item) => {
                  const count = item.badge ? counts[item.badge] : 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="a-navrow"
                      aria-current={isActive(item.href) ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="a-navrow__glyph">
                        <Icon name={item.icon} size={18} />
                      </span>
                      <span className="a-navrow__label">{item.label}</span>
                      {count > 0 && <span className="a-navrow__count">{count}</span>}
                    </Link>
                  );
                })}
              </div>
              );
            })}
          </nav>

          <div className="a-side__foot">
            <Link href="/" className="a-navrow" title={collapsed ? "Back to site" : undefined}>
              <span className="a-navrow__glyph">
                <Icon name="external" size={18} />
              </span>
              <span className="a-navrow__label">Back to site</span>
            </Link>
          </div>
        </aside>

        <div className="a-body">
          <header className="a-topbar">
            <button
              type="button"
              className="t-iconbtn t-hide-desktop"
              onClick={() => setDrawer(true)}
              aria-label="Open navigation"
            >
              <Icon name="list" size={20} />
            </button>

            {/* The section, then the page. Two lines rather than one word, so
                the bar says where you are rather than merely repeating the
                heading below it. */}
            <div className="a-topbar__where">
              <span className="a-topbar__section">{sectionTitle}</span>
              <h1 className="a-topbar__title">{pageTitle}</h1>
            </div>

            <div className="a-topbar__tools">
              {/* Narrower than it was, and pushed right. It only ever searches
                  the catalogue, so it should not sit at the centre of every
                  screen as though it searched everything. */}
              <form action="/admin/places" method="get" className="a-search t-show-desktop">
                <Icon name="search" size={15} />
                <input
                  type="search"
                  name="q"
                  placeholder="Search the catalogue…"
                  aria-label="Search places"
                />
              </form>

              <Link
                href="/admin/submissions"
                className="a-topbar__icon"
                aria-label={
                  counts.submissions > 0
                    ? `${counts.submissions} submissions awaiting review`
                    : "Submissions"
                }
              >
                <Icon name="bell" size={18} />
                {counts.submissions > 0 && (
                  <span className="a-topbar__badge">{counts.submissions}</span>
                )}
              </Link>

              <button
                type="button"
                className="a-topbar__icon"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
              >
                <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
              </button>

              <span className="a-topbar__rule" aria-hidden="true" />

              <UserMenu name={name} email={email} role={role} />
            </div>
          </header>

          <main className="a-main">{children}</main>
        </div>

        {/*
          The drawer still holds all twelve screens. This is the handful that
          staff move between constantly, put where a thumb can reach them.
        */}
        <DashboardBottomNav
          items={[
            { href: "/admin", label: "Home", icon: "grid" },
            { href: "/admin/places", label: "Places", icon: "pin" },
            {
              href: "/admin/submissions",
              label: "Queue",
              icon: "mail",
              badge: counts.submissions,
            },
            { href: "/admin/reports", label: "Reports", icon: "alert", badge: counts.reports },
            { href: "/admin/categories", label: "Types", icon: "list" },
          ]}
        />
      </div>
    </ShellContext.Provider>
  );
}

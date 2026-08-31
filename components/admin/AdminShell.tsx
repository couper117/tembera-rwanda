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
import { useTheme } from "@/lib/client/theme";
import { ADMIN_NAV, adminPageTitle } from "./adminNav";

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
  counts: { submissions: number };
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

            <h1 className="a-topbar__title">{adminPageTitle(pathname)}</h1>

            <form action="/admin/places" method="get" className="a-search t-show-desktop">
              <Icon name="search" size={16} />
              <input
                type="search"
                name="q"
                placeholder="Search places…"
                aria-label="Search places"
              />
            </form>

            <Link
              href="/admin/submissions"
              className="t-iconbtn"
              aria-label={`${counts.submissions} submissions awaiting review`}
              style={{ position: "relative" }}
            >
              <Icon name="bell" size={19} />
              {counts.submissions > 0 && <span className="t-dot" />}
            </Link>

            <button
              type="button"
              className="t-iconbtn"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
            </button>

            <div className="a-who">
              <span className="a-who__text">
                <span className="a-who__name">{name}</span>
                <span className="a-who__mail">{email}</span>
              </span>
              <form action="/logout" method="post">
                <input type="hidden" name="redirectTo" value="/admin/login" />
                <button type="submit" className="t-iconbtn" aria-label="Sign out">
                  <Icon name="lock" size={18} />
                </button>
              </form>
            </div>
          </header>

          <main className="a-main">{children}</main>
        </div>
      </div>
    </ShellContext.Provider>
  );
}

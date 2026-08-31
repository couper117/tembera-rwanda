"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";

export interface BottomNavItem {
  href: string;
  label: string;
  icon: IconName;
  /** A count to show on the tab, when there is work waiting behind it. */
  badge?: number;
}

/**
 * The dashboard navigation on a phone.
 *
 * A sidebar behind a hamburger is a desktop pattern wearing a phone costume:
 * every navigation costs two taps and hides where you are. A bottom bar is
 * what a phone user already knows, it is reachable by thumb, and it shows the
 * current screen without being opened. The public site already works this way.
 *
 * Deliberately capped at five: past that the targets get too narrow to hit,
 * and anything that does not earn a tab lives behind "More" in the drawer.
 */
export default function DashboardBottomNav({ items }: { items: BottomNavItem[] }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    // The root of each dashboard would otherwise match every path beneath it.
    const roots = ["/admin", "/business/dashboard"];
    if (roots.includes(href)) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="a-bottomnav" aria-label="Sections">
      {items.slice(0, 5).map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="a-bottomnav__item"
            aria-current={active ? "page" : undefined}
          >
            <span className="a-bottomnav__glyph">
              <Icon name={item.icon} size={21} />
              {item.badge ? (
                <span className="a-bottomnav__badge">{item.badge > 99 ? "99+" : item.badge}</span>
              ) : null}
            </span>
            <span className="a-bottomnav__label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

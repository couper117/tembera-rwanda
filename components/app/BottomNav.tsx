"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import { useSaved } from "@/lib/client/saved";
import { NAV_ITEMS, activeNavHref } from "./navItems";

/** Mobile tab bar. Hidden at desktop widths, where the rail takes over. */
export default function BottomNav() {
  const pathname = usePathname();
  const active = activeNavHref(pathname);
  const { ids, ready } = useSaved();

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <nav className="t-bottomnav" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === active;
        const showDot = item.href === "/saved" && ready && ids.length > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="t-bottomnav__item"
            aria-current={isActive ? "page" : undefined}
          >
            <span className="t-bottomnav__icon">
              <Icon
                name={item.icon}
                size={22}
                filled={isActive && item.icon === "bookmark"}
              />
              {showDot && <span className="t-dot" style={{ top: -2, right: -4 }} />}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

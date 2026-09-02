import type { IconName } from "@/components/Icon";

/**
 * The app's primary destinations. Every entry maps to a screen that actually
 * exists and does something — no placeholder tabs.
 */
export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/explore", label: "Explore", icon: "compass" },
  { href: "/business", label: "For business", icon: "briefcase" },
  { href: "/map", label: "Map", icon: "map" },
  { href: "/saved", label: "Saved", icon: "bookmark" },
  { href: "/profile", label: "Profile", icon: "user" },
];

/** Which tab should light up for a given path. */
export function activeNavHref(pathname: string): string | undefined {
  if (pathname === "/") return "/";
  if (pathname.startsWith("/business")) return "/business";
  // Category, city and place screens all live under Explore.
  if (
    pathname.startsWith("/explore") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/city/") ||
    pathname.startsWith("/place/") ||
    pathname.startsWith("/search")
  ) {
    return "/explore";
  }
  // Settings has no tab of its own; it lives under Profile.
  if (pathname.startsWith("/settings")) return "/profile";

  const match = NAV_ITEMS.find(
    (item) => item.href !== "/" && pathname.startsWith(item.href),
  );
  return match?.href;
}

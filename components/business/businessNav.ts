import type { IconName } from "@/components/Icon";

export interface BusinessNavItem {
  href: string;
  label: string;
  icon: IconName;
}

/**
 * Flat, not grouped. A business has six screens; the admin's five nav groups
 * exist because it has twelve.
 */
export const BUSINESS_NAV: BusinessNavItem[] = [
  { href: "/business/dashboard", label: "Overview", icon: "grid" },
  { href: "/business/dashboard/listings", label: "My listings", icon: "pin" },
  { href: "/business/dashboard/reviews", label: "Reviews", icon: "star" },
  { href: "/business/dashboard/staff", label: "Team", icon: "user" },
  { href: "/business/dashboard/settings", label: "Business details", icon: "settings" },
];

export function businessPageTitle(pathname: string): string {
  const match = BUSINESS_NAV.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Business";
}

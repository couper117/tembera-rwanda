import type { IconName } from "@/components/Icon";

/**
 * The admin's own navigation, grouped by the job being done rather than by the
 * table being edited. A government reviewer opens this app to clear a queue;
 * that work sits at the top, and the catalogue maintenance below it.
 */
export interface AdminNavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Which count, if any, rides on this row as a badge. */
  badge?: "submissions" | "bookings";
  /** Nothing behind it yet — shown, but marked as sample data. */
  sample?: boolean;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: "grid" }],
  },
  {
    title: "Requests",
    items: [
      {
        href: "/admin/submissions",
        label: "Submissions",
        icon: "mail",
        badge: "submissions",
        sample: true,
      },
      { href: "/admin/bookings", label: "Bookings", icon: "ticket", badge: "bookings" },
      { href: "/admin/reports", label: "Reports", icon: "alert" },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/places", label: "Places", icon: "pin" },
      { href: "/admin/categories", label: "Categories", icon: "list" },
      { href: "/admin/cities", label: "Cities", icon: "map" },
    ],
  },
  {
    title: "Community",
    items: [
      { href: "/admin/businesses", label: "Businesses", icon: "basket", sample: true },
      { href: "/admin/reviews", label: "Reviews", icon: "star" },
      { href: "/admin/users", label: "Users", icon: "user" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/chatbot", label: "AI Assistant", icon: "sparkle" },
      { href: "/admin/calendar", label: "Calendar", icon: "calendar" },
      { href: "/admin/activity", label: "Activity", icon: "clock", sample: true },
      { href: "/admin/settings", label: "Settings", icon: "settings", sample: true },
    ],
  },
];

/** The title shown in the topbar for the current path. */
export function adminPageTitle(pathname: string): string {
  const all = ADMIN_NAV.flatMap((group) => group.items);
  // Longest match wins, so /admin/places/new resolves to Places rather than
  // Dashboard, which every path starts with.
  const match = all
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Admin";
}

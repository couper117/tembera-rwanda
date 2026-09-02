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
  badge?: "submissions" | "reports";
  /**
   * Hide the row from an EDITOR. Presentation only — the screen and its
   * actions enforce the same rule with requireAdmin(), which is where the
   * permission actually lives. Never rely on this alone.
   */
  adminOnly?: boolean;
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
      },
      { href: "/admin/reports", label: "Reports", icon: "alert", badge: "reports" },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/places", label: "Places", icon: "pin" },
      // Sits with the catalogue rather than under Requests: nobody filed
      // these, and they are maintenance on what is already published.
      { href: "/admin/quality", label: "Quality", icon: "shield" },
      { href: "/admin/categories", label: "Categories", icon: "list" },
      { href: "/admin/cities", label: "Cities", icon: "map" },
    ],
  },
  {
    title: "Community",
    items: [
      {
        href: "/admin/businesses",
        label: "Businesses",
        icon: "basket",
        adminOnly: true,
      },
      { href: "/admin/reviews", label: "Reviews", icon: "star" },
      { href: "/admin/users", label: "Users", icon: "user", adminOnly: true },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/chatbot", label: "AI Assistant", icon: "sparkle" },
      { href: "/admin/calendar", label: "Calendar", icon: "calendar" },
      { href: "/admin/activity", label: "Activity", icon: "clock" },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: "settings",
        adminOnly: true,
      },
    ],
  },
];

/**
 * The nav item for the current path.
 *
 * Longest match wins. Every admin path begins with /admin, so a plain
 * startsWith would resolve /admin/places to Dashboard.
 */
function matchNav(pathname: string) {
  let best: { group: AdminNavGroup; item: AdminNavItem } | null = null;
  for (const group of ADMIN_NAV) {
    for (const item of group.items) {
      const hit = pathname === item.href || pathname.startsWith(`${item.href}/`);
      if (!hit) continue;
      if (!best || item.href.length > best.item.href.length) best = { group, item };
    }
  }
  return best;
}

/** The page name shown in the topbar. */
export function adminPageTitle(pathname: string): string {
  return matchNav(pathname)?.item.label ?? "Admin";
}

/** The nav group it sits in — "Catalogue", "Requests" — shown above the title. */
export function adminSectionTitle(pathname: string): string {
  return matchNav(pathname)?.group.title ?? "Admin";
}

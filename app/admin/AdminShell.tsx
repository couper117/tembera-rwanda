"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";
import styles from "./admin.module.css";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/places", label: "Places" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/cities", label: "Cities" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/users", label: "Users" },
];

/**
 * The admin chrome: sidebar nav + logout, wrapping page content. Used by every
 * page except /admin/login. A client component so it can highlight the active
 * link, but it renders server-provided children as-is.
 */
export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Tembera Admin</div>
        <nav className={styles.nav}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${
                isActive(item.href, item.exact) ? styles.navLinkActive : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFoot}>
          <div className={styles.who}>{email}</div>
          <form action={logout}>
            <button type="submit" className={styles.logoutBtn}>
              Log out
            </button>
          </form>
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

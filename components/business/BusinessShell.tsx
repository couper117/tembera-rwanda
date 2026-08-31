"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import UserMenu from "@/components/admin/UserMenu";
import { BUSINESS_NAV, businessPageTitle } from "./businessNav";

/**
 * The chrome around the business dashboard.
 *
 * Reuses the admin's stylesheet and its account menu on purpose. These are two
 * audiences, not two products — a second design system would be a second thing
 * to keep in step, and the person who builds one is not the person who
 * notices when they drift.
 *
 * Simpler than the admin's: a flat nav, no queue badges, no catalogue search.
 * A business has its own listings and nothing else to look through.
 */
export default function BusinessShell({
  businessName,
  status,
  name,
  email,
  role,
  children,
}: {
  businessName: string;
  status: "unverified" | "verified" | "suspended";
  name: string;
  email: string;
  role: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/business/dashboard"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <div className="a-shell">
      <aside className="a-side">
        <div className="a-side__head">
          <Link href="/business/dashboard" className="a-brand">
            <span className="a-brand__mark">
              <Icon name="basket" size={18} />
            </span>
            <span className="a-brand__text">
              {businessName}
              <span className="a-brand__sub">Business</span>
            </span>
          </Link>
        </div>

        <nav className="a-side__nav">
          <div className="a-navgroup">
            {BUSINESS_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="a-navrow"
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                <span className="a-navrow__glyph">
                  <Icon name={item.icon} size={18} />
                </span>
                <span className="a-navrow__label">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="a-side__foot">
          <Link href="/" className="a-navrow">
            <span className="a-navrow__glyph">
              <Icon name="external" size={18} />
            </span>
            <span className="a-navrow__label">Back to site</span>
          </Link>
        </div>
      </aside>

      <div className="a-body">
        <header className="a-topbar">
          <div className="a-topbar__where">
            <span className="a-topbar__section">{businessName}</span>
            <h1 className="a-topbar__title">{businessPageTitle(pathname)}</h1>
          </div>

          <div className="a-topbar__tools">
            {/*
              Standing is shown in the chrome, not buried in settings: it
              decides whether an edit goes live or waits for review, so it has
              to be visible on the screen where the edit is made.
            */}
            {status !== "verified" && (
              <span
                className={`a-badge ${status === "suspended" ? "a-badge--bad" : "a-badge--warn"}`}
                title={
                  status === "suspended"
                    ? "This account cannot publish. Contact Tembera."
                    : "Your changes are reviewed before they go live."
                }
              >
                {status}
              </span>
            )}
            <UserMenu name={name} email={email} role={role} />
          </div>
        </header>

        <main className="a-main">{children}</main>
      </div>
    </div>
  );
}

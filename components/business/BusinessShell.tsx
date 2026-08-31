"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import UserMenu from "@/components/admin/UserMenu";
import DashboardBottomNav from "@/components/admin/DashboardBottomNav";
import { BUSINESS_NAV, businessPageTitle } from "./businessNav";

/**
 * The chrome around the business dashboard.
 *
 * Reuses the admin's stylesheet, its account menu and its bottom bar on
 * purpose. These are two audiences, not two products — a second design system
 * would be a second thing to keep in step, and the person who builds one is
 * not the person who notices when they drift.
 */
export default function BusinessShell({
  businessName,
  status,
  plan,
  listings,
  pending,
  name,
  email,
  role,
  children,
}: {
  businessName: string;
  status: "unverified" | "verified" | "suspended";
  plan: string;
  listings: number;
  pending: number;
  name: string;
  email: string;
  role: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/business/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="a-shell">
      <aside className="a-side">
        <div className="a-side__brand">
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

          {/*
            Five nav items left most of the sidebar empty. This fills it with
            the thing a business actually wants to know — where it stands and
            what is outstanding — rather than padding.
          */}
          <div className="a-sidecard">
            <p className="a-sidecard__title">Your account</p>
            <dl className="a-sidecard__rows">
              <div>
                <dt>Standing</dt>
                <dd>
                  <span
                    className={`a-badge${
                      status === "verified"
                        ? " a-badge--good"
                        : status === "suspended"
                          ? " a-badge--bad"
                          : " a-badge--warn"
                    }`}
                  >
                    {status}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Plan</dt>
                <dd>{plan}</dd>
              </div>
              <div>
                <dt>Listings</dt>
                <dd>{listings}</dd>
              </div>
              <div>
                <dt>Awaiting review</dt>
                <dd>{pending}</dd>
              </div>
            </dl>

            {status === "unverified" && (
              <Link
                href="/business/dashboard/settings"
                className="t-btn t-btn--secondary t-btn--sm t-btn--block"
              >
                Get verified
              </Link>
            )}
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
            {/* The header was empty across its whole middle. The one action a
                business is here to take belongs in it. */}
            <Link
              href="/business/dashboard/listings/new"
              className="t-btn t-btn--primary t-btn--sm t-show-desktop"
            >
              <Icon name="plus" size={15} />
              Propose a listing
            </Link>

            <Link
              href="/"
              className="a-topbar__icon t-show-desktop"
              aria-label="View the public site"
              title="View the public site"
            >
              <Icon name="external" size={18} />
            </Link>

            {/* Standing decides whether an edit publishes or waits, so it is
                shown in the chrome rather than buried in settings. */}
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

            <span className="a-topbar__rule t-show-desktop" aria-hidden="true" />
            <UserMenu name={name} email={email} role={role} />
          </div>
        </header>

        <main className="a-main">{children}</main>
      </div>

      <DashboardBottomNav
        items={BUSINESS_NAV.map((item) => ({
          href: item.href,
          label: item.label === "Business details" ? "Details" : item.label,
          icon: item.icon,
        }))}
      />
    </div>
  );
}

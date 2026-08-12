"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import { categoryColor, resolveIconName } from "@/components/ui/categoryIcon";
import { useCategories } from "@/lib/client/categories";
import type { GroupSummary } from "@/lib/places/catalog";

interface Props {
  /** Counts computed on the server — the client never loads the catalog. */
  summaries: GroupSummary[];
}

/**
 * The full two-level category tree.
 *
 * A group row is a link to its page; the chevron beside it expands the
 * subcategories in place rather than navigating, so browsing the tree never
 * costs a page load. Subcategories with no listings are shown but disabled —
 * the taxonomy stays legible without pretending the data is there.
 */
export default function CategoryNav({ summaries }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categories = useCategories();

  const activeGroup = pathname.startsWith("/c/") ? pathname.slice(3) : null;
  const activeType = searchParams.get("type");

  // The active group starts open so the current filter is visible in context.
  const [expanded, setExpanded] = useState<string | null>(activeGroup);

  const byId = new Map(summaries.map((s) => [s.id, s]));

  return (
    <div className="t-catnav">
      {categories.map((group) => {
        const summary = byId.get(group.id);
        const isActive = activeGroup === group.id;
        const isOpen = expanded === group.id;

        return (
          <div key={group.id} className="t-catnav__group">
            <div className={`t-catnav__row${isActive && !activeType ? " t-catnav__row--active" : ""}`}>
              <Link
                href={`/c/${group.id}`}
                className="t-catnav__link"
                aria-current={isActive && !activeType ? "page" : undefined}
              >
                <span
                  className="t-catnav__icon"
                  style={{
                    background: categoryColor(group.id).bg,
                    color: categoryColor(group.id).fg,
                  }}
                >
                  <Icon name={resolveIconName(group.icon)} size={18} />
                </span>
                <span className="t-catnav__label">{group.label}</span>
                <span className="t-catnav__count">{summary?.total ?? 0}</span>
              </Link>

              <button
                type="button"
                className={`t-catnav__toggle${isOpen ? " t-catnav__toggle--open" : ""}`}
                aria-expanded={isOpen}
                aria-label={`${isOpen ? "Hide" : "Show"} ${group.label} subcategories`}
                onClick={() => setExpanded(isOpen ? null : group.id)}
              >
                <Icon name="chevronRight" size={15} />
              </button>
            </div>

            {isOpen && (
              <ul className="t-catnav__subs">
                {group.subcategories.map((sub) => {
                  const count =
                    summary?.subcategories.find((s) => s.name === sub)?.count ?? 0;
                  const selected = isActive && activeType === sub;

                  if (count === 0) {
                    return (
                      <li key={sub}>
                        <span className="t-catnav__sub t-catnav__sub--empty">
                          {sub}
                          <span className="t-catnav__count">0</span>
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={sub}>
                      <Link
                        href={`/c/${group.id}?type=${encodeURIComponent(sub)}`}
                        className={`t-catnav__sub${selected ? " t-catnav__sub--active" : ""}`}
                        aria-current={selected ? "page" : undefined}
                      >
                        {sub}
                        <span className="t-catnav__count">{count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

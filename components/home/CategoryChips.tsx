"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import BottomSheet from "@/components/ui/BottomSheet";
import CategoryNav from "@/components/app/CategoryNav";
import { categoryColor, resolveIconName } from "@/components/ui/categoryIcon";
import { useCategories } from "@/lib/client/categories";
import { useGroupSummaries } from "@/lib/client/catalogMeta";

interface Props {
  /** Currently filtered category, or null for everything. */
  active: string | null;
  onChange: (categoryId: string | null) => void;
}

/**
 * The category row, sitting directly under the search box.
 *
 * This replaced a whole "Explore" section — a heading, a subtitle, a link and
 * six large tiles that each said "N places". A chip carries the same three
 * facts (icon, name, count) in a quarter of the height, and unlike the tiles
 * it does something here rather than navigating away: tapping one filters the
 * rows below.
 *
 * Only the primary categories get a chip. The rest stay one tap away behind
 * "+ N more", which opens the full tree — the same sheet the header uses.
 */
export default function CategoryChips({ active, onChange }: Props) {
  const categories = useCategories();
  const summaries = useGroupSummaries();
  const [sheetOpen, setSheetOpen] = useState(false);

  const counts = new Map(summaries.map((s) => [s.id, s.total]));
  const primary = categories.filter((group) => group.primary);
  const remaining = categories.length - primary.length;

  return (
    <>
      <div className="t-chiprow t-catchips" role="group" aria-label="Filter by category">
        {primary.map((group) => {
          const color = categoryColor(group.id);
          const selected = active === group.id;
          return (
            <button
              key={group.id}
              type="button"
              className="t-chip t-catchip"
              // Pressing the active chip again clears the filter, so there is
              // always a way back to everything without hunting for an "All".
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : group.id)}
            >
              <span
                className="t-catchip__icon"
                style={{ background: color.bg, color: color.fg }}
              >
                <Icon name={resolveIconName(group.icon)} size={15} />
              </span>
              <span>{group.label}</span>
              <span className="t-chip__count">{counts.get(group.id) ?? 0}</span>
            </button>
          );
        })}

        {remaining > 0 && (
          <button
            type="button"
            className="t-chip t-catchip t-catchip--ghost"
            aria-haspopup="dialog"
            onClick={() => setSheetOpen(true)}
          >
            <Icon name="plusDashed" size={15} />
            <span>{remaining} more</span>
          </button>
        )}
      </div>

      <BottomSheet
        open={sheetOpen}
        title="All categories"
        onClose={() => setSheetOpen(false)}
      >
        <CategoryNav summaries={summaries} />
      </BottomSheet>
    </>
  );
}

import Link from "next/link";
import Icon from "@/components/Icon";
import { categoryColor, categoryIcon } from "@/components/ui/categoryIcon";
import type { CategoryGroup } from "@/lib/places/taxonomy";

interface Props {
  category: CategoryGroup;
  count?: number;
}

export default function CategoryTile({ category, count }: Props) {
  const color = categoryColor(category.id);

  return (
    <Link href={`/c/${category.id}`} className="t-cattile">
      <span
        className="t-cattile__icon"
        style={{ background: color.bg, color: color.fg }}
      >
        <Icon name={categoryIcon(category.id)} size={20} />
      </span>
      <span>
        <span className="t-cattile__label">{category.label}</span>
        {count !== undefined && (
          <span className="t-cattile__count">
            {count} {count === 1 ? "place" : "places"}
          </span>
        )}
      </span>
    </Link>
  );
}

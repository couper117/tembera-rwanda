import Link from "next/link";
import Icon from "@/components/Icon";

interface Props {
  title: string;
  subtitle?: string;
  /** Optional "see all" affordance. */
  actionLabel?: string;
  actionHref?: string;
  /** Heading level, so screens keep a sane document outline. */
  as?: "h2" | "h3";
}

export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
  as: Tag = "h2",
}: Props) {
  return (
    <div className="t-sectionhead">
      <div className="t-sectionhead__text">
        <Tag className="t-heading">{title}</Tag>
        {subtitle && <p className="t-sectionhead__sub">{subtitle}</p>}
      </div>

      {actionLabel && actionHref && (
        <Link href={actionHref} className="t-sectionhead__link">
          {actionLabel}
          <Icon name="chevronRight" size={15} />
        </Link>
      )}
    </div>
  );
}

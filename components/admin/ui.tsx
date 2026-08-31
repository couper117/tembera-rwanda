import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";

/** Page heading plus its actions — the same shape on every admin screen. */
export function PageHead({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="a-head">
      <div className="a-head__text">
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="a-head__actions">{actions}</div>}
    </div>
  );
}

/**
 * Marks a screen whose figures come from lib/admin/placeholder.ts. Sample data
 * that looks live is worse than no data, and this dashboard is being shown to
 * a buyer — nobody should mistake a mock queue for a real one.
 */
export function SampleNotice({ what }: { what: string }) {
  return (
    <p className="a-sample">
      <Icon name="info" size={16} />
      <span>
        <strong>Sample data.</strong> {what} has no table yet, so this screen is
        laid out against the records it will hold.
      </span>
    </p>
  );
}

export function Panel({
  title,
  action,
  children,
  flush,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  /** Content brings its own padding (tables, queues). */
  flush?: boolean;
}) {
  return (
    <section className="a-panel">
      <div className="a-panel__head">
        <h3 className="a-panel__title">{title}</h3>
        {action}
      </div>
      {flush ? children : <div className="a-panel__body">{children}</div>}
    </section>
  );
}

type Tone = "good" | "warn" | "bad" | "neutral";

const TONES: Record<string, Tone> = {
  approved: "good",
  confirmed: "good",
  resolved: "good",
  verified: "good",
  published: "good",
  pending: "warn",
  unverified: "warn",
  open: "warn",
  draft: "warn",
  rejected: "bad",
  cancelled: "bad",
  suspended: "bad",
  dismissed: "bad",
  // Neutral on purpose: an archived listing is a decision that was taken, not
  // a problem to be fixed. Colouring it red would put a row of alarms in front
  // of an editor who is doing nothing wrong.
  archived: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONES[status] ?? "neutral";
  return (
    <span className={`a-badge${tone === "neutral" ? "" : ` a-badge--${tone}`}`}>
      {status}
    </span>
  );
}

export function Stat({
  label,
  value,
  icon,
  note,
  href,
}: {
  label: string;
  value: number | string;
  icon: IconName;
  note?: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="a-stat__top">
        <Icon name={icon} size={15} />
        <span className="a-stat__label">{label}</span>
      </span>
      <span className="a-stat__value">
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
      {note && <span className="a-stat__note">{note}</span>}
    </>
  );

  // A number you can't act on is a poster, not a dashboard — every stat that
  // has a screen behind it links to it.
  return href ? (
    <Link href={href} className="a-stat">
      {inner}
    </Link>
  ) : (
    <div className="a-stat">{inner}</div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <p className="a-empty">{children}</p>
      </td>
    </tr>
  );
}

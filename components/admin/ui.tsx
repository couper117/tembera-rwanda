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
  attention = false,
}: {
  label: string;
  value: number | string;
  icon: IconName;
  note?: string;
  href?: string;
  /**
   * This number is a queue, not an inventory. A queue at zero is good news and
   * fades back; anything above zero is work waiting and takes a tint. Eight
   * identically-weighted cards told an editor nothing about where to start.
   */
  attention?: boolean;
}) {
  const waiting = attention && typeof value === "number" && value > 0;
  const className = [
    "a-stat",
    attention ? "a-stat--attention" : "",
    waiting ? "a-stat--waiting" : "",
    attention && !waiting ? "a-stat--clear" : "",
  ]
    .filter(Boolean)
    .join(" ");

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
    <Link href={href} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

/**
 * The quiet counts: how big the catalogue is, rather than what needs doing.
 *
 * A row of full cards for these competed with the queue above them, and the
 * two answer completely different questions. One line each, no boxes.
 */
export function CountStrip({
  items,
}: {
  items: { label: string; value: number; icon: IconName; note?: string; href?: string }[];
}) {
  return (
    <div className="a-counts">
      {items.map((item) => {
        const inner = (
          <>
            <span className="a-count__icon">
              <Icon name={item.icon} size={16} />
            </span>
            <span className="a-count__value">{item.value.toLocaleString()}</span>
            <span className="a-count__label">{item.label}</span>
            {item.note && <span className="a-count__note">{item.note}</span>}
          </>
        );
        return item.href ? (
          <Link key={item.label} href={item.href} className="a-count">
            {inner}
          </Link>
        ) : (
          <div key={item.label} className="a-count">
            {inner}
          </div>
        );
      })}
    </div>
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

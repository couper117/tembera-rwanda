import Icon, { type IconName } from "@/components/Icon";
import { currentNotice } from "@/lib/data/calendar";
import { formatDay, whenLabel } from "@/lib/rwanda/calendar";

/**
 * A quiet banner warning that the country is closing — Umuganda, a public
 * holiday, or the commemoration week.
 *
 * Renders nothing on an ordinary day, which is most days. A notice that is
 * always present stops being read, and the whole value here is that it appears
 * exactly when the opening hours below it are about to be wrong.
 */
export default async function CalendarNotice({
  withinDays = 3,
}: {
  withinDays?: number;
}) {
  const upcoming = await currentNotice(withinDays);
  if (!upcoming) return null;

  const { observance, daysAway } = upcoming;
  const when = whenLabel(daysAway, observance.day);

  const icon: IconName =
    observance.kind === "commemoration"
      ? "info"
      : observance.effect === "closed-morning"
        ? "clock"
        : "alert";

  const headline =
    observance.effect === "closed-morning"
      ? `${observance.name} ${when} — closed until midday`
      : observance.effect === "reduced"
        ? `${observance.name} — ${when}`
        : `${observance.name} ${when} — most places closed`;

  return (
    <div
      className="t-notice t-calnotice"
      role="status"
      style={{ marginBottom: "var(--t-4)" }}
    >
      <span className="t-notice__icon">
        <Icon name={icon} size={18} />
      </span>
      <div className="t-notice__body">
        <div className="t-notice__title">{headline}</div>
        {observance.note}
        <span className="t-small t-muted" style={{ display: "block", marginTop: 4 }}>
          {formatDay(observance.day)}. Opening hours shown on Tembera do not
          account for this — check with the place before you travel.
        </span>
      </div>
    </div>
  );
}

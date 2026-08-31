import Icon from "@/components/Icon";
import {
  WEEKDAYS,
  WEEKDAY_LABEL,
  formatTime,
  type OpenState,
  type WeekHours,
} from "@/lib/places/hours";

/**
 * The week, with today marked and the current state said out loud.
 *
 * Hours used to be one line of free text buried in a facts list. A person
 * standing on a street at 9pm wants two things: am I wasting my journey, and
 * when should I come instead. The state answers the first, the table the
 * second.
 *
 * A day that was never filled in reads "Not known" rather than "Closed",
 * because sending somebody away from an open restaurant is the worse error.
 */
export default function OpeningHours({
  week,
  state,
  fallback,
}: {
  week: WeekHours;
  state: OpenState;
  /** The free-text hours, for the 495 listings that have only that. */
  fallback?: string;
}) {
  const hasWeek = WEEKDAYS.some((d) => d in week);

  if (!hasWeek) {
    if (!fallback) return null;
    return (
      <section className="t-section" id="hours">
        <h2 className="t-heading">Opening hours</h2>
        <p className="t-body" style={{ marginTop: "var(--t-2)" }}>
          {fallback}
        </p>
      </section>
    );
  }

  return (
    <section className="t-section" id="hours">
      <div className="t-hours__head">
        <h2 className="t-heading">Opening hours</h2>
        {state.label && (
          <span className={`t-openstate${state.open ? " t-openstate--on" : ""}`}>
            <span className="t-openstate__dot" aria-hidden="true" />
            {state.label}
          </span>
        )}
      </div>

      <table className="t-hours">
        <tbody>
          {WEEKDAYS.map((day) => {
            const entry = week[day];
            const today = day === state.today;
            return (
              <tr key={day} className={today ? "t-hours__today" : undefined}>
                <th scope="row">
                  {WEEKDAY_LABEL[day]}
                  {today && <span className="t-hours__mark"> · today</span>}
                </th>
                <td>
                  {entry === undefined ? (
                    <span className="t-muted">Not known</span>
                  ) : entry.open === null ? (
                    "Closed"
                  ) : (
                    `${formatTime(entry.open)} – ${formatTime(entry.close!)}`
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {fallback && (
        <p className="t-small t-muted" style={{ marginTop: "var(--t-3)" }}>
          <Icon name="info" size={14} /> {fallback}
        </p>
      )}
    </section>
  );
}

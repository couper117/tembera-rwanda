"use client";

import { useState } from "react";
import {
  WEEKDAYS,
  WEEKDAY_LABEL,
  summariseWeek,
  type DayHours,
  type Weekday,
  type WeekHours,
} from "@/lib/places/hours";

/**
 * Per-weekday opening hours.
 *
 * Each day has three states, and keeping them distinct is the whole point:
 *
 *   - **Not set** — nobody has checked. The public page says nothing.
 *   - **Closed** — checked, and the place does not open that day.
 *   - **Open, with times.**
 *
 * Collapsing the first two would have the site assert a place is shut when in
 * truth nobody looked, which is worse than saying nothing at all.
 *
 * Submits as one JSON field so the whole week arrives as a unit, rather than
 * as 21 loose inputs the action would have to reassemble.
 */
export default function HoursEditor({
  name,
  initial,
}: {
  name: string;
  initial: WeekHours;
}) {
  const [week, setWeek] = useState<WeekHours>(initial);

  function setDay(day: Weekday, value: DayHours | undefined) {
    setWeek((current) => {
      const next = { ...current };
      if (value === undefined) delete next[day];
      else next[day] = value;
      return next;
    });
  }

  /** Copy the first filled-in day down the rest of the week. */
  function applyToAll() {
    const first = WEEKDAYS.find((d) => d in week);
    if (!first) return;
    const template = week[first];
    if (!template) return;
    setWeek(Object.fromEntries(WEEKDAYS.map((d) => [d, { ...template }])) as WeekHours);
  }

  const summary = summariseWeek(week);

  return (
    <div className="a-hours">
      <input type="hidden" name={name} value={JSON.stringify(week)} />

      <table className="a-hours__table">
        <thead>
          <tr>
            <th>Day</th>
            <th>Status</th>
            <th>Opens</th>
            <th>Closes</th>
          </tr>
        </thead>
        <tbody>
          {WEEKDAYS.map((day) => {
            const value = week[day];
            const state =
              value === undefined ? "unset" : value.open === null ? "closed" : "open";

            return (
              <tr key={day}>
                <th scope="row">{WEEKDAY_LABEL[day]}</th>
                <td>
                  <select
                    className="a-select"
                    value={state}
                    aria-label={`${WEEKDAY_LABEL[day]} status`}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (next === "unset") setDay(day, undefined);
                      else if (next === "closed") setDay(day, { open: null, close: null });
                      else setDay(day, { open: "08:00", close: "17:00" });
                    }}
                  >
                    <option value="unset">Not set</option>
                    <option value="closed">Closed</option>
                    <option value="open">Open</option>
                  </select>
                </td>
                <td>
                  <input
                    type="time"
                    className="a-input"
                    aria-label={`${WEEKDAY_LABEL[day]} opening time`}
                    value={value?.open ?? ""}
                    disabled={state !== "open"}
                    onChange={(e) =>
                      setDay(day, { open: e.target.value, close: value?.close ?? "17:00" })
                    }
                  />
                </td>
                <td>
                  <input
                    type="time"
                    className="a-input"
                    aria-label={`${WEEKDAY_LABEL[day]} closing time`}
                    value={value?.close ?? ""}
                    disabled={state !== "open"}
                    onChange={(e) =>
                      setDay(day, { open: value?.open ?? "08:00", close: e.target.value })
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="t-inline t-wrap" style={{ marginTop: "var(--t-2)" }}>
        <button type="button" className="t-btn t-btn--ghost t-btn--sm" onClick={applyToAll}>
          Copy the first day to all
        </button>
        <button
          type="button"
          className="t-btn t-btn--ghost t-btn--sm"
          onClick={() => setWeek({})}
        >
          Clear
        </button>
      </div>

      <p className="a-hint" style={{ marginTop: "var(--t-2)" }}>
        {summary ? (
          <>
            Visitors will see: <strong>{summary}</strong>
          </>
        ) : (
          "Nothing set yet — the listing will fall back to the free-text hours below."
        )}
      </p>
    </div>
  );
}

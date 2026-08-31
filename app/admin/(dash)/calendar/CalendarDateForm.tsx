"use client";

import { useActionState } from "react";
import { addCalendarDateAction, type CalendarState } from "./actions";

const initial: CalendarState = {};

/**
 * Adds a date the app cannot work out for itself — Eid above all, which
 * follows the lunar calendar. Everything derivable (Umuganda, the fixed
 * holidays, Good Friday, Umuganura) is calculated and is not listed here.
 */
export default function CalendarDateForm() {
  const [state, action, pending] = useActionState(addCalendarDateAction, initial);

  return (
    <form action={action} className="a-form">
      {state.error && <p className="a-error" role="alert">{state.error}</p>}
      {state.ok && <p className="a-success" role="status">Added.</p>}

      <div className="a-grid2">
        <div className="a-field">
          <label className="a-label" htmlFor="cal-date">
            Date
          </label>
          <input
            id="cal-date"
            type="date"
            name="date"
            className="a-input"
            required
          />
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="cal-name">
            Name
          </label>
          <input
            id="cal-name"
            type="text"
            name="name"
            className="a-input"
            placeholder="Eid al-Fitr"
            maxLength={120}
            required
          />
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="cal-effect">
            What happens
          </label>
          <select id="cal-effect" name="effect" className="a-select" defaultValue="closed">
            <option value="closed">Most places closed all day</option>
            <option value="closed-morning">Closed for the morning</option>
            <option value="reduced">Open but subdued</option>
          </select>
        </div>

        <div className="a-field">
          <label className="a-label" htmlFor="cal-note">
            Note for visitors (optional)
          </label>
          <input
            id="cal-note"
            type="text"
            name="note"
            className="a-input"
            placeholder="Leave blank for the standard wording"
            maxLength={400}
          />
        </div>
      </div>

      <div className="a-head__actions">
        <button
          type="submit"
          className="t-btn t-btn--primary"
          disabled={pending}
        >
          {pending ? "Adding…" : "Add date"}
        </button>
      </div>
    </form>
  );
}

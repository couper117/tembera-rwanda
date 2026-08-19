"use client";

import { useActionState } from "react";
import { addCalendarDateAction, type CalendarState } from "./actions";
import styles from "../admin.module.css";

const initial: CalendarState = {};

/**
 * Adds a date the app cannot work out for itself — Eid above all, which
 * follows the lunar calendar. Everything derivable (Umuganda, the fixed
 * holidays, Good Friday, Umuganura) is calculated and is not listed here.
 */
export default function CalendarDateForm() {
  const [state, action, pending] = useActionState(addCalendarDateAction, initial);

  return (
    <form action={action} className={styles.form}>
      {state.error && <p className={styles.error}>{state.error}</p>}
      {state.ok && <p className={styles.success}>Added.</p>}

      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cal-date">
            Date
          </label>
          <input
            id="cal-date"
            type="date"
            name="date"
            className={styles.input}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="cal-name">
            Name
          </label>
          <input
            id="cal-name"
            type="text"
            name="name"
            className={styles.input}
            placeholder="Eid al-Fitr"
            maxLength={120}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="cal-effect">
            What happens
          </label>
          <select id="cal-effect" name="effect" className={styles.select} defaultValue="closed">
            <option value="closed">Most places closed all day</option>
            <option value="closed-morning">Closed for the morning</option>
            <option value="reduced">Open but subdued</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="cal-note">
            Note for visitors (optional)
          </label>
          <input
            id="cal-note"
            type="text"
            name="note"
            className={styles.input}
            placeholder="Leave blank for the standard wording"
            maxLength={400}
          />
        </div>
      </div>

      <div className={styles.btnRow}>
        <button
          type="submit"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={pending}
        >
          {pending ? "Adding…" : "Add date"}
        </button>
      </div>
    </form>
  );
}

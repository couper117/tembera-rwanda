import { requireAdmin } from "@/lib/auth";
import { adminCalendarDates } from "@/lib/data/calendar";
import {
  derivedHolidays,
  formatDay,
  kigaliToday,
  umugandaFor,
} from "@/lib/rwanda/calendar";
import AdminShell from "../AdminShell";
import CalendarDateForm from "./CalendarDateForm";
import { deleteCalendarDateAction } from "./actions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

const EFFECT_LABEL: Record<string, string> = {
  closed: "Closed all day",
  "closed-morning": "Closed for the morning",
  reduced: "Open but subdued",
};

export default async function CalendarPage() {
  const admin = await requireAdmin();
  const today = kigaliToday();
  const year = today.year;

  const [added, holidays] = await Promise.all([
    adminCalendarDates(),
    Promise.resolve(derivedHolidays(year)),
  ]);

  const umugandas = Array.from({ length: 12 }, (_, i) => umugandaFor(year, i + 1));

  return (
    <AdminShell email={admin.email}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Calendar</h1>
          <p className={styles.pageSub}>
            Days the country closes. Tembera warns visitors about these on the
            home page and on every place page.
          </p>
        </div>
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Add a date</h2>
        <p className={styles.hint} style={{ marginBottom: 16 }}>
          Only for days Tembera cannot work out on its own — Eid al-Fitr and Eid
          al-Adha above all, because they follow the lunar calendar and change
          each year. Everything in the two lists below is calculated
          automatically and needs no entry here.
        </p>
        <CalendarDateForm />
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Dates you have added</h2>
        {added.length === 0 ? (
          <p className={styles.muted}>
            Nothing yet. Add this year&apos;s Eid dates so visitors are warned.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>What happens</th>
                  <th>Note</th>
                  <th style={{ width: 100 }} />
                </tr>
              </thead>
              <tbody>
                {added.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date.toISOString().slice(0, 10)}</td>
                    <td>{row.name}</td>
                    <td>{EFFECT_LABEL[row.effect] ?? row.effect}</td>
                    <td className={styles.muted}>{row.note || "—"}</td>
                    <td>
                      <form action={deleteCalendarDateAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <button
                          type="submit"
                          className={`${styles.btn} ${styles.btnSmall}`}
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Umuganda in {year} — calculated</h2>
        <p className={styles.hint} style={{ marginBottom: 16 }}>
          The last Saturday of every month. Worked out automatically, so this
          never needs updating.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <tbody>
              {umugandas.map((day) => (
                <tr key={`${day.month}-${day.day}`}>
                  <td>{formatDay(day)}</td>
                  <td className={styles.muted}>Closed until around midday</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Public holidays in {year} — calculated</h2>
        <p className={styles.hint} style={{ marginBottom: 16 }}>
          Fixed national days, plus Good Friday and Umuganura, which are worked
          out each year. <strong>Eid is not here</strong> — add it above.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <tbody>
              {holidays
                .slice()
                .sort(
                  (a, b) =>
                    a.day.month - b.day.month || a.day.day - b.day.day,
                )
                .map((holiday) => (
                  <tr key={holiday.name}>
                    <td>{formatDay(holiday.day)}</td>
                    <td>{holiday.name}</td>
                    <td className={styles.muted}>
                      {holiday.kind === "commemoration"
                        ? "National mourning"
                        : "Closed all day"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

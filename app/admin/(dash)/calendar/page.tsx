import { PageHead, Panel, EmptyRow } from "@/components/admin/ui";
import { adminCalendarDates } from "@/lib/data/calendar";
import ConfirmButton from "@/components/admin/ConfirmButton";
import {
  derivedHolidays,
  formatDay,
  kigaliToday,
  umugandaFor,
} from "@/lib/rwanda/calendar";
import CalendarDateForm from "./CalendarDateForm";
import { deleteCalendarDateAction } from "./actions";

export const dynamic = "force-dynamic";

const EFFECT_LABEL: Record<string, string> = {
  closed: "Closed all day",
  "closed-morning": "Closed for the morning",
  reduced: "Open but subdued",
};

export default async function CalendarPage() {
  const year = kigaliToday().year;

  const added = await adminCalendarDates();
  const holidays = derivedHolidays(year);
  const umugandas = Array.from({ length: 12 }, (_, i) => umugandaFor(year, i + 1));

  return (
    <>
      <PageHead
        title="Calendar"
        sub="Days the country closes. Tembera warns visitors about these on the home page and on every place page."
      />

      <Panel title="Add a date">
        <p className="a-hint" style={{ marginBottom: 16 }}>
          Only for days Tembera cannot work out on its own — Eid al-Fitr and Eid
          al-Adha above all, because they follow the lunar calendar and change
          each year. Everything in the two lists below is calculated
          automatically and needs no entry here.
        </p>
        <CalendarDateForm />
      </Panel>

      <Panel title="Dates you have added" flush>
        <div className="a-tablewrap">
          <table className="a-table">
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
              {added.length === 0 ? (
                <EmptyRow colSpan={5}>
                  Nothing yet. Add this year&apos;s Eid dates so visitors are warned.
                </EmptyRow>
              ) : (
                added.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date.toISOString().slice(0, 10)}</td>
                    <td className="a-table__strong">{row.name}</td>
                    <td>{EFFECT_LABEL[row.effect] ?? row.effect}</td>
                    <td>{row.note || <span className="a-table__sub">—</span>}</td>
                    <td>
                      <form action={deleteCalendarDateAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <ConfirmButton question={`Delete ${row.name}?`} />
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title={`Umuganda in ${year} — calculated`} flush>
        <p className="a-hint" style={{ padding: "0 var(--t-4) var(--t-3)" }}>
          The last Saturday of every month. Worked out automatically, so this
          never needs updating.
        </p>
        <div className="a-tablewrap">
          <table className="a-table">
            <tbody>
              {umugandas.map((day) => (
                <tr key={`${day.month}-${day.day}`}>
                  <td className="a-table__strong">{formatDay(day)}</td>
                  <td>Closed until around midday</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title={`Public holidays in ${year} — calculated`} flush>
        <p className="a-hint" style={{ padding: "0 var(--t-4) var(--t-3)" }}>
          Fixed national days, plus Good Friday and Umuganura, which are worked
          out each year. <strong>Eid is not here</strong> — add it above.
        </p>
        <div className="a-tablewrap">
          <table className="a-table">
            <tbody>
              {holidays
                .slice()
                .sort((a, b) => a.day.month - b.day.month || a.day.day - b.day.day)
                .map((holiday) => (
                  <tr key={holiday.name}>
                    <td className="a-table__strong">{formatDay(holiday.day)}</td>
                    <td>{holiday.name}</td>
                    <td>
                      {holiday.kind === "commemoration"
                        ? "National mourning"
                        : "Closed all day"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

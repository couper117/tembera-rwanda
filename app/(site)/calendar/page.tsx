import type { Metadata } from "next";
import AppHeader from "@/components/app/AppHeader";
import CalendarScreen from "@/components/calendar/CalendarScreen";
import Icon from "@/components/Icon";
import { getCalendarEvents, nowInKigali } from "@/lib/data/calendar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendar",
  description: "Rwanda's public holidays, Umuganda and national commemorations.",
};

/**
 * Rwanda's calendar — public holidays, Umuganda, and the country's main
 * civic and cultural fixtures. Entirely static/computed (see
 * lib/data/calendar.ts); nothing here is fetched or editable yet.
 */
export default function CalendarPage() {
  const { year } = nowInKigali();
  const events = getCalendarEvents(year);
  const holidayCount = events.filter((e) => e.kind === "public-holiday").length;
  const umugandaCount = events.filter((e) => e.kind === "umuganda").length;

  return (
    <>
      <AppHeader />

      <main className="t-main">
        <div className="t-page">
          <section className="t-section" style={{ maxWidth: 760 }}>
            <h1 className="t-display">Rwanda Calendar</h1>
            <p className="t-small t-muted" style={{ marginTop: 4 }}>
              Public holidays, Umuganda and national commemorations for {year}.
            </p>

            <div className="t-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: "var(--t-4)" }}>
              <Stat value={String(holidayCount)} label="Public holidays" />
              <Stat value={String(umugandaCount)} label="Umuganda Saturdays" />
              <Stat value="4" label="Event kinds" />
            </div>
          </section>

          <CalendarScreen year={year} events={events} />

          <section className="t-section" style={{ maxWidth: 760 }}>
            <div className="t-notice">
              <span className="t-notice__icon">
                <Icon name="info" size={18} />
              </span>
              <div className="t-notice__body">
                <div className="t-notice__title">Reference dates, not a legal register</div>
                Fixed civic and religious dates are computed from the year. A few events
                (marked <em>approximate</em>) genuinely move year to year with no fixed
                rule — they&apos;re shown on a representative date. Confirm exact dates with
                an official Government of Rwanda source before relying on them.
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="t-card" style={{ padding: "var(--t-4) var(--t-3)", textAlign: "center" }}>
      <div className="t-title">{value}</div>
      <div className="t-small t-muted" style={{ marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

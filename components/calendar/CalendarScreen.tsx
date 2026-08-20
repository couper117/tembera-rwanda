"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import Icon from "@/components/Icon";
import SectionHeader from "@/components/ui/SectionHeader";
import {
  EVENT_KIND_META,
  MONTH_LONG,
  WEEKDAY_SHORT_MON_FIRST,
  daysBetween,
  formatLongDate,
  kindStyleVars,
  monthShort,
  nowInKigali,
  type CalendarEvent,
  type EventKind,
} from "@/lib/data/calendar";

interface Props {
  year: number;
  events: CalendarEvent[];
}

type FilterKey = "all" | EventKind;
type View = "calendar" | "list";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "public-holiday", label: "Public holidays" },
  { key: "umuganda", label: "Umuganda" },
  { key: "culture", label: "Culture" },
  { key: "memorial", label: "Memorial" },
];

function tagStyle(kind: EventKind): CSSProperties {
  return kindStyleVars(kind) as CSSProperties;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export default function CalendarScreen({ year, events }: Props) {
  // Computed identically on server and client from the real clock — see
  // nowInKigali's doc comment for why this doesn't cause a hydration mismatch.
  const today = nowInKigali();
  const currentInYear = today.year === year;

  const [view, setView] = useState<View>("calendar");
  const [viewMonth, setViewMonth] = useState(currentInYear ? today.month - 1 : 0);
  const [selected, setSelected] = useState<string | null>(currentInYear ? today.iso : null);
  const [filter, setFilter] = useState<FilterKey>("all");

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date);
      if (list) list.push(e);
      else map.set(e.date, [e]);
    }
    return map;
  }, [events]);

  const nextEvent = useMemo(
    () => events.find((e) => e.date >= today.iso),
    [events, today.iso],
  );

  const filtered = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.kind === filter)),
    [events, filter],
  );

  const upcomingByMonth = useMemo(() => {
    const groups: { month: number; items: CalendarEvent[] }[] = [];
    for (const e of filtered) {
      if (e.date < today.iso) continue;
      const month = Number(e.date.slice(5, 7)) - 1;
      const last = groups[groups.length - 1];
      if (last && last.month === month) last.items.push(e);
      else groups.push({ month, items: [e] });
    }
    return groups;
  }, [filtered, today.iso]);

  const selectedEvents = selected ? (byDate.get(selected) ?? []) : [];

  const selectedRef = useRef<HTMLElement>(null);
  function jumpTo(dateISO: string) {
    setViewMonth(Number(dateISO.slice(5, 7)) - 1);
    setSelected(dateISO);
    requestAnimationFrame(() => {
      selectedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // -- month grid geometry ------------------------------------------------
  const firstWeekdaySun0 = new Date(Date.UTC(year, viewMonth, 1)).getUTCDay();
  const leadingBlanks = (firstWeekdaySun0 + 6) % 7; // Mon-first grid
  const daysInMonth = new Date(Date.UTC(year, viewMonth + 1, 0)).getUTCDate();
  const daysInPrevMonth = new Date(Date.UTC(year, viewMonth, 0)).getUTCDate();

  const cells: { iso: string; day: number; outside: boolean }[] = [];
  for (let i = 0; i < leadingBlanks; i++) {
    const day = daysInPrevMonth - leadingBlanks + 1 + i;
    const m = viewMonth === 0 ? 12 : viewMonth;
    const y = viewMonth === 0 ? year - 1 : year;
    cells.push({ iso: `${y}-${pad2(m)}-${pad2(day)}`, day, outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: `${year}-${pad2(viewMonth + 1)}-${pad2(d)}`, day: d, outside: false });
  }
  const rows = Math.ceil(cells.length / 7);
  const trailing = rows * 7 - cells.length;
  for (let i = 0; i < trailing; i++) {
    const m = viewMonth === 11 ? 1 : viewMonth + 2;
    const y = viewMonth === 11 ? year + 1 : year;
    cells.push({ iso: `${y}-${pad2(m)}-${pad2(i + 1)}`, day: i + 1, outside: true });
  }

  return (
    <>
      {/* -------------------------------------------------------- next up */}
      {nextEvent && (
        <section className="t-section">
          <button
            type="button"
            className="t-cal-next"
            style={{ ...tagStyle(nextEvent.kind), width: "100%", textAlign: "left" }}
            onClick={() => jumpTo(nextEvent.date)}
          >
            <span className="t-cal-next__date">
              <span>{monthShort(Number(nextEvent.date.slice(5, 7)) - 1)}</span>
              <span>{nextEvent.date.slice(8, 10)}</span>
            </span>
            <span className="t-cal-next__body">
              <span className="t-small t-muted" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "var(--t-text-micro)" }}>
                {nextEvent.date === today.iso ? "Today" : "Up next"}
              </span>
              <div className="t-heading" style={{ marginTop: 2 }}>{nextEvent.title}</div>
              <div className="t-small t-muted" style={{ marginTop: 2 }}>{nextEvent.summary}</div>
            </span>
            <span className="t-badge t-cal-next__eta">
              {nextEvent.date === today.iso
                ? "Today"
                : `in ${daysBetween(today.iso, nextEvent.date)}d`}
            </span>
          </button>
        </section>
      )}

      {/* ----------------------------------------------------------- controls */}
      <section className="t-section">
        <div className="t-cal-controls">
          <div className="t-chiprow" role="group" aria-label="Filter by kind">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const style = f.key === "all"
                ? ({ "--tag": "var(--t-ink)", "--tag-soft": "var(--t-surface-2)" } as CSSProperties)
                : tagStyle(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  className="t-cal-chip"
                  aria-pressed={active}
                  style={style}
                  onClick={() => setFilter(f.key)}
                >
                  {f.key !== "all" && <span className="t-cal-chip__dot" />}
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="t-cal-viewtoggle" role="group" aria-label="Calendar or list view">
            <button
              type="button"
              className="t-cal-viewtoggle__btn"
              aria-pressed={view === "calendar"}
              onClick={() => setView("calendar")}
            >
              <Icon name="calendar" size={16} />
              Calendar
            </button>
            <button
              type="button"
              className="t-cal-viewtoggle__btn"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <Icon name="list" size={16} />
              List
            </button>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- calendar view */}
      {view === "calendar" && (
        <section className="t-section">
          <div className="t-cal-layout">
            <div className="t-card" style={{ padding: "var(--t-4)" }}>
              <div className="t-cal-nav">
                <button
                  type="button"
                  className="t-iconbtn"
                  aria-label="Previous month"
                  disabled={viewMonth === 0}
                  onClick={() => setViewMonth((m) => Math.max(0, m - 1))}
                >
                  <Icon name="chevronLeft" size={19} />
                </button>
                <span className="t-cal-nav__label">{MONTH_LONG[viewMonth]} {year}</span>
                <button
                  type="button"
                  className="t-iconbtn"
                  aria-label="Next month"
                  disabled={viewMonth === 11}
                  onClick={() => setViewMonth((m) => Math.min(11, m + 1))}
                >
                  <Icon name="chevronRight" size={19} />
                </button>
                {currentInYear && (
                  <button
                    type="button"
                    className="t-btn t-btn--secondary t-btn--sm"
                    onClick={() => {
                      setViewMonth(today.month - 1);
                      setSelected(today.iso);
                    }}
                  >
                    Today
                  </button>
                )}
              </div>

              <div className="t-cal-dow" aria-hidden="true">
                {WEEKDAY_SHORT_MON_FIRST.map((d) => <span key={d}>{d}</span>)}
              </div>

              <div className="t-cal-grid">
                {cells.map((cell, i) => {
                  const dayEvents = byDate.get(cell.iso) ?? [];
                  const isToday = cell.iso === today.iso;
                  const isSelected = cell.iso === selected;
                  const classes = [
                    "t-cal-day",
                    cell.outside && "t-cal-day--outside",
                    isToday && "t-cal-day--today",
                    isSelected && "t-cal-day--selected",
                  ].filter(Boolean).join(" ");

                  return (
                    <button
                      key={`${cell.iso}-${i}`}
                      type="button"
                      className={classes}
                      aria-current={isToday ? "date" : undefined}
                      aria-pressed={isSelected}
                      onClick={() => setSelected(cell.iso)}
                    >
                      <span>{cell.day}</span>
                      {dayEvents.length > 0 && (
                        <span className="t-cal-day__dots">
                          {dayEvents.slice(0, 3).map((e) => (
                            <span
                              key={e.id}
                              className="t-cal-day__dot"
                              style={{ background: `var(${EVENT_KIND_META[e.kind].var})` }}
                            />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="t-cal-layout__side" ref={selectedRef}>
              <div className="t-card" style={{ padding: "var(--t-4)" }}>
                <div className="t-heading" style={{ marginBottom: "var(--t-3)" }}>
                  {selected ? formatLongDate(selected) : "Pick a day"}
                </div>

                {!selected || selectedEvents.length === 0 ? (
                  <div className="t-small t-muted">
                    {selected ? "Nothing scheduled." : "Tap a day on the calendar to see what's on."}
                  </div>
                ) : (
                  selectedEvents.map((e) => (
                    <div key={e.id} className="t-cal-event" style={tagStyle(e.kind)}>
                      <span className="t-cal-event__icon">
                        <Icon name={EVENT_KIND_META[e.kind].icon} size={17} />
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span className="t-row__name">{e.title}</span>
                        <div className="t-small t-muted" style={{ marginTop: 2 }}>
                          {e.summary}
                          {e.approx && <span className="t-badge" style={{ marginLeft: 6 }}>~ approximate</span>}
                        </div>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------- list view */}
      {view === "list" && (
        <section className="t-section">
          <SectionHeader
            title="Coming up"
            subtitle={`The rest of ${year}, in order`}
          />
          {upcomingByMonth.length === 0 ? (
            <div className="t-state">
              <span className="t-state__icon"><Icon name="calendar" size={22} /></span>
              <div className="t-state__title">Nothing left this year</div>
              <div className="t-state__text">Try a different filter, or check back next year.</div>
            </div>
          ) : (
            <div className="t-card">
              {upcomingByMonth.map((group) => (
                <div key={group.month}>
                  <div className="t-cal-monthlabel">{MONTH_LONG[group.month]}</div>
                  {group.items.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      className="t-cal-agendarow"
                      style={{ width: "100%", textAlign: "left", background: "none" }}
                      onClick={() => {
                        setView("calendar");
                        jumpTo(e.date);
                      }}
                    >
                      <span className="t-cal-agendarow__date">
                        <span>{monthShort(group.month)}</span>
                        <span>{e.date.slice(8, 10)}</span>
                      </span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span className="t-row__name">{e.title}</span>
                        <div className="t-small t-muted t-clamp-2" style={{ marginTop: 2 }}>
                          {e.summary}
                        </div>
                      </span>
                      <span
                        className="t-badge"
                        style={{
                          background: `var(${EVENT_KIND_META[e.kind].soft})`,
                          color: `var(${EVENT_KIND_META[e.kind].var})`,
                          flex: "none",
                        }}
                      >
                        {EVENT_KIND_META[e.kind].label}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}

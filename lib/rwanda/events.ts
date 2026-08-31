import type { IconName } from "@/components/Icon";

/**
 * Rwanda's national calendar — public holidays, Umuganda and the country's
 * main civic and cultural fixtures. Static and computed, not fetched: there
 * is no admin screen for this yet, so every rule-based date (Umuganda's
 * "last Saturday", Umuganura's "first Friday of August") is derived from the
 * year rather than hand-typed. A handful of events genuinely move year to
 * year with no fixed rule (Umushyikirano, Kwita Izina, Itorero Urungano) —
 * those are marked `approx` and shown on a representative date rather than
 * invented as exact.
 */

// NOTE: ./calendar.ts derives Umuganda and the public holidays too, for the
// opening-hours warnings, and is unit tested. The two lists are currently
// maintained separately — this one carries the cultural events and display
// copy that module has no need for. Worth collapsing onto one derivation
// before either grows further.

export type EventKind = "public-holiday" | "umuganda" | "memorial" | "culture";

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  kind: EventKind;
  summary: string;
  /** True for events whose exact day shifts year to year and isn't rule-based
   *  (Umuganda's "last Saturday" and Umuganura's "first Friday" are rules and
   *  don't need this) — shown on a representative date rather than invented
   *  as exact. */
  approx?: boolean;
}

export const EVENT_KIND_META: Record<
  EventKind,
  { label: string; icon: IconName; var: string; soft: string }
> = {
  "public-holiday": {
    label: "Public holiday", icon: "landmark", var: "--t-accent", soft: "--t-accent-soft",
  },
  umuganda: {
    label: "Umuganda", icon: "broom", var: "--t-ink-2", soft: "--t-surface-2",
  },
  memorial: {
    label: "Memorial", icon: "memorial", var: "--t-violet", soft: "--t-violet-soft",
  },
  culture: {
    label: "Culture", icon: "sparkle", var: "--t-gold", soft: "--t-gold-soft",
  },
};

/** The `--tag`/`--tag-soft` custom properties every kind-coloured element
 *  reads from (see .t-cal-chip, .t-cal-event, .t-cal-next in components.css). */
export function kindStyleVars(kind: EventKind): Record<string, string> {
  const meta = EVENT_KIND_META[kind];
  return { "--tag": `var(${meta.var})`, "--tag-soft": `var(${meta.soft})` };
}

const WEEKDAY_LONG = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
export const WEEKDAY_SHORT_MON_FIRST = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// --------------------------------------------------------------- dates ---

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function iso(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** 0=Sunday … 6=Saturday, matching Date#getUTCDay. */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): number {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return 1 + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7;
}

function lastWeekdayOfMonth(year: number, month: number, weekday: number): number {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDayWeekday = new Date(Date.UTC(year, month - 1, lastDay)).getUTCDay();
  return lastDay - ((lastDayWeekday - weekday + 7) % 7);
}

const SATURDAY = 6;
const FRIDAY = 5;

/** Every event Tembera shows for a given year, in chronological order. */
export function getCalendarEvents(year: number): CalendarEvent[] {
  const umuganuraDay = nthWeekdayOfMonth(year, 8, FRIDAY, 1);

  const events: CalendarEvent[] = [
    {
      id: "new-year",
      title: "New Year's Day",
      date: iso(year, 1, 1),
      kind: "public-holiday",
      summary: "Public holiday nationwide.",
    },
    {
      id: "heroes-day",
      title: "National Heroes' Day — Umunsi w'Intwari",
      date: iso(year, 2, 1),
      kind: "public-holiday",
      summary: "Honours Rwanda's national heroes.",
    },
    {
      id: "umushyikirano",
      title: "Umushyikirano — National Dialogue Council",
      date: iso(year, 2, 5),
      kind: "culture",
      approx: true,
      summary: "Leaders and citizens' representatives meet to discuss the state of the nation. The exact dates move year to year — held 5–6 February in 2026.",
    },
    {
      id: "womens-day",
      title: "International Women's Day",
      date: iso(year, 3, 8),
      kind: "culture",
      summary: "Observed nationally, though not a public holiday.",
    },
    {
      id: "kwibuka",
      title: "Kwibuka — Genocide against the Tutsi Memorial Day",
      date: iso(year, 4, 7),
      kind: "memorial",
      summary: "Opens the national commemoration week (7–13 April) and the wider mourning period observed through Liberation Day on 4 July.",
    },
    {
      id: "labour-day",
      title: "Labour Day",
      date: iso(year, 5, 1),
      kind: "public-holiday",
      summary: "Public holiday nationwide.",
    },
    {
      id: "childrens-day",
      title: "International Children's Day",
      date: iso(year, 6, 1),
      kind: "culture",
      summary: "National activities centred on children.",
    },
    {
      id: "martyrs-day",
      title: "Martyrs' Day",
      date: iso(year, 6, 3),
      kind: "public-holiday",
      summary: "Public holiday commemorating those who sacrificed for Rwanda.",
    },
    {
      id: "independence-day",
      title: "Independence Day — Umunsi w'Ubwigenge",
      date: iso(year, 7, 1),
      kind: "public-holiday",
      summary: "Marks independence from Belgium in 1962.",
    },
    {
      id: "liberation-day",
      title: "Liberation Day — Umunsi wo Kwibohora",
      date: iso(year, 7, 4),
      kind: "public-holiday",
      summary: "Marks the end of the 1994 Genocide against the Tutsi and the liberation of Rwanda; closes the mourning period that began on Kwibuka.",
    },
    {
      id: "umuganura",
      title: "Umuganura — Harvest Day",
      date: iso(year, 8, umuganuraDay),
      kind: "culture",
      summary: "Traditional harvest and thanksgiving festival, and a public holiday.",
    },
    {
      id: "kwita-izina",
      title: "Kwita Izina — Gorilla Naming Ceremony",
      date: iso(year, 8, 29),
      kind: "culture",
      approx: true,
      summary: "Newborn mountain gorillas are named near Volcanoes National Park. Held in August; the exact date varies year to year.",
    },
    {
      id: "assumption-day",
      title: "Assumption Day",
      date: iso(year, 8, 15),
      kind: "public-holiday",
      summary: "Christian public holiday.",
    },
    {
      id: "itorero-urungano",
      title: "Itorero Urungano",
      date: iso(year, 12, 15),
      kind: "culture",
      approx: true,
      summary: "Youth civic-education activities held around December; the exact timing varies year to year.",
    },
    {
      id: "christmas",
      title: "Christmas Day",
      date: iso(year, 12, 25),
      kind: "public-holiday",
      summary: "Public holiday nationwide.",
    },
    {
      id: "boxing-day",
      title: "Boxing Day",
      date: iso(year, 12, 26),
      kind: "public-holiday",
      summary: "Public holiday nationwide.",
    },
  ];

  for (let month = 1; month <= 12; month++) {
    const day = lastWeekdayOfMonth(year, month, SATURDAY);
    events.push({
      id: `umuganda-${year}-${pad2(month)}`,
      title: "Umuganda",
      date: iso(year, month, day),
      kind: "umuganda",
      summary: "Mandatory nationwide community service, 07:00–11:00. Most shops open late.",
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

// -------------------------------------------------------- formatting ---

export function formatLongDate(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${WEEKDAY_LONG[weekday]}, ${d} ${MONTH_LONG[m - 1]}`;
}

export function formatShortDate(dateISO: string): string {
  const [, m, d] = dateISO.split("-").map(Number);
  return `${d} ${MONTH_SHORT[m - 1]}`;
}

export function monthShort(month0to11: number): string {
  return MONTH_SHORT[month0to11];
}

export function daysBetween(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86_400_000);
}

/**
 * "Today" per Rwanda's clock (Africa/Kigali, UTC+2, no DST) rather than the
 * viewer's device timezone — this page is about when things happen in
 * Rwanda, and a fixed offset means server and client compute the same value
 * from the same instant with no timezone library and no hydration mismatch.
 */
export function nowInKigali(): { year: number; month: number; day: number; iso: string } {
  const shifted = new Date(Date.now() + 2 * 3600 * 1000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  return { year, month, day, iso: iso(year, month, day) };
}

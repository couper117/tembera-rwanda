// Rwanda's calendar, as far as a directory needs to care about it.
//
// A directory that publishes opening hours is wrong on a predictable schedule
// unless it knows about Umuganda and the public holidays. Once a month the
// country closes for the morning and this app would cheerfully say otherwise.
//
// Pure on purpose — no database, no Next runtime — so every rule here is unit
// tested. Dates that move with the lunar calendar (Eid) cannot be derived and
// are NOT guessed: they come from the admin-managed table instead. See
// lib/data/calendar.ts.

/** A calendar date in Rwanda. Month is 1–12, matching how people say it. */
export interface CalendarDay {
  year: number;
  month: number;
  day: number;
}

export type ObservanceKind = "umuganda" | "holiday" | "commemoration";

/** What an observance actually does to opening hours. */
export type Effect =
  /** Closed for the morning, generally reopening around midday. */
  | "closed-morning"
  /** Most things closed all day. */
  | "closed"
  /** Open, but subdued — reduced hours, no music or events. */
  | "reduced";

export interface Observance {
  kind: ObservanceKind;
  name: string;
  day: CalendarDay;
  effect: Effect;
  /** One sentence a visitor can act on. */
  note: string;
}

/* --------------------------------------------------------------- basics */

// Rwanda is UTC+2 all year and has never observed daylight saving, so a fixed
// offset is correct here rather than a simplification. It matters: a server in
// UTC would roll over to "tomorrow" at 10pm Kigali time and could announce
// Umuganda a day early.
const KIGALI_OFFSET_MINUTES = 2 * 60;

/** Today's date in Rwanda, whatever the server's own clock is set to. */
export function kigaliToday(now: Date = new Date()): CalendarDay {
  const shifted = new Date(now.getTime() + KIGALI_OFFSET_MINUTES * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/** Treats a CalendarDay as a point in time, for comparison and arithmetic. */
function toUtc(day: CalendarDay): Date {
  return new Date(Date.UTC(day.year, day.month - 1, day.day));
}

function fromUtc(date: Date): CalendarDay {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function sameDay(a: CalendarDay, b: CalendarDay): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Whole days from `a` to `b`. Negative when `b` is in the past. */
export function daysBetween(a: CalendarDay, b: CalendarDay): number {
  return Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / 86_400_000);
}

export function addDays(day: CalendarDay, count: number): CalendarDay {
  const d = toUtc(day);
  d.setUTCDate(d.getUTCDate() + count);
  return fromUtc(d);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(day: CalendarDay): number {
  return toUtc(day).getUTCDay();
}

export function formatDay(day: CalendarDay): string {
  return toUtc(day).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/* ------------------------------------------------------------- umuganda */

/** The last Saturday of a given month — community service day. */
export function umugandaFor(year: number, month: number): CalendarDay {
  // Walk back from the last day of the month to the first Saturday found.
  const last = new Date(Date.UTC(year, month, 0));
  const backtrack = (last.getUTCDay() - 6 + 7) % 7;
  last.setUTCDate(last.getUTCDate() - backtrack);
  return fromUtc(last);
}

export function isUmuganda(day: CalendarDay): boolean {
  return sameDay(day, umugandaFor(day.year, day.month));
}

/** The next Umuganda on or after `from`. */
export function nextUmuganda(from: CalendarDay): CalendarDay {
  const thisMonth = umugandaFor(from.year, from.month);
  if (daysBetween(from, thisMonth) >= 0) return thisMonth;
  const nextMonth = from.month === 12 ? 1 : from.month + 1;
  const nextYear = from.month === 12 ? from.year + 1 : from.year;
  return umugandaFor(nextYear, nextMonth);
}

const UMUGANDA_NOTE =
  "Umuganda, the monthly community work morning. Many places are closed and " +
  "movement is restricted until around midday.";

export function umugandaObservance(day: CalendarDay): Observance {
  return {
    kind: "umuganda",
    name: "Umuganda",
    day,
    effect: "closed-morning",
    note: UMUGANDA_NOTE,
  };
}

/* ------------------------------------------------------------- holidays */

/**
 * Easter Sunday, by the anonymous Gregorian algorithm. Deterministic, so it is
 * computed rather than stored — unlike Eid, which follows the lunar calendar
 * and is genuinely not derivable here.
 */
export function easterSunday(year: number): CalendarDay {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
}

export function goodFriday(year: number): CalendarDay {
  return addDays(easterSunday(year), -2);
}

/** Umuganura, the national harvest day — the first Friday of August. */
export function umuganura(year: number): CalendarDay {
  const first = new Date(Date.UTC(year, 7, 1));
  const forward = (5 - first.getUTCDay() + 7) % 7;
  first.setUTCDate(first.getUTCDate() + forward);
  return fromUtc(first);
}

/**
 * The public holidays whose dates can be derived. Eid al-Fitr and Eid al-Adha
 * are public holidays too, but they follow the lunar calendar and are set each
 * year — they come from the admin table, deliberately not from a guess here.
 */
export function derivedHolidays(year: number): Observance[] {
  const fixed: Array<[number, number, string]> = [
    [1, 1, "New Year's Day"],
    [1, 2, "Day after New Year's Day"],
    [2, 1, "National Heroes' Day"],
    [4, 7, "Kwibuka — Genocide against the Tutsi Memorial Day"],
    [5, 1, "Labour Day"],
    [7, 1, "Independence Day"],
    [7, 4, "Liberation Day"],
    [8, 15, "Assumption Day"],
    [12, 25, "Christmas Day"],
    [12, 26, "Boxing Day"],
  ];

  const list: Observance[] = fixed.map(([month, day, name]) => ({
    kind: month === 4 && day === 7 ? "commemoration" : "holiday",
    name,
    day: { year, month, day },
    effect: "closed",
    note:
      month === 4 && day === 7
        ? "A national day of mourning. Most places are closed and the day is " +
          "observed quietly across the country."
        : "A public holiday. Many places are closed or on reduced hours.",
  }));

  list.push({
    kind: "holiday",
    name: "Good Friday",
    day: goodFriday(year),
    effect: "closed",
    note: "A public holiday. Many places are closed or on reduced hours.",
  });

  list.push({
    kind: "holiday",
    name: "Umuganura — National Harvest Day",
    day: umuganura(year),
    effect: "closed",
    note: "A public holiday. Many places are closed or on reduced hours.",
  });

  return list.sort((a, b) => daysBetween(a.day, b.day) * -1 || 0);
}

/**
 * The week of national mourning that opens the commemoration period, starting
 * 7 April. Entertainment venues are generally closed or subdued throughout.
 */
export function mourningWeek(year: number): { from: CalendarDay; to: CalendarDay } {
  return { from: { year, month: 4, day: 7 }, to: { year, month: 4, day: 13 } };
}

export function isInMourningWeek(day: CalendarDay): boolean {
  const { from, to } = mourningWeek(day.year);
  return daysBetween(from, day) >= 0 && daysBetween(day, to) >= 0;
}

/* ----------------------------------------------------------- what's on */

/**
 * Everything happening on a given day, most disruptive first.
 *
 * `extra` carries the dates that cannot be derived — Eid, and anything else an
 * admin has added for the year.
 */
export function observancesOn(
  day: CalendarDay,
  extra: Observance[] = [],
): Observance[] {
  const found: Observance[] = [];

  for (const holiday of derivedHolidays(day.year)) {
    if (sameDay(holiday.day, day)) found.push(holiday);
  }
  for (const e of extra) {
    if (sameDay(e.day, day)) found.push(e);
  }
  if (isUmuganda(day)) found.push(umugandaObservance(day));

  // Mourning week: the 7th itself is already a holiday above, so only the
  // remaining days need adding.
  if (isInMourningWeek(day) && !(day.month === 4 && day.day === 7)) {
    found.push({
      kind: "commemoration",
      name: "Kwibuka commemoration week",
      day,
      effect: "reduced",
      note:
        "The week of national mourning. Bars, clubs and music venues are " +
        "closed or quiet, and events are generally suspended.",
    });
  }

  const weight: Record<Effect, number> = {
    closed: 0,
    "closed-morning": 1,
    reduced: 2,
  };
  return found.sort((a, b) => weight[a.effect] - weight[b.effect]);
}

export interface UpcomingObservance {
  observance: Observance;
  /** 0 = today, 1 = tomorrow, and so on. */
  daysAway: number;
}

/**
 * The next thing worth warning someone about, within `withinDays`.
 *
 * Returns today's observance if there is one, otherwise looks ahead. Used to
 * decide whether to show a banner at all — the answer is usually no, which is
 * the point.
 */
export function upcomingObservance(
  today: CalendarDay,
  extra: Observance[] = [],
  withinDays = 3,
): UpcomingObservance | null {
  for (let offset = 0; offset <= withinDays; offset++) {
    const day = addDays(today, offset);
    const [first] = observancesOn(day, extra);
    if (first) return { observance: first, daysAway: offset };
  }
  return null;
}

/** "today" / "tomorrow" / "on Saturday" — for the banner. */
export function whenLabel(daysAway: number, day: CalendarDay): string {
  if (daysAway === 0) return "today";
  if (daysAway === 1) return "tomorrow";
  const weekday = toUtc(day).toLocaleDateString("en-GB", {
    weekday: "long",
    timeZone: "UTC",
  });
  return `on ${weekday}`;
}

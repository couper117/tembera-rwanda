import type { Place } from "./types";

/**
 * Structured opening hours.
 *
 * `Place.hours` is a single free-text line and stays as the fallback: 495
 * listings were imported with strings like "Mon-Fri 8am-6pm" or "dawn to
 * dusk", and some of them genuinely do not fit a grid. `hoursJson` is the
 * structured form an editor fills in, and it is what "Open now" and the
 * closure calendar can actually reason about.
 *
 * Pure: no database, no React. Unit-testable, and safe to use on either side.
 */

/** Monday first, matching how a Rwandan week is written and displayed. */
export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/**
 * One day. `null` on both means closed that day; a day missing from the record
 * entirely means "not known", which is different and must not be rendered as
 * "closed" — claiming a place is shut when nobody checked is worse than
 * saying nothing.
 */
export interface DayHours {
  /** "HH:MM", 24-hour. */
  open: string | null;
  close: string | null;
}

export type WeekHours = Partial<Record<Weekday, DayHours>>;

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value: string): boolean {
  return TIME.test(value);
}

/**
 * Read whatever is in the JSON column back into a WeekHours, discarding
 * anything malformed rather than trusting it.
 *
 * The column is `Json`, so its contents are only as good as whatever last
 * wrote them — including older versions of this code. Parsing defensively here
 * means a bad row degrades to "no structured hours" instead of throwing on a
 * page render.
 */
export function parseWeekHours(value: unknown): WeekHours {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: WeekHours = {};

  for (const day of WEEKDAYS) {
    const raw = (value as Record<string, unknown>)[day];
    if (!raw || typeof raw !== "object") continue;

    const { open, close } = raw as { open?: unknown; close?: unknown };
    const openOk = typeof open === "string" && isValidTime(open);
    const closeOk = typeof close === "string" && isValidTime(close);

    if (open === null && close === null) {
      out[day] = { open: null, close: null }; // explicitly closed
    } else if (openOk && closeOk) {
      out[day] = { open: open as string, close: close as string };
    }
    // Anything else — half a range, a malformed time — is dropped.
  }
  return out;
}

/** True when at least one day has been filled in. */
export function hasWeekHours(hours: WeekHours): boolean {
  return WEEKDAYS.some((d) => d in hours);
}

/**
 * "09:00" → "9am", "17:30" → "5.30pm".
 *
 * Rwanda writes times both ways; the 12-hour form reads more naturally in a
 * sentence, which is where these end up.
 */
export function formatTime(value: string): string {
  const [h, m] = value.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}.${String(m).padStart(2, "0")}${suffix}`;
}

/**
 * A human summary, collapsing runs of identical days:
 * "Mon–Fri 8am–6pm · Sat 9am–1pm · Sun closed".
 */
export function summariseWeek(hours: WeekHours): string | null {
  if (!hasWeekHours(hours)) return null;

  const known = WEEKDAYS.filter((d) => d in hours);
  const parts: string[] = [];

  let runStart = 0;
  for (let i = 0; i <= known.length; i++) {
    const current = i < known.length ? hours[known[i]] : undefined;
    const previous = hours[known[runStart]];
    const same =
      current !== undefined &&
      previous !== undefined &&
      current.open === previous.open &&
      current.close === previous.close;

    if (!same) {
      const from = known[runStart];
      const to = known[i - 1];
      const label =
        from === to
          ? cap(from)
          : `${cap(from)}–${cap(to)}`;
      const day = hours[from];
      const when =
        day && day.open && day.close
          ? `${formatTime(day.open)}–${formatTime(day.close)}`
          : "closed";
      parts.push(`${label} ${when}`);
      runStart = i;
    }
  }
  return parts.join(" · ");
}

function cap(day: Weekday): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

/**
 * Whether a place is open at a given local time.
 *
 * Returns null when the day is not recorded — "we do not know" is a distinct
 * answer from "closed", and the UI must be able to say nothing rather than
 * assert something it cannot support. A closing time earlier than the opening
 * one is read as crossing midnight, which is how a bar is actually open.
 */
export function isOpenAt(
  hours: WeekHours,
  day: Weekday,
  minutesSinceMidnight: number,
): boolean | null {
  const today = hours[day];
  if (today === undefined) return null;
  if (today.open === null || today.close === null) return false;

  const open = toMinutes(today.open);
  const close = toMinutes(today.close);
  if (open === close) return false;
  if (close > open) {
    return minutesSinceMidnight >= open && minutesSinceMidnight < close;
  }
  // Crosses midnight.
  return minutesSinceMidnight >= open || minutesSinceMidnight < close;
}

export function toMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

/** The structured hours off a place, already parsed. */
export function weekHoursOf(place: Pick<Place, "hoursJson">): WeekHours {
  return parseWeekHours(place.hoursJson);
}

/* ------------------------------------------------------------- open now */

/** Monday-first index, matching WEEKDAYS. */
function weekdayOf(date: Date): Weekday {
  // getUTCDay() is 0=Sunday; Kigali is UTC+2 with no DST, so shifting the
  // clock forward two hours and reading UTC parts gives the local day without
  // pulling in a timezone library.
  const kigali = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  const sundayFirst = kigali.getUTCDay();
  return WEEKDAYS[(sundayFirst + 6) % 7];
}

function minutesOf(date: Date): number {
  const kigali = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  return kigali.getUTCHours() * 60 + kigali.getUTCMinutes();
}

export interface OpenState {
  /** null when the day was never filled in — "we do not know" is not "closed". */
  open: boolean | null;
  /** "Open until 10pm", "Closed · opens 8am tomorrow", or null. */
  label: string | null;
  today: Weekday;
}

/**
 * Whether a place is open at this moment, in Kigali.
 *
 * Answers with a sentence rather than a boolean, because "Open" on its own
 * leaves the reader checking the table underneath anyway. Returns null when
 * the hours were never recorded, so the page can say nothing rather than
 * guess — telling somebody a place is shut when nobody checked sends them
 * somewhere else for no reason.
 */
export function openStateNow(hours: WeekHours, now = new Date()): OpenState {
  const today = weekdayOf(now);
  const minutes = minutesOf(now);
  const open = isOpenAt(hours, today, minutes);

  if (open === null) return { open: null, label: null, today };

  const day = hours[today];
  if (open && day?.close) {
    return { open: true, label: `Open until ${formatTime(day.close)}`, today };
  }

  // Closed. The useful thing is when it opens again, which may be later today
  // or on the next day that has hours at all.
  if (day?.open && minutes < toMinutes(day.open)) {
    return { open: false, label: `Closed · opens ${formatTime(day.open)}`, today };
  }

  const todayIndex = WEEKDAYS.indexOf(today);
  for (let step = 1; step <= 7; step++) {
    const next = WEEKDAYS[(todayIndex + step) % 7];
    const entry = hours[next];
    if (entry?.open) {
      const when = step === 1 ? "tomorrow" : WEEKDAY_LABEL[next];
      return { open: false, label: `Closed · opens ${formatTime(entry.open)} ${when}`, today };
    }
  }

  return { open: false, label: "Closed", today };
}

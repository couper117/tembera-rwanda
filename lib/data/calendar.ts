import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  kigaliToday,
  upcomingObservance,
  type Effect,
  type Observance,
  type UpcomingObservance,
} from "@/lib/rwanda/calendar";

export const CALENDAR_TAG = "calendar";

/**
 * The dates an admin has entered — Eid and anything else that cannot be
 * calculated. Everything derivable lives in lib/rwanda/calendar.ts.
 */
const getAdminDates = unstable_cache(
  async (): Promise<Observance[]> => {
    const rows = await prisma.calendarDate.findMany({ orderBy: { date: "asc" } });
    return rows.map((row) => ({
      // Admin dates are holidays by definition — the derived list covers the
      // commemoration and community-work kinds.
      kind: "holiday" as const,
      name: row.name,
      // The column is a plain DATE, so the UTC parts are the calendar date as
      // typed. Reading local parts here would shift it on a westward server.
      day: {
        year: row.date.getUTCFullYear(),
        month: row.date.getUTCMonth() + 1,
        day: row.date.getUTCDate(),
      },
      effect: (row.effect as Effect) ?? "closed",
      note: row.note || "A public holiday. Many places are closed or on reduced hours.",
    }));
  },
  ["calendar-dates"],
  { tags: [CALENDAR_TAG] },
);

/**
 * The next closure worth warning someone about, or null on a quiet week.
 *
 * Null is the common answer and the banner is hidden entirely for it — a
 * notice that is always on stops being read.
 */
export async function currentNotice(
  withinDays = 3,
): Promise<UpcomingObservance | null> {
  const extra = await getAdminDates();
  return upcomingObservance(kigaliToday(), extra, withinDays);
}

/** Everything on the calendar for a year, for the admin screen. */
export async function adminCalendarDates() {
  return prisma.calendarDate.findMany({ orderBy: { date: "asc" } });
}

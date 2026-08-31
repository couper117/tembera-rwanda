import {
  kigaliToday,
  upcomingObservance,
  type UpcomingObservance,
} from "@/lib/rwanda/calendar";

/**
 * The next closure worth warning someone about, or null on a quiet week.
 *
 * Everything here is derived — Umuganda and the fixed public holidays are
 * calculated in lib/rwanda/calendar.ts. Dates that cannot be calculated (Eid
 * moves with the lunar year) used to come from an admin table; with no
 * backend there is nowhere to enter them, so they are simply absent rather
 * than approximated.
 *
 * Null is the common answer and the banner is hidden entirely for it — a
 * notice that is always on stops being read.
 */
export async function currentNotice(
  withinDays = 3,
): Promise<UpcomingObservance | null> {
  return upcomingObservance(kigaliToday(), [], withinDays);
}

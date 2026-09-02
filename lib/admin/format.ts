/**
 * Shared formatting for the admin screens.
 *
 * This was the one live function in lib/admin/placeholder.ts, a 472-line file
 * of sample rows from the build that had no database. The rows are gone now
 * that every admin screen reads Postgres; the date format is not, and it does
 * not belong in a module named for mock data.
 */

/** "20 Aug 2026" — one date format across every admin screen. */
export function adminDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

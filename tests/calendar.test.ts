import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  addDays,
  daysBetween,
  derivedHolidays,
  easterSunday,
  goodFriday,
  isInMourningWeek,
  isUmuganda,
  kigaliToday,
  nextUmuganda,
  observancesOn,
  umuganura,
  umugandaFor,
  upcomingObservance,
  weekdayOf,
  whenLabel,
  type CalendarDay,
} from "../lib/rwanda/calendar";

const d = (year: number, month: number, day: number): CalendarDay => ({
  year,
  month,
  day,
});

describe("kigaliToday", () => {
  test("uses Rwandan time, not the server's", () => {
    // 22:30 UTC is already the next day in Kigali (UTC+2). A server in UTC
    // would otherwise be a day behind and could announce Umuganda early.
    const late = new Date("2026-08-19T22:30:00Z");
    assert.deepEqual(kigaliToday(late), d(2026, 8, 20));
  });

  test("does not roll over too early", () => {
    const evening = new Date("2026-08-19T21:30:00Z"); // 23:30 in Kigali
    assert.deepEqual(kigaliToday(evening), d(2026, 8, 19));
  });

  test("handles a month boundary", () => {
    const boundary = new Date("2026-08-31T22:10:00Z"); // 00:10 on 1 Sept
    assert.deepEqual(kigaliToday(boundary), d(2026, 9, 1));
  });
});

describe("date helpers", () => {
  test("daysBetween counts forwards and backwards", () => {
    assert.equal(daysBetween(d(2026, 1, 1), d(2026, 1, 8)), 7);
    assert.equal(daysBetween(d(2026, 1, 8), d(2026, 1, 1)), -7);
    assert.equal(daysBetween(d(2026, 1, 1), d(2026, 1, 1)), 0);
  });

  test("daysBetween crosses months and years", () => {
    assert.equal(daysBetween(d(2026, 12, 31), d(2027, 1, 1)), 1);
    assert.equal(daysBetween(d(2024, 2, 28), d(2024, 3, 1)), 2, "2024 is a leap year");
  });

  test("addDays rolls over correctly", () => {
    assert.deepEqual(addDays(d(2026, 12, 31), 1), d(2027, 1, 1));
    assert.deepEqual(addDays(d(2026, 3, 1), -1), d(2026, 2, 28));
  });
});

describe("Umuganda — the last Saturday of the month", () => {
  test("is always a Saturday", () => {
    for (let month = 1; month <= 12; month++) {
      const day = umugandaFor(2026, month);
      assert.equal(weekdayOf(day), 6, `${2026}-${month} should be a Saturday`);
    }
  });

  test("is always in the last seven days of the month", () => {
    // The defining property: no later Saturday exists in that month.
    for (let year = 2024; year <= 2030; year++) {
      for (let month = 1; month <= 12; month++) {
        const day = umugandaFor(year, month);
        const aWeekLater = addDays(day, 7);
        assert.notEqual(
          aWeekLater.month,
          month,
          `${year}-${month}: a later Saturday exists in the same month`,
        );
      }
    }
  });

  test("known dates", () => {
    // 29 August 2026 is a Saturday, and the last one that month.
    assert.deepEqual(umugandaFor(2026, 8), d(2026, 8, 29));
    // 31 January 2026 is a Saturday.
    assert.deepEqual(umugandaFor(2026, 1), d(2026, 1, 31));
    // February 2026 ends on Saturday the 28th.
    assert.deepEqual(umugandaFor(2026, 2), d(2026, 2, 28));
  });

  test("isUmuganda agrees with umugandaFor", () => {
    assert.equal(isUmuganda(d(2026, 8, 29)), true);
    assert.equal(isUmuganda(d(2026, 8, 22)), false, "the Saturday before is not");
    assert.equal(isUmuganda(d(2026, 8, 28)), false, "the Friday is not");
  });

  test("nextUmuganda finds today's when today is one", () => {
    assert.deepEqual(nextUmuganda(d(2026, 8, 29)), d(2026, 8, 29));
  });

  test("nextUmuganda looks ahead within the month", () => {
    assert.deepEqual(nextUmuganda(d(2026, 8, 1)), d(2026, 8, 29));
  });

  test("nextUmuganda rolls into the following month once passed", () => {
    assert.deepEqual(nextUmuganda(d(2026, 8, 30)), d(2026, 9, 26));
  });

  test("nextUmuganda rolls across the year boundary", () => {
    const next = nextUmuganda(d(2026, 12, 30));
    assert.equal(next.year, 2027);
    assert.equal(next.month, 1);
    assert.equal(weekdayOf(next), 6);
  });
});

describe("Easter and Good Friday", () => {
  test("known Easter Sundays", () => {
    assert.deepEqual(easterSunday(2024), d(2024, 3, 31));
    assert.deepEqual(easterSunday(2025), d(2025, 4, 20));
    assert.deepEqual(easterSunday(2026), d(2026, 4, 5));
    assert.deepEqual(easterSunday(2027), d(2027, 3, 28));
  });

  test("Easter always falls on a Sunday", () => {
    for (let year = 2020; year <= 2040; year++) {
      assert.equal(weekdayOf(easterSunday(year)), 0, `Easter ${year}`);
    }
  });

  test("Good Friday is two days before, and a Friday", () => {
    for (let year = 2024; year <= 2035; year++) {
      const friday = goodFriday(year);
      assert.equal(weekdayOf(friday), 5, `Good Friday ${year}`);
      assert.equal(daysBetween(friday, easterSunday(year)), 2);
    }
  });
});

describe("Umuganura — first Friday of August", () => {
  test("is always a Friday in early August", () => {
    for (let year = 2024; year <= 2032; year++) {
      const day = umuganura(year);
      assert.equal(day.month, 8);
      assert.equal(weekdayOf(day), 5, `Umuganura ${year}`);
      assert.ok(day.day <= 7, "must be the first Friday");
    }
  });

  test("known date", () => {
    assert.deepEqual(umuganura(2026), d(2026, 8, 7));
  });
});

describe("public holidays", () => {
  test("includes the fixed national days", () => {
    const names = derivedHolidays(2026).map((h) => h.name);
    for (const expected of [
      "New Year's Day",
      "National Heroes' Day",
      "Labour Day",
      "Independence Day",
      "Liberation Day",
      "Assumption Day",
      "Christmas Day",
    ]) {
      assert.ok(names.some((n) => n === expected), `missing ${expected}`);
    }
  });

  test("7 April is marked as commemoration, not an ordinary holiday", () => {
    const april7 = derivedHolidays(2026).find(
      (h) => h.day.month === 4 && h.day.day === 7,
    );
    assert.equal(april7?.kind, "commemoration");
    assert.match(april7?.note ?? "", /mourning/i);
  });

  test("does not invent Eid dates", () => {
    // Eid follows the lunar calendar and cannot be derived. Guessing it would
    // be worse than omitting it — those dates come from the admin table.
    const names = derivedHolidays(2026).map((h) => h.name.toLowerCase());
    assert.ok(!names.some((n) => n.includes("eid")), "Eid must not be computed");
  });
});

describe("mourning week", () => {
  test("covers 7 to 13 April", () => {
    assert.equal(isInMourningWeek(d(2026, 4, 7)), true);
    assert.equal(isInMourningWeek(d(2026, 4, 13)), true);
    assert.equal(isInMourningWeek(d(2026, 4, 6)), false);
    assert.equal(isInMourningWeek(d(2026, 4, 14)), false);
  });
});

describe("observancesOn", () => {
  test("an ordinary day has nothing", () => {
    assert.deepEqual(observancesOn(d(2026, 8, 12)), []);
  });

  test("finds Umuganda", () => {
    const found = observancesOn(d(2026, 8, 29));
    assert.equal(found.length, 1);
    assert.equal(found[0].kind, "umuganda");
    assert.equal(found[0].effect, "closed-morning");
  });

  test("finds Christmas", () => {
    const found = observancesOn(d(2026, 12, 25));
    assert.equal(found[0].name, "Christmas Day");
    assert.equal(found[0].effect, "closed");
  });

  test("reports a full closure before a morning one", () => {
    // If a holiday and Umuganda ever land together, the worse effect leads.
    const extra = [
      {
        kind: "holiday" as const,
        name: "Test Holiday",
        day: d(2026, 8, 29),
        effect: "closed" as const,
        note: "test",
      },
    ];
    const found = observancesOn(d(2026, 8, 29), extra);
    assert.equal(found.length, 2);
    assert.equal(found[0].effect, "closed", "the full closure must lead");
  });

  test("includes admin-supplied dates such as Eid", () => {
    const extra = [
      {
        kind: "holiday" as const,
        name: "Eid al-Fitr",
        day: d(2026, 3, 20),
        effect: "closed" as const,
        note: "test",
      },
    ];
    assert.equal(observancesOn(d(2026, 3, 20), extra)[0].name, "Eid al-Fitr");
    assert.deepEqual(observancesOn(d(2026, 3, 21), extra), []);
  });

  test("commemoration week days are marked reduced", () => {
    const found = observancesOn(d(2026, 4, 10));
    assert.equal(found[0].kind, "commemoration");
    assert.equal(found[0].effect, "reduced");
  });
});

describe("upcomingObservance", () => {
  test("says nothing on a quiet stretch", () => {
    assert.equal(upcomingObservance(d(2026, 8, 10), [], 3), null);
  });

  test("finds today's", () => {
    const found = upcomingObservance(d(2026, 8, 29), [], 3);
    assert.equal(found?.daysAway, 0);
    assert.equal(found?.observance.kind, "umuganda");
  });

  test("looks ahead within the window", () => {
    const found = upcomingObservance(d(2026, 8, 27), [], 3);
    assert.equal(found?.daysAway, 2, "Umuganda is two days later");
  });

  test("ignores anything beyond the window", () => {
    assert.equal(upcomingObservance(d(2026, 8, 20), [], 3), null);
  });
});

describe("whenLabel", () => {
  test("names the near days plainly", () => {
    assert.equal(whenLabel(0, d(2026, 8, 29)), "today");
    assert.equal(whenLabel(1, d(2026, 8, 29)), "tomorrow");
  });

  test("uses the weekday further out", () => {
    assert.equal(whenLabel(2, d(2026, 8, 29)), "on Saturday");
  });
});

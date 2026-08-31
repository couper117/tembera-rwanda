import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  isOpenAt,
  parseWeekHours,
  summariseWeek,
  toMinutes,
  type WeekHours,
} from "../lib/places/hours";

describe("parseWeekHours", () => {
  test("reads a well-formed week", () => {
    const parsed = parseWeekHours({
      mon: { open: "08:00", close: "18:00" },
      sun: { open: null, close: null },
    });
    assert.deepEqual(parsed.mon, { open: "08:00", close: "18:00" });
    assert.deepEqual(parsed.sun, { open: null, close: null });
  });

  test("a day that is absent stays absent", () => {
    // "Not known" and "closed" are different answers, and conflating them
    // would have the site claim a place is shut when nobody checked.
    const parsed = parseWeekHours({ mon: { open: "08:00", close: "18:00" } });
    assert.equal("tue" in parsed, false);
    assert.equal(parsed.tue, undefined);
  });

  test("drops malformed times rather than trusting the column", () => {
    const parsed = parseWeekHours({
      mon: { open: "25:00", close: "18:00" },
      tue: { open: "08:00" },
      wed: { open: "0800", close: "1800" },
      thu: "open all day",
    });
    assert.deepEqual(parsed, {});
  });

  test("survives junk", () => {
    assert.deepEqual(parseWeekHours(null), {});
    assert.deepEqual(parseWeekHours("closed"), {});
    assert.deepEqual(parseWeekHours([1, 2, 3]), {});
    assert.deepEqual(parseWeekHours(undefined), {});
  });
});

describe("summariseWeek", () => {
  test("collapses a run of identical days", () => {
    const week: WeekHours = {
      mon: { open: "08:00", close: "18:00" },
      tue: { open: "08:00", close: "18:00" },
      wed: { open: "08:00", close: "18:00" },
      thu: { open: "08:00", close: "18:00" },
      fri: { open: "08:00", close: "18:00" },
      sat: { open: "09:00", close: "13:00" },
      sun: { open: null, close: null },
    };
    assert.equal(summariseWeek(week), "Mon–Fri 8am–6pm · Sat 9am–1pm · Sun closed");
  });

  test("keeps a single day on its own", () => {
    assert.equal(
      summariseWeek({ sat: { open: "09:30", close: "12:00" } }),
      "Sat 9.30am–12pm",
    );
  });

  test("nothing recorded is null, not an empty string", () => {
    assert.equal(summariseWeek({}), null);
  });
});

describe("isOpenAt", () => {
  const week: WeekHours = {
    mon: { open: "08:00", close: "18:00" },
    tue: { open: null, close: null },
    fri: { open: "20:00", close: "02:00" },
  };

  test("inside the range", () => {
    assert.equal(isOpenAt(week, "mon", toMinutes("12:00")), true);
  });

  test("before opening and after closing", () => {
    assert.equal(isOpenAt(week, "mon", toMinutes("07:59")), false);
    assert.equal(isOpenAt(week, "mon", toMinutes("18:00")), false);
  });

  test("a day marked closed is closed", () => {
    assert.equal(isOpenAt(week, "tue", toMinutes("12:00")), false);
  });

  test("a day nobody recorded answers null, not false", () => {
    assert.equal(isOpenAt(week, "wed", toMinutes("12:00")), null);
  });

  test("a closing time before the opening one crosses midnight", () => {
    assert.equal(isOpenAt(week, "fri", toMinutes("23:00")), true);
    assert.equal(isOpenAt(week, "fri", toMinutes("01:00")), true);
    assert.equal(isOpenAt(week, "fri", toMinutes("03:00")), false);
    assert.equal(isOpenAt(week, "fri", toMinutes("19:59")), false);
  });
});

import test from "node:test";
import assert from "node:assert/strict";

import {
  enumerateDatesBetweenExclusive,
  enumerateDatesInclusive,
  classifyDayType,
} from "../src/next-order-list.js";

test("pre-arrival window: strictly after the count date, through the day before shipment", () => {
  const dates = enumerateDatesBetweenExclusive("2026-08-06", "2026-08-10");
  assert.deepEqual(dates, ["2026-08-07", "2026-08-08", "2026-08-09"]);
});

test("post-arrival window: shipment date through plan-stock-through date, inclusive", () => {
  const dates = enumerateDatesInclusive("2026-08-10", "2026-08-23");
  assert.equal(dates.length, 14);
  assert.equal(dates[0], "2026-08-10");
  assert.equal(dates[dates.length - 1], "2026-08-23");
});

test("classifyDayType labels Fri/Sat/Sun separately from Mon-Thu", () => {
  assert.equal(classifyDayType("2026-08-06"), "mon-thu"); // Thursday
  assert.equal(classifyDayType("2026-08-10"), "mon-thu"); // Monday
  assert.equal(classifyDayType("2026-08-07"), "fri-sun"); // Friday
  assert.equal(classifyDayType("2026-08-08"), "fri-sun"); // Saturday
  assert.equal(classifyDayType("2026-08-09"), "fri-sun"); // Sunday
});

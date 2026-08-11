import test from "node:test";
import assert from "node:assert/strict";

import { calculateDaysOfSupply } from "../src/next-order-list.js";

const RATES = { "mon-thu": 84, "fri-sun": 156 };

test("real croissant dough count (768 pieces on Mon 2026-08-10): walks forward day-by-day using the correct weekday rate, not a flattened average", () => {
  // Count happens after closing, so consumption starts the next calendar
  // day: Tue 84, Wed 84, Thu 84, Fri 156, Sat 156, Sun 156 = 720 total,
  // leaving 48 pieces - not enough to cover the following Monday's 84, so
  // supply runs out during that Monday. Six full days are covered.
  const result = calculateDaysOfSupply({
    onHandPieces: 768,
    countDate: "2026-08-10",
    dailyUsageByDayType: RATES,
  });

  assert.equal(result.status, "ok");
  assert.equal(result.daysOfSupply, 6);
  assert.equal(result.throughDate, "2026-08-16");
});

test("a flattened average would be wrong here: two comparable on-hand pieces run out on different dates depending on which weekdays they cover", () => {
  // Same on-hand total, but starting from a Friday means the higher fri-sun
  // rate is front-loaded - it must run out sooner than the Monday case
  // above despite identical starting stock.
  const result = calculateDaysOfSupply({
    onHandPieces: 768,
    countDate: "2026-08-14", // Friday
    dailyUsageByDayType: RATES,
  });

  // Sat 156, Sun 156, Mon 84, Tue 84, Wed 84, Thu 84 = 648, leaving 120 -
  // not enough for the next Friday's 156, so it runs out that Friday.
  assert.equal(result.daysOfSupply, 6);
  assert.equal(result.throughDate, "2026-08-20");
});

test("zero on-hand pieces is already out - zero days of supply, no through-date", () => {
  const result = calculateDaysOfSupply({
    onHandPieces: 0,
    countDate: "2026-08-10",
    dailyUsageByDayType: RATES,
  });

  assert.equal(result.status, "already out");
  assert.equal(result.daysOfSupply, 0);
  assert.equal(result.throughDate, null);
});

test("stock that runs out exactly at a day boundary still counts that day as fully covered", () => {
  // Tue 84 exactly empties it.
  const result = calculateDaysOfSupply({
    onHandPieces: 84,
    countDate: "2026-08-10",
    dailyUsageByDayType: RATES,
  });

  assert.equal(result.daysOfSupply, 1);
  assert.equal(result.throughDate, "2026-08-11");
});

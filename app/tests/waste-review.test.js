import test from "node:test";
import assert from "node:assert/strict";

import { calculateWasteFlag } from "../src/waste-review.js";

test("Almond Croissant (real simulated data): leftover is stable across comparable days, not flagged", () => {
  // produced 12/day, sold [6,5,7,6] -> leftover rate [.5, .583, .417, .5]
  const result = calculateWasteFlag({
    producedQuantity: 12,
    comparableDays: [
      { sold: 6 },
      { sold: 5 },
      { sold: 7 },
      { sold: 6 },
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.isUnusuallyHigh, false);
});

test("a clear leftover spike on the most recent day is flagged as unusually high", () => {
  const result = calculateWasteFlag({
    producedQuantity: 10,
    comparableDays: [{ sold: 8 }, { sold: 8 }, { sold: 8 }, { sold: 2 }],
  });

  // history leftover rate .2, most recent .8 -> 300% above baseline
  assert.equal(result.isUnusuallyHigh, true);
  assert.equal(result.mostRecentLeftover, 8);
  assert.ok(result.percentAboveBaseline > 0.5);
});

test("exactly 50% above baseline is not flagged (threshold is strictly more than 50%)", () => {
  const result = calculateWasteFlag({
    producedQuantity: 20,
    comparableDays: [{ sold: 16 }, { sold: 16 }, { sold: 16 }, { sold: 14 }],
  });

  // history leftover rate .2, most recent 6/20=.3 -> exactly 50% above
  assert.ok(Math.abs(result.percentAboveBaseline - 0.5) < 1e-9);
  assert.equal(result.isUnusuallyHigh, false);
});

test("a baseline of zero leftover with any leftover today is still flagged, not a division error", () => {
  const result = calculateWasteFlag({
    producedQuantity: 10,
    comparableDays: [{ sold: 10 }, { sold: 10 }, { sold: 10 }, { sold: 5 }],
  });

  assert.equal(result.isUnusuallyHigh, true);
});

test("fewer than 3 comparable days shows Building comparable-day baseline, not an invented flag", () => {
  const result = calculateWasteFlag({
    producedQuantity: 12,
    comparableDays: [{ sold: 6 }, { sold: 5 }],
  });

  assert.equal(result.status, "Building comparable-day baseline");
  assert.equal(result.isUnusuallyHigh, null);
  assert.equal(result.outcome, "Information incomplete");
});

test("a flagged day with a recorded reason is a Known one-time event", () => {
  const result = calculateWasteFlag({
    producedQuantity: 10,
    comparableDays: [
      { sold: 8 },
      { sold: 8 },
      { sold: 8 },
      { sold: 2, unusualContext: "Sudden rain kept customers away" },
    ],
  });

  assert.equal(result.isUnusuallyHigh, true);
  assert.equal(result.outcome, "Known one-time event");
});

test("a flagged day with no recorded reason is a Possible repeated baseline problem", () => {
  const result = calculateWasteFlag({
    producedQuantity: 10,
    comparableDays: [{ sold: 8 }, { sold: 8 }, { sold: 8 }, { sold: 2 }],
  });

  assert.equal(result.isUnusuallyHigh, true);
  assert.equal(result.outcome, "Possible repeated baseline problem");
});

test("Kimchi Croquette (real simulated data): exactly 50% above baseline, not flagged despite floating-point rounding", () => {
  // history leftover [2,0,4] of 15 -> rate .1333; most recent leftover 3/15=.2
  // = exactly 50% above baseline (.2 / .1333 = 1.5), which floating-point
  // division computes as 0.5000000000000001, not exactly 0.5 - must not
  // flip this boundary case to "flagged" because of that rounding noise.
  const result = calculateWasteFlag({
    producedQuantity: 15,
    comparableDays: [{ sold: 13 }, { sold: 15 }, { sold: 11 }, { sold: 12 }],
  });

  assert.equal(result.isUnusuallyHigh, false);
});

test("a product with stable leftovers has no outcome label at all", () => {
  const result = calculateWasteFlag({
    producedQuantity: 12,
    comparableDays: [{ sold: 6 }, { sold: 5 }, { sold: 7 }, { sold: 6 }],
  });

  assert.equal(result.outcome, null);
});

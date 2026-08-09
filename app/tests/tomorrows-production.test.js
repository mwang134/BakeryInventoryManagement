import test from "node:test";
import assert from "node:assert/strict";

import { calculateProductionSuggestion } from "../src/tomorrows-production.js";

// Rows pulled from data/tomorrows-production-SIMULATED-comparable-day-sales.csv
// (SIMULATED, not real - see that file's companion .md for how it was built).

test("Croissant: moderate quantity change plus unusual context from a sellout day", () => {
  const result = calculateProductionSuggestion({
    currentQuantity: 12,
    comparableDays: [
      { sold: 10 },
      { sold: 12, sellout: true },
      { sold: 9 },
      { sold: 11 },
    ],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.suggestedQuantity, 11); // avg 10.5 rounds to 11
  assert.equal(result.changeLabel, "Quantity change");
  assert.equal(result.hasUnusualContext, true);
  assert.deepEqual(result.unusualContextNotes, ["Sellout"]);
});

test("Almond Croissant: chronic leftovers produce a Large Quantity Change, no unusual context", () => {
  const result = calculateProductionSuggestion({
    currentQuantity: 12,
    comparableDays: [{ sold: 6 }, { sold: 5 }, { sold: 7 }, { sold: 6 }],
  });

  assert.equal(result.status, "ok");
  assert.equal(result.suggestedQuantity, 6); // avg 6
  assert.equal(result.changeLabel, "Large Quantity Change"); // |6-12|/12 = 50%
  assert.equal(result.hasUnusualContext, false);
});

test("Kimchi Croquette: a recorded promotion event surfaces as unusual context with its note", () => {
  const result = calculateProductionSuggestion({
    currentQuantity: 15,
    comparableDays: [
      { sold: 13 },
      { sold: 15, sellout: true, unusualContext: "Local food festival promotion nearby" },
      { sold: 11 },
      { sold: 12 },
    ],
  });

  assert.equal(result.suggestedQuantity, 13); // avg 12.75 rounds to 13
  assert.equal(result.changeLabel, "Quantity change"); // |13-15|/15 = 13.3%
  assert.equal(result.hasUnusualContext, true);
  assert.deepEqual(result.unusualContextNotes, ["Local food festival promotion nearby"]);
});

test("fewer than 3 comparable days shows Limited evidence instead of a confident suggestion", () => {
  const result = calculateProductionSuggestion({
    currentQuantity: 12,
    comparableDays: [{ sold: 10 }, { sold: 11 }],
  });

  assert.equal(result.status, "Limited evidence");
  assert.equal(result.suggestedQuantity, null);
  assert.equal(result.changeLabel, null);
});

test("a comparable day with missing sold data does not count toward the evidence minimum", () => {
  const result = calculateProductionSuggestion({
    currentQuantity: 12,
    comparableDays: [{ sold: 10 }, { sold: 11 }, { sold: undefined }, { sold: 9 }],
  });

  // Only 3 of the 4 days have real data, which still meets the minimum -
  // but the missing day must not be silently treated as 0.
  assert.equal(result.status, "ok");
  assert.equal(result.suggestedQuantity, 10); // avg of 10, 11, 9 = 10
});

test("a comparable day with missing data that drops evidence below the minimum shows Limited evidence", () => {
  const result = calculateProductionSuggestion({
    currentQuantity: 12,
    comparableDays: [{ sold: 10 }, { sold: undefined }, { sold: undefined }, { sold: 9 }],
  });

  assert.equal(result.status, "Limited evidence");
});

test("suggested quantity matching current produces no change label", () => {
  const result = calculateProductionSuggestion({
    currentQuantity: 10,
    comparableDays: [{ sold: 10 }, { sold: 10 }, { sold: 10 }],
  });

  assert.equal(result.suggestedQuantity, 10);
  assert.equal(result.changeLabel, null);
  assert.equal(result.hasUnusualContext, false);
});

test("a weekend-only item with a zero current quantity treats any suggested production as a large change", () => {
  const result = calculateProductionSuggestion({
    currentQuantity: 0,
    comparableDays: [{ sold: 8 }, { sold: 10 }, { sold: 9 }],
  });

  assert.equal(result.suggestedQuantity, 9);
  assert.equal(result.changeLabel, "Large Quantity Change");
});

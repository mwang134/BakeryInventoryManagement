import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateProductionSuggestion,
  needsReview,
  resolveManagerDecision,
  canFinalizeProductionPlan,
} from "../src/tomorrows-production.js";

test("needsReview is true for any flagged product (change label, unusual context, or limited evidence)", () => {
  const quantityChange = calculateProductionSuggestion({
    currentQuantity: 12,
    comparableDays: [{ sold: 10 }, { sold: 11 }, { sold: 10 }],
  });
  assert.equal(needsReview(quantityChange), true);

  const unusualOnly = calculateProductionSuggestion({
    currentQuantity: 10,
    comparableDays: [{ sold: 10 }, { sold: 10, sellout: true }, { sold: 10 }],
  });
  assert.equal(unusualOnly.changeLabel, null);
  assert.equal(needsReview(unusualOnly), true);

  const limited = calculateProductionSuggestion({
    currentQuantity: 12,
    comparableDays: [{ sold: 10 }],
  });
  assert.equal(needsReview(limited), true);
});

test("needsReview is false for a product with no change and no unusual context", () => {
  const normal = calculateProductionSuggestion({
    currentQuantity: 10,
    comparableDays: [{ sold: 10 }, { sold: 10 }, { sold: 10 }],
  });
  assert.equal(needsReview(normal), false);
});

test("resolveManagerDecision: Use suggestion, Keep current, and Set custom quantity", () => {
  const suggestion = calculateProductionSuggestion({
    currentQuantity: 12,
    comparableDays: [{ sold: 6 }, { sold: 5 }, { sold: 7 }],
  });

  const useSuggestion = resolveManagerDecision({
    suggestion,
    currentQuantity: 12,
    action: "use-suggestion",
  });
  assert.equal(useSuggestion.finalQuantity, 6);
  assert.equal(useSuggestion.action, "use-suggestion");

  const keepCurrent = resolveManagerDecision({
    suggestion,
    currentQuantity: 12,
    action: "keep-current",
  });
  assert.equal(keepCurrent.finalQuantity, 12);

  const custom = resolveManagerDecision({
    suggestion,
    currentQuantity: 12,
    action: "custom",
    customQuantity: 9,
  });
  assert.equal(custom.finalQuantity, 9);
});

test("resolveManagerDecision rejects Use suggestion when evidence is limited (no number to use)", () => {
  const limited = calculateProductionSuggestion({
    currentQuantity: 12,
    comparableDays: [{ sold: 10 }],
  });

  assert.throws(() =>
    resolveManagerDecision({ suggestion: limited, currentQuantity: 12, action: "use-suggestion" }),
  );
});

test("canFinalizeProductionPlan blocks until every flagged product has a manager decision", () => {
  const flagged = calculateProductionSuggestion({
    currentQuantity: 12,
    comparableDays: [{ sold: 6 }, { sold: 5 }, { sold: 7 }],
  });
  const normal = calculateProductionSuggestion({
    currentQuantity: 10,
    comparableDays: [{ sold: 10 }, { sold: 10 }, { sold: 10 }],
  });

  const blocked = canFinalizeProductionPlan({
    products: [
      { id: "almond", suggestion: flagged, reviewAction: null },
      { id: "plain", suggestion: normal, reviewAction: null },
    ],
  });
  assert.equal(blocked.canFinalize, false);
  assert.equal(blocked.unreviewedCount, 1);
  assert.deepEqual(blocked.unreviewedProductIds, ["almond"]);

  const ready = canFinalizeProductionPlan({
    products: [
      { id: "almond", suggestion: flagged, reviewAction: { action: "use-suggestion", finalQuantity: 6 } },
      { id: "plain", suggestion: normal, reviewAction: null },
    ],
  });
  assert.equal(ready.canFinalize, true);
  assert.equal(ready.unreviewedCount, 0);
});

test("opening a row/chart alone (no reviewAction) does not count as review", () => {
  const flagged = calculateProductionSuggestion({
    currentQuantity: 12,
    comparableDays: [{ sold: 6 }, { sold: 5 }, { sold: 7 }],
  });

  const result = canFinalizeProductionPlan({
    products: [{ id: "almond", suggestion: flagged, reviewAction: null, wasOpened: true }],
  });
  assert.equal(result.canFinalize, false);
});

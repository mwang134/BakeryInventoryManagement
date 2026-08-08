import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateDraftTotals,
  calculateRecommendation,
  finalizeWorksheet,
} from "../src/reorder.js";

test("recommends a supplier-minimum order when counted stock misses the coverage target", () => {
  const result = calculateRecommendation({
    fullBoxes: 2,
    partialPieces: 12,
    piecesPerBox: 48,
    typicalDailySales: 22,
    coverageTargetDays: 7,
    incomingBoxes: 0,
    minimumOrderBoxes: 2,
  });

  assert.equal(result.onHandPieces, 108);
  assert.equal(result.daysOfSupply, 4.9);
  assert.equal(result.suggestedBoxes, 2);
  assert.equal(result.decision, "order");
  assert.match(result.reason, /below the 7-day target/i);
});

test("flags stock well above the coverage target as overstock", () => {
  const result = calculateRecommendation({
    fullBoxes: 6,
    partialPieces: 30,
    piecesPerBox: 60,
    typicalDailySales: 31,
    coverageTargetDays: 7,
    incomingBoxes: 0,
    minimumOrderBoxes: 1,
  });

  assert.equal(result.onHandPieces, 390);
  assert.equal(result.daysOfSupply, 12.6);
  assert.equal(result.suggestedBoxes, 0);
  assert.equal(result.decision, "overstock");
  assert.match(result.reason, /skip/i);
});

test("calculates manager-edited draft cost and projected freezer capacity", () => {
  const totals = calculateDraftTotals({
    currentBoxes: 14.25,
    freezerCapacityBoxes: 24,
    rows: [
      { managerOrderBoxes: 0, costPerBox: 30 },
      { managerOrderBoxes: 2, costPerBox: 28 },
      { managerOrderBoxes: 0, costPerBox: 32 },
      { managerOrderBoxes: 2, costPerBox: 35 },
    ],
  });

  assert.equal(totals.totalOrderBoxes, 4);
  assert.equal(totals.draftCost, 126);
  assert.equal(totals.projectedCapacityPercent, 76);
});

test("finalizes an internal worksheet without sending a supplier order", () => {
  const finalized = finalizeWorksheet(
    { status: "draft", rows: [{ productId: "chocolate", managerOrderBoxes: 2 }] },
    { managerInitials: "MW", finalizedAt: "2026-07-22T18:00:00Z" },
  );

  assert.equal(finalized.status, "final");
  assert.equal(finalized.managerInitials, "MW");
  assert.equal(finalized.finalizedAt, "2026-07-22T18:00:00Z");
  assert.equal(finalized.supplierOrderSent, false);
});

import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateRestockNeed,
  calculateSupplierWaste,
  calculateZoneCapacity,
  groupActionsByUrgency,
} from "../src/dashboard.js";

test("groups manager actions in act-now, review-today, then plan-next order", () => {
  const grouped = groupActionsByUrgency([
    { id: "waste", urgency: "plan-next" },
    { id: "count", urgency: "review-today" },
    { id: "stockout", urgency: "act-now" },
  ]);

  assert.deepEqual(Object.keys(grouped), ["act-now", "review-today", "plan-next"]);
  assert.deepEqual(grouped["act-now"].map((item) => item.id), ["stockout"]);
  assert.deepEqual(grouped["review-today"].map((item) => item.id), ["count"]);
  assert.deepEqual(grouped["plan-next"].map((item) => item.id), ["waste"]);
});

test("calculates supplier waste cost and ranks affected pastries by cost", () => {
  const result = calculateSupplierWaste([
    { id: "croissant", leftoverUnits: 8, supplierCostPerUnit: 0.5 },
    { id: "ham", leftoverUnits: 3, supplierCostPerUnit: 0.8 },
  ]);

  assert.equal(result.totalSupplierWasteCost, 6.4);
  assert.deepEqual(result.affectedProducts.map((item) => item.id), ["croissant", "ham"]);
  assert.equal(result.affectedProducts[0].supplierWasteCost, 4);
});

test("labels projected zone capacity as comfortable, limited, or blocked", () => {
  assert.equal(
    calculateZoneCapacity({ currentUnits: 6, incomingUnits: 1, practicalCapacity: 8, hardCapacity: 10 }).status,
    "comfortable",
  );
  assert.equal(
    calculateZoneCapacity({ currentUnits: 6, incomingUnits: 3, practicalCapacity: 8, hardCapacity: 10 }).status,
    "limited",
  );
  assert.equal(
    calculateZoneCapacity({ currentUnits: 6, incomingUnits: 5, practicalCapacity: 8, hardCapacity: 10 }).status,
    "blocked",
  );
});

test("suggests boxes for the projected shortfall before the next ordering opportunity", () => {
  const result = calculateRestockNeed({
    onHandPieces: 80,
    expectedUsageUntilNextOrder: 140,
    piecesPerBox: 40,
    minimumOrderBoxes: 1,
  });

  assert.equal(result.shortagePieces, 60);
  assert.equal(result.suggestedBoxes, 2);
  assert.equal(result.atRisk, true);
});

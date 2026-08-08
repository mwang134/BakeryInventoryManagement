import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateAggregatedDoughDemand,
  sumDoughDemandAcrossDates,
} from "../src/next-order-list.js";

// The real croissant-dough mapping: six pastries, each confirmed to use
// exactly 1 dough piece per planned pastry (data/redacted-sku-contracts/croissant-dough.md).
const croissantDoughMapping = [
  { pastryKey: "croissant", plannedQuantity: 12, doughPiecesPerPastry: 1 },
  { pastryKey: "strawberry-croissant", plannedQuantity: 24, doughPiecesPerPastry: 1 },
  { pastryKey: "crookie", plannedQuantity: 12, doughPiecesPerPastry: 1 },
  { pastryKey: "almond-croissant", plannedQuantity: 12, doughPiecesPerPastry: 1 },
  { pastryKey: "chocolate-croissant", plannedQuantity: 12, doughPiecesPerPastry: 1 },
  { pastryKey: "garlic-cheese-croissant", plannedQuantity: 12, doughPiecesPerPastry: 1 },
];

test("D1: several pastries mapped to one dough SKU are summed exactly once (Mon-Thu baseline, 84 pieces)", () => {
  const result = calculateAggregatedDoughDemand({ pastries: croissantDoughMapping });

  assert.equal(result.status, "ok");
  assert.equal(result.totalDoughPieces, 84);
});

test("D1: the Fri-Sun baseline (+12 per pastry) sums to 156 pieces", () => {
  const friSunMapping = croissantDoughMapping.map((row) => ({
    ...row,
    plannedQuantity: row.plannedQuantity + 12,
  }));

  const result = calculateAggregatedDoughDemand({ pastries: friSunMapping });

  assert.equal(result.status, "ok");
  assert.equal(result.totalDoughPieces, 156);
});

test("D2: a pastry with no confirmed mapping shows Mapping needed instead of guessing 1:1", () => {
  const withUnmapped = [
    ...croissantDoughMapping,
    { pastryKey: "mystery-danish", plannedQuantity: 10, doughPiecesPerPastry: undefined },
  ];

  const result = calculateAggregatedDoughDemand({ pastries: withUnmapped });

  assert.equal(result.status, "Mapping needed");
  assert.equal(result.totalDoughPieces, null);
  assert.deepEqual(result.missingMappingPastries, ["mystery-danish"]);
});

test("C4: a pastry with a confirmed mapping but no production-sheet quantity shows Information incomplete", () => {
  const withMissingQuantity = croissantDoughMapping.map((row) =>
    row.pastryKey === "crookie" ? { ...row, plannedQuantity: undefined } : row,
  );

  const result = calculateAggregatedDoughDemand({ pastries: withMissingQuantity });

  assert.equal(result.status, "Information incomplete");
  assert.equal(result.totalDoughPieces, null);
  assert.deepEqual(result.missingQuantityPastries, ["crookie"]);
});

test("C1/C3: summing across dates enumerates every day rather than using one generic average", () => {
  const monThu = calculateAggregatedDoughDemand({ pastries: croissantDoughMapping });
  const friSat = calculateAggregatedDoughDemand({
    pastries: croissantDoughMapping.map((row) => ({ ...row, plannedQuantity: row.plannedQuantity + 12 })),
  });

  // Fri 8/7 + Sat 8/8 + Sun 8/9 = 156 x 3 = 468, matching the real
  // pre-arrival worked example from the croissant-dough contract.
  const total = sumDoughDemandAcrossDates({
    dailyResults: [friSat, friSat, friSat],
  });

  assert.equal(total.status, "ok");
  assert.equal(total.totalDoughPieces, 468);

  // Sanity check the Mon-Thu single-day result still matches the base contract.
  assert.equal(monThu.totalDoughPieces, 84);
});

test("sumDoughDemandAcrossDates propagates Information incomplete rather than silently skipping a bad day", () => {
  const complete = calculateAggregatedDoughDemand({ pastries: croissantDoughMapping });
  const incomplete = calculateAggregatedDoughDemand({
    pastries: croissantDoughMapping.map((row) =>
      row.pastryKey === "crookie" ? { ...row, plannedQuantity: undefined } : row,
    ),
  });

  const total = sumDoughDemandAcrossDates({ dailyResults: [complete, incomplete, complete] });

  assert.equal(total.status, "Information incomplete");
  assert.equal(total.totalDoughPieces, null);
});

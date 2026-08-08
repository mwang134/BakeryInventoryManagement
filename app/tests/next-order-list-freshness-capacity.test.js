import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateCountFreshness,
  calculateCapacityStatus,
} from "../src/next-order-list.js";

test("B3: a count from before the most recent Monday is stale and needs a recount", () => {
  const result = calculateCountFreshness({
    countDate: "2026-08-06", // Thursday
    referenceDate: "2026-08-13", // the following Thursday; most recent Monday is 2026-08-10
    onHandPieces: 961,
    piecesPerBox: 192,
  });

  assert.equal(result.needsRecount, true);
  assert.ok(result.reasons.some((reason) => /weekly/i.test(reason)));
});

test("a count made on the most recent Monday itself is not weekly-stale", () => {
  const result = calculateCountFreshness({
    countDate: "2026-08-10", // Monday
    referenceDate: "2026-08-13", // Thursday of the same week
    onHandPieces: 961,
    piecesPerBox: 192,
  });

  assert.equal(result.needsRecount, false);
  assert.deepEqual(result.reasons, []);
});

test("B3a: stock at or below 1 box forces an off-cycle recount even with a fresh weekly count", () => {
  const result = calculateCountFreshness({
    countDate: "2026-08-10", // fresh, same week as reference date
    referenceDate: "2026-08-11",
    onHandPieces: 150, // less than one 192-piece box
    piecesPerBox: 192,
  });

  assert.equal(result.needsRecount, true);
  assert.ok(result.reasons.some((reason) => /low stock|1 box/i.test(reason)));
});

test("stock at exactly 1 box also triggers the low-stock recount (at or below, not only below)", () => {
  const result = calculateCountFreshness({
    countDate: "2026-08-10",
    referenceDate: "2026-08-11",
    onHandPieces: 192, // exactly one box
    piecesPerBox: 192,
  });

  assert.equal(result.needsRecount, true);
});

test("both weekly-stale and low-stock reasons can appear together", () => {
  const result = calculateCountFreshness({
    countDate: "2026-08-06",
    referenceDate: "2026-08-13",
    onHandPieces: 100,
    piecesPerBox: 192,
  });

  assert.equal(result.needsRecount, true);
  assert.equal(result.reasons.length, 2);
});

test("H2/zone status: comfortable, limited, and blocked labels reflect projected capacity", () => {
  assert.equal(
    calculateCapacityStatus({ currentUnits: 6, incomingUnits: 1, practicalCapacity: 8, hardCapacity: 10 }).status,
    "comfortable",
  );
  assert.equal(
    calculateCapacityStatus({ currentUnits: 6, incomingUnits: 3, practicalCapacity: 8, hardCapacity: 10 }).status,
    "limited",
  );
  assert.equal(
    calculateCapacityStatus({ currentUnits: 6, incomingUnits: 5, practicalCapacity: 8, hardCapacity: 10 }).status,
    "blocked",
  );
});

test("H2a: exceeding hard capacity warns but never blocks finalization", () => {
  const result = calculateCapacityStatus({
    currentUnits: 6,
    incomingUnits: 5,
    practicalCapacity: 8,
    hardCapacity: 10,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.blocksFinalization, false);
  assert.match(result.warning, /hard/i);
});

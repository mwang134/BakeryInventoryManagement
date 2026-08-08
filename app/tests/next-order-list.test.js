import test from "node:test";
import assert from "node:assert/strict";

import { calculatePreArrivalStatus } from "../src/next-order-list.js";

test("E1: current stock lasts through delivery", () => {
  const result = calculatePreArrivalStatus({
    onHandPieces: 10,
    preArrivalUsagePieces: 8,
  });

  assert.equal(result.projectedStockAtArrival, 2);
  assert.equal(result.status, "Lasts through delivery");
  assert.equal(result.shortagePieces, 0);
});

test("E2: current stock is short before delivery", () => {
  const result = calculatePreArrivalStatus({
    onHandPieces: 6,
    preArrivalUsagePieces: 8,
  });

  assert.equal(result.projectedStockAtArrival, 0);
  assert.equal(result.status, "Short before delivery");
  assert.equal(result.shortagePieces, 2);
});

test("a later shipment does not repair or hide a pre-arrival shortage", () => {
  const result = calculatePreArrivalStatus({
    onHandPieces: 6,
    preArrivalUsagePieces: 8,
  });

  assert.equal(result.status, "Short before delivery");
  assert.ok(result.shortagePieces > 0);
});

test("croissant-dough sample worked example: count Thu after closing, ships Mon — lasts through delivery", () => {
  // 5 full boxes x 192 (unverified) + 1 partial piece = 961 pieces on hand
  // pre-arrival usage = Fri + Sat + Sun = 156 x 3 = 468 pieces
  // (count date is excluded from usage because the count always happens after
  // closing, i.e. after that day's own production already used dough)
  const result = calculatePreArrivalStatus({
    onHandPieces: 961,
    preArrivalUsagePieces: 468,
  });

  assert.equal(result.projectedStockAtArrival, 493);
  assert.equal(result.status, "Lasts through delivery");
  assert.equal(result.shortagePieces, 0);
});

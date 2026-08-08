import test from "node:test";
import assert from "node:assert/strict";

import {
  calculatePostArrivalSuggestion,
  calculateProjectedEndStock,
} from "../src/next-order-list.js";

test("F1: whole-box rounding creates a visible natural cushion", () => {
  const result = calculatePostArrivalSuggestion({
    projectedStockAtArrival: 2,
    postArrivalUsagePieces: 15,
    piecesPerBox: 8,
    supplierMinimumBoxes: 1,
  });

  assert.equal(result.piecesNeeded, 13);
  assert.equal(result.rawBoxes, 2);
  assert.equal(result.suggestedBoxes, 2);
  assert.equal(result.supplierMinimumKnown, true);
  assert.equal(result.supplierMinimumApplied, false);

  const endStock = calculateProjectedEndStock({
    projectedStockAtArrival: 2,
    managerBoxes: result.suggestedBoxes,
    piecesPerBox: 8,
    postArrivalUsagePieces: 15,
  });

  assert.equal(endStock, 3);
});

test("F2: supplier minimum is applied visibly", () => {
  const result = calculatePostArrivalSuggestion({
    projectedStockAtArrival: 0,
    postArrivalUsagePieces: 5,
    piecesPerBox: 10,
    supplierMinimumBoxes: 2,
  });

  assert.equal(result.rawBoxes, 1);
  assert.equal(result.suggestedBoxes, 2);
  assert.equal(result.supplierMinimumApplied, true);
  assert.match(result.reason, /supplier minimum/i);
});

test("F2a: unknown supplier minimum does not block the suggestion, shows a caveat instead", () => {
  const result = calculatePostArrivalSuggestion({
    projectedStockAtArrival: 0,
    postArrivalUsagePieces: 5,
    piecesPerBox: 10,
    supplierMinimumBoxes: undefined,
  });

  assert.equal(result.rawBoxes, 1);
  assert.equal(result.suggestedBoxes, 1);
  assert.equal(result.supplierMinimumKnown, false);
  assert.equal(result.supplierMinimumApplied, false);
  assert.match(result.reason, /not verified/i);
});

test("F3: no need produces a zero-box base suggestion", () => {
  const result = calculatePostArrivalSuggestion({
    projectedStockAtArrival: 20,
    postArrivalUsagePieces: 15,
    piecesPerBox: 8,
    supplierMinimumBoxes: 1,
  });

  assert.equal(result.piecesNeeded, 0);
  assert.equal(result.rawBoxes, 0);
  assert.equal(result.suggestedBoxes, 0);
  // Deciding between "Skip this order" and "Excess after delivery" needs a
  // threshold that is not yet frozen (same open-question territory as the
  // deferred Large Quantity Change threshold) - not implemented here.
});

test("G2/G3: manager override changes projected end stock in both directions", () => {
  const lower = calculateProjectedEndStock({
    projectedStockAtArrival: 2,
    managerBoxes: 1,
    piecesPerBox: 8,
    postArrivalUsagePieces: 15,
  });
  assert.equal(lower, -5);

  const higher = calculateProjectedEndStock({
    projectedStockAtArrival: 2,
    managerBoxes: 3,
    piecesPerBox: 8,
    postArrivalUsagePieces: 15,
  });
  assert.equal(higher, 11);
});

test("croissant-dough sample worked example: base suggestion is 6 boxes, projected end stock is 37 pieces", () => {
  const suggestion = calculatePostArrivalSuggestion({
    projectedStockAtArrival: 493,
    postArrivalUsagePieces: 1608,
    piecesPerBox: 192,
    supplierMinimumBoxes: undefined,
  });

  assert.equal(suggestion.piecesNeeded, 1115);
  assert.equal(suggestion.rawBoxes, 6);
  assert.equal(suggestion.suggestedBoxes, 6);
  assert.equal(suggestion.supplierMinimumKnown, false);

  const endStock = calculateProjectedEndStock({
    projectedStockAtArrival: 493,
    managerBoxes: suggestion.suggestedBoxes,
    piecesPerBox: 192,
    postArrivalUsagePieces: 1608,
  });

  assert.equal(endStock, 37);
});

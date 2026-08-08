// Next Order List calculation engine.
//
// This is deliberately separate from reorder.js/dashboard.js, which
// implement the older sample-data prototype's fixed-coverage-days logic.
// See project/plans/NEXT-ORDER-LIST-BUILD-GATE.md for the frozen formula
// contract this file implements.

export function calculatePreArrivalStatus({ onHandPieces, preArrivalUsagePieces }) {
  if (preArrivalUsagePieces > onHandPieces) {
    return {
      projectedStockAtArrival: 0,
      shortagePieces: preArrivalUsagePieces - onHandPieces,
      status: "Short before delivery",
    };
  }

  return {
    projectedStockAtArrival: onHandPieces - preArrivalUsagePieces,
    shortagePieces: 0,
    status: "Lasts through delivery",
  };
}

export function calculatePostArrivalSuggestion({
  projectedStockAtArrival,
  postArrivalUsagePieces,
  piecesPerBox,
  supplierMinimumBoxes,
}) {
  const piecesNeeded = Math.max(0, postArrivalUsagePieces - projectedStockAtArrival);
  const rawBoxes = Math.ceil(piecesNeeded / piecesPerBox);
  const supplierMinimumKnown =
    supplierMinimumBoxes !== undefined && supplierMinimumBoxes !== null;

  if (rawBoxes === 0) {
    return {
      piecesNeeded,
      rawBoxes,
      suggestedBoxes: 0,
      supplierMinimumKnown,
      supplierMinimumApplied: false,
      reason: "Projected stock at arrival already covers expected usage through the plan-stock-through date.",
    };
  }

  if (!supplierMinimumKnown) {
    return {
      piecesNeeded,
      rawBoxes,
      suggestedBoxes: rawBoxes,
      supplierMinimumKnown: false,
      supplierMinimumApplied: false,
      reason: `Raw whole-box requirement is ${rawBoxes} box${rawBoxes === 1 ? "" : "es"}. Supplier minimum not verified — this suggestion is not yet validated against a real supplier rule.`,
    };
  }

  const suggestedBoxes = Math.max(rawBoxes, supplierMinimumBoxes);
  const supplierMinimumApplied = suggestedBoxes > rawBoxes;

  return {
    piecesNeeded,
    rawBoxes,
    suggestedBoxes,
    supplierMinimumKnown: true,
    supplierMinimumApplied,
    reason: supplierMinimumApplied
      ? `Raw requirement of ${rawBoxes} box${rawBoxes === 1 ? "" : "es"} is below the supplier minimum of ${supplierMinimumBoxes}; the supplier minimum increased the quantity to ${suggestedBoxes}.`
      : `Raw whole-box requirement is ${rawBoxes} box${rawBoxes === 1 ? "" : "es"}, already at or above the supplier minimum of ${supplierMinimumBoxes}.`,
  };
}

export function calculateProjectedEndStock({
  projectedStockAtArrival,
  managerBoxes,
  piecesPerBox,
  postArrivalUsagePieces,
}) {
  return projectedStockAtArrival + managerBoxes * piecesPerBox - postArrivalUsagePieces;
}

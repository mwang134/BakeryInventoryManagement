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

// D1/D2/C4: aggregate one date's worth of demand for a single dough SKU
// across every pastry mapped to it. A missing mapping is never guessed as
// 1:1, and a missing production-sheet quantity never falls back to zero -
// both make the whole day's number unusable rather than quietly wrong.
export function calculateAggregatedDoughDemand({ pastries }) {
  const missingMappingPastries = pastries
    .filter((row) => row.doughPiecesPerPastry === undefined || row.doughPiecesPerPastry === null)
    .map((row) => row.pastryKey);

  if (missingMappingPastries.length > 0) {
    return {
      status: "Mapping needed",
      totalDoughPieces: null,
      missingMappingPastries,
      missingQuantityPastries: [],
    };
  }

  const missingQuantityPastries = pastries
    .filter((row) => row.plannedQuantity === undefined || row.plannedQuantity === null)
    .map((row) => row.pastryKey);

  if (missingQuantityPastries.length > 0) {
    return {
      status: "Information incomplete",
      totalDoughPieces: null,
      missingMappingPastries: [],
      missingQuantityPastries,
    };
  }

  const totalDoughPieces = pastries.reduce(
    (total, row) => total + row.plannedQuantity * row.doughPiecesPerPastry,
    0,
  );

  return {
    status: "ok",
    totalDoughPieces,
    missingMappingPastries: [],
    missingQuantityPastries: [],
  };
}

// C1/C3: sum several dates' worth of already-aggregated demand (e.g. every
// date in the pre-arrival or post-arrival window). If any single date is
// incomplete, the whole range is incomplete - a bad day must not be
// silently dropped from the total.
export function sumDoughDemandAcrossDates({ dailyResults }) {
  const firstIncomplete = dailyResults.find((day) => day.status !== "ok");
  if (firstIncomplete) {
    return {
      status: firstIncomplete.status,
      totalDoughPieces: null,
    };
  }

  return {
    status: "ok",
    totalDoughPieces: dailyResults.reduce((total, day) => total + day.totalDoughPieces, 0),
  };
}

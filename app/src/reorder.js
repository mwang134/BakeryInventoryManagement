function roundTo(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function calculateRecommendation({
  fullBoxes,
  partialPieces,
  piecesPerBox,
  typicalDailySales,
  coverageTargetDays,
  incomingBoxes = 0,
  minimumOrderBoxes = 1,
}) {
  const onHandPieces = fullBoxes * piecesPerBox + partialPieces;
  const incomingPieces = incomingBoxes * piecesPerBox;
  const availablePieces = onHandPieces + incomingPieces;
  const targetPieces = typicalDailySales * coverageTargetDays;
  const shortagePieces = Math.max(0, targetPieces - availablePieces);
  const rawSuggestedBoxes = Math.ceil(shortagePieces / piecesPerBox);
  const suggestedBoxes =
    rawSuggestedBoxes > 0
      ? Math.max(rawSuggestedBoxes, minimumOrderBoxes)
      : 0;

  if (suggestedBoxes > 0) {
    return {
      onHandPieces,
      daysOfSupply: roundTo(availablePieces / typicalDailySales),
      suggestedBoxes,
      decision: "order",
      reason: `Counted and incoming stock are below the ${coverageTargetDays}-day target; order ${suggestedBoxes} box${suggestedBoxes === 1 ? "" : "es"}.`,
    };
  }

  const daysOfSupply = roundTo(availablePieces / typicalDailySales);
  const overstockThresholdDays = coverageTargetDays * 1.5;

  if (daysOfSupply > overstockThresholdDays) {
    return {
      onHandPieces,
      daysOfSupply,
      suggestedBoxes: 0,
      decision: "overstock",
      reason: `Stock is well above the ${coverageTargetDays}-day target; skip this order and review buildup.`,
    };
  }

  return {
    onHandPieces,
    daysOfSupply,
    suggestedBoxes: 0,
    decision: "enough",
    reason: `Current stock covers the ${coverageTargetDays}-day target.`,
  };
}

export function calculateDraftTotals({
  currentBoxes,
  freezerCapacityBoxes,
  rows,
}) {
  const totals = rows.reduce(
    (result, row) => {
      const orderBoxes = Math.max(0, Number(row.managerOrderBoxes) || 0);
      result.totalOrderBoxes += orderBoxes;
      result.draftCost += orderBoxes * row.costPerBox;
      return result;
    },
    { totalOrderBoxes: 0, draftCost: 0 },
  );

  return {
    ...totals,
    projectedCapacityPercent: Math.round(
      ((currentBoxes + totals.totalOrderBoxes) / freezerCapacityBoxes) * 100,
    ),
  };
}

export function finalizeWorksheet(worksheet, { managerInitials, finalizedAt }) {
  return {
    ...worksheet,
    status: "final",
    managerInitials,
    finalizedAt,
    supplierOrderSent: false,
  };
}

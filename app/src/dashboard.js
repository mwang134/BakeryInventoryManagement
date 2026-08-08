const urgencyOrder = ["act-now", "review-today", "plan-next"];

export function groupActionsByUrgency(actions) {
  return Object.fromEntries(
    urgencyOrder.map((urgency) => [
      urgency,
      actions.filter((action) => action.urgency === urgency),
    ]),
  );
}

export function calculateSupplierWaste(records) {
  const affectedProducts = records
    .map((record) => ({
      ...record,
      supplierWasteCost: Number(
        (record.leftoverUnits * record.supplierCostPerUnit).toFixed(2),
      ),
    }))
    .sort((left, right) => right.supplierWasteCost - left.supplierWasteCost);

  return {
    totalSupplierWasteCost: Number(
      affectedProducts
        .reduce((total, product) => total + product.supplierWasteCost, 0)
        .toFixed(2),
    ),
    affectedProducts,
  };
}

export function calculateZoneCapacity({
  currentUnits,
  incomingUnits,
  practicalCapacity,
  hardCapacity,
}) {
  const projectedUnits = currentUnits + incomingUnits;
  const status =
    projectedUnits > hardCapacity
      ? "blocked"
      : projectedUnits > practicalCapacity
        ? "limited"
        : "comfortable";

  return {
    projectedUnits,
    remainingHardCapacity: hardCapacity - projectedUnits,
    status,
  };
}

export function calculateRestockNeed({
  onHandPieces,
  expectedUsageUntilNextOrder,
  piecesPerBox,
  minimumOrderBoxes = 1,
}) {
  const shortagePieces = Math.max(0, expectedUsageUntilNextOrder - onHandPieces);
  const rawSuggestedBoxes = Math.ceil(shortagePieces / piecesPerBox);
  const suggestedBoxes =
    rawSuggestedBoxes > 0
      ? Math.max(rawSuggestedBoxes, minimumOrderBoxes)
      : 0;

  return {
    shortagePieces,
    suggestedBoxes,
    atRisk: shortagePieces > 0,
  };
}

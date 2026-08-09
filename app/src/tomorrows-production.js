// Tomorrow's Production calculation engine.
//
// Implements the V1 calculation rule frozen in DECISIONS.md (2026-08-09):
// suggested quantity is the average of comparable-day sold figures; a
// difference from the current production-sheet quantity is a "Quantity
// change", a difference of more than 25% is a "Large Quantity Change", any
// comparable day with a sellout or recorded event is "Unusual context", and
// fewer than 3 valid comparable days (or missing data dropping below that)
// is "Limited evidence" instead of a confident suggestion.

const MINIMUM_COMPARABLE_DAYS = 3;
const LARGE_CHANGE_THRESHOLD = 0.25;

export function calculateProductionSuggestion({
  currentQuantity,
  comparableDays,
  minimumComparableDays = MINIMUM_COMPARABLE_DAYS,
}) {
  const validDays = comparableDays.filter(
    (day) => day.sold !== undefined && day.sold !== null,
  );

  const unusualDays = comparableDays.filter((day) => day.sellout || day.unusualContext);
  const hasUnusualContext = unusualDays.length > 0;
  const unusualContextNotes = unusualDays.map((day) => day.unusualContext || "Sellout");

  if (validDays.length < minimumComparableDays) {
    return {
      status: "Limited evidence",
      suggestedQuantity: null,
      difference: null,
      changeLabel: null,
      hasUnusualContext,
      unusualContextNotes,
      reason: `Only ${validDays.length} comparable day${validDays.length === 1 ? "" : "s"} on record; at least ${minimumComparableDays} needed for a confident suggestion.`,
    };
  }

  const averageSold = validDays.reduce((sum, day) => sum + day.sold, 0) / validDays.length;
  const suggestedQuantity = Math.round(averageSold);
  const difference = suggestedQuantity - currentQuantity;
  const percentDifference =
    currentQuantity === 0 ? (difference === 0 ? 0 : Infinity) : Math.abs(difference) / currentQuantity;

  const changeLabel =
    difference === 0 ? null : percentDifference > LARGE_CHANGE_THRESHOLD ? "Large Quantity Change" : "Quantity change";

  return {
    status: "ok",
    suggestedQuantity,
    difference,
    changeLabel,
    hasUnusualContext,
    unusualContextNotes,
    reason:
      difference === 0
        ? `Suggested quantity matches the current production-sheet quantity (${currentQuantity}).`
        : `Average of ${validDays.length} comparable days is ${suggestedQuantity}, ${difference > 0 ? "above" : "below"} the current ${currentQuantity}.`,
  };
}

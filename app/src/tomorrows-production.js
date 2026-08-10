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

// A product needs an explicit manager decision if it carries any of the
// four review flags - a plain "no change, nothing unusual" product does not.
export function needsReview(suggestion) {
  return suggestion.status === "Limited evidence" || suggestion.changeLabel !== null || suggestion.hasUnusualContext;
}

// Every flagged product requires one explicit action - Use suggestion, Keep
// current, or Set custom quantity. There is no default/implicit choice.
export function resolveManagerDecision({ suggestion, currentQuantity, action, customQuantity }) {
  if (action === "use-suggestion") {
    if (suggestion.suggestedQuantity === null) {
      throw new Error("Cannot use a suggestion that does not exist (Limited evidence).");
    }
    return { action, finalQuantity: suggestion.suggestedQuantity };
  }
  if (action === "keep-current") {
    return { action, finalQuantity: currentQuantity };
  }
  if (action === "custom") {
    return { action, finalQuantity: customQuantity };
  }
  throw new Error(`Unknown manager decision action: ${action}`);
}

// The whole plan finalizes at once, not product by product. Merely opening
// a row/chart does not count as review - only a recorded reviewAction does.
export function canFinalizeProductionPlan({ products }) {
  const unreviewed = products.filter((product) => needsReview(product.suggestion) && !product.reviewAction);

  return {
    canFinalize: unreviewed.length === 0,
    unreviewedCount: unreviewed.length,
    unreviewedProductIds: unreviewed.map((product) => product.id),
  };
}

// Extra-batch reserve rule, frozen in DECISIONS.md (2026-08-09). The
// suggested/decided total never changes because of carryover - only the
// *net new prep* and the *fresh dough pull* shrink by the confirmed amount.
export function calculateReserveCarryoverImpact({ suggestedTotal, confirmedCarryover }) {
  const netPrepNeeded = Math.max(0, suggestedTotal - confirmedCarryover);
  const freshDoughPiecesAvoided = Math.min(confirmedCarryover, suggestedTotal);

  return { suggestedTotal, confirmedCarryover, netPrepNeeded, freshDoughPiecesAvoided };
}

// Reserve survives exactly one extra day. Whatever isn't used by then
// expires - it must be recorded, not silently dropped or rolled forward
// again to a third day.
export function resolveReserveLifecycle({ carryoverEnteringToday, usedToday }) {
  return {
    usedToday,
    expiredUnused: Math.max(0, carryoverEnteringToday - usedToday),
  };
}

// Keeps the daily closing check short: an item only appears if today's
// production actually included an extra batch to begin with.
export function shouldAppearInReserveCheck({ todaysExtraBatchQuantity }) {
  return todaysExtraBatchQuantity > 0;
}

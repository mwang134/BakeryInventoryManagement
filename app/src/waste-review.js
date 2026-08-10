// Waste Pattern Review calculation engine.
//
// Implements the V1 calculation rule frozen in DECISIONS.md (2026-08-10):
// compare the most recent comparable day's leftover rate against the
// average of the prior comparable days; more than 50% above that baseline
// is "unusually high". Fewer than 3 valid comparable days shows "Building
// comparable-day baseline" instead of a confident (or invented) flag.
//
// "Recorded reason" for the outcome classification is deliberately generic
// - any sellout flag or unusualContext note on the flagged day counts as a
// known explanation, whatever it actually describes. The shared simulated
// dataset's context notes were written to explain sold-side spikes, not
// leftover-side ones, so this is a mechanism, not a claim that the specific
// note explains the leftover pattern.

const MINIMUM_COMPARABLE_DAYS = 3;
const UNUSUALLY_HIGH_THRESHOLD = 0.5;

export function calculateWasteFlag({
  producedQuantity,
  comparableDays,
  minimumComparableDays = MINIMUM_COMPARABLE_DAYS,
}) {
  const validDays = comparableDays.filter((day) => day.sold !== undefined && day.sold !== null);

  if (validDays.length < minimumComparableDays) {
    return {
      status: "Building comparable-day baseline",
      isUnusuallyHigh: null,
      mostRecentLeftover: null,
      mostRecentLeftoverRate: null,
      baselineLeftoverRate: null,
      percentAboveBaseline: null,
      outcome: "Information incomplete",
      reason: `Only ${validDays.length} comparable day${validDays.length === 1 ? "" : "s"} on record; at least ${minimumComparableDays} needed before flagging a pattern.`,
    };
  }

  const withLeftover = validDays.map((day) => {
    const leftover = Math.max(0, producedQuantity - day.sold);
    return { ...day, leftover, leftoverRate: producedQuantity > 0 ? leftover / producedQuantity : 0 };
  });

  const mostRecent = withLeftover[withLeftover.length - 1];
  const history = withLeftover.slice(0, -1);
  const baselineLeftoverRate = history.reduce((sum, day) => sum + day.leftoverRate, 0) / history.length;

  const percentAboveBaseline =
    baselineLeftoverRate === 0
      ? mostRecent.leftoverRate > 0
        ? Infinity
        : 0
      : (mostRecent.leftoverRate - baselineLeftoverRate) / baselineLeftoverRate;

  const isUnusuallyHigh = percentAboveBaseline > UNUSUALLY_HIGH_THRESHOLD;
  const hasRecordedReason = Boolean(mostRecent.sellout || mostRecent.unusualContext);

  return {
    status: "ok",
    isUnusuallyHigh,
    mostRecentLeftover: mostRecent.leftover,
    mostRecentLeftoverRate: mostRecent.leftoverRate,
    baselineLeftoverRate,
    percentAboveBaseline,
    outcome: !isUnusuallyHigh ? null : hasRecordedReason ? "Known one-time event" : "Possible repeated baseline problem",
    reason: isUnusuallyHigh
      ? `Most recent leftover rate ${(mostRecent.leftoverRate * 100).toFixed(0)}% is ${(percentAboveBaseline * 100).toFixed(0)}% above the ${(baselineLeftoverRate * 100).toFixed(0)}% baseline.`
      : `Most recent leftover rate is within the normal range of recent comparable days.`,
  };
}

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

// C1/C2: date-window helpers. Pre-arrival is strictly after the count date
// through the day before shipment; post-arrival is the shipment date
// through plan-stock-through, inclusive of both ends.
export function enumerateDatesBetweenExclusive(startExclusiveIso, endExclusiveIso) {
  const dates = [];
  const cursor = new Date(`${startExclusiveIso}T00:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  const end = new Date(`${endExclusiveIso}T00:00:00Z`);
  while (cursor < end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function enumerateDatesInclusive(startInclusiveIso, endInclusiveIso) {
  const dates = [];
  const cursor = new Date(`${startInclusiveIso}T00:00:00Z`);
  const end = new Date(`${endInclusiveIso}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

// Croissant-dough contract: Fri/Sat/Sun are the higher-demand days; Mon-Thu
// share one baseline (data/redacted-sku-contracts/croissant-dough.md).
export function classifyDayType(dateIso) {
  const dayOfWeek = new Date(`${dateIso}T00:00:00Z`).getUTCDay(); // Sun=0 ... Sat=6
  return dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6 ? "fri-sun" : "mon-thu";
}

function mostRecentMonday(referenceDateIso) {
  const date = new Date(`${referenceDateIso}T00:00:00Z`);
  // getUTCDay(): Sunday = 0, Monday = 1, ... Saturday = 6.
  const dayOfWeek = date.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

// B3/B3a: staleness is tracked on one shared weekly schedule (every count
// happens as one whole-freezer session), plus an off-cycle trigger for any
// single pastry whose stock has dropped to 1 box or fewer since it was last
// counted. Both reasons can apply at once and are reported independently.
export function calculateCountFreshness({ countDate, referenceDate, onHandPieces, piecesPerBox }) {
  const reasons = [];

  if (countDate < mostRecentMonday(referenceDate)) {
    reasons.push("Weekly recount overdue - the last whole-freezer count was before the most recent Monday.");
  }

  if (onHandPieces <= piecesPerBox) {
    reasons.push("Low stock (1 box or fewer) - an off-cycle recount is required for this pastry.");
  }

  return {
    needsRecount: reasons.length > 0,
    reasons,
  };
}

// H2/H2a: labels projected freezer-zone capacity, and makes explicit that
// exceeding the hard maximum is a warning, not a finalization blocker - that
// is a deliberate V1 decision, not an oversight.
export function calculateCapacityStatus({ currentUnits, incomingUnits, practicalCapacity, hardCapacity }) {
  const projectedUnits = currentUnits + incomingUnits;
  const status =
    projectedUnits > hardCapacity ? "blocked" : projectedUnits > practicalCapacity ? "limited" : "comfortable";

  return {
    projectedUnits,
    status,
    blocksFinalization: false,
    warning:
      status === "blocked"
        ? `Projected ${projectedUnits} units exceeds the hard capacity of ${hardCapacity}. Finalization is still allowed, but review before committing to this quantity.`
        : status === "limited"
          ? `Projected ${projectedUnits} units is within legroom above the practical capacity of ${practicalCapacity}.`
          : "Projected stock is within practical capacity.",
  };
}

// Plain-language "days of supply": walks forward one calendar day at a time
// from the count date, deducting that specific day's actual weekday-dependent
// usage rate (mon-thu vs fri-sun) rather than a flattened daily average,
// which would misstate the run-out date whenever the remaining stretch
// crosses from one rate to the other. Consumption starts the day after the
// count date, matching the "count happens after closing" rule used
// elsewhere in this file - the count date's own usage already happened
// before the count was taken.
export function calculateDaysOfSupply({ onHandPieces, countDate, dailyUsageByDayType }) {
  if (onHandPieces <= 0) {
    return { status: "already out", daysOfSupply: 0, throughDate: null };
  }

  let remaining = onHandPieces;
  let cursor = countDate;
  let daysOfSupply = 0;
  let throughDate = null;

  while (true) {
    const next = new Date(`${cursor}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    cursor = next.toISOString().slice(0, 10);

    const rate = dailyUsageByDayType[classifyDayType(cursor)];
    if (remaining < rate) {
      break;
    }

    remaining -= rate;
    daysOfSupply += 1;
    throughDate = cursor;
  }

  return { status: "ok", daysOfSupply, throughDate };
}

// No real freezer-zone capacity has ever been provided, so this derives a
// placeholder estimate from one observed physical count instead of showing
// nothing. A partial piece still occupies a full box's worth of space, so it
// rounds the box count up; the hard maximum is one box beyond that. This is
// a one-time snapshot of an observed count, not a formula to be re-run as
// orders/incoming boxes change - callers must not feed a growing total back
// into it, or "capacity" would just chase whatever is currently on order.
export function estimateCapacityFromCurrentCount({ fullBoxes, partialPieces }) {
  const practicalCapacityBoxes = partialPieces > 0 ? fullBoxes + 1 : fullBoxes;
  return {
    practicalCapacityBoxes,
    hardCapacityBoxes: practicalCapacityBoxes + 1,
  };
}

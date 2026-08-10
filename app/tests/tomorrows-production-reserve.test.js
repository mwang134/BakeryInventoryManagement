import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateReserveCarryoverImpact,
  resolveReserveLifecycle,
  shouldAppearInReserveCheck,
} from "../src/tomorrows-production.js";

// Pain Au Chocolat example: 12 base + 12 extra batch, suggested total for
// tomorrow stays 24 regardless of carryover (Matthew: "this many needs to exist").

test("confirmed carryover reduces net prep and avoids re-pulling fresh dough for those pieces", () => {
  const result = calculateReserveCarryoverImpact({
    suggestedTotal: 24,
    confirmedCarryover: 7,
  });

  assert.equal(result.suggestedTotal, 24);
  assert.equal(result.netPrepNeeded, 17);
  assert.equal(result.freshDoughPiecesAvoided, 7);
});

test("zero carryover means the full suggested total still needs fresh prep", () => {
  const result = calculateReserveCarryoverImpact({
    suggestedTotal: 24,
    confirmedCarryover: 0,
  });

  assert.equal(result.netPrepNeeded, 24);
  assert.equal(result.freshDoughPiecesAvoided, 0);
});

test("carryover cannot make net prep negative, even if it exceeds the suggested total", () => {
  const result = calculateReserveCarryoverImpact({
    suggestedTotal: 10,
    confirmedCarryover: 14,
  });

  assert.equal(result.netPrepNeeded, 0);
  // Dough-avoided is capped at what was actually needed - the extra 4 units
  // of reserve are excess, not a negative prep requirement.
  assert.equal(result.freshDoughPiecesAvoided, 10);
});

test("reserve entering today that gets fully used today does not expire", () => {
  const result = resolveReserveLifecycle({
    carryoverEnteringToday: 7,
    usedToday: 7,
  });

  assert.equal(result.usedToday, 7);
  assert.equal(result.expiredUnused, 0);
});

test("reserve entering today that is only partly used expires the rest - it does not carry forward again", () => {
  const result = resolveReserveLifecycle({
    carryoverEnteringToday: 7,
    usedToday: 3,
  });

  assert.equal(result.usedToday, 3);
  assert.equal(result.expiredUnused, 4);
});

test("an item with no extra batch produced today is skipped from the closing reserve check", () => {
  assert.equal(shouldAppearInReserveCheck({ todaysExtraBatchQuantity: 0 }), false);
  assert.equal(shouldAppearInReserveCheck({ todaysExtraBatchQuantity: 12 }), true);
});

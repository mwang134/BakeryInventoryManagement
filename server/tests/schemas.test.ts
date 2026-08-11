import test from "node:test";
import assert from "node:assert/strict";

import {
  validateNextOrderListDraftSave,
  validateNextOrderListDraftFinalize,
  validateProductionDraftSave,
  createProductionFinalizeValidator,
} from "../src/schemas.ts";

// ---------- Next Order List: save (partial data allowed) ----------

test("an empty draft (fresh, nothing entered yet) is a valid save", () => {
  const result = validateNextOrderListDraftSave({});
  assert.equal(result.valid, true);
});

test("a partial draft with only the count fields is a valid save", () => {
  const result = validateNextOrderListDraftSave({ countFullBoxes: 5, countPartialPieces: 1 });
  assert.equal(result.valid, true);
});

test("a negative count is rejected", () => {
  const result = validateNextOrderListDraftSave({ countFullBoxes: -1 });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("countFullBoxes")));
});

test("a non-integer count is rejected", () => {
  const result = validateNextOrderListDraftSave({ countPartialPieces: 1.5 });
  assert.equal(result.valid, false);
});

test("a malformed date string is rejected", () => {
  const result = validateNextOrderListDraftSave({ countDate: "08/10/2026" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("countDate")));
});

test("a calendar-invalid date (Feb 30) is rejected even though it matches the format", () => {
  const result = validateNextOrderListDraftSave({ countDate: "2026-02-30" });
  assert.equal(result.valid, false);
});

test("shipmentDate on or before countDate is rejected as invalid ordering", () => {
  const result = validateNextOrderListDraftSave({ countDate: "2026-08-10", shipmentDate: "2026-08-10" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.toLowerCase().includes("shipmentdate")));
});

test("planStockThroughDate before shipmentDate is rejected as invalid ordering", () => {
  const result = validateNextOrderListDraftSave({ shipmentDate: "2026-08-14", planStockThroughDate: "2026-08-10" });
  assert.equal(result.valid, false);
});

test("valid, correctly-ordered dates pass", () => {
  const result = validateNextOrderListDraftSave({
    countDate: "2026-08-10",
    shipmentDate: "2026-08-14",
    planStockThroughDate: "2026-08-27",
  });
  assert.equal(result.valid, true);
});

test("an unknown field is rejected rather than silently stored", () => {
  const result = validateNextOrderListDraftSave({ evilField: "<script>alert(1)</script>" });
  assert.equal(result.valid, false);
});

// ---------- Next Order List: finalize (must be complete) ----------

test("finalize rejects a draft missing required fields", () => {
  const result = validateNextOrderListDraftFinalize({ managerBoxes: 6 });
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test("finalize rejects a draft missing supplierRuleAcknowledged", () => {
  const result = validateNextOrderListDraftFinalize({
    countFullBoxes: 5,
    countPartialPieces: 1,
    countDate: "2026-08-10",
    shipmentDate: "2026-08-14",
    planStockThroughDate: "2026-08-27",
    managerBoxes: 6,
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.toLowerCase().includes("supplierruleacknowledged")));
});

test("finalize accepts a fully complete, acknowledged draft", () => {
  const result = validateNextOrderListDraftFinalize({
    countFullBoxes: 5,
    countPartialPieces: 1,
    countDate: "2026-08-10",
    shipmentDate: "2026-08-14",
    planStockThroughDate: "2026-08-27",
    managerBoxes: 6,
    supplierRuleAcknowledged: true,
  });
  assert.equal(result.valid, true);
});

test("finalize rejects supplierRuleAcknowledged: false as not actually acknowledged", () => {
  const result = validateNextOrderListDraftFinalize({
    countFullBoxes: 5,
    countPartialPieces: 1,
    countDate: "2026-08-10",
    shipmentDate: "2026-08-14",
    planStockThroughDate: "2026-08-27",
    managerBoxes: 6,
    supplierRuleAcknowledged: false,
  });
  assert.equal(result.valid, false);
});

// ---------- Tomorrow's Production: save ----------

test("an empty production draft is a valid save", () => {
  assert.equal(validateProductionDraftSave({}).valid, true);
});

test("a decision with an unknown action is rejected", () => {
  const result = validateProductionDraftSave({ decisions: { croissant: { action: "bogus", finalQuantity: 5 } } });
  assert.equal(result.valid, false);
});

test("a decision with a negative finalQuantity is rejected", () => {
  const result = validateProductionDraftSave({ decisions: { croissant: { action: "keep-current", finalQuantity: -1 } } });
  assert.equal(result.valid, false);
});

test("a valid decisions/reserveEntries save passes", () => {
  const result = validateProductionDraftSave({
    decisions: { croissant: { action: "use-suggestion", finalQuantity: 11 } },
    reserveEntries: { "portuguese-egg-tart": 2 },
  });
  assert.equal(result.valid, true);
});

// ---------- Tomorrow's Production: finalize completeness (real business rule, not just shape) ----------

const FAKE_ITEMS = [
  {
    itemKey: "steady-item",
    currentQuantity: 10,
    comparableDays: [{ sold: 10 }, { sold: 10 }, { sold: 10 }, { sold: 10 }],
  },
  {
    itemKey: "flagged-item",
    currentQuantity: 10,
    comparableDays: [{ sold: 20 }, { sold: 20 }, { sold: 20 }, { sold: 20 }],
  },
];

test("production finalize rejects when a flagged item has no recorded decision", () => {
  const validateFinalize = createProductionFinalizeValidator(FAKE_ITEMS);
  const result = validateFinalize({ decisions: {}, reserveEntries: {} });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("flagged-item")));
});

test("production finalize passes once every flagged item has a decision (steady items need none)", () => {
  const validateFinalize = createProductionFinalizeValidator(FAKE_ITEMS);
  const result = validateFinalize({
    decisions: { "flagged-item": { action: "keep-current", finalQuantity: 10 } },
    reserveEntries: {},
  });
  assert.equal(result.valid, true);
});

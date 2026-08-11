import { calculateProductionSuggestion, canFinalizeProductionPlan } from "../../app/src/tomorrows-production.js";

// Server-side validation for both draft types. The browser already builds
// well-formed requests, but the server must never trust that - anyone can
// PUT arbitrary JSON at this endpoint. Two tiers on purpose:
//   - "save" (PUT /draft) allows partial data (a fresh draft starts as {}
//     and fields fill in one at a time), but rejects wrong types, malformed
//     dates, and out-of-order dates the moment they're present.
//   - "finalize" additionally requires every field to actually be present,
//     since finalizing commits to a real operational record.

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  // Round-trips through Date to reject calendar-invalid dates (e.g.
  // 2026-02-30) that still match the YYYY-MM-DD shape.
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// ---------- Next Order List ----------

const NEXT_ORDER_LIST_FIELDS = [
  "countFullBoxes",
  "countPartialPieces",
  "countDate",
  "shipmentDate",
  "planStockThroughDate",
  "managerBoxes",
  "supplierRuleAcknowledged",
];

export function validateNextOrderListDraftSave(data: unknown): ValidationResult {
  if (!isPlainObject(data)) {
    return { valid: false, errors: ["Draft data must be an object"] };
  }

  const errors: string[] = [];

  for (const key of Object.keys(data)) {
    if (!NEXT_ORDER_LIST_FIELDS.includes(key)) {
      errors.push(`Unknown field: ${key}`);
    }
  }

  if ("countFullBoxes" in data && !isNonNegativeInteger(data.countFullBoxes)) {
    errors.push("countFullBoxes must be a non-negative integer");
  }
  if ("countPartialPieces" in data && !isNonNegativeInteger(data.countPartialPieces)) {
    errors.push("countPartialPieces must be a non-negative integer");
  }
  if ("managerBoxes" in data && !isNonNegativeInteger(data.managerBoxes)) {
    errors.push("managerBoxes must be a non-negative integer");
  }
  if ("supplierRuleAcknowledged" in data && typeof data.supplierRuleAcknowledged !== "boolean") {
    errors.push("supplierRuleAcknowledged must be a boolean");
  }
  for (const dateField of ["countDate", "shipmentDate", "planStockThroughDate"]) {
    if (dateField in data && !isValidIsoDate(data[dateField])) {
      errors.push(`${dateField} must be a valid ISO date (YYYY-MM-DD)`);
    }
  }

  // Ordering is only checked once both endpoints of a pair are present and
  // individually well-formed - an ordering error on top of a format error
  // would just be noise.
  if (
    typeof data.countDate === "string" &&
    isValidIsoDate(data.countDate) &&
    typeof data.shipmentDate === "string" &&
    isValidIsoDate(data.shipmentDate) &&
    data.shipmentDate <= data.countDate
  ) {
    errors.push("shipmentDate must be after countDate");
  }
  if (
    typeof data.shipmentDate === "string" &&
    isValidIsoDate(data.shipmentDate) &&
    typeof data.planStockThroughDate === "string" &&
    isValidIsoDate(data.planStockThroughDate) &&
    data.planStockThroughDate < data.shipmentDate
  ) {
    errors.push("planStockThroughDate must be on or after shipmentDate");
  }

  return { valid: errors.length === 0, errors };
}

export function validateNextOrderListDraftFinalize(data: unknown): ValidationResult {
  const saveResult = validateNextOrderListDraftSave(data);
  if (!saveResult.valid) return saveResult;

  const errors: string[] = [...saveResult.errors];
  const record = data as Record<string, unknown>;
  const required = [
    "countFullBoxes",
    "countPartialPieces",
    "countDate",
    "shipmentDate",
    "planStockThroughDate",
    "managerBoxes",
  ];
  for (const field of required) {
    if (record[field] === undefined || record[field] === null) {
      errors.push(`${field} is required before finalizing`);
    }
  }

  // The only currently-mapped SKU (croissant dough) has an unverified box
  // size and an unknown supplier minimum - see
  // data/redacted-sku-contracts/croissant-dough.md. Finalizing without an
  // explicit human acknowledgment of that would let the app quietly present
  // an unverified estimate as a settled order.
  if (record.supplierRuleAcknowledged !== true) {
    errors.push("supplierRuleAcknowledged must be true before finalizing");
  }

  return { valid: errors.length === 0, errors };
}

// ---------- Tomorrow's Production ----------

const PRODUCTION_ACTIONS = ["use-suggestion", "keep-current", "custom"];
const PRODUCTION_FIELDS = ["decisions", "reserveEntries"];

function isValidDecision(value: unknown): boolean {
  return (
    isPlainObject(value) &&
    PRODUCTION_ACTIONS.includes(value.action as string) &&
    isNonNegativeInteger(value.finalQuantity)
  );
}

export function validateProductionDraftSave(data: unknown): ValidationResult {
  if (!isPlainObject(data)) {
    return { valid: false, errors: ["Draft data must be an object"] };
  }

  const errors: string[] = [];

  for (const key of Object.keys(data)) {
    if (!PRODUCTION_FIELDS.includes(key)) {
      errors.push(`Unknown field: ${key}`);
    }
  }

  if ("decisions" in data) {
    if (!isPlainObject(data.decisions)) {
      errors.push("decisions must be an object");
    } else {
      for (const [itemKey, decision] of Object.entries(data.decisions)) {
        if (!isValidDecision(decision)) {
          errors.push(`decisions.${itemKey} must have a valid action and a non-negative integer finalQuantity`);
        }
      }
    }
  }

  if ("reserveEntries" in data) {
    if (!isPlainObject(data.reserveEntries)) {
      errors.push("reserveEntries must be an object");
    } else {
      for (const [itemKey, value] of Object.entries(data.reserveEntries)) {
        if (!isNonNegativeInteger(value)) {
          errors.push(`reserveEntries.${itemKey} must be a non-negative integer`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// "Complete" for Production isn't just well-shaped data - it's the same
// domain rule already tested in tomorrows-production.test.js: every flagged
// item (large change, unusual context, or limited evidence) needs an
// explicit recorded decision. Reuses the real calculation engine instead of
// re-deriving "which items are flagged" as a second, driftable copy of that
// logic. The item catalog is injected so tests can use a small fake catalog
// instead of the full 17-item real one.
export function createProductionFinalizeValidator(
  items: Array<{ itemKey: string; currentQuantity: number; comparableDays: unknown[] }>,
) {
  return function validateProductionDraftFinalize(data: unknown): ValidationResult {
    const saveResult = validateProductionDraftSave(data);
    if (!saveResult.valid) return saveResult;

    const decisions = isPlainObject(data) && isPlainObject(data.decisions) ? data.decisions : {};

    const products = items.map((item) => ({
      id: item.itemKey,
      suggestion: calculateProductionSuggestion({
        currentQuantity: item.currentQuantity,
        comparableDays: item.comparableDays as never,
      }),
      reviewAction: decisions[item.itemKey] ?? null,
    }));

    const finality = canFinalizeProductionPlan({ products });
    if (!finality.canFinalize) {
      return {
        valid: false,
        errors: [
          `${finality.unreviewedCount} product(s) still need a reviewed decision before finalizing: ${finality.unreviewedProductIds.join(", ")}`,
        ],
      };
    }

    return { valid: true, errors: [] };
  };
}

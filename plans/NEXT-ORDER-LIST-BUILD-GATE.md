# Next Order List — Build Gate

Status: **BUILD — approved for implementation 2026-08-08**

Purpose: identify the minimum decisions that must be frozen before refactoring the working BakeryOps prototype into the selected Next Order List design.

## Selected build scope

Flagship slice: **Next Order List only**.

In scope:
- whole clickable homepage KPI card;
- one active Current draft;
- physical freezer-count prerequisite;
- variable shipment-arrival and plan-stock-through dates;
- weekday/weekend-aware mapped-dough demand;
- transparent pre-arrival risk and suggested-box calculations;
- List and Chart views of the same draft;
- manager quantity override;
- persistent draft;
- complete-plan internal finalization;
- finalized-only read-only History;
- missing/stale-data states;
- automated tests and portable launch verification.

Deferred:
- Tomorrow's Production implementation;
- Large Quantity Change threshold;
- Waste Pattern Review anomaly threshold;
- live POS connection;
- automatic supplier ordering;
- broad Product Setup administration.

## Decisions already frozen

- Every calendar day in the selected period is included.
- Weekdays and weekends may have different demand evidence.
- Coverage is date-driven; the fixed seven-day rule is removed.
- Each draft has its own count/planning time, shipment-available date, and plan-stock-through date.
- The shipment-arrival date belongs to the boxes selected in that draft.
- Current stock is checked against expected usage before arrival.
- `Short before delivery` is separate because arriving boxes cannot fix an earlier shortage.
- Several pastry items may consume the same frozen-dough SKU; mapped dough demand is aggregated.
- The base suggestion has no hidden percentage buffer.
- Whole-box rounding creates the visible natural cushion.
- Supplier minimums are applied visibly.
- When a supplier minimum is unknown, it does not block the draft or finalization. The row shows the raw whole-box suggestion with a permanent, visible `Supplier minimum not verified` caveat, and the same caveat persists into the finalized snapshot for that row. This intentionally supersedes the general "missing supplier rule blocks finalization" language in acceptance scenario I3 for this specific field, so an unknown minimum cannot stall a manager's otherwise-ready draft.
- **Stale-count policy (frozen for V1):** the physical count is always one whole-freezer session, not per item, so staleness is tracked on a single shared schedule rather than a separate clock per pastry.
  - Routine recount: every Monday, the manager recounts the entire freezer. Any product's count from before the most recent Monday is stale and requires recount/confirmation before finalization (per B3).
  - Emergency per-item recount: if a specific pastry's projected/on-hand stock is at or below **1 box**, that pastry requires an immediate recount regardless of where it sits in the weekly cycle. This is an off-cycle check only — it does not create a new personal schedule for that item and does not change the following Monday's routine recount for everything else.
  - Placeholder weekly day for sample/prototype purposes: Monday (real operational day to be confirmed against the actual store routine if it differs later).
- **Hard-capacity behavior (frozen for V1):** exceeding hard freezer capacity warns the manager but does not block finalization. The warning is explicit and persists into the finalized snapshot rather than being silently dropped; see acceptance scenario H2a.
- The manager can override the suggested box quantity.
- Remaining usable frozen dough is excess inventory/working capital/freezer-capacity exposure, not automatically waste or sunk cost.
- Finalization creates an internal record only and never sends a supplier order.
- History contains finalized records only; drafts do not appear in History.

## Canonical calculation shape

### A. Pre-arrival risk

Physical counts happen after closing, once that day's production has already used dough from the freezer. The counted number therefore already reflects the count date's own usage, so pre-arrival expected usage covers only the calendar dates strictly after the count date, through the day before the shipment-available date — the count date itself is excluded.

```text
projected stock at arrival
= counted usable stock
− expected mapped-dough usage before arrival (days strictly after the count date, through the day before shipment)
```

If expected pre-arrival usage exceeds counted usable stock:

```text
Short before delivery
```

Otherwise:

```text
Lasts through delivery
```

### B. Arriving order quantity

```text
pieces needed after arrival
= expected mapped-dough usage from arrival through plan-stock-through
− usable stock projected to remain at arrival
```

```text
base suggested boxes
= round positive pieces needed up to whole supplier boxes
→ apply supplier minimum visibly
```

```text
projected end stock
= projected stock at arrival
+ manager order boxes × pieces per box
− expected mapped-dough usage after arrival
```

Negative pre-arrival stock is displayed as a separate shortage and is not treated as inventory that the later shipment can retroactively repair.

## Remaining convergence decisions

### 1. Expected-demand method — SELECTED FOR V1

Use the **current production-sheet quantity** as the initial expected-demand baseline for each included calendar date. The production sheet already varies by day, so weekdays and weekends retain their own planned quantities rather than being flattened into one daily average.

For every frozen-dough SKU:
- identify every pastry row mapped to that SKU;
- convert each planned pastry quantity into required dough pieces using the confirmed mapping;
- aggregate those dough pieces across all mapped pastries and all included dates.

Comparable-day POS sales remain supporting evidence for manager review and a later baseline-improvement path; V1 does not silently replace the manager's production sheet with a mean or median forecast.

Missing production-sheet quantities or missing pastry-to-dough mappings block a confident suggestion and display `Information incomplete`.

### 2. Pastry-to-dough conversion — ONE REDACTED MAPPING RECORDED

For one frozen-dough SKU, identify:
- every pastry POS item that consumes it;
- dough pieces consumed per sold/produced pastry;
- whether damage, test batches, or normal shrinkage need a separate allowance.

Do not assume one sold pastry always equals one frozen dough piece unless confirmed.

Matthew's first redacted mapping is recorded in `data/redacted-sku-contracts/croissant-dough.md`: Croissant, Strawberry Croissant, Crookie, Almond Croissant, Chocolate Croissant, and Garlic & Cheese Croissant each consume one croissant-dough piece per planned pastry. Exact source-system identifiers still require later verification. Pieces per box is approximately 192 and remains explicitly unverified; supplier minimum remains unknown.

### 3. Shipment timing — SELECTED FOR V1

The entered shipment date is the first calendar date on which the selected boxes are treated as available for use. Dates before it belong to pre-arrival risk; the entered shipment date and later dates belong to post-arrival coverage.

V1 does not model time-of-day delivery. If real operations later require morning-versus-evening availability, add an explicit availability time rather than silently changing the date rule.

### 4. One realistic/redacted SKU contract — OPEN

Required fields:
- SKU name/identifier;
- mapped pastry items;
- pieces per box;
- full boxes and partial pieces;
- count timestamp;
- shipment-available date;
- plan-stock-through date;
- expected demand by included calendar date;
- supplier minimum/case rule;
- confirmed earlier incoming stock, if any;
- expected pre-arrival status;
- expected suggested boxes;
- expected projected end stock.

### 5. Persistence behavior — SELECTED BEHAVIOR, STORAGE TECH OPEN

Required behavior:
- one active draft survives browser refresh and app restart;
- homepage and Current open the same draft;
- List and Chart edit/read the same quantities;
- finalization stores a read-only snapshot;
- finalized records appear in History;
- editing a finalized record is not silent; reopening creates a new draft/version;
- no supplier-order-sent state is implied.

**Resolved 2026-08-07:** small server-side persistent store (a lightweight backend plus a real database, e.g. SQLite for the prototype), not browser-only storage. Matthew's reasoning: it supports future access from other devices (starting with wanting this usable from an iPhone), which browser-only storage cannot do since it is tied to one browser on one machine. The exact backend framework/database is an implementation detail to choose during BUILD, not a further convergence decision.

## Acceptance tests to freeze before UI refactor

1. Stock lasts through arrival and suggestion covers the selected post-arrival period.
2. Stock runs short before arrival; later order quantity does not hide the warning.
3. Several pastries map to one dough SKU and their expected demand is aggregated.
4. Weekday and weekend demand use their appropriate evidence.
5. Whole-box rounding produces a visible natural cushion.
6. Supplier minimum increases a smaller raw suggestion and the reason is shown.
7. Manager override changes projected end stock and capacity consequence.
8. Missing/stale count blocks finalization.
9. Draft survives reload and remains the same draft from homepage and Current.
10. Finalized plan is immutable, appears in History, and never indicates a supplier order was sent.

## Definition of ready to BUILD

All are required:

- [x] User and decision selected.
- [x] KPI-to-workspace flow selected.
- [x] Formula shape selected.
- [x] No-hidden-buffer policy selected.
- [x] Expected-demand method frozen for V1 using production-sheet quantities.
- [x] One redacted pastry-to-dough mapping frozen; exact source identifiers remain a later integration task.
- [x] Shipment-timing convention frozen for V1.
- [x] One realistic/redacted SKU contract completed: croissant dough, with a full sample/placeholder worked example in `data/redacted-sku-contracts/croissant-dough.md`. Box size and supplier minimum remain explicitly unverified/unknown, which is allowed per that file's integrity rule.
- [x] Acceptance scenarios and expected outputs frozen; Matthew reviewed and approved the full document 2026-08-08.
- [x] Persistence technology selected: small server-side store.

All items are checked. Status is now **BUILD**. First action: write failing tests, then implement in verified slices.

# BakeryOps Assistant

## Status

Matthew selected the **Next Order List** as the active flagship vertical slice. Product exploration remains available, but the current delivery lane is engineering convergence before BUILD. The working app is an older sample-data prototype and does not yet implement the selected redesign.

## One-liner

A manager-facing tool that combines a fresh frozen-dough count, mapped POS item sales, incoming stock, and supplier timing to prepare an explainable internal reorder worksheet.

## Product contract

| Layer | Role |
|---|---|
| Web app | Count, recommendation, manager edit, internal final worksheet |
| Mike/Hermes | Coach Matthew, explain reasoning, prepare artifacts; not store system of record |
| Manager | Owns count confirmation, override, and final order decision |
| Supplier process | Remains outside the app |

## Current MVP scope

In:
- manager-only interactive reorder workflow;
- full/partial freezer count with freshness;
- pastry-to-frozen-SKU mapping, including many pastries to one dough SKU;
- current production-sheet quantities as the V1 mapped-dough demand baseline;
- variable shipment-available and plan-stock-through dates;
- whole-box rounding with no hidden percentage buffer;
- supplier minimum applied visibly only when known;
- `Short before delivery / Lasts through delivery / Excess after delivery`;
- editable boxes, reason, data status, internal final confirmation.

Out for now:
- Top 10 on the daily screen;
- production planner and baker/runner accounts;
- live kitchen alerts;
- direct POS credentials/integration;
- supplier submission or autonomous ordering;
- savings claims, multi-store, and black-box forecasting.

## Current evidence

- Implementation: `app/`
- Tests: 8/8 current prototype tests pass
- Review package: `artifacts/BakeryOps-Assistant-App.zip`
- Current direction: `CURRENT-DIRECTION.md`
- Owner review: `reviews/OWNER-REVIEW-2026-07-24.md`

## Current build gate

Read `plans/NEXT-ORDER-LIST-BUILD-GATE.md`, `plans/NEXT-ORDER-LIST-ACCEPTANCE-SCENARIOS.md`, and `data/redacted-sku-contracts/croissant-dough.md`. Complete the remaining redacted count/date/supplier behavior and persistence decision before entering BUILD.

## Historical context

The original concept included production planning, waste, baker sheets, and multiple roles. Those ideas remain under `plans/`, `artifacts/`, and `demos/` for evidence and later reconsideration. They are not current implementation scope.

---
project: bakeryops-assistant
mode: engineering-convergence
active_slice: next-order-list
owner_proposal_advisory: false
---

# TODO — BakeryOps Assistant

## Next Order List — active convergence lane

Scope:
- In: one manager-facing frozen-dough Next Order List vertical slice.
- Deferred: Tomorrow's Production, Waste Pattern Review, live POS integration, supplier submission, and broad Product Setup.

Why:
- Matthew selected Next Order List as the flagship portfolio build.
- Product/design convergence is strong; one redacted data contract and persistence choice remain before BUILD.

References:
- `plans/NEXT-ORDER-LIST-BUILD-GATE.md`
- `plans/NEXT-ORDER-LIST-ACCEPTANCE-SCENARIOS.md`
- `data/redacted-sku-contracts/croissant-dough.md`

Completed evidence:
- [x] POS item-level sales capability reported.
- [x] Manager full/partial freezer-count workflow reported.
- [x] Whole-card KPI → focused workspace selected.
- [x] Date-driven pre-arrival/post-arrival formula shape selected.
- [x] Production-sheet quantities selected as V1 demand baseline.
- [x] No-hidden-percentage-buffer rule selected.
- [x] One redacted shared-dough mapping recorded.
- [x] Generic weekday croissant-dough baseline calculated as 84 pieces.
- [x] Acceptance scenarios drafted.
- [x] Current prototype tests pass 8/8.

Next tasks — finish before BUILD:
- [ ] Confirm whether the generic weekday quantities apply identically Monday through Friday.
- [ ] Add weekend production-sheet quantities or explicit no-production behavior.
- [ ] Add a redacted physical count and partial pieces.
- [ ] Add count date, shipment-available date, and plan-stock-through date.
- [ ] Confirm actual box size or retain 192 as visibly unverified prototype data.
- [ ] Define behavior when supplier minimum remains unknown.
- [ ] Freeze stale-count and hard-capacity behavior.
- [ ] Review and approve acceptance scenarios with Matthew.
- [ ] Select persistence technology.

First BUILD actions after the gate:
- [ ] Convert approved acceptance scenarios into failing tests.
- [ ] Implement domain calculation and missing-data states.
- [ ] Implement one persistent active draft and finalized-only immutable History.
- [ ] Refactor homepage and focused workspace.
- [ ] Verify exact portable archive and Mac fallback launch path.

Deferred backlog — do not start in the flagship build:
- [ ] Tomorrow's Production recommendation and large-change rule.
- [ ] Waste Pattern Review anomaly rule.
- [ ] Live POS import/integration.
- [ ] Supplier ordering or supplier-confirmation state.
- [ ] Measured impact claims without deployment evidence.

## Exploration boundary

Matthew still owns the broader product direction. New ideas may be explored without being silently added to the active BUILD scope. Capture them under `IDEA-LAB.md` / `ideas/`, then return to the selected slice unless Matthew explicitly changes direction.

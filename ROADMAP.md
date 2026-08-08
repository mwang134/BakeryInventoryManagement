---
hub_schema: 2
strategy_id: bakeryops-assistant
strategic_outcome: Prove that one store manager can prepare a transparent frozen-dough reorder worksheet from a physical count, mapped POS sales, and supplier timing.
current_stage_id: S-002
next_stage_id: S-003
last_reconciled: 2026-07-24
advisory_owner_proposal: true
---

# BakeryOps Owner-Proposal Roadmap

This roadmap is a suggested delivery path if Matthew chooses the reorder proposal. It is not his assigned direction and does not govern divergence-mode ideas.

## Program outcome ledger

| ID | Outcome | Success gate | Status |
|---|---|---|---|
| P-01 | Explainable manager reorder decision | One manager can trace count + demand + delivery timing to an editable internal order draft | In progress |
| P-02 | Credible portfolio proof | Working slice, tests, screenshot, and honest sample/real-data boundary | In progress |
| P-03 | Store validation | Redacted real examples confirm the workflow helps without adding frontline friction | Not started |

## Stage map

| Stage | Result | Completion gate | Status |
|---|---|---|---|
| S-001 | Discovery + first working reorder slice | App runs, 4 baseline tests pass, sample boundary visible | Completed |
| **S-002** | **Delivery-horizon decision contract** | One mapped frozen SKU has enough confirmed/redacted fields to calculate and explain `short / lasts / excess` | **Active** |
| S-003 | Simplified v0.2 manager screen | Delivery-horizon logic, exception-first UI, expanded tests, screenshot/package proof | Next |
| S-004 | Manager/example validation | 2–3 redacted examples reviewed; formula and workflow adjusted from evidence | Future |
| S-005 | Expansion decision | Evidence decides whether production planning, owner analytics, or additional role views earn scope | Deferred |

## Current stage — S-002

Why now:
- The prototype proves mechanics, but its fixed seven-day target is arbitrary.
- Product Setup UI would freeze unverified fields too early.
- The highest-value next proof is one real/redacted SKU chain from sales and count to delivery-horizon action.

Evidence that changes the plan:
- If store data cannot map pastries to frozen SKUs, pause product-level reorder recommendations.
- If supplier dates/rules are too irregular to model simply, keep the app as a count/worksheet aid and defer automated suggestions.
- If managers do not see reorder planning as a real pain, re-open the product wedge before more code.

## Matthew-led divergence lane

`IDEA-LAB.md` operates independently of this stage map. A new idea does not need to wait, fit this roadmap, identify a smallest test, or seek promotion while it is expanding.

Mike follows the idea, maximizes its branches, and treats every owner proposal as optional. Only an explicit later convergence discussion introduces trade-offs, sequencing, feasibility, or roadmap selection.

## Next-stage gate

S-003 activates only when `NEXT-DISCUSSION.md` produces a complete one-SKU example and Mike writes a compact decision contract with expected outputs.

# BakeryOps — Owner Proposal / Current Working Option

Status: **SELECTED DELIVERY LANE — engineering convergence before BUILD**  
Originally proposed: 2026-07-24  
Selected by Matthew: 2026-08-05/06  
This file retains the original rationale; the newest executable contract is in `plans/NEXT-ORDER-LIST-BUILD-GATE.md` and `plans/NEXT-ORDER-LIST-ACCEPTANCE-SCENARIOS.md`.

## Proposed product wedge

A **manager-facing frozen-dough reorder decision aid**.

It combines a fresh physical freezer count, mapped POS item sales, incoming stock, and supplier timing to answer:

> Will current stock last until the next supplier delivery? If not, how many boxes should the manager prepare to order?

The manager can edit and finalize an **internal worksheet**. The app never contacts a supplier or submits an order.

## Why the owner layer recommends this option

- It fits the manager's existing full/partial-box count before ordering.
- POS item-level units sold are confirmed and can provide demand evidence.
- It addresses one concrete decision: order, hold, or reduce.
- It does not add routine digital work for bakers or food runners.
- It can be explained and tested without black-box AI.

## Confirmed facts

- POS can report units sold for individual pastry items.
- Manager physically counts full and partial frozen-dough boxes before ordering.
- Inventory is exact only at count time; between counts it is estimated.
- Manager owns the final order decision.
- Supplier ordering remains outside the app.

## Data still required

For at least one frozen-dough SKU:

1. pastry item(s) that consume the SKU;
2. pieces per box and partial-box counting method;
3. fresh full/partial count and count time;
4. next order cutoff and next delivery date/lead time;
5. incoming boxes and supplier case/minimum rule;
6. current production-sheet quantities for each included date; comparable-day item sales remain supporting evidence;
7. optional later: box cost and practical freezer capacity.

Important model rule: several pastries may consume one frozen-dough SKU. Aggregate mapped pastry demand before calculating dough requirements.

## Approved main-screen spine

1. next delivery + count freshness + sample/missing-data warning;
2. exception-first reorder worksheet;
3. statuses: `Short before delivery`, `Lasts through delivery`, `Excess after delivery`;
4. editable manager order quantity;
5. short reason with on-demand `Why?` evidence;
6. one footer for total boxes, optional draft cost, and optional capacity;
7. explicit internal final confirmation.

## Remove or defer from the daily reorder screen

- Top 10 pastry ranking;
- large permanent comparable-day chart;
- duplicate order/overstock/cost/capacity cards;
- separate overstock card;
- large data-confidence panel;
- disabled future navigation;
- production planner, baker/runner accounts, live kitchen alerts;
- automatic POS integration or supplier ordering.

Role-specific views remain a design capability, not the current implementation target. The manager view is the only interactive MVP surface.

## Current proof and limitation

- Working dependency-free HTML/CSS/JavaScript slice exists.
- Current prototype tests pass 8/8.
- Portable ZIP is structurally valid.
- Current code still uses an arbitrary sample `7-day` target and sample mappings/rules.
- Therefore the current app is a **working prototype**, not a validated store recommendation system.

## Current convergence gate

Do **not** build a broad Product Setup screen or add more dashboard features in the approved delivery lane yet.

Complete the redacted croissant-dough contract in `data/redacted-sku-contracts/croissant-dough.md`, approve the acceptance scenarios, and choose persistence technology. Only after that gate should the simplified Next Order List screen be implemented test-first.

## Relationship to Matthew's ideas

Matthew owns the direction. When he proposes something new, `IDEA-LAB.md` divergence mode takes priority and this proposal waits.

Mike may offer this proposal only as an option: “one possibility is…” He must not use it to narrow, redirect, rank, or judge Matthew's idea.

Do not ask for MVP, minimum implementation, smallest test, feasibility, strongest concern, or a direction choice while the idea is still expanding. Convergence happens later and explicitly with Matthew.

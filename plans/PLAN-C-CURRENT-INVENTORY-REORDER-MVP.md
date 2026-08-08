# Plan C — Current Inventory and Reorder Planner MVP

**Status:** Preserved Plan C baseline. Refined and superseded as current truth by `../CURRENT-DIRECTION.md` after the 2026-07-23 simplification audit and 2026-07-24 owner review.

Do not use the Top 10 section, fixed seven-day target, or old first-build list as the next instruction. Use `../ROADMAP.md` and `../NEXT-DISCUSSION.md`.

## Product statement

A manager-facing website that combines physical full/partial freezer-box counts with item-level comparable-day pastry sales to prepare an explainable frozen-dough reorder recommendation.

The manager reviews and edits the draft. The website never contacts a supplier or submits an order.

## Why this is the current focus

Manager discovery confirms that the POS tracks total sales and units sold for each individual pastry item. The clearest missing workflow is using that item-level sales evidence and freezer counts to control inventory buildup and prepare reorder decisions.

Confirmed POS capability:
- Units sold are available for each individual pastry/SKU.
- The remaining data-model task is mapping each pastry item to its frozen-dough SKU, pieces per box, and supplier ordering rule.

## Primary manager decisions

1. Which frozen products need an order?
2. Which products are building up unnecessarily?
3. How long will the current stock probably last?
4. What sales evidence supports each recommendation?

## Current dashboard

### Reorder decision worksheet
For every mapped frozen product:
- product/SKU
- full and partial box count
- pieces per box
- typical comparable-day units sold
- estimated days of supply
- suggested order quantity
- manager-approved order quantity
- draft order cost
- decision status
- plain-language reason

### Comparable-day sales evidence
- compare like weekdays with like weekdays
- product selector
- recent item-level units sold
- typical comparable-day demand
- unusual-date exclusion for holidays, promotions, closures, or other exceptions

### Product popularity and sales mix
- show a horizontal Top 10 ranking by item-level units sold
- use a bar chart for ranking because it compares products more clearly than ten overlapping lines
- use a separate selected-product line graph for comparable-day change over time
- connect mapped products to coverage and order decisions

### Overstock and freezer capacity
- flag products with excessive days of supply
- estimate stock value above the coverage target
- show current and projected freezer use
- avoid calling inventory value `savings` or `waste`

### Data confidence
Clearly label whether each input is confirmed, sample, estimated, or missing:
- physical full/partial count
- item-level POS quantities
- pieces per box
- box cost
- case/minimum rules
- damaged-piece safety margin

### Final worksheet confirmation
- Keep the confirmation action directly below the reorder worksheet.
- The manager edits quantities, reviews total boxes, draft cost, and projected capacity, then marks the worksheet final.
- Do not duplicate the final action in the page header.
- Finalizing the worksheet does not contact a supplier or place an order.

### Deferred analytics
- Recommendation reliability/forecast-error analysis is removed from the daily dashboard because it does not currently change a clear manager action.
- It may return later in a history/settings view if managers need to review or tune forecasting performance.

## Required inputs

From POS:
- business date
- individual pastry/SKU
- units sold
- optional item revenue/price
- optional timestamp
- optional void/refund marker

From manager/product setup:
- pastry-to-frozen-SKU mapping
- full and partial physical count
- pieces per box
- box cost
- supplier case/minimum rules
- incoming stock
- practical freezer capacity
- manager-selected coverage/safety setting

## Guardrails

- POS sales show observed sales, not unmet demand after a sellout.
- POS sales do not reveal waste or damaged dough.
- The physical count anchors inventory; between counts, quantities are estimates.
- Popularity charts must connect to a stock/order decision.
- Do not claim cost savings without a defensible benchmark.
- Do not place or send supplier orders automatically.
- Manager approval remains explicit.
- Prototype uses fake or redacted data.

## Explicitly deferred

- Production-planner workflow unless later discovery proves it solves a separate manager problem
- Baker and food-runner accounts
- Baker execution sheet
- Live kitchen alerts
- Daily waste-cost dashboard without a reliable waste-recording process
- Autonomous ordering
- Exact real-time inventory
- Photo or voice counting
- Multi-store optimization

## First build slice

1. Load 5–10 fake mapped products.
2. Enter full and partial freezer counts.
3. Load fake item-level comparable-day sales.
4. Calculate days of supply.
5. Show suggested boxes, reason, draft cost, and projected capacity.
6. Allow manager override and internal approval.
7. Verify that no supplier action occurs.

## Current demo

- `demos/CURRENT-MANAGER-PLANNER-DASHBOARD.html`
- `demos/CURRENT-MANAGER-PLANNER-DASHBOARD.png`

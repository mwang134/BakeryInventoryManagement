# Optional Discussion — Reorder Proposal

Use this only when Matthew chooses to continue exploring the owner-proposed frozen-dough reorder option. Do not present it as the required next conversation and do not use it to interrupt a new idea.

## Optional framing from Mike

> One proposal we already have is to connect frozen-dough count, pastry demand, and next supplier delivery. We can keep developing that, combine it with one of your ideas, or leave it parked while we explore something else. What would you like to follow today?

## If Matthew chooses the reorder proposal

The owner layer has one unresolved question: can the recommendation be explained for a frozen-dough SKU using information a manager actually has?

Possible fields to explore together:

| Field | Example/answer |
|---|---|
| Frozen-dough SKU | |
| Pastry item(s) using this SKU | |
| Pieces per box | |
| Current full boxes | |
| Current partial pieces/fraction | |
| Count date/time | |
| Next order cutoff | |
| Next delivery date | |
| Incoming boxes | |
| Supplier case/minimum | |
| Comparable-day units sold | |
| Optional safety buffer | |

Possible outputs:

- `Short before delivery`
- `Lasts through delivery`
- `Excess after delivery`

## Formula decisions confirmed by Matthew

- The fixed seven-day value is only a prototype placeholder.
- The coverage horizon should be derived from the count/planning date-time and the estimated shipment-arrival date-time rather than stored as an unrelated fixed number.
- Every calendar day in that horizon is included, including weekdays and weekends.
- Demand should respect the type of day; do not apply one undifferentiated daily-sales average when weekday and weekend behavior differs.
- Several pastry items may consume the same frozen-dough SKU. Aggregate their expected dough usage before comparing demand with the physical dough count.
- For V1, use each included date's current production-sheet quantities as the expected-demand baseline. Comparable-day POS sales remain supporting evidence rather than silently replacing the production sheet with an average or median forecast.
- For V1, treat the entered shipment date as the first date on which the selected boxes are available. Dates before it are pre-arrival; that date and later dates are post-arrival. Time-of-day delivery is deferred unless real operations prove it necessary.
- Tomorrow's Production and Waste Pattern Review formulas will be discussed separately after the Next Order List formula.

Still to clarify before freezing the formula:

- Matthew confirmed that the shipment-arrival date entered in a Next Order List is the expected arrival date of the boxes selected in that same draft. Current stock is therefore evaluated against expected usage from the count/planning time until that arrival.
- The quantity to order needs a balanced post-arrival coverage rule. Matthew wants enough stock to meet expected demand with a modest stockout buffer, but not so much that slow-selling dough ties up cash or crowds the freezer. Because usable frozen dough is not immediately wasted, describe the downside as excess inventory/working capital/freezer crowding rather than sunk cost. A promising input pair is `This shipment arrives` plus `Plan stock through`; the app can enumerate every weekday/weekend in that window, aggregate mapped-pastry dough demand, add a still-unconfirmed safety buffer, subtract projected stock remaining at arrival, round to whole boxes, apply supplier minimums, and warn on practical freezer capacity.
- the pastry-to-dough conversion quantity when one sold pastry does not necessarily equal one frozen dough piece.

This worksheet is a suggestion for developing the reorder proposal, not a gate on Matthew's other ideas.

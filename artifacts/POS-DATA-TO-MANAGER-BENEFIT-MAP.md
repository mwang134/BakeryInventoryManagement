# POS Data to Manager Benefit Map

> Evidence/reference map. It does not define the current daily screen. Top 10/popularity is deferred from the reorder workflow; see `../CURRENT-DIRECTION.md`.

## Current discovery

The manager confirmed that the POS tracks:
- total sales
- units sold for each individual pastry/SKU

This supports product-level popularity, comparable-day demand, and product-level reorder recommendations once each pastry is mapped to its frozen-dough SKU and box rules.

## Data limitation test

### If POS has only total store sales and total pastry count
Possible:
- total pastry-demand trend
- comparable-day total pastry volume
- high/low demand days
- rough total frozen-dough requirement

Not possible:
- most-popular pastry ranking
- product-level demand forecast
- product-level box reorder recommendation
- product-level slow-moving inventory analysis

### If POS has item-level pastry counts
Possible:
- every feature below, assuming products can be mapped to frozen-dough SKUs and box sizes

## Prioritized manager-benefit features

### 1. Comparable-day demand

Manager decision:
- How much of each frozen product will probably be used before the next freezer count/delivery?

Evidence:
- compare Tuesday with recent Tuesdays
- separate weekdays and weekends
- allow holidays, promotions, closures, and unusual events to be excluded

Output:
- expected pieces sold by pastry
- trend direction
- confidence based on available history

Why it matters:
- creates the demand input for the reorder recommendation

### 2. Product popularity and sales mix

Manager decision:
- Which products deserve more freezer space and closer stock protection?

Useful outputs:
- pastries ranked by units sold
- each pastry’s share of total pastry units
- weekday/weekend popularity differences
- fast, medium, and slow movers

Guardrail:
- popularity alone is descriptive; connect it to stock levels or ordering to make it actionable

### 3. Days of supply / stock coverage

Manager decision:
- How long will the current full and partial boxes probably last?

Inputs:
- manager’s physical full/partial box count
- pieces per box
- expected product-level demand
- safety/shrinkage buffer

Output example:
- Butter Croissant Dough: approximately 8 days of supply
- Chocolate Croissant Dough: approximately 3 days of supply

Why it matters:
- translates boxes into language the manager can immediately understand

### 4. Explainable reorder recommendation

Manager decision:
- What should I order today?

Inputs:
- usable freezer count
- expected use before replenishment
- pieces per box
- safety buffer
- incoming stock
- case-size/minimum rules
- practical freezer capacity

Output:
- suggested boxes
- manager-approved boxes
- reason
- estimated draft order cost
- projected remaining stock

Example explanation:
> Suggest 2 boxes because current usable stock is expected to fall below the safety buffer before replenishment. Rounded to the supplier’s case size.

Guardrail:
- website prepares the decision; manager approves and places the order through the existing process

### 5. Overstock and slow-moving inventory risk

Manager decision:
- Which boxes are building up faster than the products sell?

Outputs:
- products with unusually high days of supply
- inventory value tied up in slow-moving dough
- projected freezer capacity after delivery
- suggested order reduction or no-order decision

Why it matters:
- directly targets unnecessary inventory buildup and cash tied up in the freezer

### 6. Demand trend change

Manager decision:
- Is a product becoming consistently more or less popular?

Outputs:
- recent comparable-day demand versus prior period
- sustained increase/decrease rather than one-day noise
- products whose reorder settings may need review

Guardrail:
- do not change settings automatically; manager reviews the evidence

### 7. Forecast/recommendation accuracy

Manager decision:
- Is the planner becoming trustworthy?

Compare:
- expected usage
- actual POS units sold
- next physical freezer count
- manager-approved order

Outputs:
- forecast error by product
- products with weak predictions
- recurring manager overrides

Why it matters:
- shows where the system is reliable and where manager judgment should dominate

## Useful only with additional data

### Product revenue ranking
Requires:
- item-level revenue or unit price

Benefit:
- compare popularity by units with contribution to revenue

### Margin or profit estimate
Requires:
- ingredient/purchase cost per piece
- packaging and other relevant costs

Benefit:
- rank products by estimated contribution, not only popularity

Guardrail:
- do not label revenue as profit

### Waste/sell-through review
Requires:
- quantity produced or starting display quantity
- waste/leftovers or end-of-day count

Benefit:
- distinguish high demand from overproduction

Guardrail:
- POS sales alone cannot reveal waste or unsatisfied demand

### Hourly demand pattern
Requires:
- item-level timestamps

Benefit:
- identify when products usually sell and support preparation timing

## Recommended MVP dashboard

### Top manager decisions
1. Which products need an order?
2. Which products are building up unnecessarily?
3. Can the current stock cover expected demand?

### Main sections
- freezer count entry: full and partial boxes
- comparable-day demand by product
- days of supply by frozen SKU
- suggested order with reason and manager override
- overstock/slow-mover list
- draft order cost and projected freezer capacity
- data-confidence/missing-information panel

### Secondary analytics
- pastry popularity ranking
- weekday/weekend sales mix
- demand trend changes
- recommendation accuracy

## Data fields to request next

From POS/export:
- business date
- pastry name or SKU
- units sold
- item revenue or unit price, if available
- timestamp, if available
- void/refund indicator, if available

From manager/product setup:
- pastry-to-frozen-SKU mapping
- pieces per box
- how partial boxes are expressed
- box/case cost
- supplier case/minimum rules
- physical count date
- incoming boxes
- practical freezer capacity

## One next discovery question

Ask the manager:

> When you say the POS tracks the number of pastries sold, can the report show the quantity for each individual pastry—for example, Butter Croissant 32 and Chocolate Croissant 21—or only one total pastry count?

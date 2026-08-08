# BakeryOps Product Opportunity Map

> Opportunity history, not current scope. Use `../CURRENT-DIRECTION.md` for the approved wedge and `../ROADMAP.md` for expansion gates.

Context: the manager physically counts full and partial freezer boxes before ordering. The MVP should support manager decisions without slowing bakers or food runners.

## Opportunity 1 — Freezer reorder and overstock planner

### Problem
Managers can see current boxes, but may not know whether that amount is too high or too low relative to upcoming demand, supplier lead time, and freezer capacity.

### Inputs
- Full boxes and partial-box estimate
- Pieces per box
- Planned production / expected usage
- Order day and delivery day
- Supplier lead time
- Minimum/full-case order rule
- Safety stock
- Freezer capacity
- Optional cost per box

### Outputs
- Estimated days of inventory remaining
- Low-stock warning
- Overstock / excess-cover warning
- Suggested order quantity, rounded to allowed case sizes
- Projected freezer level after delivery
- Reason for recommendation

### Value
Directly addresses inventory buildup, stockouts, freezer crowding, and excess purchasing.

### MVP fit
High, if the manager can provide box size, order schedule, and lead-time information.

## Opportunity 2 — Production and waste planner

### Problem
Fixed weekday/weekend quantities may create leftovers on slower days and sellouts on busier days.

### Inputs
- POS item sales
- Approved production quantities
- Leftovers or waste
- Sold-out / extra-batch observations where available
- Comparable weekdays

### Outputs
- Tomorrow’s recommended production/preparation sheet
- Comparable-day trend
- Waste and sellout warnings
- Manager-approved printable baker sheet

### Value
Reduces finished-pastry waste and missed sales.

### MVP fit
High, especially if POS item-level exports are available.

## Opportunity 3 — Freezer capacity planner

### Problem
An order may be financially reasonable but physically overcrowd the freezer.

### Inputs
- Current boxes by product
- Incoming deliveries
- Box-space or shelf-space requirement
- Total usable freezer capacity

### Outputs
- Projected capacity after delivery
- Crowding warning
- Products occupying excess space
- Suggested order timing or reduction

### Value
Prevents inventory buildup and improves freezer organization.

### MVP fit
Medium; requires a practical way to describe freezer capacity.

## Opportunity 4 — Expiration and FIFO assistant

### Problem
Older boxes may remain behind newer deliveries and eventually expire or deteriorate.

### Inputs
- Delivery date
- Expiration or best-use date
- Box/lot identity
- Remaining boxes

### Outputs
- Use-first list
- Expiration warning
- Aging inventory report

### Value
Reduces avoidable ingredient waste.

### MVP fit
Low to medium because lot/date entry adds work. Use only if expiration loss is a confirmed problem.

## Opportunity 5 — Order calendar and supplier constraint planner

### Problem
Managers may order too late, miss an order day, or forget case-size and minimum-order rules.

### Inputs
- Order days
- Delivery days
- Lead times
- Case sizes
- Minimum order quantities
- Supplier availability notes

### Outputs
- Upcoming order reminder
- Products that will run low before the next delivery
- Suggested order quantities
- Manager approval checklist

### Value
Reduces emergency purchases and ordering mistakes.

### MVP fit
High if ordering schedules are stable.

## Opportunity 6 — Preparation workload planner

### Problem
A quantity plan may be correct for demand but impossible to complete with available labor, proofing time, oven capacity, racks, or trays.

### Inputs
- Pastry preparation type
- Preparation/bake time
- Required trays
- Available labor and equipment capacity

### Outputs
- Tomorrow’s preparation workload
- Over-capacity warning
- Suggested preparation order

### Value
Improves labor flow and on-time opening readiness.

### MVP fit
Medium to low until time and capacity data are observed.

## Opportunity 7 — Packaging-supply planner

### Problem
A bakery can have enough dough but run short of bags, boxes, labels, trays, or packaging materials.

### Inputs
- Packaging stock
- Packaging usage per product
- Planned packaged quantities
- Supplier lead time

### Outputs
- Low packaging-supply alerts
- Weekly reorder list

### Value
Prevents operational disruption unrelated to pastry demand.

### MVP fit
Medium if packaging shortages are common; otherwise defer.

## Opportunities to defer

- Fully autonomous ordering
- Exact real-time inventory without physical reconciliation
- Individual baker and food-runner accounts
- AI photo counting before the basic workflow is validated
- Multi-store transfers and optimization
- Menu removal decisions that may be controlled by franchise policy
- Complex labor scheduling

## Recommended product direction

Combine only two closely related manager jobs in the MVP:

1. **Production planner:** recommend tomorrow’s pastry quantities and generate the final baker sheet.
2. **Reorder planner:** use full/partial freezer-box counts and next-week expected usage to prepare a manager-approved order suggestion.

Keep every recommendation transparent and editable. Do not place supplier orders automatically.

## Highest-priority discovery gaps

1. Pieces per box for each frozen product
2. Partial-box counting method
3. Supplier order and delivery days
4. Lead times
5. Full-case/minimum-order rules
6. Freezer capacity or practical maximum stock
7. Product cost per box, if cost savings will be measured
8. POS item-level export availability
9. Whether expiration or packaging shortages are real problems

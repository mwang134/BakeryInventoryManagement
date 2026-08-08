# BakeryOps MVP — Top-Level Feature Design

> Historical broad feature design. It is not the current build instruction. Use `../CURRENT-DIRECTION.md`; the current MVP is the manager reorder wedge only.

## Product statement

A manager-facing website with two connected planning tools:

1. **Production planner** — recommends pastry quantities and generates the final baker execution sheet.
2. **Reorder planner** — uses full/partial freezer-box counts and expected production to prepare a manager-approved frozen-dough order suggestion.

The interface uses spreadsheet-style editable tables, but adds calculations, validation, status alerts, explanations, and version control.

## Main navigation

1. Dashboard
2. Production Planner
3. Reorder Planner
4. Product Setup
5. History / Approved Plans

## 1. Dashboard

### Required features
- Planning date and store/manager context
- Tomorrow’s production-plan status: draft or approved
- Yesterday’s waste cost versus a transparent normal matching-weekday reference
- Product-level waste contributors and suggested items to investigate
- Products with preparation shortages
- Products with low estimated freezer stock
- Products with possible overstock
- Upcoming order deadline
- Current draft order cost
- Button to review production plan
- Button to review reorder plan
- Clear label that all recommendations require manager approval

### Purpose
Show only the exceptions and decisions requiring manager attention.

### Metric boundaries
- `Normal waste cost` should initially mean the typical waste cost from the previous four comparable weekdays, with unusual dates excluded.
- A daily difference is a signal to investigate, not verified savings.
- Do not show `purchase deferred` as a savings KPI; inventory not purchased today may still be purchased later.
- Keep supplier timing/order-cycle logic inside the reorder calculation unless the manager needs to act on a deadline.

## 2. Production Planner

### Spreadsheet-style columns
- Pastry name
- Preparation type: `prepare today for tomorrow` or `ready to bake`
- Existing weekday/weekend standard
- Comparable weekday average sales
- Recent leftovers
- Recent sellout / extra-batch indicator, if available
- System-recommended quantity
- Recommended trays
- Reserve-tray rule
- Manager-approved quantity
- Manager note / override reason
- Status: draft or approved

### Required features
- Compare Monday with previous Mondays, Friday with previous Fridays, etc.
- Use transparent rules rather than black-box forecasting
- Show why each quantity was recommended
- Allow manager edit/override
- Require explicit manager approval
- Separate the final plan into:
  - prepare today for tomorrow
  - ready-to-bake / reserve instructions
- Generate printable baker sheet
- Display bake date, generated time/version, manager name/initials, and approval status
- Mark replaced sheets as superseded when a new version is approved

## 3. Reorder Planner

### Manager input columns
- Frozen product name / SKU
- Full boxes counted
- Partial box amount: fraction or remaining pieces
- Count date/time
- Incoming boxes already ordered
- Optional manager adjustment

### Product/rule columns
- Pieces per full box
- Expected shrinkage/safety buffer
- Planned usage before next delivery
- Supplier lead time
- Order day
- Delivery day
- Full-case/minimum-order rule
- Safety stock
- Practical maximum/freezer-capacity limit
- Optional cost per box

### Calculated columns
- Estimated usable pieces/boxes available
- Projected inventory before next delivery
- Estimated coverage through next delivery
- Low-stock status
- Overstock / excess-cover status
- Suggested order quantity
- Projected inventory after suggested delivery
- Estimated order cost, if cost data exists
- Plain-language recommendation reason

### Manager decision columns
- Manager-approved order quantity
- Manager note / override reason
- Status: draft, approved, or deferred

### Required behavior
- Label inventory between physical counts as estimated
- Reconcile estimates whenever the manager performs a new freezer count
- Apply safety/shrinkage buffer rather than requiring every damaged piece to be logged
- Round suggestions to allowed case sizes
- Warn when an order may exceed practical freezer capacity
- Never place or send the supplier order automatically
- Export/print an approved order-preparation list for the manager

## 4. Product Setup

### Required fields
- Product name
- POS name or item ID, if available
- Frozen product/SKU
- Preparation type
- Items per tray
- Weekend tray exception, if applicable
- Reserve eligible: yes/no
- Reserve trays
- Pieces per box
- Partial-box counting method
- Mon–Thu standard quantity
- Fri–Sun standard quantity
- Supplier case size / minimum
- Lead time
- Safety stock
- Active/inactive status

### Purpose
Store rules once so managers do not re-enter them every day.

## 5. History and approved plans

### Required features
- Previous production plans
- Previous reorder plans
- Manager approvals and overrides
- Generated versions/timestamps
- Comparable-day history
- Ability to reopen and print the latest approved sheet
- Clear superseded-version label

## Spreadsheet interaction features

- Prefilled rows and formulas
- Editable input cells visually distinguished from calculated cells
- Dropdowns for categories and statuses
- Whole-number and non-negative validation
- Conditional colors: green, yellow, red
- Search, filter, and sort
- Freeze pastry-name/header columns
- Save draft
- Approve/finalize
- Import POS CSV when available
- Export/print baker sheet and order-preparation list
- Plain-language explanation beside each recommendation

## MVP safety and truth rules

- App is the planning source of truth; printed sheets are execution copies.
- Manager approval is required for production and reorder quantities.
- Inventory is exact only at manager-confirmed physical count time; between counts it is estimated.
- Supplier orders are never placed automatically.
- No POS credentials or confidential customer/payment data are required for the prototype.
- Start with fake/redacted sample data.

## Explicitly deferred

- Individual baker and food-runner accounts
- Replacing verbal restock communication
- AI photo counting
- Voice editing
- Fully automatic POS integration
- Autonomous supplier ordering
- Exact real-time inventory
- Multi-store optimization
- Advanced black-box forecasting

## Recommended first prototype slice

Build one spreadsheet-like reorder table for 5–10 sample frozen products with:

1. full boxes
2. partial-box amount
3. pieces per box
4. planned next-week usage
5. safety stock
6. suggested order
7. low/overstock status
8. manager-approved order quantity
9. transparent reason

Then generate one printable baker production/preparation sheet from sample production data.

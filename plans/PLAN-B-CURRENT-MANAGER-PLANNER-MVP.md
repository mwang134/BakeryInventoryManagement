# Plan B — Manager Production and Reorder Planner

**Status:** Preserved previous manager-first direction; superseded by the focused inventory/reorder MVP after manager workflow discovery.

**Purpose of this file:** Preserve the earlier two-planner direction for comparison. The current active direction is documented in `PLAN-C-CURRENT-INVENTORY-REORDER-MVP.md`.

## Product idea

A manager-facing bakery planning website with two connected tools:

1. **Production planner** — recommends pastry quantities and generates the final baker production/preparation sheet.
2. **Reorder planner** — uses full and partial freezer-box counts plus expected usage to prepare a manager-approved frozen-dough order suggestion.

The software supports manager decisions without requiring routine app interaction from bakers or food runners.

## Roles

### Manager
- Uses the website
- Imports/reviews sales information
- Enters full and partial freezer-box counts at ordering time
- Reviews comparable-day trends
- Reviews production and reorder recommendations
- Changes quantities when appropriate
- Approves final plans
- Prints or displays the latest baker sheet
- Places supplier orders through the existing approved process

### Head baker / bakers
- Check the approved printed or read-only execution sheet
- Prepare and bake the listed quantities
- Follow reserve-tray instructions
- Do not need individual app accounts for the MVP
- Do not change manager-approved production targets

### Food runner
- Continues existing verbal communication with bakers for urgent replenishment
- Does not need an app account for the MVP
- May verbally report low/sold-out items and extra-batch needs to the manager/baker

## Devices

### Required
- Manager desktop, laptop, or tablet
- Printer, or one read-only display if the store prefers digital viewing

### Not required for MVP
- Baker phones
- Food-runner phones
- Individual kitchen tablets
- Shared event-reporting kiosk
- Live push-notification devices

## Main workflow

1. Manager imports or reviews POS item-sales information when available.
2. Manager reviews comparable weekdays, leftovers, sellouts, and known extra batches.
3. System recommends tomorrow’s production/preparation quantities.
4. Manager edits and approves the final quantities.
5. Website generates a dated, versioned baker execution sheet.
6. Bakers follow the sheet.
7. Food runner and bakers continue fast verbal restock communication.
8. Before ordering, manager counts full and partial freezer boxes.
9. Reorder planner combines the physical count with expected usage, lead time, safety stock, case rules, and freezer capacity.
10. Manager reviews/overrides the order suggestion.
11. Manager places the supplier order through the existing approved process; the website does not send it automatically.

## Main pages

### 1. Dashboard
- Tomorrow’s production-plan status
- Yesterday’s total waste cost compared with a normal matching weekday
- Product-level waste contributors so the manager can investigate the difference
- Preparation shortages
- Low estimated freezer stock
- Possible overstock
- Upcoming order deadline
- Current manager-reviewed order draft and its estimated cost
- Plans waiting for manager approval

Dashboard metric rule:
- Do not claim `waste cost avoided` until a defensible before/after benchmark exists.
- Define `normal waste cost` transparently, initially as the typical cost from the previous four comparable weekdays.
- Allow holidays, promotions, closures, and other unusual dates to be excluded.
- Treat the comparison as an investigation prompt, not automatic proof of savings or failure.
- Do not present `purchase deferred` as savings; a delayed purchase may still occur later.
- Supplier timing/order-cycle rules may support reorder calculations internally, but they are not a manager-facing benefit or KPI by themselves.

### 2. Production Planner
Spreadsheet-style fields:
- Pastry
- Preparation type
- Existing weekday/weekend standard
- Comparable-day average
- Recent leftovers/sellouts where available
- Recommended pieces and trays
- Reserve rule
- Manager-approved quantity
- Override reason
- Draft/approved status

Outputs:
- Transparent explanation
- `Prepare today for tomorrow` list
- `Ready to bake / reserve` list
- Printable baker sheet

### 3. Reorder Planner
Manager inputs:
- Frozen product / SKU
- Full boxes counted
- Partial box amount
- Count date/time
- Incoming boxes

Stored rules:
- Pieces per box
- Expected shrinkage/safety buffer
- Planned usage before next delivery
- Order/delivery days
- Lead time
- Minimum/full-case rule
- Safety stock
- Practical freezer capacity
- Optional box cost

Calculated outputs:
- Estimated usable stock
- Coverage through next delivery
- Low-stock warning
- Overstock warning
- Suggested order quantity
- Projected stock after delivery
- Plain-language reason

Manager decisions:
- Approved order quantity
- Override reason
- Draft/approved/deferred status

### 4. Product Setup
- Product and POS names/IDs
- Preparation type
- Items per tray
- Weekend tray exception
- Reserve eligibility
- Pieces per box
- Partial-box counting method
- Weekday/weekend standards
- Supplier constraints
- Lead time and safety stock

### 5. History
- Approved production plans
- Approved reorder plans
- Manager overrides
- Versions and timestamps
- Latest printable baker sheet
- Superseded-sheet labels

## Baker sheet requirements

Every sheet must show:
- Bake/preparation date
- `DRAFT` or `FINAL`
- Version or generated timestamp
- Manager name/initials
- Pastry names
- Pieces and trays
- Preparation type
- Reserve instructions
- Clear replacement/superseded status when updated

## Inventory accuracy rule

- Manager counts full and partial boxes before ordering.
- Damaged/broken pieces are treated as expected shrinkage or margin of error rather than logged individually.
- Inventory is most reliable at the physical count time.
- Between counts, balances are estimates and must be labeled as such.
- Reorder suggestions include a transparent safety/shrinkage buffer.

## Strengths

- Minimal interruption to kitchen workflow
- No frontline accounts or data entry
- Preserves verbal communication that already works
- Focuses software on the manager’s highest-value decisions
- Easier MVP to build, test, and explain
- Can reduce both pastry waste and frozen-dough overstock

## Risks and controls

### Stale paper sheet
Control: date, final status, manager identity, version/time, and superseded labels.

### Missing same-day event data
Control: manager may include known sellouts/extra batches during review without forcing frontline logging.

### Estimated inventory drift
Control: reconcile with the manager’s next full/partial box count and show estimate confidence.

### Unknown POS access
Control: support redacted CSV/manual sample data first; do not require credentials.

## Explicitly deferred

- Individual baker and food-runner accounts
- Replacing verbal restock communication
- Live kitchen notification system
- Photo counting
- Voice editing
- Exact real-time inventory
- Automatic supplier ordering
- Multi-store optimization
- Black-box forecasting

## Recommended first prototype

1. Spreadsheet-like reorder planner for 5–10 fake products
2. Full-box and partial-box manager inputs
3. Expected usage, safety stock, low/overstock status, suggested order, and explanation
4. Manager-approved order field
5. Simple production planner using comparable weekdays
6. Versioned printable baker sheet

All prototype data should be fake or explicitly redacted and approved.

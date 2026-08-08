# Next Order List — Acceptance Scenarios

Status: **CONVERGE — behavior scenarios drafted for Matthew review**

These scenarios define what the selected Next Order List must do. They are not automated tests yet. The first BUILD action is to convert the approved scenarios into failing tests before changing implementation code.

All numerical examples are illustrative until Matthew completes one realistic/redacted pastry-to-dough SKU contract.

## A. Homepage and workspace

### A1 — Whole KPI card opens the active workflow

**Given** the homepage shows a Next Order List KPI card  
**When** the manager selects anywhere on the card  
**Then** the app opens the focused Next Order List workspace  
**And** no separate `Expand` step is required.

### A2 — Homepage and Current open the same draft

**Given** one active Next Order List draft exists  
**When** the manager opens it from the homepage or the workspace `Current` tab  
**Then** both entry points open the same draft identifier and quantities  
**And** no duplicate draft is created.

## B. Count prerequisite

### B1 — Missing count blocks recommendations and finalization

**Given** a frozen-dough SKU has no confirmed physical count  
**When** the manager opens its Next Order List row  
**Then** the row shows `Count needed`  
**And** no confident box suggestion is shown  
**And** the complete draft cannot be finalized.

### B2 — Confirmed count becomes the inventory source of truth

**Given** the manager records full boxes, partial pieces, and a count timestamp  
**When** the count is confirmed  
**Then** usable on-hand pieces equal full-box pieces plus partial pieces  
**And** the count section may collapse to a compact confirmed state  
**And** a quiet `View count` action can reopen it.

### B3 — Stale count is not silently treated as current

**Given** the most recent whole-freezer routine count happened before the most recent Monday  
**When** the manager opens or finalizes the draft  
**Then** the app identifies the count as stale  
**And** requires recount/confirmation before finalization.

### B3a — Low stock forces an off-cycle recount for one pastry

**Given** a pastry's projected or on-hand stock is at or below 1 box  
**And** it has not been recounted since dropping to that level  
**When** the manager opens its Next Order List row  
**Then** the app requires an immediate recount for that pastry specifically  
**And** this off-cycle recount does not change the routine Monday recount schedule for other pastries.

## C. Date-driven production-sheet demand

### C1 — Every date in the selected windows is included

**Given** a count/planning date, shipment-available date, and plan-stock-through date  
**When** expected demand is prepared  
**Then** the app enumerates every calendar date in the relevant windows  
**And** includes weekdays and weekends rather than using a fixed seven-day number.

### C2 — Shipment date starts post-arrival availability

**Given** the entered shipment date is Thursday  
**When** demand is divided into pre-arrival and post-arrival windows  
**Then** dates before Thursday belong to pre-arrival risk  
**And** Thursday and later dates belong to post-arrival coverage.

### C3 — Production-sheet quantities are the V1 baseline

**Given** each included date has current production-sheet quantities  
**When** expected dough usage is calculated  
**Then** the app uses those date-specific quantities  
**And** does not replace them with one generic daily-sales average  
**And** comparable-day POS sales remain visible as supporting evidence rather than silently changing the baseline.

### C4 — Missing production-sheet quantity blocks a confident suggestion

**Given** one required date or mapped pastry has no production-sheet quantity  
**When** the app calculates expected dough usage  
**Then** the affected SKU shows `Information incomplete`  
**And** identifies the missing date/pastry  
**And** does not present a confident suggested box quantity.

## D. Shared pastry-to-dough mapping

### D1 — Several pastries using one dough SKU are aggregated

**Given** two or more pastry items map to the same frozen-dough SKU  
**And** each mapping has a confirmed dough-pieces-per-planned-pastry conversion  
**When** the app calculates demand for that SKU  
**Then** it converts every mapped pastry's production-sheet quantity into dough pieces  
**And** sums all mapped dough usage exactly once.

### D2 — Missing mapping blocks a confident suggestion

**Given** a production-sheet pastry has no confirmed frozen-dough mapping or conversion  
**When** the app attempts to calculate its SKU demand  
**Then** the app shows `Mapping needed`  
**And** does not guess that one pastry equals one dough piece.

## E. Pre-arrival risk

### E1 — Current stock lasts through delivery

**Given** current usable stock is 10 pieces  
**And** expected production-sheet usage before arrival is 8 pieces  
**When** pre-arrival risk is calculated  
**Then** projected stock at arrival is 2 pieces  
**And** the status is `Lasts through delivery`.

### E2 — Current stock is short before delivery

**Given** current usable stock is 6 pieces  
**And** expected production-sheet usage before arrival is 8 pieces  
**When** pre-arrival risk is calculated  
**Then** the shortage is 2 pieces  
**And** the status is `Short before delivery`  
**And** a later-arriving order does not hide or retroactively repair that warning.

## F. Suggested arriving quantity

### F1 — Whole-box rounding creates a visible natural cushion

**Given** 2 usable pieces are projected to remain at arrival  
**And** expected usage through the plan-stock-through date is 15 pieces  
**And** the supplier box contains 8 pieces  
**And** the supplier minimum is 1 box  
**When** the base suggestion is calculated  
**Then** net additional need is 13 pieces  
**And** the raw whole-box requirement rounds up to 2 boxes  
**And** 16 pieces arrive  
**And** projected end stock is 3 pieces  
**And** the explanation labels those 3 pieces as the natural whole-box rounding cushion rather than a hidden percentage buffer.

### F2 — Supplier minimum is applied visibly

**Given** the rounded raw requirement is 1 box  
**And** the supplier minimum is 2 boxes  
**When** the base suggestion is calculated  
**Then** the suggestion is 2 boxes  
**And** the explanation states that the supplier minimum increased the quantity.

### F2a — Unknown supplier minimum does not block the draft

**Given** the supplier minimum for a SKU is unknown  
**When** the base suggestion is calculated  
**Then** the app shows the raw whole-box suggestion without applying any invented minimum  
**And** the row displays a permanent `Supplier minimum not verified` caveat  
**And** the draft and finalization are not blocked by this missing field  
**And** the same caveat persists into the finalized snapshot for that row.

### F3 — No need produces a zero-box base suggestion

**Given** projected stock at arrival already covers expected usage through the plan-stock-through date  
**When** the base suggestion is calculated  
**Then** the suggestion is 0 boxes  
**And** the row shows `Skip this order` or `Excess after delivery` according to the projected end-stock evidence  
**And** the manager may still override the quantity with a recorded reason.

## G. Manager judgment and consequences

### G1 — Manager can use or override the suggestion

**Given** the base suggestion is 2 boxes  
**When** the manager keeps 2, changes it to 1, or changes it to 3  
**Then** the draft stores the manager quantity separately from the base suggestion  
**And** recalculates projected end stock and capacity  
**And** retains an explanation of the original suggestion.

### G2 — Lower override shows stockout consequence

**Given** the illustrative scenario in F1  
**When** the manager changes the order from 2 boxes to 1 box  
**Then** projected end stock is negative 5 pieces  
**And** the app warns of the projected shortage before finalization.

### G3 — Higher override shows excess-inventory consequence

**Given** the illustrative scenario in F1  
**When** the manager changes the order from 2 boxes to 3 boxes  
**Then** projected end stock is 11 pieces  
**And** the app shows the additional inventory and freezer-capacity consequence  
**And** does not call usable frozen stock finished-pastry waste or sunk cost.

## H. List, Chart, and capacity

### H1 — List and Chart show the same draft

**Given** the manager changes a row quantity in List view  
**When** the manager opens Chart view  
**Then** the chart reflects the same manager quantity and projected consequence  
**And** does not create a separate plan.

### H2 — Capacity warning is a guardrail, not a hidden quantity change

**Given** the manager quantity would exceed practical or hard freezer capacity  
**When** the draft totals are recalculated  
**Then** the app shows the appropriate capacity warning  
**And** does not silently reduce the manager quantity.

### H2a — Exceeding hard capacity warns but does not block finalization

**Given** the manager quantity would push projected stock above the hard freezer-capacity maximum  
**When** the manager attempts to finalize  
**Then** the app shows an explicit hard-capacity warning on the affected row/zone  
**And** finalization is still allowed to proceed  
**And** the finalized snapshot preserves the hard-capacity warning rather than silently dropping it.

## I. Persistence, finalization, and History

### I1 — Active draft survives reload

**Given** the manager edits quantities in the active draft  
**When** the browser refreshes or the local app restarts  
**Then** the same draft, count, dates, mappings/version references, and manager quantities are restored.

### I2 — Incomplete draft is not History

**Given** an active draft has not been finalized  
**When** the manager opens History  
**Then** that draft does not appear as a historical record.

### I3 — Finalization requires complete inputs

**Given** any required count, production-sheet quantity, mapping, date, or manager quantity is missing or invalid  
**When** the manager attempts to finalize  
**Then** finalization is blocked  
**And** the app identifies every unresolved item.

**Exception:** an unknown supplier minimum does not block finalization on its own — see F2a. It persists as a visible caveat on the finalized row instead.

### I4 — Finalization creates one internal read-only snapshot

**Given** all required rows and inputs are complete  
**When** the manager selects `Finalize Next Order List`  
**Then** the app stores one read-only snapshot containing evidence, base suggestions, manager quantities, dates, count timestamps, and manager/finalized time  
**And** the record appears in History  
**And** `supplierOrderSent` remains false  
**And** the app never claims a supplier received or accepted an order.

### I5 — Finalized records are not silently edited

**Given** a finalized History record exists  
**When** the manager needs a correction  
**Then** the original snapshot remains unchanged  
**And** reopening creates a new draft/version rather than mutating History.

## Remaining scenario parameters to freeze after mapping

- One realistic/redacted frozen-dough SKU and mapped pastries.
- Dough pieces consumed per planned pastry.
- Pieces per supplier box and supplier minimum.
- Realistic production-sheet quantities by included date.
- Physical full/partial count and count timestamp.
- Shipment date and plan-stock-through date.
- Practical/hard freezer-capacity behavior.
- Stale-count threshold.
- Persistence technology.

After Matthew fills the mapping/redacted SKU contract, replace the illustrative numbers in at least one end-to-end scenario with the approved redacted values and freeze the expected outputs.

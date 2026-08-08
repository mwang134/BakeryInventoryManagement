# Plan A — Multi-User, Multi-Device Bakery Operations Website

**Status:** Preserved original concept; not the current MVP recommendation.

**Purpose of this file:** Keep Matthew’s original role-based website idea available for comparison or possible future development.

## Product idea

A shared bakery operations website used by the manager, head baker/bakers, and food runner on different devices. Each role receives a different screen and permission level while working from one live operating plan.

## Main roles and authority

| Role | Main responsibilities in the app | Authority boundary |
|---|---|---|
| Manager | Review POS sales, freezer inventory, leftovers, sellouts, forecasts, alerts, production plans, and reorder plans | Can edit and approve production and reorder quantities |
| Head baker / baker | View the approved preparation and bake list; acknowledge and mark work complete; report an execution exception | Cannot change the manager-approved target quantity |
| Food runner | Report `Running Low`, `Sold Out`, or `Extra Batch Requested`; view whether the request was acknowledged | Cannot change production targets or approve orders |

Important distinction:
- Bakers and food runners may **report what happened**.
- Only the manager may **change the approved plan**.

## Devices

### Manager
Possible devices:
- Office desktop or laptop
- Manager tablet
- Manager phone for alerts

Primary manager screen:
- Full dashboard
- Production planner
- Reorder planner
- Inventory and sales history
- Approval controls

### Head baker / bakers
Possible devices:
- Shared mounted kitchen display
- Shared kitchen tablet
- Individual work device, if company policy permits

Primary baker screen:
- Read-only final list
- Separate `Prepare today for tomorrow` and `Ready to bake` sections
- Pieces and tray quantities
- Reserve-tray instructions
- `Acknowledge`, `Complete`, and `Report exception` actions

### Food runner
Possible devices:
- Shared display-area tablet
- Shared kiosk
- Employee phone, if permitted

Primary food-runner screen:
- Large product tiles
- One-tap `Running Low`, `Sold Out`, and `Extra Batch` actions
- Automatic item, time, and user/station recording
- Request acknowledgement status

## Proposed live workflow

1. Manager reviews POS sales, inventory, and system recommendations.
2. Manager edits and approves the production/preparation plan.
3. Approved quantities appear on the baker device.
4. Baker acknowledges and executes the list.
5. Food runner reports low or sold-out display items through one-tap actions.
6. Baker receives the replenishment request and prepares/bakes the extra batch.
7. Baker marks the request completed.
8. Manager sees the live event history and uses it in future planning.
9. Manager reviews and approves reorder suggestions.

## Main pages

### Manager dashboard
- Tomorrow’s plan status
- Low ready-to-bake inventory
- Preparation shortages
- Sold-out and extra-batch events
- Comparable-day trends
- Reorder warnings
- Production and order approval queue

### Baker execution board
- Approved quantities only
- Trays and pieces
- Preparation type
- Reserve instruction
- Completion status
- Exception reporting

### Food-runner event screen
- Product tiles
- Low / sold out / extra batch
- Quantity or tray count when necessary
- Time recorded automatically

### Shared history
- Approved plan versions
- Acknowledgements
- Completion events
- Extra-batch requests
- Manager changes

## Notification design

Possible channels:
- In-app alert
- Kitchen display change
- Sound on a shared device
- Manager push notification

Urgent verbal communication should remain available as a fallback. The app should not delay an urgent restock request.

## Strengths

- One shared source of truth
- Clear role permissions
- Real-time status and accountability
- Captures extra-batch and sold-out events
- Reduces stale paper plans
- Strong long-term product direction

## Risks and bottlenecks

- Login and device friction during a busy shift
- Employees may not have suitable work devices
- Phones/tablets may be inappropriate in food-handling areas
- Notifications may be slower than existing verbal communication
- Network, charging, cleaning, and device placement become operational dependencies
- Manager may become a bottleneck if too many actions require approval
- Event entry may slow bakers and food runners during irregular customer rushes
- Requires account management, permissions, shift handoff, and audit design

## Conditions required before using this design

- Confirm devices available to each role
- Confirm phones/tablets are allowed in production areas
- Test whether each frontline action takes only a few seconds
- Confirm who monitors the shared device
- Define offline and printer/device failure fallback
- Confirm company permission for store/POS data use
- Validate that digital communication improves the existing verbal workflow

## Features intentionally controlled

- Supplier orders are never placed automatically.
- Manager approval is required for quantity changes.
- Bakers and food runners cannot overwrite production or inventory records.
- AI/photo/voice inputs create drafts that require confirmation.

## Why this is not the current MVP

Matthew identified that irregular customer arrivals and busy periods could make multi-user app interaction slower than the existing workflow. Food-runner and baker verbal communication already works well. The current MVP therefore focuses software on the manager’s planning work and gives bakers a simple execution sheet.

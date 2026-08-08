# BakeryOps Interface Design Options

Status: historical/candidate interface concepts. The current manager-only reorder direction is frozen in `../CURRENT-DIRECTION.md`; multi-role views are deferred.

## Shared role rules across every option

| Role | Can view | Can report/confirm | Can change approved production quantity? |
|---|---|---|---|
| Manager | Sales, inventory, alerts, forecasts, plans | Confirm data and approve plans | Yes |
| Head baker / baker | Approved production and preparation list | Acknowledge, complete, and report an exception | No |
| Food runner | Current display/product status | Report low, sold out, or request extra batch | No |

The system must distinguish **changing the target** from **reporting what happened**. Bakers and food runners may report reality without receiving authority to change the manager-approved target.

## Option A — Full role-based multi-user website

### Description
Each manager, baker/head baker, and food runner has a role-specific account and screen.

### Strengths
- Clear permissions and accountability.
- Shared source of truth.
- Real-time alerts and acknowledgements.
- Strong long-term product direction.

### Risks
- Too many logins and devices during a fast shift.
- Frontline adoption may fail if interactions take more than a few seconds.
- Requires reliable network, notification, and account management.
- Manager can become a bottleneck if every minor operational event requires approval.

### Best fit
A store with shared tablets or work devices and employees willing to interact with the app during the shift.

## Option B — Manager hub + shared kitchen display

### Description
The manager uses the full planning website. Bakers use one shared read-only kitchen screen. The food runner uses a shared one-tap reporting screen or fixed product buttons.

### Strengths
- Fewer logins and devices.
- Bakers always see the latest approved list.
- Food runner can report `Low`, `Sold Out`, or `Extra Batch` quickly.
- Preserves role authority without making every employee manage an account.

### Risks
- Shared device location and cleanliness must be considered.
- Individual accountability is weaker unless a quick PIN/initial is used.
- An urgent verbal call may still be faster than a digital alert.

### Best fit
A practical first deployed workflow for a busy bakery.

## Option C — Manager digital planner + printed baker sheet

### Description
The manager uses the website for forecasting and approval, then prints the final production/preparation sheet. Food-runner and baker communication remains verbal.

### Strengths
- Lowest behavior change.
- Very simple for bakers.
- Works when devices or internet are unavailable.
- Easiest MVP to validate.

### Risks
- Paper becomes stale after changes.
- Same-day events are not captured automatically.
- No live alerts or acknowledgement.

### Best fit
An initial pilot that proves whether the recommendations are useful before digitizing every role.

## Option D — Manager hub + QR/kiosk exception reporting

### Description
The manager owns the main website. Bakers and food runners scan a QR code or use a kiosk to open a very small exception screen without navigating the full app.

### Strengths
- Fast event capture.
- Fewer full user accounts.
- Can automatically record product, time, and device/station.
- Good transition between paper and a full multi-user system.

### Risks
- Phone access may be restricted or inconvenient.
- QR scanning may still be slower than speaking during urgent moments.
- Shared identity and audit rules need care.

### Best fit
A store that wants digital event capture but cannot support a device for every role.

## Current recommendation

Use **Option C as the practical MVP direction** and keep **Option A as a possible long-term product only if later validation supports it**:

1. Manager gets the full dashboard, recommendations, inventory view, and approval controls.
2. The app generates a clear printed or read-only baker execution sheet.
3. Bakers follow the sheet without routine app input.
4. Food-runner and baker restock communication remains verbal because it already works quickly during irregular demand.
5. Frontline accounts, one-tap event reporting, and live notifications are deferred until evidence shows they reduce rather than add friction.
6. Generated sheets must include a date, approval status, version/generated time, and manager identity so outdated copies can be recognized.

## Questions required before freezing the design

1. What devices are actually available: manager computer, shared tablet, kitchen display, or employee phones?
2. Is phone use permitted during production and food handling?
3. Who carries or watches the device during each shift?
4. How quickly must a restock request reach the baker?
5. Should the app replace the current bell/call, or simply record that the call happened?
6. How are shift changes and accountability handled?
7. What should happen if the internet or device is unavailable?

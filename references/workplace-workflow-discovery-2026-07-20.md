# Workplace Workflow Discovery — 2026-07-20

## Confirmed from Matthew

### Roles
- Manager tracks sales, receives operating information, records leftovers/sold-outs, reviews recommendations, and approves final quantities.
- Head baker organizes production and follows the approved quantities.
- Bakers produce the quantities on the list; they do not decide whether the store should make more or less.
- Food runner displays finished pastries by 9:00 AM, packages designated pastries, restocks display cases, reports low/sold-out pastries, requests additional production when needed, and cleans cases/trays after closing.

### Two dough/production types
1. **Shape/prep required:** imported dough must be shaped/prepared before baking. This work is normally done for the next day and takes more labor/time. These products are generally lower demand.
2. **Ready-to-bake:** imported dough arrives already shaped and mainly needs oven baking. These products are generally higher demand and easier to replenish during the day.

### Production unit and buffer
- A typical tray holds 12 items.
- One known pastry is an exception and uses 15 items per tray on busy weekends; the specific pastry name still needs confirmation.
- Only selected high-demand pastries receive one additional tray of unbaked, ready-to-bake headroom. Reserve eligibility is product-specific, not automatic for every ready-to-bake item.
- Less-popular ready-to-bake pastries do not receive an extra tray because physical cart/rack space is limited (wording inferred from voice transcription and should be confirmed).
- Existing production quantities differ significantly by day group; example for croissants: approximately 30 Monday–Thursday and 100 Friday–Sunday.

## Product implications
- The system should distinguish **tomorrow’s shape/prep plan** from **today’s ready-to-bake/replenishment plan**.
- Recommendations should show both pieces and trays; quantities may need rounding to practical tray increments.
- The manager-facing view owns sales, leftovers, sellouts, extra-batch events, recommendation reasoning, and final approval.
- The baker-facing view should show only approved quantities and operational instructions.
- Food-runner requests for another batch are useful evidence of underproduction and should be captured as an operating event.
- The product is broader than an inventory checklist: it is a production and replenishment planning system connected to inventory.

## Confirmed freezer-count workflow and accuracy boundary
- Before ordering, the manager looks inside the freezer and counts full boxes plus partial boxes.
- Damaged or broken dough pieces are normally overlooked and treated as part of the expected margin of error rather than recorded individually.
- The current process therefore provides a usable ordering-time snapshot, but not a continuously exact stock balance.
- The MVP should reuse the manager’s existing ordering-time count rather than require daily frontline counting.
- Any between-count calculated balance should be labeled as estimated and should include a configurable safety/shrinkage buffer.
- The remaining gap is how the manager expresses a partial box and how many usable pieces are contained in each product’s full box.

## Manager call: POS sales data
- The manager confirmed that the POS tracks total sales and units sold for each individual pastry item/SKU.
- This supports product-level popularity, comparable-day demand, and product-level reorder recommendations once pastry items are mapped to frozen-dough SKUs and box sizes.
- Current product focus: inventory planning and reorder recommendations are the primary cost-control problem; sales analytics should support that decision rather than become a separate reporting product.

## Assumptions requiring confirmation
- Whether one reserve tray is unbaked dough held ready, a baked tray held off-display, or simply extra planned quantity.
- Whether every pastry uses a 12-item tray or tray capacity varies by product.
- Whether shape/prep-required products can be replenished the same day.
- Whether manager approval happens before or after end-of-day leftovers are known.
- Whether extra batches and their quantities are currently recorded.
- Whether POS data can be exported at item/day or item/time-bucket level.
- How frozen dough is counted and ordered: pieces, bags, boxes/cases, or trays.
- Supplier order days, lead times, minimum order quantities, and case sizes.
- What happens to finished leftovers: waste, donation, discounting, or next-day sale.

## Data-entry design principle
- Frontline bakery work is fast and interruption-heavy; bakers and food runners should not be required to complete long manual checklists.
- Reuse POS sales data through CSV import or integration where available.
- Prefill expected production from the manager-approved plan and record only exceptions/deviations.
- Food-runner reporting should use large one-tap actions such as `Low`, `Sold Out`, and `Extra Batch`; item, user, and timestamp should be filled automatically.
- Photo and voice input may prepare draft records, but a human should confirm uncertain counts or interpreted changes.
- Manager should perform one short end-of-day review rather than reconstructing the entire day manually.

## Proposed first workflow to model
1. Import POS sales automatically or through one manager-uploaded CSV.
2. Prefill expected production from the approved list; baker confirms completion once and edits only exceptions.
3. Food runner reports only low/sold-out items and additional-batch requests through one-tap controls.
4. Manager reviews prefilled sales, leftovers, sellouts, and extra batches in a short end-of-day review.
5. System recommends quantities in pieces and practical tray units.
6. Manager edits and approves the final plan.
7. System separates the approved plan into:
   - items to shape/prepare today for tomorrow;
   - ready-to-bake items and reserve/replenishment quantities.
8. Head baker and bakers follow the final execution list.

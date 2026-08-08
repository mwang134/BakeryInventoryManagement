# BakeryOps Assistant — Project Start Package

> Historical starter artifact from 2026-07-19. It preserves the original broad production + reorder framing. Current scope and next gate live in `CURRENT-DIRECTION.md` and `NEXT-DISCUSSION.md`.

## One-liner
A bakery operations app with an optional AI co-pilot that recommends daily bake quantities and weekly reorder quantities from POS sales, inventory counts, supplier lead times, and end-of-day waste.

## Business problem
The store loses money in two ways:
- overproduction: pastries made but not sold are discarded;
- underproduction/stockout: popular pastries or supplies run out, causing missed sales and disruption.

The missing loop is:
`POS sales → demand forecast → bake plan → inventory/reorder plan → end-of-day waste feedback`

## MVP tables

### product_master
- sku_id
- item_name
- category
- unit_price
- estimated_unit_cost
- shelf_life_rule
- component_or_dough_sku

### sales_daily
- date
- day_of_week
- sku_id
- quantity_sold
- revenue
- optional_time_bucket

### bake_plan_daily
- date
- sku_id
- planned_bake_qty
- actual_bake_qty
- manager_adjustment_reason

### waste_daily
- date
- sku_id
- leftover_qty
- discarded_qty
- reason

### inventory_items
- inventory_sku
- item_name
- type: dough/component/supply
- current_stock
- unit
- reorder_point
- lead_time_days
- min_order_qty

### reorder_recommendations
- date
- inventory_sku
- current_stock
- forecast_usage_during_lead_time
- safety_stock
- recommended_order_qty
- explanation

## MVP screens
1. Manager dashboard: tomorrow bake recommendation, stockout risks, waste risks.
2. Daily bake plan: recommended vs manager-adjusted quantities.
3. End-of-day close: sold, leftover, discarded.
4. Inventory count: frozen dough/components and cups/napkins/utensils/syrups.
5. Weekly reorder: recommended order quantities and reasons.

## Fake dataset prompt
Ask AI:
> Generate a realistic CSV-style sample dataset for a Korean chain bakery store. Include 30 pastry/cake SKUs, 10 supply/inventory SKUs, 8 weeks of daily item sales, planned/actual bake quantities, leftover/waste quantities, and supplier lead times. Include weekday/weekend seasonality, occasional stockouts, and overproduction on some weekdays. Keep names realistic but fictional.

## Simple recommendation rules
- Forecast each item using recent comparable days: Mondays compare to previous Mondays, weekends compare to weekends.
- Add a small safety buffer for high-demand or historically sold-out items.
- Reduce future bake recommendation when an item repeatedly has waste.
- Reorder quantity = forecast usage during lead time + safety stock - current stock - incoming orders.
- Explain every recommendation in plain language.

## Discovery questions for the store
1. Can POS export item-level sales by day or time bucket?
2. How many active pastry/cake SKUs exist?
3. Can we see a current daily bake sheet?
4. Are leftovers/waste recorded today?
5. Which items are most often wasted?
6. Which items most often sell out?
7. Which items come from Korea vs local suppliers?
8. What are actual lead times and fixed order days?
9. How are cups, napkins, utensils, syrups, bags, and boxes counted?
10. Who would use the system daily: manager, shift lead, worker, or owner?

## Business pitch
BakeryOps Assistant helps chain bakery managers reduce food waste and avoid stockouts by turning POS sales, bake plans, inventory counts, and waste records into simple daily production and weekly reorder recommendations. It starts as a lightweight dashboard with transparent rules, then can add an AI co-pilot to explain recommendations and help managers adjust plans safely.

## Default working language

Use English for Matthew unless he explicitly asks otherwise.

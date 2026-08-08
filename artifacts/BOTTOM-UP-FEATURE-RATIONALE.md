# BakeryOps Bottom-Up Feature Rationale

## What “bottom-up design” means

BakeryOps did not begin with a list of attractive dashboard features. It began with the information and workflow the store already has:

```text
Observed store data and workflow
→ calculations the data can support
→ features that expose those calculations
→ manager decisions and benefits
```

## Level 1 — Confirmed store data and workflow

### Confirmed data

1. The POS provides units sold for each individual pastry item.
2. Comparable-day analysis requires each item count to be associated with a business date; the exact export columns still need to be inspected.
3. The manager physically counts full frozen-dough boxes.
4. The manager also counts partial boxes.
5. Broken or damaged pieces are normally treated as a margin of error rather than recorded individually.

### Confirmed workflow

1. The manager checks freezer inventory before ordering.
2. The manager owns the final order decision.
3. The application must not send a supplier order automatically.

### Still sample or missing

1. Pastry-to-frozen-dough SKU mapping.
2. Pieces per box.
3. Box cost.
4. Supplier case/minimum rules.
5. Incoming deliveries.
6. Practical freezer capacity.
7. Final coverage/safety target.

Features using these fields are structurally working but still use sample numbers.

## Level 2 — Calculations supported by the data

### From item-level POS sales

- Top pastries by units sold.
- Typical units sold on comparable weekdays.
- Product-level sales trend across matching weekdays.

### From physical counts and product setup

```text
usable pieces on hand
= full boxes × pieces per box + partial-box pieces
```

### From counts plus comparable-day sales

```text
days of supply
= usable pieces on hand ÷ typical comparable-day units sold
```

### From days of supply and a coverage target

- Stock below target → order recommendation.
- Stock near target → enough stock.
- Stock far above target → overstock/skip-order recommendation.

### From supplier and capacity setup

- Suggested order rounded to supplier minimum/case rule.
- Draft order cost.
- Projected freezer use after delivery.

## Level 3 — Features created from those calculations

### 1. Top 10 pastry ranking

**Data source:** Item-level POS units sold.

**Why it exists:** Shows which products have the highest observed sales volume.

**Manager benefit:** Helps prioritize high-volume products when reviewing inventory coverage.

**Guardrail:** Popularity alone does not determine an order. It must be combined with physical inventory.

### 2. Comparable-day line graph

**Data source:** Item-level units sold plus business date/weekday.

**Why it exists:** Monday demand can differ from Friday demand, so like days should be compared.

**Manager benefit:** Provides a better estimate of expected product usage than one overall average.

### 3. Days-of-supply calculation

**Data source:** Full/partial physical count, pieces per box, and typical comparable-day sales.

**Why it exists:** A box count alone does not tell the manager how quickly stock may run out.

**Manager benefit:** Translates stock into understandable language such as “approximately five days remaining.”

### 4. Reorder worksheet

**Data source:** Physical count, days of supply, coverage target, incoming stock, and supplier rules.

**Why it exists:** Converts evidence into one of three actions:
- Order
- Enough
- Skip order / overstock

**Manager benefit:** Shows what needs attention, the suggested boxes, and the reason in one place.

### 5. Overstock attention

**Data source:** Days of supply compared with the coverage target.

**Why it exists:** Products with excessive stock should not be mixed with products that are merely “fine.”

**Manager benefit:** Tells the manager what not to order and reduces unnecessary freezer buildup.

### 6. Editable manager order

**Data source:** Suggested order plus the manager's judgment.

**Why it exists:** The calculation may not know about promotions, holidays, unusual events, or supplier changes.

**Manager benefit:** The manager can override the suggestion instead of being controlled by it.

### 7. Live draft cost and freezer capacity

**Data source:** Manager-edited boxes, box cost, current freezer stock, and freezer capacity.

**Why it exists:** Editing a quantity changes both spending and available freezer space.

**Manager benefit:** Shows the consequence of the manager's decision immediately.

**Current boundary:** Costs and capacity are still sample values.

### 8. Data-confidence panel

**Data source:** Whether each required field is confirmed, entered, estimated, sample, or missing.

**Why it exists:** The POS capability is confirmed, but product mappings and supplier settings are not yet real.

**Manager benefit:** Prevents incomplete sample calculations from appearing more trustworthy than they are.

### 9. Final worksheet confirmation

**Source:** Manager workflow and authority, not sales numbers.

**Why it exists:** The manager owns the final decision.

**Manager benefit:** Clearly separates an editable draft from a checked final worksheet.

**Safety boundary:** Finalizing never sends a supplier order.

## Level 4 — The manager decisions supported

The final dashboard is designed to answer:

1. Which frozen products need an order?
2. Which products already have enough?
3. Which products are building up unnecessarily?
4. How long will current stock probably last?
5. What sales evidence supports the recommendation?
6. How will my edits affect cost and freezer capacity?
7. Is the data complete enough to trust?
8. Is this worksheet still a draft or final?

## Feature deliberately not added yet

### Exact bake recommendation

Item-level sales provide a useful starting point, but units sold alone cannot establish the correct bake quantity. A stronger production recommendation also needs:

- quantity produced
- leftovers
- sold-out status/time
- unusual events or promotions

Until those inputs exist, comparable-day sales should be described as demand evidence, not a guaranteed bake instruction.

## One-sentence portfolio explanation

> I used a bottom-up design process: I started with the store's actual POS item sales, physical full/partial freezer counts, and manager approval workflow, derived comparable-day demand and days of supply, and then built only the dashboard features needed to prepare an explainable manager-reviewed reorder worksheet.

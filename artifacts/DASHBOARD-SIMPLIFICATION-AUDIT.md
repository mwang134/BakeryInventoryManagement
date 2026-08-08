# BakeryOps Dashboard Simplification Audit

## User feedback

The current dashboard is confusing because decision features, supporting evidence, setup warnings, and descriptive analytics all appear at the same level.

## Primary operating question

> What should the manager order so current frozen stock lasts until the next supplier delivery without creating unnecessary freezer buildup?

A feature should remain on the main screen only if it directly helps answer, verify, edit, or approve that question.

## Feature comparison

| Current feature | Unique job | Overlap/redundancy | Recommendation | New placement |
|---|---|---|---|---|
| Reorder worksheet | Shows item-level recommendation, manager quantity, and reason | None; this is the core decision surface | **Keep and simplify** | Main screen |
| Products needing order KPI | Counts rows already labeled `Order` in the worksheet | Repeats worksheet status | **Compress** | One small exception sentence/filter |
| Possible overstock KPI | Counts rows already labeled `Skip order` | Repeated again in worksheet and Overstock card | **Remove as separate KPI** | Worksheet/filter only |
| Draft order cost KPI | Shows a total repeated below the worksheet | Duplicates worksheet footer and confirmation dialog | **Remove top card** | Worksheet footer only |
| Projected freezer-use KPI | Shows a total repeated below the worksheet | Duplicates worksheet footer | **Remove top card** | Footer; elevate only when capacity is risky |
| Comparable-day line graph | Lets manager inspect sales evidence behind one recommendation | `Typical/day` and reason already summarize it | **Move behind “Why?”** | Expandable row detail or drawer |
| Top 10 pastry ranking | Describes popularity | Sales velocity is already used in days-of-supply; rank does not change an order without stock | **Remove from daily reorder screen** | Optional weekly analysis page later |
| Overstock-attention card | Explains one overstock row | Overstock appears in KPI and worksheet already | **Remove separate card** | Keep `Skip order` row and reason in worksheet |
| Data-confidence panel | Shows which setup fields are real or sample | Useful, but a large permanent card competes with the decision | **Compress** | One setup warning/banner; inline warning on affected rows |
| Final worksheet confirmation | Makes manager approval explicit and preserves safety boundary | None | **Keep** | Directly under worksheet |
| Sidebar with disabled future pages | Suggests navigation that does not work yet | Adds visual noise and dead controls | **Remove until pages exist** | Simple page header |
| Draft/final status | Tells manager whether the worksheet is approved | None | **Keep** | Header and final area |

## Redundancy clusters

### Overstock appears three times

1. Possible-overstock KPI.
2. `Skip order` status in worksheet.
3. Overstock-attention card.

**Decision:** Keep it once in the worksheet. Optionally provide an `Overstock` filter.

### Draft totals appear three times

1. KPI cards.
2. Worksheet footer.
3. Final confirmation dialog.

**Decision:** Keep live totals in the worksheet footer and repeat them only in the confirmation dialog, where repetition supports approval.

### Sales evidence appears three ways

1. Typical/day column.
2. Comparable-day line graph.
3. Top 10 sales ranking.

**Decision:** Keep `Typical/day` or a short reason in the table. Put the line graph behind `Why?`. Remove Top 10 from the reorder workflow.

## Recommended simplified screen

```text
Inventory Reorder — next delivery: [date]       Draft
Counted today at [time]                         [setup warning if needed]

Needs order: 2  ·  Skip order: 1  ·  Missing data: 0

┌─────────────────────────────────────────────────────────────┐
│ Product       Count    Lasts until   Recommended  Your order │
│ Chocolate     2¼ box   Before delivery   2 boxes      [ 2 ]  │
│ Ham & Cheese  1½ box   Before delivery   2 boxes      [ 2 ]  │
│ Butter        6½ box   After delivery    0 boxes      [ 0 ]  │
│ Almond        4 boxes  Excess stock      0 boxes      [ 0 ]  │
│                                      [Why? on each row]       │
├─────────────────────────────────────────────────────────────┤
│ Order: 4 boxes · Draft cost: $126 · Freezer after: 76%      │
│                            [Confirm worksheet is final]       │
└─────────────────────────────────────────────────────────────┘
```

## Simpler user flow

1. Confirm when the freezer was counted.
2. Review only products needing an order or attention.
3. Edit order boxes if needed.
4. Open `Why?` only when the recommendation needs inspection.
5. Review total cost and capacity.
6. Mark the internal worksheet final.

The default view should show exceptions first, not every available chart.

## Overlooked problem with stronger value

### Will current stock last until the next supplier delivery?

The current prototype uses an arbitrary sample seven-day coverage target. A manager's real concern is more specific:

> Will each product last through the next delivery, including supplier lead time and incoming stock?

### Required data

Already used:
- physical full/partial count
- pieces per box
- comparable-day item sales
- incoming stock

Small new setup fields:
- next order cutoff
- next delivery date/day
- supplier lead time or delivery schedule
- optional safety buffer

### Better calculation

```text
required coverage
= expected usage until next delivery + safety buffer

order shortage
= required coverage - on-hand pieces - incoming pieces
```

### Better feature

Replace generic `7 days supply` emphasis with:
- `Lasts through delivery`
- `Short before delivery`
- `Excess after delivery`

This is more direct and easier for a manager to trust.

## Important overlooked data-model question

### Can multiple pastries consume the same frozen-dough SKU?

If two sellable pastries use the same frozen dough, their POS units must be combined before calculating dough demand.

```text
Demand for one dough SKU
= sales of every pastry mapped to that dough SKU
```

Without this mapping, the app may under-order shared dough or double-count inventory. Product Setup should therefore support many pastries mapping to one frozen SKU, not assume a one-to-one relationship.

## Other guardrails

- Units sold can understate true demand when a pastry sells out.
- Old physical counts make recommendations unreliable; show count time/freshness.
- Damage and waste can make calculated inventory drift; continue anchoring recommendations to physical counts.

## MVP recommendation

### Keep on the main screen

1. Count freshness.
2. Exception-first reorder worksheet.
3. Editable manager quantity.
4. Short reason / on-demand `Why?` detail.
5. Draft cost and projected capacity in one footer.
6. Final internal confirmation.

### Remove from the main screen

1. Top 10 sales.
2. Separate overstock card.
3. Separate top KPI cards for values repeated in the worksheet.
4. Large permanent line chart.
5. Large data-confidence card.
6. Disabled navigation items.

### Defer

- Top 10 and longer-term trends to an optional weekly analysis view only if a manager identifies a real recurring decision they support.

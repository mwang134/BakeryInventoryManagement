# Redacted SKU Contract — Croissant Dough

Status: **CONVERGE — mapping reported; box-size estimate recorded; one full sample worked example drafted (pending confirmation of the "two weeks" plan-stock-through assumption); box size and supplier minimum still unverified/unknown**

This is a redacted planning contract, not a live supplier record or production record.

## Frozen-dough SKU

| Field | Value | Status |
|---|---|---|
| Canonical redacted key | `croissant-dough` | Proposed stable internal key |
| Matthew's supplied label | `crossiant` | Preserved as source wording |
| Normalized display name | `Croissant dough` | Proposed; verify against real production/supplier label later |

## Pastry mappings

| Matthew's supplied pastry label | Proposed normalized display label | Dough pieces per planned pastry | Status |
|---|---|---:|---|
| `crossiant` | Croissant | 1 | Reported by Matthew |
| `strawberry crossiant` | Strawberry Croissant | 1 | Reported by Matthew |
| `crookie` | Crookie | 1 | Reported by Matthew |
| `almont crossiant` | Almond Croissant | 1 | Reported by Matthew |
| `chocolate crossiant` | Chocolate Croissant | 1 | Reported by Matthew |
| `garlic & cheese crossiant` | Garlic & Cheese Croissant | 1 | Reported by Matthew |

Exact POS and production-sheet item identifiers are not yet available. Do not assume normalized display labels are exact source-system identifiers.

## V1 demand rule for this SKU

For every included calendar date:

```text
expected croissant-dough pieces
= planned Croissant quantity × 1
+ planned Strawberry Croissant quantity × 1
+ planned Crookie quantity × 1
+ planned Almond Croissant quantity × 1
+ planned Chocolate Croissant quantity × 1
+ planned Garlic & Cheese Croissant quantity × 1
```

Aggregate the date-level quantities separately for:

```text
Pre-arrival window:
dates before shipment-available date

Post-arrival window:
shipment-available date through plan-stock-through date
```

## Generic weekday production-sheet baseline

Matthew supplied the following redacted quantities for a generic weekday:

| Pastry | Planned quantity | Croissant-dough pieces |
|---|---:|---:|
| Croissant | 12 | 12 |
| Strawberry Croissant | 24 | 24 |
| Crookie | 12 | 12 |
| Almond Croissant | 12 | 12 |
| Chocolate Croissant | 12 | 12 |
| Garlic & Cheese Croissant | 12 | 12 |
| **Total per weekday** | **84 pastries** | **84 pieces** |

Verified arithmetic:

```text
12 + 24 + 12 + 12 + 12 + 12 = 84 croissant-dough pieces
```

Using the explicitly unverified estimate of 192 pieces per supplier box:

```text
one weekday = 84 pieces = 0.4375 estimated box
two weekdays = 168 pieces = 1 whole box when starting from zero
three weekdays = 252 pieces = 2 whole boxes when starting from zero
```

These box examples do not constitute an order recommendation. The actual recommendation must subtract projected usable inventory and use the selected pre-arrival and post-arrival date windows.

## Weekday/weekend applicability

Matthew confirmed: the generic weekday quantities above (84 dough pieces total) apply identically **Monday through Thursday**.

**Friday, Saturday, and Sunday** each add 12 more planned pastries per item versus the Monday–Thursday baseline (Matthew: "usually added 12 more each"):

| Pastry | Mon–Thu quantity | Fri–Sun quantity | Croissant-dough pieces (Fri–Sun) |
|---|---:|---:|---:|
| Croissant | 12 | 24 | 24 |
| Strawberry Croissant | 24 | 36 | 36 |
| Crookie | 12 | 24 | 24 |
| Almond Croissant | 12 | 24 | 24 |
| Chocolate Croissant | 12 | 24 | 24 |
| Garlic & Cheese Croissant | 12 | 24 | 24 |
| **Total per Fri/Sat/Sun day** | **84** | **156** | **156** |

Verified arithmetic:

```text
24 + 36 + 24 + 24 + 24 + 24 = 156 croissant-dough pieces per Friday/Saturday/Sunday
```

Matthew described this as the *usual* Friday–Sunday addition, not confirmed as identical across all three of those days individually; treat Friday, Saturday, and Sunday as currently using the same reported quantity unless Matthew later distinguishes them.

## Supplier packaging

| Field | Value | Status |
|---|---|---|
| Pieces per supplier box | Approximately 192 | Unverified estimate reported by Matthew; safe only for clearly provisional prototype calculations |
| Supplier minimum | Unknown | Must not be invented |
| Case/box increment | Unknown | Must not be invented |

For prototype calculations, BakeryOps may calculate a **provisional** raw box estimate using 192 pieces per box. The interface and finalized internal snapshot must preserve `box size unverified`; they must not describe the result as supplier-validated. Operational use requires the actual packaging quantity to be confirmed.

Until the supplier minimum is known, BakeryOps may display the raw whole-box calculation after box size is confirmed, but it must label supplier-minimum validation as incomplete and must not claim the quantity satisfies supplier rules.

## Physical count — SAMPLE/PLACEHOLDER, not a real operational count

Matthew supplied this explicitly as sample data for building one complete example, not as a real store count:

| Field | Value | Status |
|---|---:|---|
| Full boxes | 5 | Sample/placeholder |
| Partial pieces | 1 | Sample/placeholder |
| Count/planning date | Thursday, 2026-08-06 | Sample/placeholder — Matthew said "today"; falls in the Monday–Thursday (84 pieces/day) baseline window, not Friday–Sunday |
| Shipment-available date | Monday, 2026-08-10 | Sample/placeholder — Matthew said "following Monday" |

Provisional on-hand pieces using the still-unverified 192-pieces-per-box estimate:

```text
5 boxes × 192 (unverified) + 1 piece = 961 pieces — provisional, box size unverified, sample count
```

This number must not be treated as a validated inventory figure; it depends on both an unconfirmed box size and a sample (not real) count.

Count date resolved: Thursday, 2026-08-06. Shipment-available date resolved: Monday, 2026-08-10 (both sample/placeholder).

Resolved: Matthew confirmed the physical count happens **after closing**, i.e. after that day's production has already used dough from the freezer. So the count date's own production usage is already reflected in the counted number and must not be subtracted again. The pre-arrival window is the days strictly after the count date, through the day before the shipment-available date: **Friday + Saturday + Sunday = 156 + 156 + 156 = 468 pieces**, not 552.

Matthew confirmed this is the **general practice, not specific to this one count**: every physical freezer count happens after closing. This is a general rule for the Next Order List pre-arrival formula, not just a fact about this one SKU's example, and should be promoted into `plans/NEXT-ORDER-LIST-BUILD-GATE.md`'s canonical calculation section.

## Worked pre-arrival example (sample/placeholder inputs)

```text
on-hand pieces at count (Thu 8/6, after closing, provisional box size)
  = 5 boxes × 192 (unverified) + 1 piece = 961 pieces

pre-arrival usage (Fri 8/7 + Sat 8/8 + Sun 8/9)
  = 156 + 156 + 156 = 468 pieces

projected stock at arrival (Mon 8/10)
  = 961 − 468 = 493 pieces

status: 493 > 0 → "Lasts through delivery"
```

This is provisional: box size (192) is unverified and the count itself is sample/placeholder data, not a real store count.

## Worked post-arrival example (sample/placeholder inputs)

Plan-stock-through date: **confirmed by Matthew as Sunday, 2026-08-23** (14 days from the shipment-available date, Mon 8/10 through Sun 8/23 inclusive).

Post-arrival window (Mon 8/10 – Sun 8/23) breaks into 8 Monday–Thursday days (84 pieces/day) and 6 Friday–Sunday days (156 pieces/day):

```text
Mon–Thu usage: 8 days × 84 = 672 pieces
Fri–Sun usage: 6 days × 156 = 936 pieces
total post-arrival expected usage = 672 + 936 = 1,608 pieces

pieces needed after arrival
  = post-arrival expected usage − projected stock at arrival
  = 1,608 − 493 = 1,115 pieces

raw boxes (using unverified 192 pieces/box)
  = ceil(1,115 ÷ 192) = ceil(5.807...) = 6 boxes

supplier minimum: unknown — cannot be validated or applied; must remain visibly unresolved

base suggested boxes (provisional) = 6 boxes

projected end stock
  = projected stock at arrival + (manager boxes × pieces per box) − post-arrival expected usage
  = 493 + (6 × 192) − 1,608
  = 493 + 1,152 − 1,608
  = 37 pieces
```

Entirely provisional: depends on the unverified 192-piece box size, a sample (not real) physical count, an assumed "two weeks" endpoint pending Matthew's confirmation, and an unknown/unvalidated supplier minimum.

## Still needed for the end-to-end redacted acceptance example

- Replace the approximate 192 pieces per box with the actual verified value when available.
- Confirm supplier minimum/case rule, or define missing-rule behavior for V1.
- ~~Confirm whether the generic weekday quantities apply identically Monday through Friday or are only a sample weekday.~~ Resolved: applies Monday–Thursday only.
- ~~Add Friday, Saturday, and Sunday production-sheet quantities.~~ Resolved: +12 per pastry vs. Monday–Thursday (156 total), reported as one usual figure for all three days rather than day-by-day.
- ~~Add physical count: full boxes and partial pieces.~~ Resolved as sample/placeholder: 5 full boxes, 1 partial piece.
- ~~Add count/planning date.~~ Resolved as sample/placeholder: Thursday, 2026-08-06.
- ~~Add shipment-available date.~~ Resolved as sample/placeholder: Monday, 2026-08-10.
- Add plan-stock-through date. Sample/placeholder pending confirmation: Sunday, 2026-08-23 (Matthew said "two weeks"; read as 14 days from the shipment date — needs Matthew's confirmation of this interpretation).
- ~~Resolve whether the pre-arrival window includes the count date itself or only later dates.~~ Resolved: count happens after closing, so the count date is excluded; window is the days strictly after it, through the day before shipment.
- ~~Calculate and approve expected pre-arrival status.~~ Resolved for this sample example: 493 pieces projected at arrival → "Lasts through delivery."
- ~~Calculate and approve suggested boxes and projected end stock.~~ Provisionally calculated: 6 boxes (unverified box size, no supplier minimum applied since unknown), projected end stock 37 pieces. Pending confirmation of the plan-stock-through assumption above, and still not usable operationally until box size and supplier minimum are verified.
- Calculate and approve suggested boxes and projected end stock.

## Integrity rule

Missing or ambiguous supplier packaging must remain visible. The software must not convert `unknown` into `1 box minimum` or treat `192` as confirmed without Matthew's clarification.

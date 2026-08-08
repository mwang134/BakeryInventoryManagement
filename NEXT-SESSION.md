# Next Session — BakeryOps Assistant

## Current lane

**CONVERGE — Next Order List flagship vertical slice.** Matthew explicitly selected this lane and is finishing one redacted croissant-dough contract before BUILD.

## Read first

1. `plans/NEXT-ORDER-LIST-BUILD-GATE.md`
2. `plans/NEXT-ORDER-LIST-ACCEPTANCE-SCENARIOS.md`
3. `data/redacted-sku-contracts/croissant-dough.md`
4. `ideas/manager-centered-bakery-flow.md`
5. `TODO.md`
6. `DECISIONS.md`
7. `app/README.md`, source, and tests only after understanding the current contracts

## Resume state

Frozen for V1:
- production-sheet quantities are the demand baseline;
- every selected weekday/weekend is included;
- shared pastry demand is aggregated by frozen-dough SKU;
- shipment date is the first date selected boxes are available;
- pre-arrival shortage is separate from arriving order quantity;
- no hidden percentage buffer;
- whole-box rounding creates visible natural cushion;
- manager quantity remains editable;
- finalization creates an internal record only;
- History contains finalized immutable records only.

First redacted mapping:

```text
Croissant dough:
Croissant 12
Strawberry Croissant 24
Crookie 12
Almond Croissant 12
Chocolate Croissant 12
Garlic & Cheese Croissant 12
= 84 dough pieces per generic weekday
```

Packaging:

```text
approximately 192 pieces per box — unverified
supplier minimum — unknown
```

## Exact next question

Ask Matthew one narrow question:

> Do the supplied quantities apply to every weekday Monday through Friday, or only to one sample weekday?

Then collect weekend quantities, physical count, and the redacted dates needed for one end-to-end acceptance example.

## BUILD gate

Do not refactor the app yet. BUILD begins after:
- redacted SKU/date/count contract completed;
- missing supplier-rule behavior selected;
- acceptance scenarios approved;
- persistence technology selected.

First BUILD action: encode approved scenarios as failing tests.

## Safety

No credentials, unapproved real store data, store/supplier contact, autonomous ordering, or fabricated impact claims. Exact source-system identifiers and the 192-piece box estimate remain unverified.

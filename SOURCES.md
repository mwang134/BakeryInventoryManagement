# Sources — BakeryOps Assistant

## Canonical current truth

- `CURRENT-DIRECTION.md`
- `ROADMAP.md`
- `reviews/OWNER-REVIEW-2026-07-24.md`
- `NEXT-DISCUSSION.md`

## Discovery sources

- Curated meeting notes: `references/meeting-notes-2026-07-19.md`
- Workplace workflow discovery: `references/workplace-workflow-discovery-2026-07-20.md`
- Mike/Matthew discussion evidence is preserved in the Mike runtime state database; do not copy raw personal identifiers into project docs.

## Current app evidence

- Implementation source: `app/`
- Baseline tests independently rerun 2026-07-24: 4/4 passed
- Screenshot: `app/artifacts/reorder-overview.png`
- Portable package: `artifacts/BakeryOps-Assistant-App.zip`
- ZIP integrity and Mac launcher executable bits verified 2026-07-24
- Current code last changed 2026-07-22
- Current project directory is not a Git repository

## Confirmed operational facts

- POS can report units sold for individual pastry items.
- Manager counts full and partial frozen-dough boxes before ordering.
- Manager owns the final order decision.
- The app must not contact suppliers or submit orders.

## Unverified/missing inputs

- Actual POS export column/date shape
- Pastry-to-frozen-SKU mapping
- Pieces per box and partial-count rule
- Supplier cutoff, delivery date/lead time, case/minimum rules
- Incoming stock
- Box costs and practical freezer capacity
- Safety/shrinkage buffer

Treat every unverified value as `sample` or `missing`; do not convert it into store truth.

## Runtime location

- Agent: Mike Atlas
- Runtime host: Mini3
- Project path in container: `/opt/data/projects/bakeryops-assistant`
- Default working language with Matthew: English

No credentials, raw Telegram IDs, or personal contact details belong in this file.

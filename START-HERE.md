# START HERE — Baker's Door / BakeryOps Assistant

Aliases: Baker's Door, CakeStore, Cake Store, BakeryOps Assistant.

## Current state

All three selected KPIs are **built, tested, and verified live**: Next Order List, Tomorrow's Production, and Waste Pattern Review. 119/119 tests passing (75 in `app/`, 44 in `server/`). External code review's P0 (security/validation) and P1 (persistence reliability) findings are addressed; P2 (documentation accuracy, launcher, Node version pin, accessibility) is in progress - see `TODO.md` for exactly what's left.

## Fresh pickup order

1. `README.md` - what's built, where it lives, how to run it
2. `DECISIONS.md` - every dated decision, most recent at the bottom; this is the current source of truth, not the older `plans/` docs below
3. `TODO.md` - exactly what's still open
4. `plans/NEXT-ORDER-LIST-BUILD-GATE.md` and `plans/NEXT-ORDER-LIST-ACCEPTANCE-SCENARIOS.md` - Next Order List's frozen formula contract (still accurate; predates BUILD but was never superseded)
5. `data/redacted-sku-contracts/croissant-dough.md` - the one real/redacted SKU contract
6. `server/src/*.ts` and `app/src/*.js` - implementation, after understanding the contracts above

Do not treat `app/src/app.js`, `dashboard.js`, `reorder.js`, or `sample-data.js` as current - those are the original sample-data prototype, kept for history only. The current app is `server/public/app.js`, which imports its calculation logic from the tested modules in `app/src/` (`next-order-list.js`, `tomorrows-production.js`, `waste-review.js`, `escape-html.js`).

## Boundary

- `DECISIONS.md` = curated project truth, most current, dated, append-only.
- `server/` = current implementation (Express + SQLite + plain-ES-module UI).
- `app/src/*.js` (excluding `app.js`/`dashboard.js`/`reorder.js`/`sample-data.js`) = tested calculation engines, shared by the server via `/lib/*.js`.
- `demos/`, `sketches/`, older `plans/*` not named above = design history/inspiration, not current behavior.
- No real store/POS/supplier action without explicit permission and manager approval. No `git push` without Matthew running it himself.

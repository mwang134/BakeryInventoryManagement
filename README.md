# BakeryOps Assistant / Baker's Door

## Status

All three selected KPIs — **Next Order List**, **Tomorrow's Production**, and **Waste Pattern Review** — are built, test-first, and verified live in the browser. External code review (security, persistence integrity, portfolio coherence) has been addressed through P0 and P1; P2 (this pass) is in progress. See `DECISIONS.md` for the full dated history of every business/engineering decision.

The **current implementation lives in `server/`**, not `app/` alone. `app/` holds the tested calculation engines (`app/src/next-order-list.js`, `tomorrows-production.js`, `waste-review.js`, `escape-html.js`, each with its own `node:test` suite) plus the original sample-data prototype (`app/src/app.js`, `dashboard.js`, `reorder.js`) kept for history — that prototype is not the current app. `server/public/app.js` is the current single-page app; it imports the exact same tested calculation modules from `app/src/` (served at `/lib/*.js`), so there is one source of truth for every formula, not a duplicated copy.

## One-liner

A manager-facing tool that turns a physical frozen-dough count, mapped POS/production-sheet demand, and supplier timing into an explainable, editable, auditable internal worksheet — plus two supporting diagnostics (tomorrow's production plan, and a waste-pattern review) that reuse the same real production data.

## Architecture

```
server/
  src/server.ts        Express app, HTTP routes, security headers (CSP, no X-Powered-By)
  src/draftStore.ts     SQLite persistence (node:sqlite) - versioned migrations,
                         one-active-draft DB constraint, transactional finalize
  src/schemas.ts        Server-side validation for both draft types
  public/app.js          Current single-page app (imports calculation engines from /lib)
  public/index.html, styles.css, productionData.js
  tests/                 42 tests: routes, persistence, schemas, real process lifecycle

app/
  src/next-order-list.js, tomorrows-production.js, waste-review.js, escape-html.js
                          Tested pure calculation engines - the single source of truth
  src/app.js, dashboard.js, reorder.js, sample-data.js
                          Deprecated original prototype - history only, not current scope
  tests/                 75 tests total (both current engines and the old prototype)
```

Run `npm test` from both `app/` and `server/` — 119/119 passing as of the last commit.

## Data provenance

This project follows one hard rule throughout: never invent business or supplier data. Every number in the app falls into exactly one labeled category:

- **Real**: Matthew's actual production-sheet quantities and freezer counts (`data/tous-les-jours-menu-blueprint.csv`), the real public Tous Les Jours menu.
- **Clearly-labeled SIMULATED**: comparable-day sold/leftover/sellout evidence for Tomorrow's Production and Waste Pattern Review (`data/tomorrows-production-SIMULATED-comparable-day-sales.{csv,md}`) - real sales history doesn't exist yet, so this is synthetic data with its construction methodology documented, never presented as real.
- **Explicitly unverified/unknown, and visibly flagged as such in the UI**: croissant dough's box size (192 pieces, unverified) and supplier minimum (unknown) - shown with a permanent caveat, and finalizing Next Order List now requires an explicit manager acknowledgment of that (see `DECISIONS.md`, 2026-08-11).

## Running it

Requires **Node.js 22.6.0+** (`.nvmrc` pins the exact version this was last verified against, 22.22.3) - both `server/`'s `node:sqlite` and `--experimental-strip-types` flags need at least 22.6.0. `nvm use` picks up `.nvmrc` automatically if you use nvm.

```bash
cd server
npm run dev
```

Opens on `http://127.0.0.1:4000` (or `PORT=xxxx npm run dev` for a different port). No build step - plain ES modules served directly. Mac users can also double-click `server/START-SERVER-MAC.command`.

## Current build gate / contracts

`plans/NEXT-ORDER-LIST-BUILD-GATE.md`, `plans/NEXT-ORDER-LIST-ACCEPTANCE-SCENARIOS.md`, and `data/redacted-sku-contracts/croissant-dough.md` remain the frozen formula contract for Next Order List. `DECISIONS.md` has the equivalent frozen rules for Tomorrow's Production and Waste Pattern Review, plus every decision made since, in date order.

## Historical context

Earlier product exploration (multi-role accounts, live kitchen alerts, broader Product Setup, autonomous supplier ordering) remains under `plans/`, `artifacts/`, and `ideas/` for history and later reconsideration. None of it is current implementation scope.

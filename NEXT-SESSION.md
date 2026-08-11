# Next Session — BakeryOps Assistant

## Current lane

**P2 (portfolio coherence)** from the 2026-08-11 external code review. All three KPIs are built and tested; P0 (security/validation) and P1 (persistence reliability) from that review are done. This file itself was stale until this pass - it described the pre-BUILD CONVERGE state, which was resolved and superseded weeks of work ago. `DECISIONS.md` is the reliable source of current state; treat any other doc (including this one) as possibly stale if it disagrees with `DECISIONS.md`.

## Read first

1. `README.md` - current architecture and status
2. `DECISIONS.md` - full dated decision history, most recent at the bottom
3. `TODO.md` - exactly what's open right now

## Resume state

All three KPIs frozen and implemented - see `DECISIONS.md` for each feature's exact formula/threshold decisions (Next Order List: 2026-08-07/08; Tomorrow's Production: 2026-08-09; Waste Pattern Review: 2026-08-10). Two decisions made most recently (2026-08-11):

- Partial-box counting is an exact piece count, not an eyeballed fraction.
- Tomorrow's Production and Waste Pattern Review both stay in portfolio scope alongside Next Order List.

## What's actually left (P2)

- [x] Update README, START-HERE, NEXT-SESSION, TODO to reflect current state (this pass).
- [ ] One verified Mac launcher for the current server (the existing `app/START-MAC.command` targets the old prototype, not `server/`).
- [ ] Pin and document the supported Node version (`node:sqlite` + `--experimental-strip-types` requirement).
- [ ] Keyboard accessibility audit across `server/public/`.
- [ ] Look at reducing Tomorrow's Production's per-item review load (currently every flagged item needs an explicit click-through decision).

## Safety

No credentials, unapproved real store data, store/supplier contact, autonomous ordering, or fabricated impact claims. Box size (192 pieces/box) and supplier minimum remain unverified/unknown and must stay visibly flagged, not treated as confirmed. Commits happen locally only - `git push` is Matthew's to run (passphrase-protected SSH key).

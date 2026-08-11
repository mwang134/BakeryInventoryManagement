---
project: bakeryops-assistant
mode: portfolio-coherence
active_slice: p2-review-followup
owner_proposal_advisory: false
---

# TODO — BakeryOps Assistant

## All three KPIs: built, tested, verified

Next Order List, Tomorrow's Production, and Waste Pattern Review are all implemented test-first, wired into a real SQLite-backed server, and verified live in the browser. 119/119 tests passing. Full history in `DECISIONS.md`.

External code review (2026-08-11) findings:
- **P0 (security/validation)** - done. Server binds to 127.0.0.1, both draft types have server-side schemas with save/finalize validation tiers, supplier-rule acknowledgment is required and stored, the real stored-XSS path (unescaped `managerInitials`) is fixed and tested, CSP + disabled X-Powered-By are in place.
- **P1 (persistence reliability)** - done. Versioned migrations, a database-level constraint enforcing exactly one active draft, transactional finalize, client-side handling of non-2xx responses (a real error banner instead of silent failure), and a process-lifecycle test that spawns the real server as an OS process.
- **P2 (portfolio coherence)** - in progress, see below.

## P2 — remaining

- [x] Confirm partial-box counting method with Matthew (exact piece count, not a fraction) - `DECISIONS.md`, 2026-08-11.
- [x] Confirm Production/Waste stay in portfolio scope - `DECISIONS.md`, 2026-08-11.
- [x] Update README, START-HERE, NEXT-SESSION, TODO to reflect actual current state.
- [ ] Provide one verified Mac launcher for the current `server/` app (the existing `app/START-MAC.command` targets the old prototype).
- [ ] Pin and document the supported Node version.
- [ ] Keyboard accessibility audit across `server/public/`.
- [ ] Reduce Tomorrow's Production's per-item review load if a reasonable simplification exists, without silently skipping real flags.

## Deferred - not started, not currently in scope

- [ ] Live POS import/integration (real sales data would replace the SIMULATED comparable-day dataset).
- [ ] Supplier ordering or supplier-confirmation state (finalization stays internal-only by design).
- [ ] Broad multi-role accounts, live kitchen alerts, wider Product Setup.
- [ ] Measured real-world impact claims - would require actual deployment evidence, not simulated data.

## Exploration boundary

Matthew still owns the broader product direction. New ideas may be explored without being silently added to current scope. Capture them under `IDEA-LAB.md` / `ideas/`, then return here unless Matthew explicitly changes direction.

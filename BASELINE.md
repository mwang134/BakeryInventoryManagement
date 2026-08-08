# BakeryOps App Baseline — Before Urgency Dashboard

Captured: 2026-07-27T22:51:16+00:00

## Project identity

- Project: BakeryOps Assistant / Baker's Door
- Canonical app: `/opt/data/projects/bakeryops-assistant/app`
- Runtime: dependency-free Node.js static app
- Repository state: project folder is not a Git repository
- Rollback artifact: `artifacts/BakeryOps-App-Baseline-Before-Urgency-Dashboard.zip`

## Existing behavior

- Reorder worksheet with physical full/partial counts
- Seven-day sample coverage recommendations
- Manager-editable box quantities
- Draft cost and whole-freezer percentage
- Comparable-day item sales and Top 10 ranking
- Internal worksheet finalization that never contacts a supplier

## Baseline proof

Command: `npm test`

Result: 4 tests passed, 0 failed.

## Known sample boundaries

POS item-level sales capability is confirmed. Product mappings, costs, supplier rules, physical counts, and freezer capacity are sample data.

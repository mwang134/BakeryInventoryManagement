# Tomorrow's Production — SIMULATED Comparable-Day Sales Data

Status: **100% synthetic. Not real. Not observed. Not a substitute for a real POS export.**

This file exists only so `tomorrows-production-SIMULATED-comparable-day-sales.csv` is never mistaken for real evidence later. If real comparable-day POS data ever replaces this file, this note (and the `SIMULATED` labeling) should be deleted along with it, not left behind as stale cover.

## Why this exists

Matthew asked to build and test the Tomorrow's Production KPI's mechanics (review-flag logic, comparable-day chart, sellout/unusual-context markers) before real sold/leftover data exists. Real per-item daily sales are not public information for any bakery and were not available, so Claude generated a hand-built, deterministic dataset instead of leaving the feature untestable — and instead of pulling unrelated real data from some other business, which would have been more misleading than an honest placeholder.

## How the numbers were built

- **Produced quantity** for each item is the real Monday–Thursday production baseline Matthew reported in `tous-les-jours-menu-blueprint.csv` (Tuesday was chosen as the simulated comparable weekday, so the Mon–Thu baseline column applies).
- **Sold quantity** for each of 4 comparable Tuesdays (2026-07-14, 2026-07-21, 2026-07-28, 2026-08-04) was chosen by hand, not by a random-number generator, so specific test scenarios could be deliberately covered:
  - Several items (Crookie, Ube Cream Donut, several others) were given frequent sellouts (sold = produced) to exercise sellout-marker logic and a "large quantity change" upward suggestion.
  - Several items (Almond Croissant, Pistachio Cream Donut, Guava Danish) were given chronic heavy leftovers to exercise a downward suggestion.
  - Kimchi Croquette's 2026-07-21 row includes a made-up `unusual_context` ("Local food festival promotion nearby") to exercise the unusual-context marker path. This event is invented for testing purposes and did not happen.
  - Most other items were given moderate, unremarkable variation to represent the common case that shouldn't trigger a flag.
- **Leftover quantity** = produced − sold for every row (no separate assumption).
- 17 items were chosen (not the full menu) to keep the dataset reviewable, covering the croissant-dough family, the donut-dough family, and several standalone dough types for variety.

## What this does NOT establish

- Does not confirm actual demand for any item.
- Does not confirm the "every-Tuesday" comparable-day convention is what the real store uses.
- Does not confirm the invented promotion/event actually occurred.
- Must not be cited as evidence when Tomorrow's Production scenarios are reviewed/approved with Matthew - only real data should be used to freeze expected outputs, per the same rule already applied to the Next Order List acceptance scenarios.

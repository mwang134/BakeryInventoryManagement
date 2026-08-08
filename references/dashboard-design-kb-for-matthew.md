# Dashboard Design KB for Matthew

## One sentence

A dashboard is good when it helps a specific person make a specific decision faster and with more confidence.

## Pretty vs useful

Pretty dashboard:
- clean spacing
- consistent alignment
- good typography
- calm colors
- professional layout

Useful dashboard:
- tells one role what changed
- shows what needs attention
- explains why a recommendation exists
- shows data confidence
- gives a next action

Best dashboard:
- useful first, visually polished second.

## BakeryOps roles

| Role | Needs | Should not see too much |
|---|---|---|
| Manager | approve quantities, understand waste, reorder boxes, review confidence | unnecessary execution clutter |
| Baker | final prep list, quantity, timing, notes | forecasting logic, savings estimates, reorder math |
| Food runner | restock signal, sold-out/low-stock status | manager planning or ordering logic |

## Manager dashboard first-10-seconds test

A manager should know these quickly:

1. What needs review today?
2. What can be approved safely?
3. What changed from normal?
4. What data is uncertain?
5. What should I do next?

If a dashboard does not answer these, adding more charts will not fix it.

## Better metrics for BakeryOps

Good metrics:
- Yesterday waste vs normal waste for comparable weekdays
- Items above normal waste
- Items that sold out or nearly sold out
- Freezer coverage days
- Suggested order quantity
- Confidence level and missing data
- Manager overrides and why

Risky metrics unless defined carefully:
- estimated savings
- purchase deferred
- purchase cycle
- efficiency score

These can sound smart but confuse the manager if the baseline is weak.

## Visual polish checklist

- [ ] One primary action is obvious.
- [ ] Top cards answer the manager's main questions.
- [ ] Tables align numbers and units.
- [ ] Status colors are semantic: green safe, amber review, red risk.
- [ ] Text is large enough to read.
- [ ] Empty decoration is removed.
- [ ] Sample/estimated data is labeled.
- [ ] The screen feels calm, not noisy.

## Current BakeryOps dashboard review — 2026-07-21

Strengths:
- Visually credible operations dashboard.
- Dark sidebar + cream workspace feels polished and calm.
- Top cards, planner table, reorder planner, and waste review are logical sections.
- Sample-data warning and data confidence are good trust signals.
- Manager/baker separation is starting to appear.

Weaknesses:
- Too many modules for an inexperienced viewer.
- Primary manager decision is not dominant enough.
- Right rail has many tools; it feels like feature inventory.
- Waste and savings metrics need a manager-understandable benchmark.
- Jargon like purchase cycle/deferred needs plain-language labels.
- It needs stronger teaching labels: what should the manager do next?

Recommended next revision:
1. Put the top manager decision in a prominent action strip.
2. Rename fuzzy metrics into plain operational language.
3. Move optional tools into a secondary area.
4. Add a "Why this recommendation" explanation per changed quantity.
5. Keep baker-facing output as a separate clean sheet.

## Coaching prompt for Mike

When Matthew asks about a dashboard, ask one question:

> What is the one decision this screen should help the manager make first?

Then help him revise one thing at a time.

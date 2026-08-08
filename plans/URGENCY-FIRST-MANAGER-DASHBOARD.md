# Frozen Build Package — Urgency-First Manager Dashboard

Status: authorized by Matthew on 2026-07-27.

## Goal

Redesign the BakeryOps manager website around the question: **What needs action now, what should be reviewed today, and what should be planned next?**

## In scope

- Calm light manager homepage with `Act now`, `Review today`, and `Plan next`
- Act-now items fully visible; lower-urgency sections compact and expandable
- Connected Waste Review, Production Plan, and Freezer Count & Supplier Restock views
- Supplier Waste Cost, affected products, comparable-Tuesday evidence, and production adjustments
- Product shortage risk, confirmed freezer count, editable internal supplier draft, and zone-capacity guardrails
- Zone setup assumptions: assigned sections, practical capacity, hard maximum, limited legroom
- Sample-data and data-freshness labels
- Explicit internal-only approvals; no supplier submission or production-record side effects
- Responsive local website retaining Mac/Windows/Linux launchers

## Acceptance criteria

1. Manager overview visibly orders work by urgency rather than displaying an equal KPI grid.
2. `Review today` and `Plan next` can expand/collapse and remain visible on the homepage.
3. Queue actions navigate to the correct detailed view.
4. Waste Review shows supplier waste cost, affected products, comparable-Tuesday trend, evidence considered, availability guardrail, and a link to Production Plan.
5. Production Plan allows sample quantity edits and internal approval only.
6. Freezer Count & Supplier Restock supports count confirmation, shortage-risk review, editable draft boxes, and zone statuses `comfortable`, `limited`, and `blocked`.
7. Calculation behavior is covered by tests written before implementation.
8. Full automated test suite passes; browser console is clean; primary interactions and responsive layout are verified.

## Non-goals

- Real POS/supplier integration
- Automatic supplier orders
- Changes to real production or inventory records
- Authentication or persistence
- Claiming sample costs, forecasts, or capacity as confirmed store facts

## Visual direction

Airtable/Carbon-inspired light operational workspace: neutral surfaces, deep navy text, one blue accent, restrained semantic red/amber/green, readable tables, and no decorative gradients or gauges.

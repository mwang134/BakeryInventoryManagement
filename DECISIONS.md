# Decisions — BakeryOps Assistant

## 2026-07-19 — Product should be app + controlled agent, not agent-only

Decision:
- Build the store-facing product as an app/system of record.
- Use Hermes as Matthew's project/build coach and later as a controlled store co-pilot.

Reason:
- Store managers need stable forms, dashboards, records, and auditability.
- Agent-only interface is too free-form for inventory/production/order control.
- Hermes is valuable for explanation, reminders, action drafting, and Matthew's learning/build loop.

Status: active.

## 2026-07-19 — Start with transparent forecasting rules

Decision:
- MVP should use auditable rules before advanced AI.

Reason:
- Bakery manager must trust recommendations.
- POS/inventory/waste data quality matters more than model sophistication in V1.

Status: active.

## 2026-07-20 — Separate manager planning from baker execution

Decision:
- Manager owns sales tracking, leftovers, sold-out information, estimation, and the final production quantity.
- Bakers follow the approved production/preparation list; they do not decide whether quantities should increase or decrease.
- Food runner displays and packages pastries, restocks display cases, reports low/out-of-stock pastries to the manager, requests replenishment from bakers when needed, and cleans cases/trays at closing.
- The product should provide a manager planning view and a simpler baker-facing execution list.

Reason:
- Each role should see only the information and actions needed for its real workflow.
- Forecast reasoning belongs with the manager; the baker needs an unambiguous final quantity.
- Food-runner reports and extra-batch requests are useful demand signals for the manager’s next recommendation.

Status: active.

## 2026-07-21 — MVP is manager digital planner plus baker execution sheet

Decision:
- The MVP should be manager-facing rather than a full multi-user workflow system.
- Manager reviews imported/prefilled data, recommendations, inventory, and alerts; manager approves the final production and preparation quantities.
- The app generates a simple printed or read-only baker execution sheet.
- Bakers check and follow the sheet without logging routine activity into the app.
- Existing verbal communication between food runner and bakers remains unchanged because it already works quickly during irregular customer demand.
- Individual baker and food-runner accounts, live app notifications, and event-by-event recording are deferred until evidence shows they would improve rather than slow the workflow.

Reason:
- Customer arrivals are irregular and busy periods create bottlenecks.
- Requiring frontline digital interaction would add friction to a fast kitchen workflow.
- The highest-value software task is helping the manager create a better plan, not digitizing every existing communication.

Risk controls:
- Every generated sheet should show the bake/preparation date, approval status, version or generated time, and manager name/initials.
- If the manager changes the plan after printing, the updated sheet must clearly supersede the older version.

Status: active.

## 2026-07-24 — Freeze the manager reorder wedge and gate the next build on one real/redacted SKU

Decision:
- The current MVP is a manager-facing frozen-dough reorder decision aid, not a broad production/waste platform.
- Replace the arbitrary fixed seven-day rule with a delivery-horizon decision: `Short before delivery`, `Lasts through delivery`, or `Excess after delivery`.
- Remove Top 10 and duplicate analytics from the daily reorder screen; supporting evidence belongs behind `Why?`.
- Do not build a broad Product Setup screen until one frozen SKU has a validated/redacted mapping, count, supplier timing/rule, and comparable-day demand example.
- Several pastries may map to one frozen SKU; aggregate mapped demand.
- Establish a versioned baseline before the next durable implementation slice.

Reason:
- The current prototype proves mechanics, but sample fields and a fixed seven-day target are not store truth.
- Converging on one manager decision is more valuable than expanding screens or roles.
- One concrete SKU example will expose missing data/model assumptions before they become code.

Status: active; canonical detail in `CURRENT-DIRECTION.md`.

## 2026-07-24 — Protect Matthew's idea-exploration lane

Decision:
- The approved delivery direction is a default path, not a restriction on Matthew's new ideas.
- Mike must help Matthew steelman and deepen new ideas before judging fit.
- Local reversible research, sketches, sample-data exercises, and disposable spikes may continue immediately.
- New ideas are captured under `IDEA-LAB.md` / `ideas/` and surfaced to Ping/Jade with strongest case, strongest concern, evidence, and next decision.
- Exploration remains separate from the current app/mainline until owner review promotes it.

Reason:
- Student initiative and original thinking are project outcomes, not distractions.
- Separating exploration from committed delivery preserves creativity without creating roadmap drift or hiding unreviewed product changes.

Status: active.

## 2026-07-24 — Divergence before convergence; Mike advises but does not direct

Decision:
- Matthew owns creative direction. Owner proposals are suggestions he may adopt, modify, combine, ignore, or revisit.
- A new idea enters divergence mode: maximize the idea, branch it, and follow it before discussing feasibility or scope.
- Mike must not propose an MVP, minimum implementation, smallest test, forced priority, downside review, or kill criterion while the idea is expanding.
- Mike's contributions are framed as optional possibilities, never requirements or direction.
- If Matthew wants to make artifacts, preserve the full vision and follow his chosen branch rather than shrinking it for implementation convenience.
- Convergence begins only when Matthew explicitly asks to narrow/plan, or when Matthew joins a deliberate later Ping/Jade convergence discussion.

Reason:
- Premature minimal implementation can erase the idea before its full value and shape are understood.
- The project should develop Matthew's imagination and ownership, not train him to obey an externally selected roadmap.

Status: active; supersedes any earlier wording that made the owner proposal or smallest test sound mandatory.

## 2026-08-05 — Select the Tomorrow’s Production KPI design concept

Decision:
- The homepage KPI is a whole-card entry into **Tomorrow’s Production** and leads with the number of products needing manager review.
- A product needs review when its suggested quantity changes or an unusual condition makes the normal plan questionable.
- Use distinct labels for `Quantity change`, `Large quantity change`, `Unusual context`, and `Limited evidence`.
- Comparable weekdays support the selected product through an explainable sold/leftover chart; they are evidence, not a separate headline KPI.
- Every flagged product requires one explicit manager action: `Use suggestion`, `Keep current`, or `Set custom quantity`.
- One button finalizes the complete internal plan after all required products are reviewed.
- Finalized plans provide both a read-only baker sheet and a printable sheet from the same saved quantities.
- Ready-to-bake pastries show an opening batch that must be baked and displayed before 9:00 AM plus a thawed/prepared but unbaked reserve. Other products show a simple finalized quantity unless their real workflow establishes another split.

Reason:
- The flow keeps the homepage compact, makes recommendations explainable, preserves manager judgment, and gives bakers a simple execution sheet rather than manager analytics.
- Explicit review actions prevent merely opening a chart from being mistaken for approval.
- Product-type-specific rows avoid forcing the ready-to-bake workflow onto unrelated items.

Open validation before implementation:
- Real calculation rules and thresholds for suggested or “large” changes.
- Availability and meaning of produced, sold, leftover, sellout, promotion/event, and new-product data.
- Treatment of weak evidence and of ready-to-bake reserve remaining unbaked at day end.

Status: design concept selected in Matthew’s exploration lane; not implemented and not promoted into committed app scope.

## 2026-08-05 — Select the Waste Pattern Review KPI design concept

Decision:
- The entire homepage **Waste Pattern Review** card is clickable and opens a focused review workspace.
- The headline KPI is the number of pastries with an unusually high finished-leftover rate versus reliable recent comparable weekdays—not a standalone money total.
- Supplier cost in affected finished leftovers remains supporting financial context.
- Known promotions, events, sellouts, and missing information must be marked so the system does not present them as normal comparable evidence.
- Before enough reliable comparable-day history exists, the card says `Building comparable-day baseline`; it must not invent an anomaly.
- The inner page ranks affected products and shows one selected product’s comparable-day evidence, including baked, sold, finished leftovers, normal range, sellout markers, unusual-context markers, and missing-data states.
- The chart’s job is to help the manager distinguish a known one-time event from a possible repeated production-baseline problem.
- Manager outcomes are `Known one-time event`, `Possible repeated baseline problem`, or `Information incomplete`.
- Waste Review diagnoses the pattern; editable quantity decisions and finalization remain in Tomorrow’s Production.

Reason:
- A money amount communicates impact but does not identify the specific problem or manager action.
- Comparable-day exceptions direct attention to products that may be overproduced while preserving contextual judgment.
- Keeping production edits in one workspace prevents duplicate recommendations and approvals.

Open validation before implementation:
- Minimum reliable comparable-day history.
- Statistical or rule-based threshold for “unusually high.”
- Valid produced/baked, sold, finished-leftover, sellout, event/promotion, and supplier-cost data.
- Treatment of ready-to-bake prepared reserve, missing counts, and product launches.

Status: design concept selected in Matthew’s exploration lane; not implemented and not promoted into committed app scope.

## 2026-08-06 — Select Next Order List as the flagship BUILD lane and freeze the V1 formula shape

Decision:
- Matthew selected **Next Order List** as the first portfolio-quality vertical slice.
- Use current production-sheet quantities as the V1 expected-demand baseline; comparable-day POS sales remain supporting evidence and a later improvement path.
- Include every calendar date in the selected windows; shipment date is the first date selected boxes are available.
- Aggregate all pastries mapped to one frozen-dough SKU using explicit conversion quantities.
- Keep pre-arrival shortage separate from post-arrival order quantity.
- Add no hidden percentage safety buffer; whole-box rounding creates a visible natural cushion.
- Keep base suggestion separate from manager-selected quantity.
- Persist one active draft; finalization creates an immutable internal snapshot shown in finalized-only History and never implies a supplier order was sent.

First redacted mapping:
- Croissant, Strawberry Croissant, Crookie, Almond Croissant, Chocolate Croissant, and Garlic & Cheese Croissant each use one croissant-dough piece.
- Generic weekday production-sheet total is 84 dough pieces.
- Supplier box size is approximately 192 pieces but remains unverified; supplier minimum is unknown.

Reason:
- Starting from the current production sheet preserves the manager's existing operational baseline instead of inventing a forecast.
- Explicit date windows, shared-dough mapping, and visible rounding make the recommendation explainable and testable.
- Keeping estimated/unknown supplier fields visible prevents prototype precision from being mistaken for operational validation.

Status: active engineering-convergence contract. BUILD waits for the remaining redacted count/date inputs, missing supplier-rule behavior, acceptance-scenario approval, and persistence-technology choice.

## 2026-08-08 — Enter BUILD for Next Order List

Decision:
- All remaining Next Order List convergence items are resolved: the croissant-dough SKU contract has a full sample/placeholder worked example (including a resolved count-date/shipment-date pre-arrival window rule that generalizes to all counts, since counts always happen after closing); supplier-minimum-unknown shows a permanent caveat rather than blocking; stale-count policy is a weekly whole-freezer recount (placeholder day: Monday) plus a per-pastry ≤1-box off-cycle trigger; hard-capacity overage warns but does not block finalization; persistence is a small server-side store; and Matthew reviewed and approved the acceptance scenarios document section by section.
- Status changes from CONVERGE to BUILD. First BUILD action is writing failing tests from the approved acceptance scenarios, then implementing in verified vertical slices per the engineering method in `AI-HANDOFF/AI-CONTINUATION-PROMPT.md`.

Reason:
- Every item on the build-gate's "Definition of ready to BUILD" checklist is now checked, and Matthew explicitly asked to start testing and coding.

Status: active.

## 2026-08-07 — Open Branch H: phone-native capture (photos and voice), kept separate from BUILD scope

Decision:
- A new idea-lab branch was opened and expanded under `ideas/manager-centered-bakery-flow.md`: end-of-day leftover photos (any phone, auto-counted, manager accepts/edits), and push-to-talk voice for speaking the physical freezer count instead of typing it.
- Non-manager roles (starting with the food runner) would get a deliberately stripped-down extension of the manager tool — camera/voice capture only, not the full manager workspace — if this is ever promoted.
- Matthew stated he wants this included in implementation eventually, but per the idea-lab rules this is recorded as intent only; it has not been promoted into the Next Order List BUILD scope and requires its own explicit convergence discussion later.

Reason:
- Protects the idea-exploration lane from being silently folded into committed delivery scope, per the existing 2026-07-24 decision on protecting Matthew's exploration lane.

Status: active; Branch H remains in `expanding` state, not promoted.

## 2026-08-09 — Enter BUILD convergence for Tomorrow's Production; freeze the calculation rule

Decision:
- Matthew provided real production-sheet baselines (Monday–Thursday and Friday–Sunday quantities) and freezer counts for many additional pastries and breads beyond croissant dough, via a self-reported blueprint (`data/tous-les-jours-menu-blueprint.csv`). A second genuine shared-dough SKU was confirmed: **donut dough** — one shared dough pool fried as a batch, then split into flavors (Vanilla, Chocolate, Mango, Ube, Pistachio Cream Donut) afterward, analogous to croissant dough. All other shared-looking labels (e.g., "Ready-to-bake," "Frozen package") were confirmed to be prep-category descriptions only — each of those pastries keeps its own separate box/count, not a shared one.
- "Depends" production quantities are not a data gap; several items genuinely run on an irregular (roughly every-other-day) schedule with no fixed quantity. These are treated as `Information incomplete` (no confident baseline), same UI treatment as a true missing value, for an honest reason rather than an assumed one.
- Extra-batch carryover is a real operational rule (unbaked extra batch becomes a head start on the next day's prep) that Matthew has not yet decided how to formalize into next-day quantity math. For V1, extra-batch carryover is tracked and shown as visible context only; it does not silently adjust any suggested quantity until Matthew freezes that rule.
- Real comparable-day sold/leftover/sellout data does not exist yet (leftover counts were confirmed as not currently tracked at all, same root gap as Waste Pattern Review). A clearly labeled, deterministically hand-built **SIMULATED** dataset (`data/tomorrows-production-SIMULATED-comparable-day-sales.csv` and its companion `.md`) stands in for real data so the KPI's mechanics can be built and tested. This dataset must never be used to freeze real acceptance-scenario outputs.
- Tomorrow's Production calculation rule, frozen for V1:
  - Suggested quantity = average sold across comparable days on record, rounded to a whole number.
  - `Quantity change`: suggested differs at all from the current production-sheet quantity.
  - `Large Quantity Change`: suggested differs from current by more than 25%.
  - `Unusual context`: any comparable day in the lookback window had a sellout or a recorded unusual event.
  - `Limited evidence`: fewer than 3 comparable days on record, or any required day's data is missing - shown instead of a confident suggestion, not alongside one.

Reason:
- Mirrors the same convergence discipline already applied to Next Order List: real data where available, clearly labeled placeholders where not, and no invented thresholds presented as settled without an explicit decision.

Status: active convergence contract for Tomorrow's Production. Not yet fully BUILD-ready: real (non-simulated) comparable-day data remains open. The extra-batch/reserve rule below is now frozen.

## 2026-08-09 — Freeze the extra-batch reserve carryover rule

Decision:
- Reserve-eligible items are exactly those whose production quantity includes a "+ extra batch" note in `tous-les-jours-menu-blueprint.csv` (e.g., Pain Au Chocolat, Chocolate Avalanche, Spinach Feta Danish). This is derived from data already provided, not a new judgment call.
- The suggested/decided total for a product ("this many needs to exist") is never reduced by carryover - it stays exactly what the suggestion engine or manager decision produced.
- Reserve dough is prepped the day before it's baked (shaped/pulled from the freezer, then refrigerated), matching the existing shape-required production pattern. Any extra-batch reserve not used the day it was prepped survives exactly **one additional day** and no longer - if still unused after that one extra day, it expires and must be recorded as expired/unused rather than silently dropped or allowed to carry forward again.
- Every evening at **closing**, the manager confirms (quick-entry, not a form - a stepper/tap adjustment per item) how much extra-batch reserve is actually sitting prepped-but-unbaked. Only items that could plausibly have leftover reserve appear in that day's check - an item whose extra batch fully sold out that day is skipped entirely, keeping the daily list short.
- That single confirmed number feeds two calculations without being entered twice:
  - **Net prep instruction** on the baker sheet: suggested total minus confirmed carryover (floored at zero).
  - **Fresh dough pull** in the Next Order List math: the dough for carried-over reserve was already pulled from the freezer when it was originally prepped, so it must not be counted again as dough needed for tomorrow. Next Order List reads this same confirmed number rather than the manager entering it separately there.
- Tomorrow's production plan is finalized at **today's closing time**, not the next morning - this matches the real constraint that shape-required dough for tomorrow's opening batch needs to be prepped tonight, not discovered as a plan the next morning.

Reason:
- Resolves a real, currently-existing operational risk Matthew confirmed: without this, fresh dough needs get double-counted (once when reserve was originally prepped, again when the next day's plan assumes it all needs fresh dough), which would inflate supplier-order suggestions.
- Keeps the manager-facing check small and low-friction: short list, only items that need it, quick-tap entry, one confirmation feeding two features rather than two separate entry points.

Status: active. Implementation next.

## 2026-08-10 — Enter BUILD convergence for Waste Pattern Review; freeze the calculation rule

Decision:
- Reuses the same product/comparable-day data already built for Tomorrow's Production (`server/public/productionData.js`), since that SIMULATED dataset already carries sold, sellout, and unusual-context fields per comparable day, and leftover is derivable as production baseline minus sold. No new data-gathering pass was needed to start.
- Waste Pattern Review calculation rule, frozen for V1:
  - For each product, compute leftover rate (leftover ÷ produced) for every comparable day on record.
  - Compare the **most recent** comparable day's leftover rate against the **average of the prior comparable days'** rates (the baseline).
  - `Unusually high`: the most recent rate exceeds the baseline by more than 50%.
  - `Building comparable-day baseline`: fewer than 3 valid comparable days on record (or any required day's data missing) - shown instead of a confident flag, never an invented anomaly.
  - Manager outcome for a flagged product: `Known one-time event` if the flagged day has a recorded sellout/unusual-context note, `Possible repeated baseline problem` if it does not, `Information incomplete` when evidence is limited.
- Supplier cost in affected leftovers remains supporting context only and shows `Not available`, since no real per-unit cost data has been provided for any product (same treatment as Next Order List's box cost).
- Waste Pattern Review remains a diagnostic/read view - it does not have its own finalize action or editable quantities; any resulting production change happens in Tomorrow's Production, per the original design decision.

Reason:
- Mirrors the same convergence discipline as Next Order List and Tomorrow's Production: reuse real/simulated data where it already exists, freeze one clear threshold before writing code, and keep unknowns (supplier cost) visibly unresolved rather than invented.

Status: active convergence contract for Waste Pattern Review. Implementation next.

## 2026-08-11 — Implement Next Order List's plain-language days-of-supply (Feature 2)

Decision:
- `calculateDaysOfSupply` walks forward one calendar day at a time from the count date, deducting each day's real weekday-dependent dough usage rate (mon-thu: 84 pieces/day, fri-sun: 156 pieces/day, both derived from `CROISSANT_DOUGH.pastriesByDayType` rather than hardcoded a second time) rather than a flattened daily average - a flattened average would misstate the run-out date whenever the remaining runway crosses from one rate to the other.
- Consumption starts the day *after* the count date, consistent with the existing "count happens after closing" rule already frozen for the pre-/post-arrival formulas.
- This is the on-hand count's own runway assuming no further order arrives - a distinct number from the plan-stock-through projection used elsewhere in Next Order List, and it's available as soon as a count exists (it does not require shipment/plan-through dates to be entered yet).
- Surfaced as plain language, e.g. "~6 days of supply (through Aug 16)", on the homepage KPI card's meta line and the workspace List row - not as a new standalone view.

Reason:
- This was the "Feature 2" scoped during Next Order List's original Feature 1/Feature 2 planning discussion, deferred until after Feature 1 (the "what changed" trend comparison) shipped.

Status: implemented and tested (real croissant dough count numbers as the primary test case). Chart panels across all three KPIs were also redesigned this session with a real Y-axis, gridlines, and KPI-tied reference lines, replacing the earlier plain bar rows.

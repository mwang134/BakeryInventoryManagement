# BakeryOps Chat-to-Walking-Skeleton Workflow

## Purpose

Use this protocol to keep Matthew's idea exploration open while making later delivery work efficient and verifiable.

The chat must declare its mode before doing substantial work:

1. `EXPLORE` — expand an idea without narrowing it.
2. `CONVERGE` — compare branches and deliberately choose or combine a direction.
3. `BUILD` — implement a frozen, bounded slice without adding features.
4. `REVIEW` — test the built artifact against frozen acceptance criteria.

Do not silently switch modes.

---

## Why the earlier chat drifted

The conversation produced valuable discoveries, but the delivery process mixed:

- store/workflow discovery;
- idea expansion;
- dashboard feature selection;
- implementation;
- packaging and Mac verification;
- product-design theory;
- timesheet administration.

The main implementation began before freezing:

- one operating question;
- one-SKU data contract;
- delivery-horizon calculation;
- acceptance examples;
- target-computer launch requirement;
- persistence requirement;
- explicit non-goals.

As a result, descriptive features such as Top 10 sales and duplicated dashboard cards were built before their decision value was proven.

---

## Mode 1 — EXPLORE

Use when Matthew is imagining or expanding an idea.

### Chat header

```text
MODE: EXPLORE
IDEA IN MATTHEW'S WORDS:
WHAT FEELS INTERESTING:
BRANCHES TO KEEP ALIVE:
ARTIFACT TO UPDATE:
```

### Rules

- Expand the world, roles, journeys, and alternate possibilities.
- Do not force an MVP, feature priority, smallest test, or feasibility decision.
- Preserve contradictory branches.
- Store new branches in the idea landscape.
- End by asking which branch Matthew wants to continue exploring, not which one he must build.

### Exit condition

Only exit when Matthew explicitly says he wants to narrow, compare, choose, plan, or build.

---

## Mode 2 — CONVERGE

Use when Matthew deliberately wants to make a delivery choice.

### Chat header

```text
MODE: CONVERGE
BRANCHES BEING COMPARED:
DECISION TO MAKE TODAY:
EVIDENCE:
ASSUMPTIONS:
OUTPUT:
```

### Required gates

#### Gate 1 — Choose the operating question

For the optional reorder branch:

> Will current counted stock plus incoming stock last until the next supplier delivery; if not, how many boxes should the manager prepare to order?

Do not design screens until the question is accepted for this branch.

#### Gate 2 — Freeze one thin data contract

For one frozen-dough SKU:

- mapped pastry item(s);
- comparable-day sales;
- pieces per box;
- full/partial physical count;
- count timestamp;
- next order cutoff;
- next delivery date;
- incoming boxes;
- supplier case/minimum rule;
- safety buffer.

Every field is labeled `confirmed`, `reported`, `sample`, or `missing`.

#### Gate 3 — Freeze calculation examples

Write at least three examples:

1. short before delivery;
2. lasts through delivery;
3. excess after delivery.

Expected outputs must be calculated before implementation.

#### Gate 4 — Freeze the walking-skeleton chain

```text
Load one SKU contract
→ enter/confirm fresh count
→ calculate usage until delivery
→ classify coverage
→ recommend boxes and explain why
→ manager edits quantity
→ show consequence
→ confirm internal worksheet
→ save it
→ reload and recover it
```

#### Gate 5 — Freeze acceptance criteria

Example:

- known fixture produces the expected status and boxes;
- changing count changes the recommendation;
- manager override updates totals;
- final worksheet survives browser reload;
- no supplier network action exists;
- app launches on Matthew's Mac from the delivered package;
- the primary workflow is understandable without opening analytics.

#### Gate 6 — Freeze non-goals

For the thin reorder skeleton:

- no Top 10 chart;
- no permanent large trend chart;
- no production recommendation;
- no automatic POS integration;
- no supplier ordering;
- no broad Product Setup screen;
- no additional roles.

New ideas go to the landscape/backlog; they do not enter the frozen slice automatically.

### Exit condition

Convergence ends with a one-page frozen slice contract that Matthew understands and chooses to build.

---

## Mode 3 — BUILD

### Chat header

```text
MODE: BUILD
FROZEN CONTRACT:
CURRENT MINI-STEP:
DONE WHEN:
NOT CHANGING:
```

### Rules

- Work one link at a time.
- Write a failing test first for calculation/state behavior.
- Implement the minimum code to pass it.
- Verify immediately.
- Do not brainstorm new features during the inner build loop.
- Put new ideas into a parking list without implementing them.
- Report evidence, not promises.

### Suggested mini-steps

1. One-SKU fixture and status calculation.
2. Delivery-horizon box recommendation.
3. Count input.
4. Exception row.
5. Manager override and totals.
6. Internal final state.
7. Local persistence and reload.
8. Mac launcher/package.

### Exit condition

Every frozen acceptance criterion has real test or browser evidence.

---

## Mode 4 — REVIEW

### Chat header

```text
MODE: REVIEW
BUILD UNDER REVIEW:
ACCEPTANCE CRITERIA:
PASS/FAIL EVIDENCE:
OPEN DEFECTS:
DECISION:
```

### Rules

- Review only against the frozen contract.
- Test the complete user path.
- Test on the target computer/package format.
- Separate defects from new ideas.
- New ideas return to EXPLORE or a later CONVERGE session.
- Do not call the slice complete while a required link is missing.

---

## Five-line prompt Matthew can use

```text
Mode: Explore / Converge / Build / Review
Today I want to:
The artifact or idea is:
By the end, I want:
Do not work on:
```

Matthew does not need to fill every line perfectly. Mike should reflect it back concisely and ask only one question if a missing detail changes the work.

---

## Efficient session closing

Every substantive session ends with:

```text
DECIDED:
BUILT OR UPDATED:
VERIFIED:
PARKED IDEAS:
NEXT ENTRY POINT:
TIMESHEET HOURS (if provided):
```

Do not use memory for temporary progress. Update the project handoff or use session history.

---

## Current assessment

The existing BakeryOps app is useful as an exploratory prototype and proof that the calculation-to-approval interaction can work. It is not yet the frozen operational walking skeleton because:

- the delivery-horizon contract is not implemented;
- setup fields and sales are sample data;
- final worksheets do not persist after reload;
- the first build included nonessential analytics;
- the target-computer packaging requirement was discovered after delivery rather than frozen before build.

The next implementation should happen only after Matthew explicitly chooses a branch and the corresponding one-page slice contract passes the CONVERGE gates above.

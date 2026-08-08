# Resume-Quality Project Path — BakeryOps Assistant

Status: coaching roadmap for Matthew; not an implementation approval.

## The four stages

### 1. EXPLORE — understand the problem space

Question:

> What actually happens in the bakery, where does judgment occur, and what might software improve?

Outputs:
- observed/reported workflow facts;
- user roles and decisions;
- competing feature ideas;
- assumptions and unknowns;
- static concepts and rejected alternatives.

Matthew's status: strong. He has explored freezer/reorder planning, tomorrow's production, comparable-day evidence, baker output, and waste-pattern review. He also rejected weak ideas such as popularity charts and a money-only waste KPI when they did not lead to a clear action.

### 2. CONVERGE — commit to one precise delivery target

Question:

> Of all the useful ideas, what exactly will this version solve and how will we know it works?

Convergence is not "stop thinking." It means making current decisions explicit so implementation does not keep changing underneath the code.

Required outputs:
1. one flagship user and decision;
2. one problem statement;
3. in-scope and out-of-scope behavior;
4. input data contract;
5. deterministic calculation/decision rules;
6. screen and state flow;
7. acceptance examples and failure states;
8. testable definition of done.

Matthew's status: partial. The product interaction concepts are selected, but exact data contracts, thresholds, persistence, and acceptance tests are not frozen.

### 3. BUILD — implement a complete vertical slice

Question:

> Can a manager complete the selected task from input through saved/final output?

A resume-grade vertical slice should demonstrate:
- data ingestion or realistic fixture data;
- transparent domain logic;
- responsive user interface;
- editable state;
- persistence across refresh/restart;
- finalized read-only records;
- error and missing-data handling;
- automated tests;
- portable local launch instructions.

### 4. REVIEW — prove quality and communicate impact

Question:

> Does the software behave correctly, and can Matthew explain why the result matters?

Required evidence:
- automated test output;
- manual end-to-end verification;
- screenshots or short demo video;
- realistic scenarios, including missing/weak data;
- architecture/data-flow diagram;
- README with setup, constraints, and trade-offs;
- honest limitations and future-production requirements;
- user/manager feedback when available.

Do not claim measured cost savings, waste reduction, or store adoption unless they were actually measured. Portfolio impact can be stated as the decision/workflow the software supports.

## Recommended flagship implementation

Recommended first flagship: **Next Order List**.

Why:
- it answers one concrete manager decision;
- existing working JavaScript logic and automated tests provide a head start;
- physical freezer counts and item-level POS sales are grounded in the reported workflow;
- it demonstrates domain modeling, state management, explainable rules, testing, and internal finalization;
- Waste Pattern Review requires longer historical data and is better as a later extension.

The selected Tomorrow's Production and Waste Pattern Review concepts remain valuable portfolio design evidence, but they do not all need to be fully implemented in the first resume-grade release.

## Next Order List convergence gate

Before changing implementation, freeze one realistic or explicitly redacted SKU example:

1. frozen SKU and mapped pastry items;
2. pieces per box and partial-box counting method;
3. physical count and count timestamp;
4. supplier cutoff, delivery horizon, incoming stock, and case/minimum rules;
5. comparable-day POS unit sales;
6. expected `Short before delivery`, `Lasts through delivery`, or `Excess after delivery` result;
7. manager-edited quantity and final internal worksheet behavior;
8. missing/stale-count and invalid-input behavior.

Then write acceptance tests before refactoring the UI.

## Resume-quality build sequence

1. Replace the sample fixed seven-day rule with validated delivery-horizon logic.
2. Simplify the homepage into whole-card navigation.
3. Build the focused Current workspace with count prerequisite, editable list, and explainable evidence.
4. Persist the active draft across browser refresh.
5. Finalize an immutable internal worksheet and show finalized-only History.
6. Add input validation and missing/stale-data states.
7. Expand automated domain and state-transition tests.
8. Package and verify macOS/Windows launch behavior.
9. Create README, architecture diagram, screenshots, and a short demo.

## What Matthew should be able to explain in an interview

1. Who is the user and what decision are they making?
2. Why is a physical freezer count the inventory source of truth?
3. Why are POS sales demand evidence rather than exact inventory?
4. How do several pastries map to one frozen SKU?
5. How does the delivery-horizon calculation work?
6. Why are recommendations editable and explainable?
7. What happens when data is missing or stale?
8. How are drafts, finalization, and history modeled?
9. What tests protect the business rules?
10. What would be required before using the app in a real store?
11. Which ideas were rejected or deferred, and why?
12. What did Matthew personally design, implement, test, and learn?

If Matthew can demonstrate the app and answer these questions clearly, the project communicates software-engineering ability rather than only visual design.

## Honest resume language template

> Designed and built a manager-facing bakery operations web application that converts physical freezer counts and item-level POS demand evidence into explainable replenishment recommendations, editable drafts, and finalized internal worksheets. Implemented deterministic business rules, stateful workflows, automated tests, and portable local launch tooling while documenting data-quality and operational constraints.

Add measured numbers only after real verification. Do not claim supplier integration, live POS integration, store deployment, or cost savings unless those capabilities or outcomes are actually proven.

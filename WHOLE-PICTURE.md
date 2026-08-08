# BakeryOps Assistant — Whole Picture

## Matthew-led exploration

- Matthew owns the creative direction.
- New ideas enter divergence mode: maximize, branch, and worldbuild before narrowing.
- Mike follows and expands the idea; his proposals are optional suggestions.
- No MVP, minimum implementation, smallest test, feasibility judgment, or forced choice until Matthew explicitly wants convergence.
- Idea landscapes live in `IDEA-LAB.md` and `ideas/`.

## Selected current delivery lane

Matthew selected a manager-facing frozen-dough Next Order List as the current flagship vertical slice:

> Will fresh counted stock plus incoming stock last until the next supplier delivery; if not, how many boxes should the manager prepare to order?

Evidence for this option:
- dependency-free working prototype;
- 8/8 current prototype tests passing;
- manager count workflow and POS item-level capability confirmed.

Limitations:
- code still uses sample mappings/rules and an arbitrary seven-day target;
- no real POS export or supplier schedule has been inspected.

Current convergence lives in `plans/NEXT-ORDER-LIST-BUILD-GATE.md`, `plans/NEXT-ORDER-LIST-ACCEPTANCE-SCENARIOS.md`, and `data/redacted-sku-contracts/croissant-dough.md`. If Matthew brings another idea, preserve it in the exploration lane without silently changing the selected build scope.

## Authority and safety

- Exploratory direction belongs to Matthew.
- Mike advises and co-explores; he does not assign product direction.
- Ping/Jade help converge only later, with Matthew, after the idea has been deeply explored.
- No unapproved real data, store/supplier contact, or automatic ordering.

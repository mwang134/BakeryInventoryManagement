# BakeryOps Assistant — Implementation App

This folder is the implementation source of truth for the current reorder-planner MVP.

## Current working slice

The first screen includes:
- calculated `Order`, `Enough`, and `Overstock` decisions
- physical full/partial freezer-box counts
- comparable-day item sales
- manager-editable order quantities
- live draft cost and projected freezer capacity
- selected-pastry comparable-day line chart
- Top 10 pastry ranking
- data-confidence labels
- internal final worksheet confirmation

Finalizing a worksheet never contacts a supplier or submits an order.

## Quick start on another computer

Requirement: install [Node.js](https://nodejs.org/) first.

### Windows

1. Extract the ZIP.
2. Open the extracted `app` folder.
3. Double-click `START-WINDOWS.bat`.
4. If the browser does not open automatically, visit `http://127.0.0.1:4173/`.

### macOS

**Easiest:** double-click `START-MAC.command`.

If macOS blocks the launcher or shows `permission denied`, open Terminal inside the extracted `app` folder and run:

```bash
bash START-MAC-LINUX.sh
```

Then visit `http://127.0.0.1:4173/`. Running the script through `bash` works even if an unzip tool removes the executable permission.

### Command-line alternative

```bash
cd app
npm test
npm start
```

No `npm install` is required because this working slice has no external packages.

## Structure

```text
index.html               manager screen shell
styles.css               responsive visual system
src/app.js               browser state and interactions
src/reorder.js           tested calculation and safety logic
src/sample-data.js       fake prototype data
 tests/reorder.test.js    Node test suite
```

## Current data boundary

Confirmed:
- POS provides units sold for each individual pastry item.

Still sample/missing:
- pastry-to-frozen-dough SKU mapping
- pieces per box
- box cost
- supplier case/minimum rules
- real freezer capacity
- real full/partial counts

## Optional next gate for the reorder proposal

This applies only if Matthew chooses to develop the reorder proposal and later asks to converge. It must not be used to redirect or minimize a new idea; see `../IDEA-LAB.md`.

For this proposal, do not build a broad Product Setup screen yet. First complete the one-SKU delivery-horizon contract in `../NEXT-DISCUSSION.md` and freeze the expected `Short / Lasts / Excess` behavior.

After that gate, the next bounded slice is to replace the sample seven-day rule with delivery-horizon logic, simplify the manager screen per `../CURRENT-DIRECTION.md`, and expand tests. Product Setup follows only when its fields are validated.

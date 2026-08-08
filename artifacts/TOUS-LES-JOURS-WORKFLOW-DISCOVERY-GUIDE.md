# Tous les Jours Store Workflow Discovery Guide

Purpose: understand the current production, freezer-inventory, POS, waste, and ordering workflow before defining the BakeryOps Assistant MVP.

Use this as an interview and observation guide. Do not ask for passwords, POS credentials, customer information, employee personal data, payment-card data, or confidential corporate access. Request redacted samples whenever possible.

## Suggested opening

> I am documenting the current bakery production and inventory workflow so I can design a small tool that supports the manager without slowing down the kitchen. Could you walk me through one normal weekday and one busy weekend day? I would like to understand the current process before suggesting any changes.

## Part 1 — Start with a real day

Ask the manager to walk through the process in time order:

1. What happens from opening until the first pastries are displayed?
2. When is tomorrow’s production/preparation list created?
3. Who creates, reviews, and approves that list?
4. What information is considered when quantities are changed?
5. How do the head baker and bakers receive the final list?
6. What happens when an item runs low or sells out during the day?
7. What happens at closing?
8. What information is carried into the next day?
9. How does this differ on Friday, Saturday, Sunday, holidays, or promotion days?

Follow-up method:
- Ask “Can you show me the current sheet or screen?”
- Ask “Who does that?”
- Ask “When does that happen?”
- Ask “What happens when the normal process fails?”

## Part 2 — Production and preparation planning

1. Which pastries arrive ready to bake?
2. Which pastries must be shaped or prepared the day before?
3. Is there a product list that identifies the preparation type?
4. What is the preparation lead time for each type?
5. How many items normally fit on each tray?
6. Which pastry uses the 15-item weekend tray exception?
7. Which products receive one unbaked reserve tray?
8. Who decides whether a product is eligible for a reserve tray?
9. Is the reserve tray included in the manager’s approved quantity or added by the head baker?
10. Can partially filled trays be prepared, or are quantities rounded?
11. What are the usual Monday–Thursday and Friday–Sunday quantities by product?
12. How often does the head baker need to change the practical tray arrangement?
13. How are same-day extra batches handled?
14. Is the number of extra batches recorded anywhere?
15. What production constraints matter: oven space, proofing time, labor, trays, racks/carts, or freezer space?

## Part 3 — Freezer inventory

Ask the manager to show the actual counting process.

1. What exactly is counted: boxes, cases, bags, pieces, trays, or all of these?
2. What does one box/case contain for each product?
3. How are partially opened boxes counted?
4. Are ready-to-bake and shape-required dough stored separately?
5. Does each product have a SKU, item code, label, or standard name?
6. Where is the current freezer count stored: paper, spreadsheet, POS, ordering portal, or memory?
7. Who counts the freezer inventory?
8. When and how often is it counted?
9. How long does a complete count take?
10. How are receiving, damaged stock, transfers, and corrections recorded?
11. Are lot numbers or expiration dates tracked?
12. Is FIFO (first in, first out) used?
13. How are multiple freezer locations handled?
14. What causes the recorded count to disagree with the physical count?
15. Which frozen products most often run low or become overstocked?
16. Is there a minimum level or safety stock for each product?
17. How much freezer capacity is actually available?

## Part 4 — POS and sales information

Do not request login credentials. Ask what exports and reports are available.

1. What POS system and report are currently used?
2. Can it show item-level sales by pastry?
3. Can sales be viewed by date and time of day?
4. Can a report be exported as CSV or Excel?
5. Does each pastry have a stable POS item name or product ID?
6. How are packaged items, discounts, promotions, refunds, voids, and complimentary items represented?
7. Can the POS distinguish products that sold out from products with low demand?
8. Does the POS record when an item became unavailable?
9. Are extra batches visible anywhere in POS data?
10. Who is allowed to export reports?
11. Could the project use a redacted sample export with a few products and dates?
12. Are there company rules restricting use of exported data?

## Part 5 — Leftovers, waste, and sellouts

1. Is end-of-day leftover quantity recorded by pastry?
2. Who counts it and when?
3. Where is the count stored?
4. What happens to leftovers: waste, donation, employee use, discounting, or next-day sale?
5. Are damaged and expired items recorded separately?
6. Are sellouts recorded, or only communicated verbally?
7. Is the approximate sellout time known?
8. Which pastries are most often wasted?
9. Which pastries most often sell out?
10. Does the manager currently compare production, sales, and leftovers?

## Part 6 — Ordering and receiving

1. Who places frozen-dough and supply orders?
2. On which days are orders placed and delivered?
3. What are the normal supplier lead times?
4. Are there minimum order quantities or full-case requirements?
5. What are the case sizes for each product?
6. Are orders placed through a supplier portal, email, phone, or franchise system?
7. How does the manager decide the order quantity today?
8. Is there a reorder point or safety-stock rule?
9. What happens when an item is unavailable from the supplier?
10. How are received quantities checked against the order?
11. How are damaged, missing, or substituted deliveries recorded?
12. Which ordering activity takes the most time or causes the most mistakes?

## Part 7 — Roles, communication, and constraints

1. What decisions belong only to the manager?
2. What operational discretion does the head baker have?
3. What information do bakers need on the final sheet?
4. What communication between the food runner and bakers already works well?
5. What communication regularly fails or is forgotten?
6. Where is the paper production sheet placed?
7. When is it finalized and printed?
8. How are changes made after printing?
9. How are old versions removed so bakers do not use the wrong sheet?
10. What devices and internet access are available to the manager?
11. Are phones/tablets allowed in food-production areas?
12. What happens if the internet, printer, or manager computer is unavailable?
13. Are there franchise/company approvals required before using store data or a new tool?

## Part 8 — Success criteria

1. What is the single biggest production or inventory problem today?
2. Which task takes the manager the most time?
3. What mistake creates the most waste or disruption?
4. What result would make this project useful after one month?
5. Which matters most: less waste, fewer sellouts, faster planning, faster ordering, or more accurate freezer inventory?
6. How would the manager measure improvement?
7. What should the website never automate or change without approval?

## Redacted examples to request

Ask permission for copies or photos with confidential information removed:

- One normal weekday production/preparation sheet
- One busy weekend production/preparation sheet
- Current freezer-inventory checklist
- Product/SKU list with box or case sizes
- Redacted POS item-sales export or report
- Waste/leftover sheet, if one exists
- Supplier order form or blank ordering template
- Delivery schedule and lead-time notes
- Example of a changed/reprinted production sheet

## Recommended interview order

### First conversation — highest priority
1. Walk through one weekday and one weekend day.
2. Review the production sheet.
3. Review the freezer count process.
4. Determine whether item-level POS data can be exported.
5. Identify who owns each decision.

### Second conversation — after reviewing samples
1. Clarify product units, tray/box exceptions, and reserve rules.
2. Review waste, sellout, ordering, and receiving.
3. Confirm the smallest useful manager-facing MVP.
4. Agree on which sample data may be used for a prototype.

## After the interview

For every finding, label it as one of:
- **Confirmed:** observed or shown in a current artifact.
- **Reported:** explained verbally but not yet observed.
- **Assumption:** still needs verification.
- **Out of scope:** not needed for the first MVP.

Do not design around an assumption as if it were confirmed.

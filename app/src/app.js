import {
  calculateRestockNeed,
  calculateSupplierWaste,
  calculateZoneCapacity,
  groupActionsByUrgency,
} from "./dashboard.js";
import {
  freezerZones,
  productionPlan,
  products,
  wasteRecords,
} from "./sample-data.js";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const viewCopy = {
  overview: ["Operations overview", "Handle the most urgent exception, then move to what is next."],
  waste: ["Waste review", "Translate finished-pastry leftovers into supplier cost and an explainable next-Tuesday plan."],
  production: ["Production plan", "Review the entire sheet or adjust one pastry while protecting availability."],
  restock: ["Freezer count & supplier restock", "Confirm physical stock, review shortage risk, and check assigned freezer zones."],
};

const state = {
  activeView: "overview",
  expanded: { "review-today": false, "plan-next": false },
  selectedWasteProductId: wasteRecords[0].id,
  productionStatus: "draft",
  restockStatus: "draft",
  countConfirmed: false,
  dialogMode: null,
  counts: Object.fromEntries(
    products.map((product) => [
      product.id,
      { fullBoxes: product.fullBoxes, partialPieces: product.partialPieces },
    ]),
  ),
  productionQuantities: Object.fromEntries(
    productionPlan.map((row) => [row.id, row.suggestedQuantity]),
  ),
  restockOrders: {},
};

function getRestockRows() {
  return products.map((product) => {
    const count = state.counts[product.id];
    const onHandPieces = count.fullBoxes * product.piecesPerBox + count.partialPieces;
    const recommendation = calculateRestockNeed({
      onHandPieces,
      expectedUsageUntilNextOrder: product.expectedUsageUntilNextOrder,
      piecesPerBox: product.piecesPerBox,
      minimumOrderBoxes: product.minimumOrderBoxes,
    });
    return {
      ...product,
      ...count,
      ...recommendation,
      onHandPieces,
      managerOrderBoxes:
        state.restockOrders[product.id] ?? recommendation.suggestedBoxes,
    };
  });
}

function initializeRestockOrders() {
  getRestockRows().forEach((row) => {
    state.restockOrders[row.id] = row.suggestedBoxes;
  });
}
initializeRestockOrders();

function getZoneRows() {
  const incomingByZone = getRestockRows().reduce((totals, row) => {
    totals[row.zoneId] = (totals[row.zoneId] || 0) + row.managerOrderBoxes;
    return totals;
  }, {});

  return freezerZones.map((zone) => ({
    ...zone,
    incomingUnits: incomingByZone[zone.id] || 0,
    ...calculateZoneCapacity({
      currentUnits: zone.currentUnits,
      incomingUnits: incomingByZone[zone.id] || 0,
      practicalCapacity: zone.practicalCapacity,
      hardCapacity: zone.hardCapacity,
    }),
  }));
}

function buildActions() {
  const waste = calculateSupplierWaste(wasteRecords);
  const restockRows = getRestockRows();
  const atRisk = restockRows.filter((row) => row.atRisk);
  const limitedZones = getZoneRows().filter((zone) => zone.status === "limited");
  const blockedZones = getZoneRows().filter((zone) => zone.status === "blocked");
  const productionChanges = productionPlan.filter(
    (row) => state.productionQuantities[row.id] !== row.currentQuantity,
  );

  const actions = [];
  if (!state.countConfirmed) {
    actions.push({
      id: "count-required",
      urgency: "act-now",
      tone: "danger",
      icon: "!",
      title: "Supplier review is waiting on the freezer count",
      detail: "Confirm full and partial boxes before any restock recommendation is treated as current.",
      meta: ["Sample order review · due today", "Count status · not confirmed"],
      button: "Start freezer count",
      view: "restock",
    });
  }
  blockedZones.forEach((zone) => {
    actions.push({
      id: `blocked-${zone.id}`,
      urgency: "act-now",
      tone: "danger",
      icon: "!",
      title: `${zone.name} exceeds its hard limit`,
      detail: "The current draft cannot fit inside the assigned freezer section.",
      meta: [`Projected ${zone.projectedUnits} of ${zone.hardCapacity} units`, "Sample zone limits"],
      button: "Adjust draft",
      view: "restock",
    });
  });
  if (state.countConfirmed && atRisk.length) {
    actions.push({
      id: "shortage-risk",
      urgency: "review-today",
      tone: "warning",
      icon: atRisk.length,
      title: `${atRisk.length} products may run short before the next ordering opportunity`,
      detail: atRisk.map((row) => row.pastryName).join(" and "),
      meta: ["Based on confirmed sample count", "Manager approval required"],
      button: "Review supplier restock",
      view: "restock",
    });
  }
  if (state.countConfirmed && limitedZones.length) {
    actions.push({
      id: "zone-review",
      urgency: "review-today",
      tone: "warning",
      icon: limitedZones.length,
      title: `${limitedZones.length} freezer zones use their extra legroom`,
      detail: limitedZones.map((zone) => zone.name).join(" and "),
      meta: ["Within hard limits", "Manager confirmation needed"],
      button: "Review capacity",
      view: "restock",
    });
  }
  actions.push({
    id: "waste-review",
    urgency: "plan-next",
    tone: "info",
    icon: "$",
    title: `${currency.format(waste.totalSupplierWasteCost)} supplier waste cost needs review`,
    detail: `${waste.affectedProducts[0].pastryName} is the largest sample contributor.`,
    meta: ["Comparable Tuesday", "Evidence, not a confirmed cause"],
    button: "Review waste",
    view: "waste",
  });
  actions.push({
    id: "production-review",
    urgency: "plan-next",
    tone: "info",
    icon: productionChanges.length,
    title: `${productionChanges.length} next-Tuesday quantities have proposed changes`,
    detail: "Review availability guardrails before approving the entire production sheet.",
    meta: ["Internal sample plan", "No production record changed"],
    button: "Open production plan",
    view: "production",
  });
  return actions;
}

function renderOverview() {
  const grouped = groupActionsByUrgency(buildActions());
  const labels = {
    "act-now": ["Act now", "Immediate operational blocks"],
    "review-today": ["Review today", "Important decisions before close"],
    "plan-next": ["Plan next", "Prepare the next comparable day"],
  };

  document.querySelector("#action-queue").innerHTML = Object.entries(grouped)
    .map(([urgency, actions]) => {
      const alwaysExpanded = urgency === "act-now";
      const expanded = alwaysExpanded || state.expanded[urgency];
      const [title, subtitle] = labels[urgency];
      const emptyCopy = urgency === "act-now" ? "No immediate operational blocks." : "No items in this group.";
      const list = actions.length
        ? actions.map(renderActionItem).join("")
        : `<div class="compact-preview"><div><b>All clear</b><p>${emptyCopy}</p></div></div>`;
      const compact = actions.length
        ? `<div class="compact-preview"><div><b>${actions.length} item${actions.length === 1 ? "" : "s"}</b><p>Next: ${actions[0].title}</p></div><button class="secondary expand-group" data-urgency="${urgency}">Expand</button></div>`
        : list;
      return `<section class="urgency-group ${urgency}">
        <header class="urgency-header"><div class="urgency-title"><b>${title}</b><span>${subtitle}</span></div>${!alwaysExpanded && expanded ? `<button class="text-button collapse-group" data-urgency="${urgency}">Collapse</button>` : ""}</header>
        ${expanded ? `<div class="queue-list">${list}</div>` : compact}
      </section>`;
    })
    .join("");
}

function renderActionItem(action) {
  return `<article class="action-item">
    <span class="action-icon ${action.tone}">${action.icon}</span>
    <div class="action-copy"><b>${action.title}</b><p>${action.detail}</p><div class="action-meta">${action.meta.map((item) => `<span>${item}</span>`).join("")}</div></div>
    <button class="action-button" data-go-view="${action.view}">${action.button}</button>
  </article>`;
}

function trendSvg(values, label) {
  const width = 390;
  const height = 178;
  const xs = [42, 142, 242, 342];
  const maximum = Math.max(...values, 1);
  const y = (value) => 132 - (value / maximum) * 92;
  const points = values.map((value, index) => `${xs[index]},${y(value)}`).join(" ");
  const labels = values.map((value, index) => `<circle class="point" cx="${xs[index]}" cy="${y(value)}" r="5"></circle><text class="value" x="${xs[index]}" y="${y(value) - 12}" text-anchor="middle">${value}</text><text x="${xs[index]}" y="158" text-anchor="middle">Tue ${index + 1}</text>`).join("");
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}"><line class="grid" x1="28" y1="40" x2="360" y2="40"></line><line class="grid" x1="28" y1="86" x2="360" y2="86"></line><line class="grid" x1="28" y1="132" x2="360" y2="132"></line><polyline class="line" points="${points}"></polyline>${labels}</svg>`;
}

function renderWaste() {
  const waste = calculateSupplierWaste(wasteRecords);
  const selected = waste.affectedProducts.find((row) => row.id === state.selectedWasteProductId) || waste.affectedProducts[0];
  const totalSelloutProducts = wasteRecords.filter((row) => row.soldOutComparableDays > 0).length;
  const comparableCosts = [0, 1, 2, 3].map((index) => wasteRecords.reduce((sum, row) => sum + row.comparableWaste[index] * row.supplierCostPerUnit, 0));
  const baseline = comparableCosts.slice(0, 3).reduce((sum, value) => sum + value, 0) / 3;
  const change = baseline ? Math.round(((comparableCosts[3] - baseline) / baseline) * 100) : 0;

  document.querySelector("#waste-total").textContent = currency.format(waste.totalSupplierWasteCost);
  document.querySelector("#waste-compare").textContent = `${change >= 0 ? "+" : ""}${change}% vs prior three sample Tuesdays`;
  document.querySelector("#waste-product-count").textContent = waste.affectedProducts.length;
  document.querySelector("#waste-availability").textContent = `${totalSelloutProducts} review`;
  document.querySelector("#waste-table-body").innerHTML = waste.affectedProducts.map((row) => {
    const source = wasteRecords.find((item) => item.id === row.id);
    const changeUnits = source.suggestedProduction - source.currentProduction;
    const guardrail = source.soldOutComparableDays ? `${source.soldOutComparableDays} sellout${source.soldOutComparableDays === 1 ? "" : "s"}` : "Low risk";
    return `<tr class="selectable ${row.id === selected.id ? "selected" : ""}" data-waste-id="${row.id}"><td class="product-cell"><b>${row.pastryName}</b><small>Sample Tuesday</small></td><td class="number">${row.leftoverUnits}</td><td class="number"><b>${currency.format(row.supplierWasteCost)}</b></td><td class="number">${changeUnits === 0 ? "Hold" : `${changeUnits > 0 ? "+" : ""}${changeUnits} units`}</td><td><span class="badge ${source.soldOutComparableDays ? "review" : "low"}">${guardrail}</span></td></tr>`;
  }).join("");

  document.querySelector("#waste-evidence-title").textContent = `${selected.pastryName} · evidence considered`;
  document.querySelector("#waste-trend").innerHTML = trendSvg(selected.comparableWaste, `Comparable Tuesday leftovers for ${selected.pastryName}`);
  document.querySelector("#waste-evidence").innerHTML = `${selected.evidence.map((item, index) => `<div class="evidence-row"><i>${index + 1}</i><span>${item}</span></div>`).join("")}<div class="recommendation-box"><b>Proposed next-Tuesday change</b><span>${selected.suggestedProduction === selected.currentProduction ? `Hold at ${selected.currentProduction} units` : `Change from ${selected.currentProduction} to ${selected.suggestedProduction} units`}. Manager approval required.</span></div>`;
}

function getProductionRows() {
  return productionPlan.map((row) => ({
    ...row,
    managerQuantity: state.productionQuantities[row.id],
  }));
}

function renderProductionSummary() {
  const rows = getProductionRows();
  const changed = rows.filter((row) => row.managerQuantity !== row.currentQuantity);
  const review = rows.filter((row) => row.availability === "Review");
  const unitChange = rows.reduce((sum, row) => sum + row.managerQuantity - row.currentQuantity, 0);
  document.querySelector("#production-change-count").textContent = changed.length;
  document.querySelector("#production-review-count").textContent = review.length;
  document.querySelector("#production-unit-change").textContent = `${unitChange > 0 ? "+" : ""}${unitChange} units`;
  const status = document.querySelector("#production-status");
  status.textContent = state.productionStatus === "final" ? "Internally approved" : "Internal draft";
  status.className = `status-chip ${state.productionStatus}`;
}

function renderProduction() {
  const rows = getProductionRows();
  renderProductionSummary();
  document.querySelector("#production-table-body").innerHTML = rows.map((row) => `<tr><td class="product-cell"><b>${row.pastryName}</b><small>Sample next Tuesday</small></td><td class="number">${row.currentQuantity}</td><td class="number">${row.suggestedQuantity}</td><td><input class="qty-input production-input" type="number" min="0" step="1" value="${row.managerQuantity}" data-product-id="${row.id}" aria-label="Manager production quantity for ${row.pastryName}"></td><td><span class="badge ${row.availability === "Review" ? "review" : "low"}">${row.availability}</span></td><td>${row.evidence}</td></tr>`).join("");
}

function renderCountTable() {
  document.querySelector("#count-table-body").innerHTML = products.map((product) => {
    const count = state.counts[product.id];
    const zone = freezerZones.find((item) => item.id === product.zoneId);
    return `<tr><td class="product-cell"><b>${product.name}</b><small>${product.pastryName}</small></td><td>${zone.name}</td><td><input class="qty-input count-input" type="number" min="0" step="1" value="${count.fullBoxes}" data-product-id="${product.id}" data-field="fullBoxes" aria-label="Full boxes of ${product.name}"></td><td><input class="qty-input count-input" type="number" min="0" step="1" value="${count.partialPieces}" data-product-id="${product.id}" data-field="partialPieces" aria-label="Partial pieces of ${product.name}"></td><td class="number">${product.piecesPerBox}</td></tr>`;
  }).join("");
}

function renderRestock({ renderTable = true } = {}) {
  const rows = getRestockRows();
  const zones = getZoneRows();
  const atRisk = rows.filter((row) => row.atRisk);
  const totalBoxes = rows.reduce((sum, row) => sum + row.managerOrderBoxes, 0);
  const totalCost = rows.reduce((sum, row) => sum + row.managerOrderBoxes * row.costPerBox, 0);
  const zonesForReview = zones.filter((zone) => zone.status !== "comfortable");
  const blockedZones = zones.filter((zone) => zone.status === "blocked");

  const status = document.querySelector("#restock-status");
  status.textContent = !state.countConfirmed ? "Waiting for freezer count" : state.restockStatus === "final" ? "Internal draft approved" : "Count confirmed · draft open";
  status.className = `status-chip ${!state.countConfirmed ? "waiting" : state.restockStatus}`;
  const freshness = document.querySelector("#count-freshness");
  freshness.textContent = state.countConfirmed ? "Confirmed now · sample" : "Not confirmed";
  freshness.className = `source-chip ${state.countConfirmed ? "" : "warning"}`;
  document.querySelector("#shortage-count").textContent = state.countConfirmed ? atRisk.length : "Waiting";
  document.querySelector("#shortage-context").textContent = state.countConfirmed ? "Before next sample ordering opportunity" : "Confirm the freezer count";
  document.querySelector("#restock-box-count").textContent = state.countConfirmed ? `${totalBoxes} boxes` : "—";
  document.querySelector("#restock-cost").textContent = state.countConfirmed ? `${currency.format(totalCost)} sample draft` : "Internal sample draft";
  document.querySelector("#zone-review-count").textContent = state.countConfirmed ? zonesForReview.length : "—";

  if (renderTable) {
    document.querySelector("#restock-table-body").innerHTML = rows.map((row) => `<tr><td class="product-cell"><b>${row.name}</b><small>${row.pastryName}</small></td><td class="number">${row.onHandPieces}</td><td class="number">${row.expectedUsageUntilNextOrder}</td><td><span class="badge ${!state.countConfirmed ? "review" : row.atRisk ? "risk" : "low"}">${!state.countConfirmed ? "Waiting" : row.atRisk ? `${row.shortagePieces} short` : "Covered"}</span></td><td class="number">${state.countConfirmed ? `${row.suggestedBoxes} boxes` : "—"}</td><td><input class="qty-input restock-input" type="number" min="0" step="1" value="${row.managerOrderBoxes}" data-product-id="${row.id}" aria-label="Manager supplier boxes for ${row.name}" ${state.countConfirmed ? "" : "disabled"}></td><td>${!state.countConfirmed ? "Confirm physical count first." : row.atRisk ? `Expected usage is above counted stock; review ${row.suggestedBoxes} suggested box${row.suggestedBoxes === 1 ? "" : "es"}.` : "Counted stock covers expected sample usage; skip this order."}</td></tr>`).join("");
  }

  document.querySelector("#zone-list").innerHTML = zones.map((zone) => {
    const width = Math.min(100, Math.round((zone.projectedUnits / zone.hardCapacity) * 100));
    const detail = zone.status === "comfortable" ? "Within practical capacity" : zone.status === "limited" ? "Using extra legroom" : "Exceeds hard boundary";
    return `<div class="zone-row ${zone.status}"><div class="zone-top"><div><b>${zone.name}</b><p>${zone.contents}</p></div><span class="badge ${zone.status}">${zone.status}</span></div><div class="zone-bar"><span style="width:${width}%"></span></div><div class="zone-foot"><span>${zone.currentUnits} current + ${zone.incomingUnits} incoming</span><span>${detail} · hard max ${zone.hardCapacity}</span></div></div>`;
  }).join("");

  document.querySelector("#approve-restock").disabled = !state.countConfirmed || blockedZones.length > 0;
  const steps = document.querySelectorAll(".workflow-steps span");
  steps.forEach((step, index) => step.classList.toggle("active", index === 0 ? !state.countConfirmed : index === 1 ? state.countConfirmed && state.restockStatus !== "final" : state.restockStatus === "final"));
}

function switchView(view) {
  state.activeView = view;
  document.querySelectorAll("[data-view-content]").forEach((section) => section.classList.toggle("active", section.dataset.viewContent === view));
  document.querySelectorAll(".nav-button").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  const [title, subtitle] = viewCopy[view];
  document.querySelector("#page-title").textContent = title;
  document.querySelector("#page-subtitle").textContent = subtitle;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setCountPending() {
  state.countConfirmed = false;
  state.restockStatus = "draft";
  renderRestock();
  renderOverview();
}

function confirmCount() {
  state.countConfirmed = true;
  state.restockStatus = "draft";
  getRestockRows().forEach((row) => {
    state.restockOrders[row.id] = row.suggestedBoxes;
  });
  renderRestock();
  renderOverview();
  showToast("Physical freezer count confirmed. Sample restock recommendations refreshed.");
}

function openApproval(mode) {
  state.dialogMode = mode;
  const title = document.querySelector("#dialog-title");
  const copy = document.querySelector("#dialog-copy");
  const summary = document.querySelector("#dialog-summary");
  if (mode === "production") {
    const rows = productionPlan.map((row) => ({ ...row, quantity: state.productionQuantities[row.id] }));
    title.textContent = "Approve production plan";
    copy.textContent = "This marks the sample plan internally approved. It does not change a baker sheet or production record.";
    summary.innerHTML = `<b>${rows.length} pastries reviewed</b><br>${rows.filter((row) => row.quantity !== row.currentQuantity).length} quantities differ from the current sample sheet.`;
  } else {
    const rows = getRestockRows();
    const totalBoxes = rows.reduce((sum, row) => sum + row.managerOrderBoxes, 0);
    title.textContent = "Approve supplier-restock draft";
    copy.textContent = "This marks an internal worksheet approved. It does not contact or submit anything to a supplier.";
    summary.innerHTML = `<b>${totalBoxes} sample boxes in the draft</b><br>${rows.filter((row) => row.managerOrderBoxes > 0).map((row) => `${row.name}: ${row.managerOrderBoxes}`).join("<br>") || "No products selected."}`;
  }
  document.querySelector("#confirm-dialog").showModal();
}

function confirmApproval(event) {
  event.preventDefault();
  const initials = document.querySelector("#manager-initials").value.trim() || "Manager";
  document.querySelector("#confirm-dialog").close();
  if (state.dialogMode === "production") {
    state.productionStatus = "final";
    renderProduction();
    showToast(`Production plan internally approved by ${initials}. No production record changed.`);
  } else {
    state.restockStatus = "final";
    renderRestock();
    showToast(`Restock worksheet internally approved by ${initials}. No supplier order was sent.`);
  }
  renderOverview();
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-view]");
    const go = event.target.closest("[data-go-view]");
    const expand = event.target.closest(".expand-group");
    const collapse = event.target.closest(".collapse-group");
    const wasteRow = event.target.closest("[data-waste-id]");
    if (nav) switchView(nav.dataset.view);
    if (go) switchView(go.dataset.goView);
    if (expand) { state.expanded[expand.dataset.urgency] = true; renderOverview(); }
    if (collapse) { state.expanded[collapse.dataset.urgency] = false; renderOverview(); }
    if (wasteRow) { state.selectedWasteProductId = wasteRow.dataset.wasteId; renderWaste(); }
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches(".production-input")) {
      state.productionQuantities[event.target.dataset.productId] = Math.max(0, Number(event.target.value) || 0);
      state.productionStatus = "draft";
      renderProductionSummary();
      renderOverview();
    }
    if (event.target.matches(".count-input")) {
      state.counts[event.target.dataset.productId][event.target.dataset.field] = Math.max(0, Number(event.target.value) || 0);
      setCountPending();
    }
    if (event.target.matches(".restock-input")) {
      state.restockOrders[event.target.dataset.productId] = Math.max(0, Number(event.target.value) || 0);
      state.restockStatus = "draft";
      renderRestock({ renderTable: false });
      renderOverview();
    }
  });

  document.querySelector("#confirm-count").addEventListener("click", confirmCount);
  document.querySelector("#approve-production").addEventListener("click", () => openApproval("production"));
  document.querySelector("#approve-restock").addEventListener("click", () => openApproval("restock"));
  document.querySelector("#confirm-dialog-action").addEventListener("click", confirmApproval);
  document.querySelector("#edit-zones").addEventListener("click", () => showToast("Sample zone limits are manager-owned setup values. No real freezer settings were changed."));
}

renderOverview();
renderWaste();
renderProduction();
renderCountTable();
renderRestock();
bindEvents();

import {
  calculatePreArrivalStatus,
  calculatePostArrivalSuggestion,
  calculateProjectedEndStock,
  calculateAggregatedDoughDemand,
  sumDoughDemandAcrossDates,
  calculateCountFreshness,
  enumerateDatesBetweenExclusive,
  enumerateDatesInclusive,
  classifyDayType,
  calculateCapacityStatus,
  estimateCapacityFromCurrentCount,
} from "/lib/next-order-list.js";
import { calculateWasteFlag } from "/lib/waste-review.js";
import {
  calculateProductionSuggestion,
  needsReview,
  resolveManagerDecision,
  canFinalizeProductionPlan,
  calculateReserveCarryoverImpact,
  shouldAppearInReserveCheck,
} from "/lib/tomorrows-production.js";
import { TOMORROWS_PRODUCTION_ITEMS } from "/productionData.js";

// The one currently-validated redacted SKU contract
// (data/redacted-sku-contracts/croissant-dough.md). Box size is explicitly
// unverified and supplier minimum/cost are explicitly unknown - all stay
// visible in the UI rather than being treated as confirmed.
const CROISSANT_DOUGH = {
  skuKey: "croissant-dough",
  displayName: "Croissant dough",
  piecesPerBox: 192,
  supplierMinimumBoxes: undefined,
  costPerBox: undefined,
  pastriesByDayType: {
    "mon-thu": [
      { pastryKey: "croissant", plannedQuantity: 12, doughPiecesPerPastry: 1 },
      { pastryKey: "strawberry-croissant", plannedQuantity: 24, doughPiecesPerPastry: 1 },
      { pastryKey: "crookie", plannedQuantity: 12, doughPiecesPerPastry: 1 },
      { pastryKey: "almond-croissant", plannedQuantity: 12, doughPiecesPerPastry: 1 },
      { pastryKey: "chocolate-croissant", plannedQuantity: 12, doughPiecesPerPastry: 1 },
      { pastryKey: "garlic-cheese-croissant", plannedQuantity: 12, doughPiecesPerPastry: 1 },
    ],
    "fri-sun": [
      { pastryKey: "croissant", plannedQuantity: 24, doughPiecesPerPastry: 1 },
      { pastryKey: "strawberry-croissant", plannedQuantity: 36, doughPiecesPerPastry: 1 },
      { pastryKey: "crookie", plannedQuantity: 24, doughPiecesPerPastry: 1 },
      { pastryKey: "almond-croissant", plannedQuantity: 24, doughPiecesPerPastry: 1 },
      { pastryKey: "chocolate-croissant", plannedQuantity: 24, doughPiecesPerPastry: 1 },
      { pastryKey: "garlic-cheese-croissant", plannedQuantity: 24, doughPiecesPerPastry: 1 },
    ],
  },
};

// ---------- tiny inline icon set (no external icon font/CDN) ----------

const icon = {
  overview: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 11l9-7 9 7"/><path d="M5 10v9h14v-9"/></svg>`,
  waste: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/></svg>`,
  production: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>`,
  restock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 8l-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>`,
  back: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>`,
  mic: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v4"/></svg>`,
  camera: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13.5" r="3.3"/></svg>`,
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function demandForDate(dateIso) {
  return calculateAggregatedDoughDemand({
    pastries: CROISSANT_DOUGH.pastriesByDayType[classifyDayType(dateIso)],
  });
}

// Turns the raw draft.data into everything the UI needs to render: status
// badges, the suggestion, and what (if anything) is blocking finalization.
function computeRow(data) {
  const hasCount =
    data.countFullBoxes !== undefined &&
    data.countPartialPieces !== undefined &&
    data.countDate;

  if (!hasCount) {
    return { status: "count-needed", blockers: ["Physical count needed"] };
  }

  const onHandPieces = data.countFullBoxes * CROISSANT_DOUGH.piecesPerBox + data.countPartialPieces;
  const freshness = calculateCountFreshness({
    countDate: data.countDate,
    referenceDate: todayIso(),
    onHandPieces,
    piecesPerBox: CROISSANT_DOUGH.piecesPerBox,
  });

  if (!data.shipmentDate || !data.planStockThroughDate) {
    return {
      status: "dates-needed",
      onHandPieces,
      freshness,
      blockers: ["Shipment-available date and plan-stock-through date needed"],
    };
  }

  const preArrivalDates = enumerateDatesBetweenExclusive(data.countDate, data.shipmentDate);
  const preArrivalTotal = sumDoughDemandAcrossDates({
    dailyResults: preArrivalDates.map(demandForDate),
  });
  if (preArrivalTotal.status !== "ok") {
    return { status: preArrivalTotal.status, onHandPieces, freshness, blockers: [preArrivalTotal.status] };
  }

  const preArrival = calculatePreArrivalStatus({
    onHandPieces,
    preArrivalUsagePieces: preArrivalTotal.totalDoughPieces,
  });

  const postArrivalDates = enumerateDatesInclusive(data.shipmentDate, data.planStockThroughDate);
  const postArrivalTotal = sumDoughDemandAcrossDates({
    dailyResults: postArrivalDates.map(demandForDate),
  });
  if (postArrivalTotal.status !== "ok") {
    return { status: postArrivalTotal.status, onHandPieces, freshness, preArrival, blockers: [postArrivalTotal.status] };
  }

  const suggestion = calculatePostArrivalSuggestion({
    projectedStockAtArrival: preArrival.projectedStockAtArrival,
    postArrivalUsagePieces: postArrivalTotal.totalDoughPieces,
    piecesPerBox: CROISSANT_DOUGH.piecesPerBox,
    supplierMinimumBoxes: CROISSANT_DOUGH.supplierMinimumBoxes,
  });

  const managerBoxes = data.managerBoxes ?? suggestion.suggestedBoxes;
  const projectedEndStock = calculateProjectedEndStock({
    projectedStockAtArrival: preArrival.projectedStockAtArrival,
    managerBoxes,
    piecesPerBox: CROISSANT_DOUGH.piecesPerBox,
    postArrivalUsagePieces: postArrivalTotal.totalDoughPieces,
  });

  const blockers = [];
  if (freshness.needsRecount) blockers.push(...freshness.reasons);

  // Placeholder capacity estimate (see estimateCapacityFromCurrentCount) -
  // a one-time snapshot from today's observed count, not a real measured
  // freezer-zone size. Deliberately not recalculated from any growing
  // total, or it would just chase whatever is on order.
  const capacityEstimate = estimateCapacityFromCurrentCount({
    fullBoxes: data.countFullBoxes,
    partialPieces: data.countPartialPieces,
  });
  const capacity = calculateCapacityStatus({
    currentUnits: capacityEstimate.practicalCapacityBoxes,
    incomingUnits: managerBoxes,
    practicalCapacity: capacityEstimate.practicalCapacityBoxes,
    hardCapacity: capacityEstimate.hardCapacityBoxes,
  });

  return {
    status: "ready",
    onHandPieces,
    freshness,
    preArrival,
    preArrivalUsagePieces: preArrivalTotal.totalDoughPieces,
    postArrivalUsagePieces: postArrivalTotal.totalDoughPieces,
    suggestion,
    managerBoxes,
    projectedEndStock,
    capacityEstimate,
    capacity,
    blockers,
  };
}

// Builds the full per-item picture for Tomorrow's Production: the
// suggestion, whether it needs review, the manager's recorded decision (if
// any), and - for reserve-eligible items - the carryover impact.
function computeProductionRows(data) {
  const decisions = data.decisions ?? {};
  const reserveEntries = data.reserveEntries ?? {};

  return TOMORROWS_PRODUCTION_ITEMS.map((item) => {
    const suggestion = calculateProductionSuggestion({
      currentQuantity: item.currentQuantity,
      comparableDays: item.comparableDays,
    });
    const flagged = needsReview(suggestion);
    const reviewAction = decisions[item.itemKey] ?? null;
    const finalQuantity = reviewAction ? reviewAction.finalQuantity : flagged ? null : item.currentQuantity;

    let reserve = null;
    if (item.hasReserve && shouldAppearInReserveCheck({ todaysExtraBatchQuantity: item.reserveExtraQuantity })) {
      const confirmedCarryover = reserveEntries[item.itemKey] ?? 0;
      reserve = calculateReserveCarryoverImpact({
        suggestedTotal: finalQuantity ?? item.currentQuantity,
        confirmedCarryover,
      });
    }

    return { item, suggestion, flagged, reviewAction, finalQuantity, reserve };
  });
}

// Waste Pattern Review is a read-only diagnostic view over the same shared
// product/comparable-day data - no draft, no persistence, no finalize
// action, per the frozen design decision.
function computeWasteRows() {
  return TOMORROWS_PRODUCTION_ITEMS.map((item) => ({
    item,
    waste: calculateWasteFlag({
      producedQuantity: item.currentQuantity,
      comparableDays: item.comparableDays,
    }),
  }));
}

const state = {
  view: "overview",
  workspaceTab: "current",
  currentSubview: "list",
  editingCount: false,
  finalizeDialogOpen: false,
  showWhy: false,
  saveState: "idle", // idle | saving | saved
  draft: null,
  history: [],

  productionWorkspaceTab: "current",
  productionSelectedItemKey: TOMORROWS_PRODUCTION_ITEMS[0].itemKey,
  productionFinalizeDialogOpen: false,
  productionSaveState: "idle",
  productionDraft: null,
  productionHistory: [],

  wasteSelectedItemKey: TOMORROWS_PRODUCTION_ITEMS[0].itemKey,

  sidebarCollapsed: localStorage.getItem("sidebarCollapsed") === "true",
};

async function loadActiveDraft() {
  state.draft = await fetch("/draft").then((r) => r.json());
}

async function loadHistory() {
  state.history = await fetch("/history").then((r) => r.json());
}

async function saveDraft(patch) {
  state.saveState = "saving";
  render();
  const nextData = { ...state.draft.data, ...patch };
  state.draft = await fetch("/draft", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(nextData),
  }).then((r) => r.json());
  state.saveState = "saved";
  render();
}

async function finalizeDraft(managerInitials) {
  await fetch(`/draft/${state.draft.id}/finalize`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ managerInitials }),
  });
  state.finalizeDialogOpen = false;
  await loadActiveDraft();
  state.workspaceTab = "history";
  await loadHistory();
  render();
}

async function loadActiveProductionDraft() {
  state.productionDraft = await fetch("/production/draft").then((r) => r.json());
}

async function loadProductionHistory() {
  state.productionHistory = await fetch("/production/history").then((r) => r.json());
}

async function saveProductionDraft(patch) {
  state.productionSaveState = "saving";
  render();
  const nextData = {
    ...state.productionDraft.data,
    ...patch,
    decisions: { ...state.productionDraft.data.decisions, ...(patch.decisions ?? {}) },
    reserveEntries: { ...state.productionDraft.data.reserveEntries, ...(patch.reserveEntries ?? {}) },
  };
  state.productionDraft = await fetch("/production/draft", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(nextData),
  }).then((r) => r.json());
  state.productionSaveState = "saved";
  render();
}

// Removing a decision means deleting a key, which the merge-only
// saveProductionDraft can't do (it only adds/overwrites) - this replaces
// the whole decisions object instead.
async function clearProductionDecision(itemKey) {
  state.productionSaveState = "saving";
  render();
  const nextDecisions = { ...state.productionDraft.data.decisions };
  delete nextDecisions[itemKey];
  const nextData = { ...state.productionDraft.data, decisions: nextDecisions };
  state.productionDraft = await fetch("/production/draft", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(nextData),
  }).then((r) => r.json());
  state.productionSaveState = "saved";
  render();
}

async function finalizeProductionDraft(managerInitials) {
  await fetch(`/production/draft/${state.productionDraft.id}/finalize`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ managerInitials }),
  });
  state.productionFinalizeDialogOpen = false;
  await loadActiveProductionDraft();
  state.productionWorkspaceTab = "history";
  await loadProductionHistory();
  render();
}

function statusBadge(row) {
  if (row.status === "count-needed") return `<span class="badge muted">Count needed</span>`;
  if (row.status === "dates-needed") return `<span class="badge muted">Dates needed</span>`;
  if (row.status === "Mapping needed") return `<span class="badge danger">Mapping needed</span>`;
  if (row.status === "Information incomplete") return `<span class="badge danger">Information incomplete</span>`;
  if (row.freshness?.needsRecount) return `<span class="badge warning">Recount needed</span>`;
  if (row.preArrival?.status === "Short before delivery") return `<span class="badge danger">Short before delivery</span>`;
  if (row.preArrival?.status === "Lasts through delivery") return `<span class="badge ok">Lasts through delivery</span>`;
  return "";
}

function formatTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" });
}

// ---------- Sidebar ----------

function renderSidenav() {
  const items = [
    { id: "overview", label: "Overview", icon: icon.overview, enabled: true },
    { id: "restock", label: "Next Order List", icon: icon.restock, enabled: true },
    { id: "waste", label: "Waste review", icon: icon.waste, enabled: true, flag: icon.camera },
    { id: "production", label: "Production plan", icon: icon.production, enabled: true },
  ];

  document.querySelector("#sidenav").innerHTML = items
    .map((item) => {
      const active =
        (item.id === "overview" && state.view === "overview") ||
        (item.id === "restock" && state.view === "workspace") ||
        (item.id === "waste" && state.view === "waste") ||
        (item.id === "production" && state.view === "production");
      return `
        <button class="nav-item ${active ? "active" : ""} ${item.enabled ? "" : "disabled"}"
                data-nav="${item.id}" ${item.enabled ? "" : "disabled"}>
          ${item.icon}
          <span>${item.label}</span>
          ${item.enabled ? "" : `<span class="nav-badge">Soon</span>`}
          ${item.flag ? `<span class="nav-icon-flag" title="Leftover photo capture planned here">${item.flag}</span>` : ""}
        </button>
      `;
    })
    .join("");
}

// ---------- Overview ----------

function renderOverview() {
  const row = state.draft ? computeRow(state.draft.data) : { status: "count-needed" };
  const reviewedCount = row.status === "ready" ? 1 : 0;
  const totalCount = 1;
  const lastEdited = formatTime(state.draft?.updatedAt);

  const statusLabel =
    row.status === "count-needed"
      ? "Needs freezer count"
      : row.status === "ready"
        ? `${row.suggestion.suggestedBoxes} box${row.suggestion.suggestedBoxes === 1 ? "" : "es"} suggested`
        : "Needs remaining dates";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const productionRows = state.productionDraft ? computeProductionRows(state.productionDraft.data) : [];
  const productionFlaggedCount = productionRows.filter((row) => row.flagged).length;
  const productionReviewedCount = productionRows.filter((row) => row.flagged && row.reviewAction).length;
  const productionLastEdited = formatTime(state.productionDraft?.updatedAt);
  const productionDetail = !state.productionDraft
    ? "Loading…"
    : productionFlaggedCount === 0
      ? "No products need review right now"
      : `${productionFlaggedCount} product${productionFlaggedCount === 1 ? "" : "s"} need review`;

  const wasteRows = computeWasteRows();
  const wasteFlaggedCount = wasteRows.filter((r) => r.waste.isUnusuallyHigh).length;
  const wasteDetail =
    wasteFlaggedCount === 0
      ? "No unusually high leftover patterns"
      : `${wasteFlaggedCount} pastr${wasteFlaggedCount === 1 ? "y" : "ies"} with unusually high leftovers`;

  return `
    <p class="eyebrow">Overview</p>
    <h1 class="page-title">${greeting}, Manager</h1>
    <p class="page-subtitle">Continue the most important work first.</p>

    <h2 class="section-title">Review today</h2>
    <button class="kpi-card" id="open-workspace">
      <div class="kpi-top">
        ${statusBadge(row) || `<span class="badge muted">Draft in progress</span>`}
      </div>
      <div class="kpi-title">Next Order List</div>
      <div class="kpi-detail">${statusLabel} · Croissant dough</div>
      <div class="progress-track"><div class="progress-fill" style="width:${(reviewedCount / totalCount) * 100}%"></div></div>
      <div class="kpi-meta">${reviewedCount} of ${totalCount} products reviewed${lastEdited ? ` · Last edited ${lastEdited}` : ""}</div>
    </button>

    <button class="kpi-card" id="open-production" style="margin-top:1rem">
      <div class="kpi-top">
        <span class="badge ${productionFlaggedCount > 0 ? "warning" : "ok"}">${productionFlaggedCount > 0 ? `${productionFlaggedCount} flagged` : "All clear"}</span>
      </div>
      <div class="kpi-title">Tomorrow's Production</div>
      <div class="kpi-detail">${productionDetail}</div>
      <div class="progress-track"><div class="progress-fill" style="width:${productionFlaggedCount ? (productionReviewedCount / productionFlaggedCount) * 100 : 100}%"></div></div>
      <div class="kpi-meta">${productionReviewedCount} of ${productionFlaggedCount} flagged products reviewed${productionLastEdited ? ` · Last edited ${productionLastEdited}` : ""}</div>
    </button>

    <button class="kpi-card" id="open-waste" style="margin-top:1rem">
      <div class="kpi-top">
        <span class="badge ${wasteFlaggedCount > 0 ? "warning" : "ok"}">${wasteFlaggedCount > 0 ? `${wasteFlaggedCount} flagged` : "All clear"}</span>
      </div>
      <div class="kpi-title">Waste Pattern Review</div>
      <div class="kpi-detail">${wasteDetail}</div>
      <div class="kpi-meta">Comparable-day leftover evidence · SIMULATED data</div>
    </button>
  `;
}

// ---------- Workspace ----------

function renderCountSection(data, row) {
  const hasCount = row.status !== "count-needed";

  if (hasCount && !state.editingCount) {
    const onHand = row.onHandPieces;
    return `
      <div class="card">
        <div class="count-confirmed-row">
          <span class="badge ${row.freshness?.needsRecount ? "warning" : "ok"}">
            ${row.freshness?.needsRecount ? "Recount needed" : "Count confirmed"}
          </span>
          <span>${data.countFullBoxes} box${data.countFullBoxes === 1 ? "" : "es"} + ${data.countPartialPieces} piece${data.countPartialPieces === 1 ? "" : "s"} (${onHand} pieces) on ${data.countDate}</span>
          <button class="text-link" id="edit-count">Edit count</button>
        </div>
        ${row.freshness?.needsRecount ? `<p class="caveat">${row.freshness.reasons.join(" ")}</p>` : ""}
      </div>
    `;
  }

  return `
    <div class="card">
      <h3 style="margin-top:0">Physical freezer count — Croissant dough</h3>
      <div class="row">
        <label>Full boxes
          <input type="number" min="0" step="1" id="countFullBoxes" value="${data.countFullBoxes ?? ""}" />
        </label>
        <label>Partial pieces
          <input type="number" min="0" step="1" id="countPartialPieces" value="${data.countPartialPieces ?? ""}" />
        </label>
        <label>Count date
          <input type="date" id="countDate" value="${data.countDate ?? ""}" />
        </label>
        <button class="mic-button" title="Voice count entry — planned, not yet available" disabled>
          ${icon.mic} Voice count
        </button>
      </div>
      <div class="row" style="margin-top:0.9rem">
        <label>Shipment-available date
          <input type="date" id="shipmentDate" value="${data.shipmentDate ?? ""}" />
        </label>
        <label>Plan stock through
          <input type="date" id="planStockThroughDate" value="${data.planStockThroughDate ?? ""}" />
        </label>
        ${hasCount ? `<button class="secondary" id="done-editing-count">Done</button>` : ""}
      </div>
      <p class="reason">Box size (192 pieces) is an unverified estimate. Supplier minimum is unknown.</p>
      <p class="reason">Freezer capacity is also estimated — from today's count rounded up, plus one box of headroom — not a real measured zone size.</p>
    </div>
  `;
}

function renderListRow(row) {
  if (row.status !== "ready") {
    return `
      <tr>
        <td>${CROISSANT_DOUGH.displayName}</td>
        <td colspan="4">${statusBadge(row)} <span class="reason">${row.blockers?.join("; ") ?? ""}</span></td>
      </tr>
    `;
  }

  const s = row.suggestion;
  const whyText = `Pre-arrival usage ${row.preArrivalUsagePieces} pieces (count date excluded — the count happens after closing). Projected ${row.preArrival.projectedStockAtArrival} pieces at arrival. Post-arrival usage ${row.postArrivalUsagePieces} pieces through the plan-stock-through date. ${s.reason}`;

  return `
    <tr>
      <td>
        <b>${CROISSANT_DOUGH.displayName}</b>
        <span class="why-link" id="toggle-why">${state.showWhy ? "Hide evidence" : "Why? ›"}</span>
        ${state.showWhy ? `<div class="why-detail">${whyText}</div>` : ""}
      </td>
      <td>${row.onHandPieces} pieces</td>
      <td>${statusBadge(row)}</td>
      <td>
        ${s.suggestedBoxes} box${s.suggestedBoxes === 1 ? "" : "es"}
        ${!s.supplierMinimumKnown ? `<div class="caveat">Supplier minimum not verified</div>` : ""}
      </td>
      <td><input type="number" min="0" step="1" id="managerBoxes" value="${row.managerBoxes}" style="width:5rem" /></td>
    </tr>
  `;
}

function renderSidePanel(row) {
  if (row.status !== "ready") {
    return `<div class="card side-panel"><h3>Shortage comparison</h3><p class="reason">Evidence appears once the count and dates are entered.</p></div>`;
  }
  const shortage = row.preArrival.shortagePieces;
  const max = Math.max(shortage, row.suggestion.piecesNeeded, 1);
  return `
    <div class="card side-panel">
      <h3>Shortage comparison</h3>
      <div class="shortage-row">
        <div class="shortage-label"><span>Pre-arrival shortage</span><b>${shortage}</b></div>
        <div class="shortage-track"><div class="shortage-fill" style="width:${(shortage / max) * 100}%"></div></div>
      </div>
      <div class="shortage-row">
        <div class="shortage-label"><span>Net pieces needed after arrival</span><b>${row.suggestion.piecesNeeded}</b></div>
        <div class="shortage-track"><div class="shortage-fill" style="width:${(row.suggestion.piecesNeeded / max) * 100}%"></div></div>
      </div>
      <p class="reason">Only one SKU (croissant dough) has a validated contract, so this compares its own pre- and post-arrival evidence rather than ranking multiple products.</p>
    </div>
  `;
}

function renderList(data, row) {
  return `
    ${renderCountSection(data, row)}
    <div class="list-layout">
      <div class="card">
        <table>
          <thead>
            <tr><th>Product</th><th>On hand</th><th>Status</th><th>Suggested</th><th>Manager boxes</th></tr>
          </thead>
          <tbody>${renderListRow(row)}</tbody>
        </table>
      </div>
      ${renderSidePanel(row)}
    </div>
  `;
}

function bar(label, value, max) {
  const height = max > 0 ? Math.max(4, Math.round((Math.max(value, 0) / max) * 150)) : 4;
  return `
    <div class="bar-col">
      <div class="bar-value">${value}</div>
      <div class="bar" style="height:${height}px"></div>
      <div class="bar-label">${label}</div>
    </div>
  `;
}

function renderChart(row) {
  if (row.status !== "ready") {
    return `<div class="card">Enter the count and dates to see the chart.</div>`;
  }
  const arrivingPieces = row.managerBoxes * CROISSANT_DOUGH.piecesPerBox;
  const max = Math.max(
    row.onHandPieces,
    row.preArrivalUsagePieces,
    row.postArrivalUsagePieces,
    arrivingPieces,
    Math.abs(row.projectedEndStock),
  );
  return `
    <div class="card">
      <div class="bars">
        ${bar("On hand", row.onHandPieces, max)}
        ${bar("Pre-arrival usage", row.preArrivalUsagePieces, max)}
        ${bar("At arrival", row.preArrival.projectedStockAtArrival, max)}
        ${bar("Post-arrival usage", row.postArrivalUsagePieces, max)}
        ${bar("Arriving", arrivingPieces, max)}
        ${bar("End stock", row.projectedEndStock, max)}
      </div>
    </div>
  `;
}

function renderHistory() {
  if (!state.history.length) {
    return `<div class="card">No finalized Next Order Lists yet.</div>`;
  }
  return state.history
    .map(
      (record) => `
        <div class="card history-card">
          <div class="history-head">
            <b>Finalized ${new Date(record.finalizedAt).toLocaleString()}</b>
            <span class="badge muted">by ${record.managerInitials}</span>
          </div>
          <div class="reason">Supplier order sent: ${record.supplierOrderSent}</div>
          <pre>${JSON.stringify(record.data, null, 2)}</pre>
        </div>
      `,
    )
    .join("");
}

function renderStatBar(row) {
  const productsNeedReview = row.status === "ready" ? 0 : 1;
  const boxesProposed = row.status === "ready" ? row.managerBoxes : 0;
  const draftStatus = state.draft?.status === "final" ? "Finalized" : "Draft";
  const capacityLabel =
    row.status === "ready"
      ? `${row.capacity.status[0].toUpperCase()}${row.capacity.status.slice(1)} (est.)`
      : "Not configured";

  return `
    <div class="stat-bar">
      <div class="stat"><b>${productsNeedReview}</b><span>Needs review</span></div>
      <div class="stat"><b>${boxesProposed}</b><span>Boxes proposed</span></div>
      <div class="stat"><b>${capacityLabel}</b><span>Freezer capacity</span></div>
      <div class="stat"><b>${draftStatus}</b><span>Status</span></div>
    </div>
  `;
}

function renderFinalizeBar(row) {
  const canFinalize = row.status === "ready" && !row.blockers.length;
  const s = row.status === "ready" ? row.suggestion : null;

  if (state.finalizeDialogOpen) {
    return `
      <div class="finalize-bar">
        <div class="finalize-inline">
          <label style="color:var(--cream)">Manager initials
            <input type="text" id="managerInitials" placeholder="e.g. MW" autofocus />
          </label>
        </div>
        <div class="finalize-inline">
          <button class="primary" id="confirmFinalize">Confirm finalize</button>
          <button class="secondary" id="cancelFinalize" style="color:var(--cream);border-color:rgba(243,233,216,0.3)">Cancel</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="finalize-bar">
      <div class="totals">
        <div><span class="label">Boxes</span><b>${s ? s.suggestedBoxes : "—"}</b></div>
        <div><span class="label">Supplier cost</span><b class="cost-note">Not available</b></div>
        <div>
          <span class="label">Capacity (estimate)</span>
          ${
            row.status === "ready"
              ? `<b>${row.capacityEstimate.practicalCapacityBoxes} / ${row.capacityEstimate.hardCapacityBoxes} boxes — ${row.capacity.status}</b>`
              : `<b class="cost-note">Not configured</b>`
          }
        </div>
      </div>
      <button class="primary" id="finalize" ${canFinalize ? "" : "disabled"}>Finalize Next Order List</button>
    </div>
  `;
}

function renderWorkspace() {
  const row = computeRow(state.draft.data);
  return `
    <button class="back-link" id="back-to-overview">${icon.back} Overview</button>
    <div class="workspace-header">
      <div>
        <p class="eyebrow">Restock</p>
        <h1 class="page-title" style="margin-bottom:0">Next Order List</h1>
      </div>
      <div class="autosave"><span class="dot"></span>${state.saveState === "saving" ? "Saving…" : "Autosaved"}</div>
    </div>
    <div class="meta-line">
      ${state.draft.updatedAt ? `<span>Last saved ${formatTime(state.draft.updatedAt)}</span>` : ""}
    </div>

    <div class="tabs">
      <button data-tab="current" class="${state.workspaceTab === "current" ? "active" : ""}">Current</button>
      <button data-tab="history" class="${state.workspaceTab === "history" ? "active" : ""}">History</button>
    </div>

    ${
      state.workspaceTab === "current"
        ? `
          ${renderStatBar(row)}
          <div class="tabs">
            <button data-subview="list" class="${state.currentSubview === "list" ? "active" : ""}">List</button>
            <button data-subview="chart" class="${state.currentSubview === "chart" ? "active" : ""}">Chart</button>
          </div>
          ${state.currentSubview === "list" ? renderList(state.draft.data, row) : renderChart(row)}
          ${renderFinalizeBar(row)}
        `
        : renderHistory()
    }
  `;
}

// ---------- Tomorrow's Production workspace ----------

function flagBadges(row) {
  const badges = [];
  if (row.suggestion.status === "Limited evidence") badges.push(`<span class="badge muted">Limited evidence</span>`);
  if (row.suggestion.changeLabel === "Large Quantity Change") badges.push(`<span class="badge danger">Large Quantity Change</span>`);
  else if (row.suggestion.changeLabel === "Quantity change") badges.push(`<span class="badge warning">Quantity change</span>`);
  if (row.suggestion.hasUnusualContext) badges.push(`<span class="badge warning">Unusual context</span>`);
  return badges.join(" ") || `<span class="badge ok">No change</span>`;
}

function renderProductionActionCell(row) {
  if (!row.flagged) {
    return `<span class="reason">No review needed — using current (${row.item.currentQuantity}).</span>`;
  }
  if (row.reviewAction) {
    const labels = { "use-suggestion": "Used suggestion", "keep-current": "Kept current", custom: "Custom" };
    return `
      <span class="badge ok">${labels[row.reviewAction.action]}: ${row.reviewAction.finalQuantity}</span>
      <button class="text-link" data-change-decision="${row.item.itemKey}">Change</button>
    `;
  }
  const canUseSuggestion = row.suggestion.suggestedQuantity !== null;
  return `
    <div class="action-group">
      ${canUseSuggestion ? `<button class="secondary" data-decide="${row.item.itemKey}" data-action="use-suggestion">Use suggestion (${row.suggestion.suggestedQuantity})</button>` : ""}
      <button class="secondary" data-decide="${row.item.itemKey}" data-action="keep-current">Keep current (${row.item.currentQuantity})</button>
      <input type="number" min="0" step="1" class="custom-qty-input" data-custom-input="${row.item.itemKey}" placeholder="Custom" style="width:5.5rem" />
      <button class="secondary" data-decide="${row.item.itemKey}" data-action="custom">Set</button>
    </div>
  `;
}

function renderProductionList(rows) {
  return `
    <div class="card">
      <table>
        <thead>
          <tr><th>Product</th><th>Current</th><th>Suggested</th><th>Flags</th><th>Manager action</th></tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr class="${row.item.itemKey === state.productionSelectedItemKey ? "selected" : ""}">
                  <td>
                    <button class="text-link" data-select-product="${row.item.itemKey}">${row.item.displayName}</button>
                  </td>
                  <td>${row.item.currentQuantity}</td>
                  <td>${row.suggestion.suggestedQuantity ?? "—"}</td>
                  <td>${flagBadges(row)}</td>
                  <td>${renderProductionActionCell(row)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderProductionEvidence(rows) {
  const row = rows.find((r) => r.item.itemKey === state.productionSelectedItemKey) ?? rows[0];
  const max = Math.max(...row.item.comparableDays.map((d) => d.sold), row.item.currentQuantity, 1);

  return `
    <div class="card side-panel">
      <h3>${row.item.displayName} — comparable Tuesdays</h3>
      <p class="reason">SIMULATED evidence, not real sales data — see data/tomorrows-production-SIMULATED-comparable-day-sales.md.</p>
      <div class="bars">
        ${row.item.comparableDays
          .map((day) => {
            const height = Math.max(4, Math.round((day.sold / max) * 130));
            return `
              <div class="bar-col">
                <div class="bar-value">${day.sold}${day.sellout ? " ⚑" : ""}</div>
                <div class="bar" style="height:${height}px; ${day.sellout ? "background:linear-gradient(180deg,var(--brick),var(--terracotta-dark))" : ""}"></div>
                <div class="bar-label">${day.date.slice(5)}</div>
              </div>
            `;
          })
          .join("")}
      </div>
      <p class="reason">Suggested: ${row.suggestion.suggestedQuantity ?? "n/a"} — ${row.suggestion.reason}</p>
      ${row.suggestion.unusualContextNotes.length ? `<p class="caveat">${row.suggestion.unusualContextNotes.join("; ")}</p>` : ""}
    </div>
  `;
}

function renderReserveCheck(rows) {
  const reserveRows = rows.filter((r) => r.reserve);
  if (!reserveRows.length) {
    return "";
  }
  return `
    <div class="card">
      <h3 style="margin-top:0">Closing reserve check</h3>
      <p class="reason">Only items with an extra batch today appear here. Confirm what's actually sitting prepped-but-unbaked — it survives one more day only.</p>
      ${reserveRows
        .map(
          (row) => `
            <div class="row" style="margin-bottom:0.75rem">
              <label>${row.item.displayName} carried over
                <input type="number" min="0" step="1" data-reserve-input="${row.item.itemKey}" value="${row.reserve.confirmedCarryover}" style="width:6rem" />
              </label>
              <span class="reason">Net prep needed: ${row.reserve.netPrepNeeded} (of ${row.reserve.suggestedTotal} total)</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderProductionStatBar(rows, finality) {
  const flaggedCount = rows.filter((r) => r.flagged).length;
  const reviewedCount = rows.filter((r) => r.flagged && r.reviewAction).length;
  return `
    <div class="stat-bar">
      <div class="stat"><b>${flaggedCount - reviewedCount}</b><span>Awaiting decision</span></div>
      <div class="stat"><b>${reviewedCount}/${flaggedCount}</b><span>Reviewed</span></div>
      <div class="stat"><b>${rows.length}</b><span>Products tracked</span></div>
      <div class="stat"><b>${finality.canFinalize ? "Ready" : "Blocked"}</b><span>Finalize status</span></div>
    </div>
  `;
}

function renderProductionFinalizeBar(finality) {
  if (state.productionFinalizeDialogOpen) {
    return `
      <div class="finalize-bar">
        <div class="finalize-inline">
          <label style="color:var(--cream)">Manager initials
            <input type="text" id="productionManagerInitials" placeholder="e.g. MW" autofocus />
          </label>
        </div>
        <div class="finalize-inline">
          <button class="primary" id="confirmProductionFinalize">Confirm finalize</button>
          <button class="secondary" id="cancelProductionFinalize" style="color:var(--cream);border-color:rgba(243,233,216,0.3)">Cancel</button>
        </div>
      </div>
    `;
  }
  return `
    <div class="finalize-bar">
      <div class="totals">
        <div><span class="label">Unreviewed</span><b>${finality.unreviewedCount}</b></div>
      </div>
      <button class="primary" id="finalizeProduction" ${finality.canFinalize ? "" : "disabled"}>Finalize tomorrow's production plan</button>
    </div>
  `;
}

function bakerSheetRow(itemKey, quantity) {
  const item = TOMORROWS_PRODUCTION_ITEMS.find((i) => i.itemKey === itemKey);
  if (!item) return "";
  if (item.hasReserve) {
    return `
      <tr>
        <td>${item.displayName}</td>
        <td><b>Opening batch — bake for 9:00 AM:</b> ${item.reserveOpeningQuantity}<br/><b>Reserve — prepare, do not bake yet:</b> ${Math.max(0, quantity - item.reserveOpeningQuantity)}<br/><b>Total prepared/planned:</b> ${quantity}</td>
      </tr>
    `;
  }
  return `<tr><td>${item.displayName}</td><td>${quantity}</td></tr>`;
}

function renderProductionHistory() {
  if (!state.productionHistory.length) {
    return `<div class="card">No finalized production plans yet.</div>`;
  }
  return state.productionHistory
    .map((record) => {
      const decisions = record.data.decisions ?? {};
      return `
        <div class="card history-card">
          <div class="history-head">
            <b>Finalized ${new Date(record.finalizedAt).toLocaleString()}</b>
            <span class="badge muted">by ${record.managerInitials}</span>
          </div>
          <table>
            <thead><tr><th>Product</th><th>Baker sheet</th></tr></thead>
            <tbody>
              ${TOMORROWS_PRODUCTION_ITEMS.map((item) =>
                bakerSheetRow(item.itemKey, decisions[item.itemKey]?.finalQuantity ?? item.currentQuantity),
              ).join("")}
            </tbody>
          </table>
          <button class="secondary" data-print="true" style="margin-top:0.75rem">Print baker sheet</button>
        </div>
      `;
    })
    .join("");
}

function renderProductionWorkspace() {
  const rows = computeProductionRows(state.productionDraft.data);
  const finality = canFinalizeProductionPlan({
    products: rows.map((r) => ({ id: r.item.itemKey, suggestion: r.suggestion, reviewAction: r.reviewAction })),
  });

  return `
    <button class="back-link" id="back-to-overview-from-production">${icon.back} Overview</button>
    <div class="workspace-header">
      <div>
        <p class="eyebrow">Production</p>
        <h1 class="page-title" style="margin-bottom:0">Tomorrow's Production</h1>
      </div>
      <div class="autosave"><span class="dot"></span>${state.productionSaveState === "saving" ? "Saving…" : "Autosaved"}</div>
    </div>

    <div class="tabs">
      <button data-production-tab="current" class="${state.productionWorkspaceTab === "current" ? "active" : ""}">Current</button>
      <button data-production-tab="history" class="${state.productionWorkspaceTab === "history" ? "active" : ""}">History</button>
    </div>

    ${
      state.productionWorkspaceTab === "current"
        ? `
          ${renderProductionStatBar(rows, finality)}
          ${renderProductionList(rows)}
          ${renderProductionEvidence(rows)}
          ${renderReserveCheck(rows)}
          ${renderProductionFinalizeBar(finality)}
        `
        : renderProductionHistory()
    }
  `;
}

// ---------- Waste Pattern Review workspace (read-only diagnostic) ----------

function wasteOutcomeBadge(waste) {
  if (waste.status === "Building comparable-day baseline") return `<span class="badge muted">Building comparable-day baseline</span>`;
  if (waste.outcome === "Known one-time event") return `<span class="badge warning">Known one-time event</span>`;
  if (waste.outcome === "Possible repeated baseline problem") return `<span class="badge danger">Possible repeated baseline problem</span>`;
  return `<span class="badge ok">Normal range</span>`;
}

function renderWasteList(rows) {
  const ranked = [...rows].sort((a, b) => {
    if (a.waste.isUnusuallyHigh !== b.waste.isUnusuallyHigh) return a.waste.isUnusuallyHigh ? -1 : 1;
    return (b.waste.percentAboveBaseline ?? -1) - (a.waste.percentAboveBaseline ?? -1);
  });

  return `
    <div class="card">
      <table>
        <thead>
          <tr><th>Product</th><th>Most recent leftover</th><th>vs. baseline</th><th>Outcome</th><th>Supplier cost</th></tr>
        </thead>
        <tbody>
          ${ranked
            .map(
              (row) => `
                <tr class="clickable-row ${row.item.itemKey === state.wasteSelectedItemKey ? "selected" : ""}" data-select-waste="${row.item.itemKey}">
                  <td><span class="text-link" style="pointer-events:none">${row.item.displayName}</span></td>
                  <td>${row.waste.mostRecentLeftover ?? "—"}</td>
                  <td>${row.waste.percentAboveBaseline === null ? "—" : `${row.waste.percentAboveBaseline === Infinity ? ">1000" : Math.round(row.waste.percentAboveBaseline * 100)}%`}</td>
                  <td>${wasteOutcomeBadge(row.waste)}</td>
                  <td class="cost-note">Not available</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderWasteEvidence(rows) {
  const row = rows.find((r) => r.item.itemKey === state.wasteSelectedItemKey) ?? rows[0];
  const produced = row.item.currentQuantity;
  const max = Math.max(produced, 1);

  return `
    <div class="card">
      <h3 style="margin-top:0">${row.item.displayName} — leftover evidence</h3>
      <p class="reason">SIMULATED evidence, not real sales data — see data/tomorrows-production-SIMULATED-comparable-day-sales.md.</p>
      <div class="bars">
        ${row.item.comparableDays
          .map((day) => {
            const leftover = Math.max(0, produced - day.sold);
            const height = Math.max(4, Math.round((leftover / max) * 130));
            return `
              <div class="bar-col">
                <div class="bar-value">${leftover}</div>
                <div class="bar" style="height:${height}px"></div>
                <div class="bar-label">${day.date.slice(5)}${day.sellout ? " ⚑" : ""}</div>
              </div>
            `;
          })
          .join("")}
      </div>
      <p class="reason">Produced ${produced}/day. ${row.waste.reason}</p>
      ${wasteOutcomeBadge(row.waste)}
    </div>
  `;
}

function renderWasteWorkspace() {
  const rows = computeWasteRows();
  const flaggedCount = rows.filter((r) => r.waste.isUnusuallyHigh).length;

  return `
    <button class="back-link" id="back-to-overview-from-waste">${icon.back} Overview</button>
    <div class="workspace-header">
      <div>
        <p class="eyebrow">Waste</p>
        <h1 class="page-title" style="margin-bottom:0">Waste Pattern Review</h1>
      </div>
    </div>
    <p class="page-subtitle">Diagnostic only — production changes happen in Tomorrow's Production. ${icon.camera} Leftover photo capture is planned as a future input method here.</p>

    <div class="stat-bar">
      <div class="stat"><b>${flaggedCount}</b><span>Unusually high</span></div>
      <div class="stat"><b>${rows.length}</b><span>Products tracked</span></div>
      <div class="stat"><b class="cost-note">Not available</b><span>Total supplier waste cost</span></div>
    </div>

    ${renderWasteList(rows)}
    ${renderWasteEvidence(rows)}
  `;
}

function render() {
  document.querySelector("#shell").classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
  document.querySelector("#sidebar-toggle").title = state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
  renderSidenav();
  const app = document.querySelector("#app");
  if (state.view === "overview") app.innerHTML = renderOverview();
  else if (state.view === "workspace") app.innerHTML = renderWorkspace();
  else if (state.view === "production") app.innerHTML = renderProductionWorkspace();
  else if (state.view === "waste") app.innerHTML = renderWasteWorkspace();
}

function bindEvents() {
  document.addEventListener("click", async (event) => {
    if (event.target.closest("#sidebar-toggle")) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem("sidebarCollapsed", String(state.sidebarCollapsed));
      render();
      return;
    }

    const nav = event.target.closest("[data-nav]");
    if (nav && !nav.disabled) {
      if (nav.dataset.nav === "overview") state.view = "overview";
      if (nav.dataset.nav === "restock") state.view = "workspace";
      if (nav.dataset.nav === "production") state.view = "production";
      if (nav.dataset.nav === "waste") state.view = "waste";
      render();
      return;
    }

    if (event.target.closest("#open-workspace") || event.target.closest("#back-to-overview")) {
      state.view = event.target.closest("#open-workspace") ? "workspace" : "overview";
      render();
      return;
    }
    if (event.target.closest("#open-production") || event.target.closest("#back-to-overview-from-production")) {
      state.view = event.target.closest("#open-production") ? "production" : "overview";
      render();
      return;
    }
    if (event.target.closest("#open-waste") || event.target.closest("#back-to-overview-from-waste")) {
      state.view = event.target.closest("#open-waste") ? "waste" : "overview";
      render();
      return;
    }
    if (event.target.closest("[data-select-waste]")) {
      state.wasteSelectedItemKey = event.target.closest("[data-select-waste]").dataset.selectWaste;
      render();
      return;
    }
    if (event.target.closest("[data-production-tab]")) {
      state.productionWorkspaceTab = event.target.closest("[data-production-tab]").dataset.productionTab;
      if (state.productionWorkspaceTab === "history") await loadProductionHistory();
      render();
      return;
    }
    if (event.target.closest("[data-select-product]")) {
      state.productionSelectedItemKey = event.target.closest("[data-select-product]").dataset.selectProduct;
      render();
      return;
    }
    const decideButton = event.target.closest("[data-decide]");
    if (decideButton) {
      const itemKey = decideButton.dataset.decide;
      const action = decideButton.dataset.action;
      const row = computeProductionRows(state.productionDraft.data).find((r) => r.item.itemKey === itemKey);
      let customQuantity;
      if (action === "custom") {
        const input = document.querySelector(`[data-custom-input="${itemKey}"]`);
        if (!input.value) {
          input.focus();
          return;
        }
        customQuantity = Number(input.value);
      }
      const decision = resolveManagerDecision({
        suggestion: row.suggestion,
        currentQuantity: row.item.currentQuantity,
        action,
        customQuantity,
      });
      await saveProductionDraft({ decisions: { [itemKey]: decision } });
      return;
    }
    if (event.target.closest("[data-change-decision]")) {
      await clearProductionDecision(event.target.closest("[data-change-decision]").dataset.changeDecision);
      return;
    }
    if (event.target.id === "finalizeProduction") {
      state.productionFinalizeDialogOpen = true;
      render();
      return;
    }
    if (event.target.id === "cancelProductionFinalize") {
      state.productionFinalizeDialogOpen = false;
      render();
      return;
    }
    if (event.target.id === "confirmProductionFinalize") {
      const input = document.querySelector("#productionManagerInitials");
      if (!input.value.trim()) {
        input.focus();
        return;
      }
      await finalizeProductionDraft(input.value.trim());
      return;
    }
    if (event.target.closest("[data-print]")) {
      window.print();
      return;
    }
    if (event.target.closest("[data-tab]")) {
      state.workspaceTab = event.target.closest("[data-tab]").dataset.tab;
      if (state.workspaceTab === "history") await loadHistory();
      render();
      return;
    }
    if (event.target.closest("[data-subview]")) {
      state.currentSubview = event.target.closest("[data-subview]").dataset.subview;
      render();
      return;
    }
    if (event.target.id === "edit-count") {
      state.editingCount = true;
      render();
      return;
    }
    if (event.target.id === "done-editing-count") {
      state.editingCount = false;
      render();
      return;
    }
    if (event.target.id === "toggle-why") {
      state.showWhy = !state.showWhy;
      render();
      return;
    }
    if (event.target.id === "finalize") {
      state.finalizeDialogOpen = true;
      render();
      return;
    }
    if (event.target.id === "cancelFinalize") {
      state.finalizeDialogOpen = false;
      render();
      return;
    }
    if (event.target.id === "confirmFinalize") {
      const input = document.querySelector("#managerInitials");
      if (!input.value.trim()) {
        input.focus();
        return;
      }
      await finalizeDraft(input.value.trim());
      return;
    }
  });

  document.addEventListener("change", async (event) => {
    const id = event.target.id;
    if (["countFullBoxes", "countPartialPieces", "countDate", "shipmentDate", "planStockThroughDate"].includes(id)) {
      // Keep the form expanded through the save/re-render cycle so it
      // doesn't collapse to the compact summary mid-edit.
      state.editingCount = true;
      const value = ["countFullBoxes", "countPartialPieces"].includes(id) ? Number(event.target.value) : event.target.value;
      await saveDraft({ [id]: value });
    }
    if (id === "managerBoxes") {
      await saveDraft({ managerBoxes: Number(event.target.value) });
    }

    const reserveInput = event.target.closest("[data-reserve-input]");
    if (reserveInput) {
      const itemKey = reserveInput.dataset.reserveInput;
      await saveProductionDraft({ reserveEntries: { [itemKey]: Number(reserveInput.value) } });
    }
  });
}

async function init() {
  await loadActiveDraft();
  await loadActiveProductionDraft();
  render();
  bindEvents();
}

init();

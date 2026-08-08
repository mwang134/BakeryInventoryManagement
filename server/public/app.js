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
} from "/lib/next-order-list.js";

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
    blockers,
  };
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
    { id: "waste", label: "Waste review", icon: icon.waste, enabled: false, flag: icon.camera },
    { id: "production", label: "Production plan", icon: icon.production, enabled: false },
  ];

  document.querySelector("#sidenav").innerHTML = items
    .map((item) => {
      const active =
        (item.id === "overview" && state.view === "overview") ||
        (item.id === "restock" && state.view === "workspace");
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

    <h2 class="section-title">Plan next</h2>
    <div class="plan-next-grid">
      <div class="ghost-card">
        <div class="soon">Coming soon</div>
        <b>Waste review</b>
        <p>Comparable-day leftover patterns and supplier waste cost. ${icon.camera} Leftover photo capture is planned here.</p>
      </div>
      <div class="ghost-card">
        <div class="soon">Coming soon</div>
        <b>Production plan</b>
        <p>Tomorrow's production quantities with review flags.</p>
      </div>
    </div>
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

  return `
    <div class="stat-bar">
      <div class="stat"><b>${productsNeedReview}</b><span>Needs review</span></div>
      <div class="stat"><b>${boxesProposed}</b><span>Boxes proposed</span></div>
      <div class="stat"><b>Not configured</b><span>Freezer capacity</span></div>
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
        <div><span class="label">Capacity</span><b class="cost-note">Not configured</b></div>
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

function render() {
  renderSidenav();
  document.querySelector("#app").innerHTML = state.view === "overview" ? renderOverview() : renderWorkspace();
}

function bindEvents() {
  document.addEventListener("click", async (event) => {
    const nav = event.target.closest("[data-nav]");
    if (nav && !nav.disabled) {
      if (nav.dataset.nav === "overview") state.view = "overview";
      if (nav.dataset.nav === "restock") state.view = "workspace";
      render();
      return;
    }

    if (event.target.closest("#open-workspace") || event.target.closest("#back-to-overview")) {
      state.view = event.target.closest("#open-workspace") ? "workspace" : "overview";
      render();
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
  });
}

async function init() {
  await loadActiveDraft();
  render();
  bindEvents();
}

init();

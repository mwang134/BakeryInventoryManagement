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
// unverified and supplier minimum is explicitly unknown - both stay visible
// in the UI rather than being treated as confirmed.
const CROISSANT_DOUGH = {
  skuKey: "croissant-dough",
  displayName: "Croissant dough",
  piecesPerBox: 192,
  piecesPerBoxVerified: false,
  supplierMinimumBoxes: undefined,
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
  view: "home",
  workspaceTab: "current",
  currentSubview: "list",
  draft: null,
  history: [],
  finalizeDialogOpen: false,
};

async function loadActiveDraft() {
  state.draft = await fetch("/draft").then((r) => r.json());
}

async function loadHistory() {
  state.history = await fetch("/history").then((r) => r.json());
}

async function saveDraft(patch) {
  const nextData = { ...state.draft.data, ...patch };
  state.draft = await fetch("/draft", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(nextData),
  }).then((r) => r.json());
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

function renderHome() {
  const row = state.draft ? computeRow(state.draft.data) : { status: "count-needed", blockers: [] };
  const detail =
    row.status === "count-needed"
      ? "Physical freezer count needed before a recommendation can be shown."
      : row.status === "ready"
        ? `${row.suggestion.suggestedBoxes} box${row.suggestion.suggestedBoxes === 1 ? "" : "es"} suggested for croissant dough`
        : "Enter the remaining dates to see a recommendation.";

  return `
    <button class="kpi-card" id="open-workspace">
      <div class="kpi-title">Next Order List</div>
      <div class="kpi-detail">${detail}</div>
    </button>
  `;
}

function renderCountForm(data) {
  return `
    <div class="card">
      <h3>Physical freezer count — Croissant dough</h3>
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
        <label>Shipment-available date
          <input type="date" id="shipmentDate" value="${data.shipmentDate ?? ""}" />
        </label>
        <label>Plan stock through
          <input type="date" id="planStockThroughDate" value="${data.planStockThroughDate ?? ""}" />
        </label>
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
        <td colspan="4">${statusBadge(row)} ${row.blockers?.join("; ") ?? ""}</td>
      </tr>
    `;
  }

  const s = row.suggestion;
  return `
    <tr>
      <td>${CROISSANT_DOUGH.displayName}</td>
      <td>${statusBadge(row)}</td>
      <td>
        ${s.suggestedBoxes} box${s.suggestedBoxes === 1 ? "" : "es"}
        <div class="reason">${s.reason}</div>
      </td>
      <td><input type="number" min="0" step="1" id="managerBoxes" value="${row.managerBoxes}" /></td>
      <td>${row.projectedEndStock} pieces</td>
    </tr>
  `;
}

function renderList(data, row) {
  return `
    ${renderCountForm(data)}
    <div class="card">
      <table>
        <thead>
          <tr><th>Product</th><th>Status</th><th>Suggested</th><th>Manager boxes</th><th>Projected end stock</th></tr>
        </thead>
        <tbody>${renderListRow(row)}</tbody>
      </table>
      ${row.freshness?.needsRecount ? `<p class="caveat">${row.freshness.reasons.join(" ")}</p>` : ""}
      <div class="row" style="margin-top:1rem">
        ${
          state.finalizeDialogOpen
            ? `
              <label>Manager initials
                <input type="text" id="managerInitials" placeholder="e.g. MW" autofocus />
              </label>
              <button class="primary" id="confirmFinalize">Confirm finalize</button>
              <button class="secondary" id="cancelFinalize">Cancel</button>
            `
            : `
              <button class="primary" id="finalize" ${row.status === "ready" && !row.blockers.length ? "" : "disabled"}>
                Finalize Next Order List
              </button>
            `
        }
      </div>
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
        <div class="card">
          <b>Finalized ${new Date(record.finalizedAt).toLocaleString()}</b> by ${record.managerInitials}
          <div class="reason">Supplier order sent: ${record.supplierOrderSent}</div>
          <pre style="white-space:pre-wrap;font-size:0.85rem">${JSON.stringify(record.data, null, 2)}</pre>
        </div>
      `,
    )
    .join("");
}

function renderWorkspace() {
  const row = computeRow(state.draft.data);
  return `
    <div class="tabs">
      <button data-tab="current" class="${state.workspaceTab === "current" ? "active" : ""}">Current</button>
      <button data-tab="history" class="${state.workspaceTab === "history" ? "active" : ""}">History</button>
    </div>
    ${
      state.workspaceTab === "current"
        ? `
          <div class="tabs">
            <button data-subview="list" class="${state.currentSubview === "list" ? "active" : ""}">List</button>
            <button data-subview="chart" class="${state.currentSubview === "chart" ? "active" : ""}">Chart</button>
          </div>
          ${state.currentSubview === "list" ? renderList(state.draft.data, row) : renderChart(row)}
        `
        : renderHistory()
    }
  `;
}

function render() {
  document.querySelector("#app").innerHTML = state.view === "home" ? renderHome() : renderWorkspace();
}

function bindEvents() {
  document.addEventListener("click", async (event) => {
    if (event.target.closest("#open-workspace")) {
      state.view = "workspace";
      render();
    }
    if (event.target.closest("[data-tab]")) {
      state.workspaceTab = event.target.closest("[data-tab]").dataset.tab;
      if (state.workspaceTab === "history") await loadHistory();
      render();
    }
    if (event.target.closest("[data-subview]")) {
      state.currentSubview = event.target.closest("[data-subview]").dataset.subview;
      render();
    }
    if (event.target.id === "finalize") {
      state.finalizeDialogOpen = true;
      render();
    }
    if (event.target.id === "cancelFinalize") {
      state.finalizeDialogOpen = false;
      render();
    }
    if (event.target.id === "confirmFinalize") {
      const input = document.querySelector("#managerInitials");
      if (!input.value.trim()) {
        input.focus();
        return;
      }
      await finalizeDraft(input.value.trim());
    }
  });

  document.addEventListener("change", async (event) => {
    const id = event.target.id;
    if (["countFullBoxes", "countPartialPieces"].includes(id)) {
      await saveDraft({ [id]: Number(event.target.value) });
    }
    if (["countDate", "shipmentDate", "planStockThroughDate"].includes(id)) {
      await saveDraft({ [id]: event.target.value });
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

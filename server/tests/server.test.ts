import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../src/server.ts";

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const app = createApp(":memory:");
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

const VALID_NEXT_ORDER_LIST_DRAFT = {
  countFullBoxes: 5,
  countPartialPieces: 1,
  countDate: "2026-08-10",
  shipmentDate: "2026-08-14",
  planStockThroughDate: "2026-08-27",
  managerBoxes: 6,
  supplierRuleAcknowledged: true,
};

test("GET /draft, PUT /draft, and reload return the same saved draft over HTTP", async () => {
  await withServer(async (baseUrl) => {
    const first = await fetch(`${baseUrl}/draft`).then((r) => r.json());
    assert.equal(first.status, "draft");

    await fetch(`${baseUrl}/draft`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ countFullBoxes: 5, countPartialPieces: 1 }),
    });

    const reloaded = await fetch(`${baseUrl}/draft`).then((r) => r.json());
    assert.equal(reloaded.id, first.id);
    assert.deepEqual(reloaded.data, { countFullBoxes: 5, countPartialPieces: 1 });
  });
});

test("POST /draft/:id/finalize moves the draft into History and never sends a supplier order", async () => {
  await withServer(async (baseUrl) => {
    const draft = await fetch(`${baseUrl}/draft`).then((r) => r.json());
    await fetch(`${baseUrl}/draft`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        countFullBoxes: 5,
        countPartialPieces: 1,
        countDate: "2026-08-10",
        shipmentDate: "2026-08-14",
        planStockThroughDate: "2026-08-27",
        managerBoxes: 6,
        supplierRuleAcknowledged: true,
      }),
    });

    const finalized = await fetch(`${baseUrl}/draft/${draft.id}/finalize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ managerInitials: "MW" }),
    }).then((r) => r.json());

    assert.equal(finalized.status, "final");
    assert.equal(finalized.supplierOrderSent, false);

    const history = await fetch(`${baseUrl}/history`).then((r) => r.json());
    assert.equal(history.length, 1);
    assert.equal(history[0].id, finalized.id);
  });
});

test("/production/draft is a completely independent draft from /draft", async () => {
  await withServer(async (baseUrl) => {
    await fetch(`${baseUrl}/draft`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ countFullBoxes: 5 }),
    });
    await fetch(`${baseUrl}/production/draft`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decisions: { croissant: { action: "keep-current", finalQuantity: 12 } } }),
    });

    const orderDraft = await fetch(`${baseUrl}/draft`).then((r) => r.json());
    const productionDraft = await fetch(`${baseUrl}/production/draft`).then((r) => r.json());

    assert.deepEqual(orderDraft.data, { countFullBoxes: 5 });
    assert.deepEqual(productionDraft.data, {
      decisions: { croissant: { action: "keep-current", finalQuantity: 12 } },
    });

    const productionHistory = await fetch(`${baseUrl}/production/history`).then((r) => r.json());
    assert.deepEqual(productionHistory, []);
  });
});

// ---------- Security headers (P0) ----------

test("responses carry a restrictive CSP and never advertise X-Powered-By", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/draft`);
    assert.equal(response.headers.get("x-powered-by"), null);
    const csp = response.headers.get("content-security-policy");
    assert.ok(csp);
    assert.ok(csp.includes("default-src 'self'"));
    assert.ok(csp.includes("script-src 'self'"));
    assert.ok(csp.includes("frame-ancestors 'none'"));
  });
});

// ---------- Invalid data is rejected (P0) ----------

test("PUT /draft rejects a negative count instead of storing it", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/draft`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ countFullBoxes: -3 }),
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.ok(body.errors.some((e: string) => e.includes("countFullBoxes")));

    const draft = await fetch(`${baseUrl}/draft`).then((r) => r.json());
    assert.deepEqual(draft.data, {});
  });
});

test("PUT /draft rejects shipmentDate that is not after countDate", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/draft`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ countDate: "2026-08-10", shipmentDate: "2026-08-09" }),
    });
    assert.equal(response.status, 400);
  });
});

test("PUT /production/draft rejects an unknown decision action", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/production/draft`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decisions: { croissant: { action: "delete-everything", finalQuantity: 12 } } }),
    });
    assert.equal(response.status, 400);
  });
});

// ---------- Incomplete finalization is rejected (P0) ----------

test("finalize rejects a Next Order List draft that is missing required fields", async () => {
  await withServer(async (baseUrl) => {
    const draft = await fetch(`${baseUrl}/draft`).then((r) => r.json());
    await fetch(`${baseUrl}/draft`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ managerBoxes: 6 }),
    });

    const response = await fetch(`${baseUrl}/draft/${draft.id}/finalize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ managerInitials: "MW" }),
    });
    assert.equal(response.status, 400);

    const history = await fetch(`${baseUrl}/history`).then((r) => r.json());
    assert.equal(history.length, 0);
  });
});

test("finalize rejects a Next Order List draft that is complete but not supplier-rule-acknowledged", async () => {
  await withServer(async (baseUrl) => {
    const draft = await fetch(`${baseUrl}/draft`).then((r) => r.json());
    await fetch(`${baseUrl}/draft`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...VALID_NEXT_ORDER_LIST_DRAFT, supplierRuleAcknowledged: undefined }),
    });

    const response = await fetch(`${baseUrl}/draft/${draft.id}/finalize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ managerInitials: "MW" }),
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.ok(body.errors.some((e: string) => e.toLowerCase().includes("supplierruleacknowledged")));
  });
});

test("finalize rejects a Tomorrow's Production draft with unreviewed flagged items", async () => {
  await withServer(async (baseUrl) => {
    const draft = await fetch(`${baseUrl}/production/draft`).then((r) => r.json());

    const response = await fetch(`${baseUrl}/production/draft/${draft.id}/finalize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ managerInitials: "MW" }),
    });
    assert.equal(response.status, 400);

    const history = await fetch(`${baseUrl}/production/history`).then((r) => r.json());
    assert.equal(history.length, 0);
  });
});

test("managerInitials over 20 characters is rejected at finalize", async () => {
  await withServer(async (baseUrl) => {
    const draft = await fetch(`${baseUrl}/draft`).then((r) => r.json());
    await fetch(`${baseUrl}/draft`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(VALID_NEXT_ORDER_LIST_DRAFT),
    });

    const response = await fetch(`${baseUrl}/draft/${draft.id}/finalize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ managerInitials: "a".repeat(21) }),
    });
    assert.equal(response.status, 400);
  });
});

// ---------- Stored injection (P0) ----------
//
// The server does not (and should not) reject HTML-looking text in
// managerInitials - free-text input is legitimately allowed to contain any
// characters. The actual fix is that the client escapes it before ever
// rendering it back (see app/tests/escape-html.test.js). This test proves
// the storage/retrieval pipe itself doesn't mangle or partially filter the
// value in some unexpected way, which would be a false sense of security.
// Kept under the 20-character managerInitials cap on purpose, so this test
// is exercising the injection path specifically, not the length check.

test("a script-tag payload in managerInitials is stored and returned byte-for-byte, unexecuted, unmodified", async () => {
  await withServer(async (baseUrl) => {
    const draft = await fetch(`${baseUrl}/draft`).then((r) => r.json());
    await fetch(`${baseUrl}/draft`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(VALID_NEXT_ORDER_LIST_DRAFT),
    });

    const malicious = "<script>x</script>";
    const finalized = await fetch(`${baseUrl}/draft/${draft.id}/finalize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ managerInitials: malicious }),
    }).then((r) => r.json());

    assert.equal(finalized.managerInitials, malicious);

    const history = await fetch(`${baseUrl}/history`).then((r) => r.json());
    assert.equal(history[0].managerInitials, malicious);
  });
});

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
      body: JSON.stringify({ managerBoxes: 6 }),
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

import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createDraftStore, runMigrations, CURRENT_SCHEMA_VERSION } from "../src/draftStore.ts";

// Each test gets its own in-memory database so tests don't interfere with
// each other. The real server points this same module at a file on disk
// instead of ":memory:" — that swap is the only difference.
function freshStore() {
  return createDraftStore(":memory:");
}

test("I1: a fresh app has one active draft, and saved data survives a simulated reload", () => {
  const store = freshStore();

  const draft = store.getActiveDraft();
  assert.equal(draft.status, "draft");
  assert.deepEqual(draft.data, {});
  assert.equal(draft.updatedAt, null);

  store.saveActiveDraft({ countFullBoxes: 5, countPartialPieces: 1 });

  // Simulate "reload" by asking for the active draft again from the same
  // underlying database rather than reusing an in-memory object.
  const reloaded = store.getActiveDraft();
  assert.equal(reloaded.id, draft.id);
  assert.deepEqual(reloaded.data, { countFullBoxes: 5, countPartialPieces: 1 });
  assert.equal(typeof reloaded.updatedAt, "string");
});

test("I2: an unfinalized draft never appears in History", () => {
  const store = freshStore();
  store.saveActiveDraft({ countFullBoxes: 5, countPartialPieces: 1 });

  assert.deepEqual(store.getHistory(), []);
});

test("I4: finalizing creates one read-only snapshot, and supplierOrderSent is always false", () => {
  const store = freshStore();
  const draft = store.getActiveDraft();
  store.saveActiveDraft({ countFullBoxes: 5, countPartialPieces: 1, managerBoxes: 6 });

  const finalized = store.finalizeDraft(draft.id, {
    managerInitials: "MW",
    finalizedAt: "2026-08-10T20:00:00Z",
  });

  assert.equal(finalized.status, "final");
  assert.equal(finalized.managerInitials, "MW");
  assert.equal(finalized.finalizedAt, "2026-08-10T20:00:00Z");
  assert.equal(finalized.supplierOrderSent, false);
  assert.deepEqual(finalized.data, { countFullBoxes: 5, countPartialPieces: 1, managerBoxes: 6 });

  const history = store.getHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].id, finalized.id);
});

test("I5: finalized records are immutable, and reopening creates a new draft rather than editing History", () => {
  const store = freshStore();
  const original = store.getActiveDraft();
  store.saveActiveDraft({ countFullBoxes: 5, countPartialPieces: 1 });
  store.finalizeDraft(original.id, { managerInitials: "MW", finalizedAt: "2026-08-10T20:00:00Z" });

  // Trying to save to a finalized draft id must not silently succeed.
  assert.throws(() => store.saveDraft(original.id, { countFullBoxes: 999 }));

  // The original snapshot in History is untouched.
  const history = store.getHistory();
  assert.deepEqual(history[0].data, { countFullBoxes: 5, countPartialPieces: 1 });

  // A brand new active draft now exists, separate from the finalized one.
  const next = store.getActiveDraft();
  assert.notEqual(next.id, original.id);
  assert.equal(next.status, "draft");
  assert.deepEqual(next.data, {});
});

// ---------- P1: versioned migrations ----------

test("a fresh database lands on the current schema version", () => {
  const db = new DatabaseSync(":memory:");
  runMigrations(db);
  const { user_version } = db.prepare("PRAGMA user_version").get() as { user_version: number };
  assert.equal(user_version, CURRENT_SCHEMA_VERSION);
});

test("running migrations twice against the same database is a safe no-op", () => {
  const db = new DatabaseSync(":memory:");
  runMigrations(db);
  db.prepare("INSERT INTO drafts (status, data) VALUES ('draft', '{}')").run();
  runMigrations(db);
  const rows = db.prepare("SELECT * FROM drafts").all();
  assert.equal(rows.length, 1);
});

test("reopening an existing on-disk database file preserves its data and re-applies migrations safely", () => {
  const dbPath = path.join(os.tmpdir(), `draftstore-migration-test-${Date.now()}.db`);
  try {
    const store1 = createDraftStore(dbPath);
    store1.saveActiveDraft({ countFullBoxes: 3 });

    // Simulate a process restart: a brand new createDraftStore call against
    // the same file, as the real server does on every boot.
    const store2 = createDraftStore(dbPath);
    const reloaded = store2.getActiveDraft();
    assert.deepEqual(reloaded.data, { countFullBoxes: 3 });
  } finally {
    fs.rmSync(dbPath, { force: true });
  }
});

// ---------- P1: exactly one active draft, enforced by the database itself ----------

test("the database rejects a second row with status='draft', not just application logic", () => {
  const db = new DatabaseSync(":memory:");
  runMigrations(db);
  db.prepare("INSERT INTO drafts (status, data) VALUES ('draft', '{}')").run();

  assert.throws(() => {
    db.prepare("INSERT INTO drafts (status, data) VALUES ('draft', '{}')").run();
  });
});

test("multiple finalized rows are still allowed - only 'draft' status is constrained to one", () => {
  const db = new DatabaseSync(":memory:");
  runMigrations(db);
  db.prepare("INSERT INTO drafts (status, data) VALUES ('final', '{}')").run();
  // Should not throw - the unique index only applies to status = 'draft'.
  db.prepare("INSERT INTO drafts (status, data) VALUES ('final', '{}')").run();
  const rows = db.prepare("SELECT * FROM drafts WHERE status = 'final'").all();
  assert.equal(rows.length, 2);
});

// ---------- P1: finalization is transactional ----------

test("after finalizing, exactly one active draft exists - never zero, never two", () => {
  const store = freshStore();
  const original = store.getActiveDraft();
  store.finalizeDraft(original.id, { managerInitials: "MW", finalizedAt: "2026-08-10T20:00:00Z" });

  const active = store.getActiveDraft();
  assert.equal(active.status, "draft");
  assert.notEqual(active.id, original.id);

  // Calling getActiveDraft again must return the SAME row, not create a
  // second one - proves finalizeDraft's internal transaction left the
  // database in a single, consistent state rather than a half-applied one.
  const activeAgain = store.getActiveDraft();
  assert.equal(activeAgain.id, active.id);
});

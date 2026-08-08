import test from "node:test";
import assert from "node:assert/strict";

import { createDraftStore } from "../src/draftStore.ts";

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

  store.saveActiveDraft({ countFullBoxes: 5, countPartialPieces: 1 });

  // Simulate "reload" by asking for the active draft again from the same
  // underlying database rather than reusing an in-memory object.
  const reloaded = store.getActiveDraft();
  assert.equal(reloaded.id, draft.id);
  assert.deepEqual(reloaded.data, { countFullBoxes: 5, countPartialPieces: 1 });
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

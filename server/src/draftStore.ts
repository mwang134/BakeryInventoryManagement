import { DatabaseSync } from "node:sqlite";

// Data-access layer for the Next Order List draft/History persistence.
// This is deliberately the only place that knows it's talking to SQLite.
// If this ever needs to become Postgres (see DECISIONS.md, "multi-user"
// trigger), only this file should need to change.

export type DraftStatus = "draft" | "final";

export interface DraftRecord {
  id: number;
  status: DraftStatus;
  data: Record<string, unknown>;
  managerInitials: string | null;
  finalizedAt: string | null;
  supplierOrderSent: boolean;
  updatedAt: string | null;
}

export interface DraftStore {
  getActiveDraft(): DraftRecord;
  saveActiveDraft(data: Record<string, unknown>): DraftRecord;
  saveDraft(id: number, data: Record<string, unknown>): DraftRecord;
  finalizeDraft(
    id: number,
    options: { managerInitials: string; finalizedAt: string },
  ): DraftRecord;
  getHistory(): DraftRecord[];
}

function toRecord(row: {
  id: number;
  status: string;
  data: string;
  manager_initials: string | null;
  finalized_at: string | null;
  updated_at: string | null;
}): DraftRecord {
  return {
    id: row.id,
    status: row.status as DraftStatus,
    data: JSON.parse(row.data),
    managerInitials: row.manager_initials,
    finalizedAt: row.finalized_at,
    // Finalization never contacts or claims a supplier order was sent -
    // this is a fixed rule of the domain, not something the database can
    // ever be asked to override, so it is not even a column.
    supplierOrderSent: false,
    updatedAt: row.updated_at,
  };
}

export function createDraftStore(location: string): DraftStore {
  const db = new DatabaseSync(location);

  db.exec(`
    CREATE TABLE IF NOT EXISTS drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT NOT NULL CHECK (status IN ('draft', 'final')),
      data TEXT NOT NULL,
      manager_initials TEXT,
      finalized_at TEXT,
      updated_at TEXT
    )
  `);

  function getActiveDraft(): DraftRecord {
    const existing = db
      .prepare("SELECT * FROM drafts WHERE status = 'draft' LIMIT 1")
      .get() as any;

    if (existing) {
      return toRecord(existing);
    }

    const inserted = db
      .prepare("INSERT INTO drafts (status, data) VALUES ('draft', '{}')")
      .run();
    const created = db
      .prepare("SELECT * FROM drafts WHERE id = ?")
      .get(inserted.lastInsertRowid) as any;
    return toRecord(created);
  }

  function saveDraft(id: number, data: Record<string, unknown>): DraftRecord {
    const row = db.prepare("SELECT * FROM drafts WHERE id = ?").get(id) as any;
    if (!row) {
      throw new Error(`No draft with id ${id}`);
    }
    if (row.status === "final") {
      throw new Error(`Draft ${id} is finalized and is immutable`);
    }

    db.prepare("UPDATE drafts SET data = ?, updated_at = ? WHERE id = ?").run(
      JSON.stringify(data),
      new Date().toISOString(),
      id,
    );
    return toRecord(db.prepare("SELECT * FROM drafts WHERE id = ?").get(id) as any);
  }

  function saveActiveDraft(data: Record<string, unknown>): DraftRecord {
    const active = getActiveDraft();
    return saveDraft(active.id, data);
  }

  function finalizeDraft(
    id: number,
    options: { managerInitials: string; finalizedAt: string },
  ): DraftRecord {
    const row = db.prepare("SELECT * FROM drafts WHERE id = ?").get(id) as any;
    if (!row) {
      throw new Error(`No draft with id ${id}`);
    }
    if (row.status === "final") {
      throw new Error(`Draft ${id} is already finalized`);
    }

    db.prepare(
      "UPDATE drafts SET status = 'final', manager_initials = ?, finalized_at = ? WHERE id = ?",
    ).run(options.managerInitials, options.finalizedAt, id);

    // Finalizing always leaves a fresh empty active draft behind, so
    // reopening/continuing work creates a new draft rather than ever
    // mutating the finalized History record.
    getActiveDraft();

    return toRecord(db.prepare("SELECT * FROM drafts WHERE id = ?").get(id) as any);
  }

  function getHistory(): DraftRecord[] {
    const rows = db
      .prepare("SELECT * FROM drafts WHERE status = 'final' ORDER BY finalized_at DESC")
      .all() as any[];
    return rows.map(toRecord);
  }

  return { getActiveDraft, saveActiveDraft, saveDraft, finalizeDraft, getHistory };
}

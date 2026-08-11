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
  getDraft(id: number): DraftRecord | undefined;
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

// Versioned migrations, keyed off SQLite's built-in PRAGMA user_version.
// Each migration must be safe to re-run against a database that's already
// at or past its version (IF NOT EXISTS everywhere) - runMigrations always
// walks the full list on every startup rather than trusting a stored
// "already ran" flag, so a database that's behind catches up regardless of
// how long it's been since it was last opened.
const MIGRATIONS: Array<{ version: number; up: (db: DatabaseSync) => void }> = [
  {
    version: 1,
    up: (db) => {
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
      // A partial unique index on a column that's constant among the rows
      // it covers (every matching row has status = 'draft') enforces "at
      // most one row satisfies this predicate" - the standard SQLite
      // pattern for a singleton row, here used to make "exactly one active
      // draft" a database-level guarantee instead of just an application
      // convention that a bug (or a second process touching the same file)
      // could silently violate.
      db.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS one_active_draft_idx
        ON drafts(status) WHERE status = 'draft'
      `);
    },
  },
];

export const CURRENT_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

export function runMigrations(db: DatabaseSync): void {
  const { user_version: currentVersion } = db.prepare("PRAGMA user_version").get() as {
    user_version: number;
  };
  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      migration.up(db);
      db.exec(`PRAGMA user_version = ${migration.version}`);
    }
  }
}

function withTransaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function createDraftStore(location: string): DraftStore {
  const db = new DatabaseSync(location);
  runMigrations(db);

  function insertNewActiveDraft(): DraftRecord {
    const inserted = db
      .prepare("INSERT INTO drafts (status, data) VALUES ('draft', '{}')")
      .run();
    const created = db
      .prepare("SELECT * FROM drafts WHERE id = ?")
      .get(inserted.lastInsertRowid) as any;
    return toRecord(created);
  }

  function getActiveDraft(): DraftRecord {
    const existing = db
      .prepare("SELECT * FROM drafts WHERE status = 'draft' LIMIT 1")
      .get() as any;

    if (existing) {
      return toRecord(existing);
    }

    try {
      return insertNewActiveDraft();
    } catch (error) {
      // Lost a race to another process/connection touching the same file:
      // the one_active_draft_idx constraint rejected our insert because a
      // draft now exists. Whoever won, re-select rather than surfacing
      // this as a real error - the invariant this protects ("exactly one
      // active draft") still holds either way.
      const winner = db.prepare("SELECT * FROM drafts WHERE status = 'draft' LIMIT 1").get() as any;
      if (winner) {
        return toRecord(winner);
      }
      throw error;
    }
  }

  function getDraft(id: number): DraftRecord | undefined {
    const row = db.prepare("SELECT * FROM drafts WHERE id = ?").get(id) as any;
    return row ? toRecord(row) : undefined;
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

    // Both writes - finalizing this row, and leaving a fresh active draft
    // behind - happen as one transaction. Without this, a crash between
    // the two statements could leave a finalized record with no active
    // draft at all (the app would self-heal on the next read, since
    // getActiveDraft() creates one lazily, but there'd be a real window
    // where the invariant "exactly one active draft always exists" is
    // false on disk, not just in application logic).
    return withTransaction(db, () => {
      db.prepare(
        "UPDATE drafts SET status = 'final', manager_initials = ?, finalized_at = ? WHERE id = ?",
      ).run(options.managerInitials, options.finalizedAt, id);

      insertNewActiveDraft();

      return toRecord(db.prepare("SELECT * FROM drafts WHERE id = ?").get(id) as any);
    });
  }

  function getHistory(): DraftRecord[] {
    const rows = db
      .prepare("SELECT * FROM drafts WHERE status = 'final' ORDER BY finalized_at DESC")
      .all() as any[];
    return rows.map(toRecord);
  }

  return { getActiveDraft, getDraft, saveActiveDraft, saveDraft, finalizeDraft, getHistory };
}

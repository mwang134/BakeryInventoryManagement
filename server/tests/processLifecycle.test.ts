import test from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// This is the one test in the suite that runs the real server the way it
// actually runs in production: as its own OS process, reading from a real
// file on disk, started and stopped the way an init system or a developer
// actually would - rather than createApp() called in-process against
// ":memory:", which every other test file uses. That in-process shortcut is
// the right tool for testing routes and validation, but it can't tell you
// whether the process actually boots cleanly, listens, shuts down without
// hanging, or picks real data back up after a restart.

const SERVER_ENTRY = path.join(import.meta.dirname, "..", "src", "server.ts");

function startServer(env: Record<string, string>): Promise<{ child: ChildProcess; baseUrl: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--experimental-strip-types", "--experimental-sqlite", SERVER_ENTRY],
      { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] },
    );

    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill();
        reject(new Error("Server did not report listening within 5s"));
      }
    }, 5000);

    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      const match = text.match(/listening on http:\/\/127\.0\.0\.1:(\d+)/);
      if (match && !settled) {
        settled = true;
        clearTimeout(timeout);
        resolve({ child, baseUrl: `http://127.0.0.1:${match[1]}` });
      }
    });

    child.on("exit", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(new Error(`Server exited early (code ${code}). stderr: ${stderr}`));
      }
    });
  });
}

function stopServer(child: ChildProcess): Promise<number | null> {
  return new Promise((resolve) => {
    child.on("exit", (code) => resolve(code));
    child.kill("SIGTERM");
  });
}

test("the real server process starts, serves requests, and shuts down cleanly on SIGTERM", async (t) => {
  const dbPath = path.join(os.tmpdir(), `process-lifecycle-${Date.now()}.db`);
  const productionDbPath = path.join(os.tmpdir(), `process-lifecycle-production-${Date.now()}.db`);
  t.after(() => {
    fs.rmSync(dbPath, { force: true });
    fs.rmSync(productionDbPath, { force: true });
  });

  const { child, baseUrl } = await startServer({
    PORT: "0",
    NOL_DB_PATH: dbPath,
    PRODUCTION_DB_PATH: productionDbPath,
  });

  const draft = await fetch(`${baseUrl}/draft`).then((r) => r.json());
  assert.equal(draft.status, "draft");

  const exitCode = await stopServer(child);
  assert.equal(exitCode, 0, "clean SIGTERM shutdown should exit with code 0, not be force-killed");
});

test("data written before a restart is still there after the process comes back up", async (t) => {
  const dbPath = path.join(os.tmpdir(), `process-lifecycle-restart-${Date.now()}.db`);
  const productionDbPath = path.join(os.tmpdir(), `process-lifecycle-restart-production-${Date.now()}.db`);
  t.after(() => {
    fs.rmSync(dbPath, { force: true });
    fs.rmSync(productionDbPath, { force: true });
  });
  const env = { PORT: "0", NOL_DB_PATH: dbPath, PRODUCTION_DB_PATH: productionDbPath };

  const first = await startServer(env);
  await fetch(`${first.baseUrl}/draft`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ countFullBoxes: 7, countPartialPieces: 2 }),
  });
  await stopServer(first.child);

  // A fresh OS process, pointed at the same on-disk file - this is the
  // actual "restart" scenario (deploy, crash-and-recover, machine reboot),
  // not just a second in-process object.
  const second = await startServer(env);
  const reloaded = await fetch(`${second.baseUrl}/draft`).then((r) => r.json());
  await stopServer(second.child);

  assert.deepEqual(reloaded.data, { countFullBoxes: 7, countPartialPieces: 2 });
});

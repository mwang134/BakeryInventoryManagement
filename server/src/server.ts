import express, { type Express } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDraftStore, type DraftStore } from "./draftStore.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mounts the same draft/finalize/history shape at a given base path. Next
// Order List and Tomorrow's Production are two independent drafts (own
// database file, own active draft) sharing this one generic pattern rather
// than duplicating four routes per feature.
function mountDraftRoutes(app: Express, basePath: string, store: DraftStore) {
  app.get(`${basePath}/draft`, (_req, res) => {
    res.json(store.getActiveDraft());
  });

  app.put(`${basePath}/draft`, (req, res) => {
    res.json(store.saveActiveDraft(req.body ?? {}));
  });

  app.post(`${basePath}/draft/:id/finalize`, (req, res) => {
    const { managerInitials } = req.body ?? {};
    if (!managerInitials) {
      res.status(400).json({ error: "managerInitials is required" });
      return;
    }
    try {
      const finalized = store.finalizeDraft(Number(req.params.id), {
        managerInitials,
        finalizedAt: new Date().toISOString(),
      });
      res.json(finalized);
    } catch (error) {
      res.status(409).json({ error: (error as Error).message });
    }
  });

  app.get(`${basePath}/history`, (_req, res) => {
    res.json(store.getHistory());
  });
}

export function createApp(dbLocation: string, productionDbLocation?: string) {
  const store = createDraftStore(dbLocation);
  const productionStore = createDraftStore(productionDbLocation ?? ":memory:");
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "..", "public")));
  // The calculation engines' single source of truth lives in
  // project/app/src/*.js (each with its own tested suite). Serving them here
  // means the UI imports the exact same modules rather than a copy that
  // could drift out of sync.
  app.use("/lib", express.static(path.join(__dirname, "..", "..", "app", "src")));

  mountDraftRoutes(app, "", store);
  mountDraftRoutes(app, "/production", productionStore);

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  const app = createApp("./next-order-list.db", "./tomorrows-production.db");
  app.listen(port, () => {
    console.log(`Next Order List server listening on http://127.0.0.1:${port}`);
  });
}

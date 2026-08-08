import express from "express";
import { createDraftStore } from "./draftStore.ts";

export function createApp(dbLocation: string) {
  const store = createDraftStore(dbLocation);
  const app = express();
  app.use(express.json());

  app.get("/draft", (_req, res) => {
    res.json(store.getActiveDraft());
  });

  app.put("/draft", (req, res) => {
    res.json(store.saveActiveDraft(req.body ?? {}));
  });

  app.post("/draft/:id/finalize", (req, res) => {
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

  app.get("/history", (_req, res) => {
    res.json(store.getHistory());
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  const app = createApp("./next-order-list.db");
  app.listen(port, () => {
    console.log(`Next Order List server listening on http://127.0.0.1:${port}`);
  });
}

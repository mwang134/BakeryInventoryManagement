import express, { type Express } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDraftStore, type DraftStore } from "./draftStore.ts";
import {
  validateNextOrderListDraftSave,
  validateNextOrderListDraftFinalize,
  validateProductionDraftSave,
  createProductionFinalizeValidator,
  type ValidationResult,
} from "./schemas.ts";
import { TOMORROWS_PRODUCTION_ITEMS } from "../public/productionData.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface DraftValidators {
  validateSave: (data: unknown) => ValidationResult;
  validateFinalize: (data: unknown) => ValidationResult;
}

// Mounts the same draft/finalize/history shape at a given base path. Next
// Order List and Tomorrow's Production are two independent drafts (own
// database file, own active draft) sharing this one generic pattern rather
// than duplicating four routes per feature. Each base path gets its own
// validators, since the two draft types have entirely different shapes and
// completeness rules.
function mountDraftRoutes(app: Express, basePath: string, store: DraftStore, validators: DraftValidators) {
  app.get(`${basePath}/draft`, (_req, res) => {
    res.json(store.getActiveDraft());
  });

  app.put(`${basePath}/draft`, (req, res) => {
    const data = req.body ?? {};
    const result = validators.validateSave(data);
    if (!result.valid) {
      res.status(400).json({ errors: result.errors });
      return;
    }
    res.json(store.saveActiveDraft(data));
  });

  app.post(`${basePath}/draft/:id/finalize`, (req, res) => {
    const { managerInitials } = req.body ?? {};
    // The client escapes managerInitials before ever rendering it back, but
    // that's a rendering-side fix - anyone can bypass the browser and POST
    // directly here, so the field itself is still bounded at the door too.
    if (
      !managerInitials ||
      typeof managerInitials !== "string" ||
      !managerInitials.trim() ||
      managerInitials.length > 20
    ) {
      res.status(400).json({ error: "managerInitials is required and must be 20 characters or fewer" });
      return;
    }

    const draft = store.getDraft(Number(req.params.id));
    if (!draft) {
      res.status(404).json({ error: "Draft not found" });
      return;
    }

    const finalizeCheck = validators.validateFinalize(draft.data);
    if (!finalizeCheck.valid) {
      res.status(400).json({ errors: finalizeCheck.errors });
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

// Blocks inline/external scripts and any cross-origin fetch/connect target
// outright. style-src allows 'unsafe-inline' as a deliberate, documented
// relaxation - the chart (server/public/app.js, renderBarChart) positions
// bars via inline style="top:...px" computed per-value in JS, and hashing
// or nonce-ing every one of those is impractical. Revisit only if the chart
// is refactored to set styles through the DOM API instead of inline HTML.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export function createApp(dbLocation: string, productionDbLocation?: string) {
  const store = createDraftStore(dbLocation);
  const productionStore = createDraftStore(productionDbLocation ?? ":memory:");
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("Content-Security-Policy", CONTENT_SECURITY_POLICY);
    next();
  });
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "..", "public")));
  // The calculation engines' single source of truth lives in
  // project/app/src/*.js (each with its own tested suite). Serving them here
  // means the UI imports the exact same modules rather than a copy that
  // could drift out of sync.
  app.use("/lib", express.static(path.join(__dirname, "..", "..", "app", "src")));

  mountDraftRoutes(app, "", store, {
    validateSave: validateNextOrderListDraftSave,
    validateFinalize: validateNextOrderListDraftFinalize,
  });
  mountDraftRoutes(app, "/production", productionStore, {
    validateSave: validateProductionDraftSave,
    validateFinalize: createProductionFinalizeValidator(TOMORROWS_PRODUCTION_ITEMS),
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  const app = createApp("./next-order-list.db", "./tomorrows-production.db");
  app.listen(port, "127.0.0.1", () => {
    console.log(`Next Order List server listening on http://127.0.0.1:${port}`);
  });
}

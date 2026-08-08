import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL("../index.html", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const requestedPath = normalize(join(root, relativePath));

    if (!requestedPath.startsWith(root)) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    const fileStats = await stat(requestedPath);
    if (!fileStats.isFile()) throw new Error("Not a file");
    const content = await readFile(requestedPath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(requestedPath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`BakeryOps is running at http://127.0.0.1:${port}/`);
  console.log("Press Ctrl+C to stop.");
});

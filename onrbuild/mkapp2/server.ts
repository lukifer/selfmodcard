import { existsSync, watchFile } from "node:fs";
// const DEV = process.env.DEV === "1" || !existsSync("dist/app.js");
const DEV = true;

const server = Bun.serve({
  port: 5173,
  idleTimeout: 0,
  fetch: async(req) => {
    const url = new URL(req.url);

    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    // const file = Bun.file("dist" + path);
    // if (!file.size) return new Response("Not found", { status: 404 });

    const headers = {
      "Cache-Control": "no-store",
      "Pragma": "no-cache",
      "Expires": "0",
      "Content-Type": contentType(path)
    };

    // In dev, transpile src/app.ts on-the-fly as /app.js
    if (DEV && path === "/app.js") {
      const src = await Bun.file("src/app.ts").text();
      const js = new Bun.Transpiler({ loader: "ts", target: "browser" }).transformSync(src);
      return new Response(js, { headers });
    }

    let file = Bun.file("dist" + path);
    if (!(await file.exists())) {
      if (DEV && path.startsWith("/vendor/")) {
        file = Bun.file("." + path); // serve from ./vendor/*
      }
      else if (DEV && path.startsWith("/data/")) {
        file = Bun.file("src" + path); // ./src/data/*
      }
    }
    if (!(await file.exists())) return new Response("Not found", { status: 404 });
    return new Response(file, { headers });
  }
});

console.log(`Dev server at http://localhost:${server.port}`);

function contentType(p: string) {
  if (p.endsWith(".html")) return "text/html; charset=utf-8";
  if (p.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (p.endsWith(".css")) return "text/css; charset=utf-8";
  if (p.endsWith(".json")) return "application/json; charset=utf-8";
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
  if (p.endsWith(".svg")) return "image/svg+xml; charset=utf-8";
  return "application/octet-stream";
}

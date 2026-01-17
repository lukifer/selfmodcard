import { $ } from "bun";
import { existsSync, mkdirSync, copyFileSync, writeFileSync, watch } from "node:fs";

await $`rm -rf dist`;
mkdirSync("dist", { recursive: true });
mkdirSync("dist/vendor", { recursive: true });
mkdirSync("dist/data", { recursive: true });

copyFileSync("index.html", "dist/index.html");
if (existsSync("src/styles.css")) copyFileSync("src/styles.css", "dist/styles.css");
copyFileSync("vendor/van.min.js", "dist/vendor/van.min.js");

if (existsSync("assets")) {
  await $`cp -r assets dist/assets`;
}

const result = await Bun.build({
  entrypoints: ["src/app.ts"],
  outdir: "dist",
  target: "browser",
  minify: false,
  sourcemap: "inline",
  splitting: false
});
if (!result.success) {
  console.error("Build failed:", result.logs);
  process.exit(1);
}

console.log("Built → dist/");
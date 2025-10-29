#!/usr/bin/env node
// run.mjs
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { parse } from "csv-parse";
import { firefox, webkit, chromium } from "playwright";

/** -------------------- CLI ARGS -------------------- **/
const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args
    .filter(a => a.startsWith("--"))
    .map(a => {
      const [k, ...rest] = a.replace(/^--/, "").split("=");
      return [k, rest.join("=") || true];
    })
);

// Inputs (at least one source of URLs)
const INPUT = flags.input || flags.file || "";   // local file containing URLs (txt/csv/tsv)
const SHEET = flags.sheet || "";                 // Google Sheet export CSV URL

// Behavior flags
// NOTE: Review/approval is ON by default. Disable with --auto (optionally add --headless).
const APPROVAL = !("auto" in flags);
// const APPROVAL = false;
// console.log('APPROVAL', APPROVAL);
// console.log('flags', flags);
const BROWSER = (flags.browser || process.env.BROWSER || "firefox").toLowerCase(); // firefox|webkit|chromium
const HEADLESS = ("auto" in flags) || !!flags.headless;  // headless if auto; override with --headless
const OUTDIR = flags.outdir || "output";
const ORIGDIR = flags.originals || "originals"; // originals directory
const JSON_OUT = flags.json || flags["json-out"] || "cards.json"; // output JSON file

// Find/replace (single pair fallback)
const FIND = flags.find || "foo";
const REPL = flags.replace || "bar";

// Optional: a file containing multiple find/replace pairs, separated by a blank line.
// Supports both literal and regex (with capturing) patterns:
//
// find value one
// replace value one
//
// /foo(\d+)/gi
// bar-$1
//
// regex: ^(hello)\s+(world)$
// $2, $1
//
const REPL_FILE = flags["replacements"] || flags["replacements-file"] || "";

// Timeouts (ms)
const BUILD_READY_TIMEOUT = Number(flags.buildReadyTimeout || 180000);   // wait for "Save PNG" data URI to appear
const NAV_TIMEOUT = Number(flags.navTimeout || 45000);

// Domain remap (useful for local dev): --map-domain=example.com,localhost:5173
let MAP_FROM = "", MAP_TO = "";
if (flags["map-domain"]) {
  const [from, to] = String(flags["map-domain"]).split(",");
  MAP_FROM = (from || "").trim();
  MAP_TO = (to || "").trim();
}

/** -------------------- FS HELPERS -------------------- **/
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
function sanitizeFilename(s, fallback = "file") {
  const name = (s || "").toString().trim() || fallback;
  return name.replace(/[\\/:*?"<>|]+/g, "_").slice(0, 120);
}
function stemOf(filename) {
  const i = filename.lastIndexOf(".");
  return i > 0 ? filename.slice(0, i) : filename;
}
function stripExt(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(0, i) : name;
}
function toRelUnix(p, base) {
  return path.relative(base, p).split(path.sep).join("/");
}

/** -------------------- READ URLS -------------------- **/
async function readUrls() {
  const urls = [];

  // From Google Sheet (CSV)
  if (SHEET) {
    const res = await fetch(SHEET);
    if (!res.ok) throw new Error(`Failed to fetch sheet CSV: ${res.status} ${res.statusText}`);
    const text = await res.text();

    await new Promise((resolve, reject) => {
      parse(
        text,
        { columns: true, skip_empty_lines: true, relax_column_count: true },
        (err, records) => {
          if (err) return reject(err);
          if (!records?.length) return resolve();
          const cols = Object.keys(records[0]);

          // Prefer "smc url" (case-insensitive), then "url", then first column
          const lcCols = cols.map(c => c.toLowerCase());
          const smcIdx = lcCols.indexOf("smc url");
          const urlIdx = lcCols.indexOf("url");
          const pickIdx = smcIdx !== -1 ? smcIdx : (urlIdx !== -1 ? urlIdx : 0);
          const urlCol = cols[pickIdx];

          for (const row of records) {
            const u = String(row[urlCol] || "").trim();
            if (u) urls.push(u);
          }
          resolve();
        }
      );
    });
  }

  // From local file (txt/csv/tsv)
  if (INPUT) {
    const content = fs.readFileSync(INPUT, "utf8");
    let consumedCSV = false;
    try {
      await new Promise((resolve, reject) => {
        parse(content, { columns: true, skip_empty_lines: true }, (err, records) => {
          if (err) return reject(err);
          if (records?.length) {
            const cols = Object.keys(records[0]);
            const lcCols = cols.map(c => c.toLowerCase());
            const smcIdx = lcCols.indexOf("smc url");
            const urlIdx = lcCols.indexOf("url");
            const pickIdx = smcIdx !== -1 ? smcIdx : (urlIdx !== -1 ? urlIdx : 0);
            const urlCol = cols[pickIdx];

            for (const row of records) {
              const u = String(row[urlCol] || "").trim();
              if (u) urls.push(u);
            }
            consumedCSV = true;
          }
          resolve();
        });
      });
    } catch { /* fall through to plain lines */ }

    if (!consumedCSV) {
      content.split(/\r?\n/).forEach(line => {
        const u = line.trim();
        if (u) urls.push(u);
      });
    }
  }

  if (!urls.length) {
    throw new Error("No URLs found. Provide --sheet=<csv-export-url> and/or --input=<file>");
  }

  // Optional domain swap
  if (MAP_FROM && MAP_TO) {
    return urls.map(u => u.replace(MAP_FROM, MAP_TO));
  }
  return urls;
}

/** -------------------- READ REPLACEMENTS -------------------- **/
// Returns array of ops for evaluate():
//   { kind: "regex", source: "foo(\\d+)", flags: "gi", replace: "bar-$1" }
//   { kind: "literal", find: "foo", replace: "bar" }
function readReplacementPairs() {
  if (!REPL_FILE) return [{ kind: "literal", find: String(FIND), replace: String(REPL) }];

  const raw = fs.readFileSync(REPL_FILE, "utf8");
  const blocks = raw.split(/\r?\n\s*\r?\n/g).map(b => b.trim()).filter(Boolean);
  const ops = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map(s => s.trim());
    if (!lines.length) continue;
    const findLine = lines[0] ?? "";
    const replaceLine = lines[1] ?? "";

    const parsed = parseFindAsRegex(findLine);
    if (parsed) {
      ops.push({ kind: "regex", source: parsed.source, flags: parsed.flags, replace: replaceLine ?? "" });
    } else {
      ops.push({ kind: "literal", find: findLine, replace: replaceLine ?? "" });
    }
  }

  if (!ops.length) {
    return [{ kind: "literal", find: String(FIND), replace: String(REPL) }];
  }
  return ops;
}

// Accept: /pattern/flags  OR  regex: pattern [;flags]  OR  re: pattern [;flags]
function parseFindAsRegex(line) {
  if (!line) return null;
  const s = String(line).trim();

  if (s.startsWith("/") && s.lastIndexOf("/") > 0) {
    const last = s.lastIndexOf("/");
    const body = s.slice(1, last);
    const flags = s.slice(last + 1);
    try { new RegExp(body, flags); return { source: body, flags }; } catch {}
  }

  const m = /^(?:regex:|re:)\s*(.*)$/i.exec(s);
  if (m) {
    const rest = m[1].trim();
    const semi = rest.lastIndexOf(";");
    if (semi !== -1) {
      const body = rest.slice(0, semi).trim();
      const flags = rest.slice(semi + 1).trim();
      try { new RegExp(body, flags); return { source: body, flags }; } catch {}
    } else {
      try { new RegExp(rest); return { source: rest, flags: "" }; } catch {}
    }
  }
  return null;
}

/** -------------------- BROWSER FACTORY -------------------- **/
function getBrowserType(name) {
  switch (name) {
    case "firefox": return firefox;
    case "webkit": return webkit;     // Safari engine
    case "chromium": return chromium; // Chrome/Edge engine
    default: return firefox;
  }
}

/** -------------------- PAGE HELPERS -------------------- **/
async function waitForReactIdle(page, { timeout = 15000 } = {}) {
  await page.waitForLoadState("domcontentloaded", { timeout });
  await page.waitForLoadState("networkidle", { timeout }).catch(() => {});
  await page.waitForTimeout(100);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.locator("textarea").first().waitFor({ timeout }).catch(() => {});
}

async function replaceInFirstTextarea(page, ops) {
  await page.evaluate((ops) => {
    const ta = document.querySelector("textarea");
    if (!ta) return;

    let value = ta.value ?? "";
    for (const op of ops) {
      if (op.kind === "regex") {
        let re; try { re = new RegExp(op.source, op.flags || ""); } catch { continue; }
        value = value.replace(re, op.replace ?? "");
      } else {
        const find = String(op.find ?? "");
        const repl = String(op.replace ?? "");
        if (find) {
          const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          value = value.replace(new RegExp(escaped, "g"), repl);
        }
      }
    }

    if (value === (ta.value ?? "")) return;

    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setter ? setter.call(ta, value) : (ta.value = value);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.dispatchEvent(new Event("change", { bubbles: true }));
  }, ops);
}

function locatorForAction(page, text) {
  return page
    .locator(`role=button[name="${text}"]`)
    .or(page.locator(`role=link[name="${text}"]`))
    .or(page.locator(`button:has-text("${text}")`))
    .or(page.locator(`a:has-text("${text}")`));
}

async function clickByText(page, text) {
  const loc = locatorForAction(page, text).first();
  await loc.waitFor({ timeout: 60000 });
  await loc.click();
}

async function promptApproval(page, url, onReload) {
  await page.addStyleTag({
    content: `
      #__await_approval__ {
        position: fixed; right: 12px; bottom: 12px; z-index: 999999;
        background: rgba(0,0,0,.2); color: #fff; padding: 8px 12px;
        border-radius: 10px; font: 13px/1.3 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Ubuntu,Helvetica,Arial,sans-serif;
        pointer-events: none; user-select: none;
      }`
  });
  await page.evaluate((u) => {
    let div = document.getElementById("__await_approval__");
    if (!div) {
      div = document.createElement("div");
      div.id = "__await_approval__";
      document.body.appendChild(div);
    }
    div.textContent = `Waiting for approval… (${u})  •  Terminal: [Enter]=continue  [s]=skip  [r]=reload  [q]=quit`;
  }, url);

  process.stdout.write(`\nReview page:\n  ${url}\n[Enter]=continue, [s]=skip, [r]=reload, [q]=quit: `);
  return new Promise(resolve => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once("data", async (buf) => {
      const key = buf.toString();
      process.stdin.setRawMode(false);
      if (key === "s" || key === "S") resolve("skip");
      else if (key === "r" || key === "R") resolve("reload");
      else if (key === "q" || key === "Q") resolve("quit");
      else resolve("ok");
    });
  }).then(async (action) => {
    if (action === "reload") {
      await page.reload({ waitUntil: "domcontentloaded" });
      await waitForReactIdle(page);
      if (typeof onReload === "function") await onReload();
    }
    return action;
  });
}

/** ---- Data URI helpers (anchor[download][href^="data:"]) ---- **/
async function waitForDataHref(page, text, { timeout = BUILD_READY_TIMEOUT } = {}) {
  const loc = locatorForAction(page, text).first();
  await loc.waitFor({ timeout: Math.min(30000, timeout) }).catch(() => {});

  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const tag = (await loc.evaluate(el => el.tagName)).toLowerCase();
      if (tag === "a") {
        const href = await loc.getAttribute("href");
        const downloadName = (await loc.getAttribute("download")) || "";
        if (href && /^data:image\/png(?:;[^,]*)?,/i.test(href)) {
          return { href, downloadName };
        }
      } else {
        const a = loc.locator("a");
        if (await a.count()) {
          const href = await a.first().getAttribute("href");
          const downloadName = (await a.first().getAttribute("download")) || "";
          if (href && /^data:image\/png(?:;[^,]*)?,/i.test(href)) {
            return { href, downloadName };
          }
        }
      }
    } catch {}
    await page.waitForTimeout(200);
  }
  throw new Error(`Timed out waiting for "${text}" data URI`);
}

function decodeDataURI(dataURI) {
  const m = /^data:([^;,]*)?(;base64)?,(.*)$/i.exec(dataURI);
  if (!m) throw new Error("Invalid data URI");
  const isBase64 = !!m[2];
  const dataPart = m[3];
  if (isBase64) return Buffer.from(dataPart.replace(/\s+/g, ""), "base64");
  return Buffer.from(decodeURIComponent(dataPart), "utf8");
}
function mediaTypeFromDataURI(dataURI) {
  const m = /^data:([^;,]*)/i.exec(dataURI);
  return m ? (m[1] || "") : "";
}

/** ---- Page metadata: side, faction, kind, image_url ---- **/
async function readMeta(page) {
  return await page.evaluate(() => {
    function valOfSelect(id) {
      const el = document.getElementById(id);
      if (!el) return "";
      const v = el.value ?? "";
      if (v) return String(v);
      const opt = el.options?.[el.selectedIndex];
      return opt ? String(opt.textContent || "").trim() : "";
    }
    function valOfInput(id) {
      const el = document.getElementById(id);
      return el ? String(el.value ?? "").trim() : "";
    }
    function subtypes() {
      const items = document.querySelectorAll('.ts-control .item') ?? [];
      return [...items].map(el => el.childNodes[0].textContent ?? el.innerText);
    }
    return {
      name: valOfInput("name"),
      side: (valOfSelect("side") || "").toLowerCase(),
      faction: (valOfSelect("faction") || "").toLowerCase(),
      kind: (valOfSelect("kind") || "").toLowerCase(),
      subtypes: subtypes(),
      text: valOfInput("text"),
      imageUrl: valOfInput("image_url")
    };
  });
}

/** ---- Originals download helper ---- **/
async function saveOriginalImage(imageUrl, baseDir, subdirParts, preferredStem) {
  try {
    if (!imageUrl) return false;

    const subdir = path.join(baseDir, ...subdirParts.map(sanitizeFilename));
    ensureDir(subdir);

    // Always use preferredStem for the filename base (to match output),
    // only the extension may differ based on the actual image type.
    const safeStem = sanitizeFilename(preferredStem || "original");

    // Handle data: URI directly
    if (/^data:/i.test(imageUrl)) {
      const mt = mediaTypeFromDataURI(imageUrl).toLowerCase();
      const ext = extFromContentType(mt) || ".bin";
      const filePath = path.join(subdir, safeStem + ext);
      const buf = decodeDataURI(imageUrl);
      fs.writeFileSync(filePath, buf);
      return true;
    }

    // Otherwise fetch
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`fetch ${imageUrl} -> ${res.status}`);
    const arrbuf = await res.arrayBuffer();
    const buf = Buffer.from(arrbuf);

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    // Choose extension based on content type; if missing, try URL name; else default .bin
    let ext = extFromContentType(ct);
    if (!ext) {
      const urlName = (() => { try { return path.basename(new URL(imageUrl).pathname); } catch { return ""; } })();
      ext = extFromName(urlName) || ".bin";
    }

    const filePath = path.join(subdir, safeStem + ext);
    fs.writeFileSync(filePath, buf);
    return filePath;
  } catch (e) {
    console.warn(`   ↳ originals save failed: ${(e && e.message) || e}`);
    return null;
  }
}

function extFromContentType(ct) {
  if (/png/.test(ct)) return ".png";
  if (/jpe?g/.test(ct)) return ".jpg";
  if (/webp/.test(ct)) return ".webp";
  if (/gif/.test(ct)) return ".gif";
  if (/svg/.test(ct)) return ".svg";
  return "";
}
function extFromName(name) {
  const m = /\.[a-z0-9]{2,5}$/i.exec(name || "");
  return m ? m[0] : "";
}
function ensurePngExt(name) {
  return /\.png$/i.test(name) ? name : `${name}.png`;
}

/** -------------------- MAIN -------------------- **/
(async () => {
  const urls = await readUrls();
  const replacementOps = readReplacementPairs();

  ensureDir(OUTDIR);
  ensureDir(ORIGDIR);

  const browserType = getBrowserType(BROWSER);
  const browser = await browserType.launch({ headless: !!HEADLESS, downloadsPath: path.resolve(OUTDIR) });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1200, height: 900 }});
  const page = await context.newPage();

  const cards = [];
  let quitRequested = false;

  for (let i = 0; i < urls.length; i++) {
  // for (let i = 0; i < 10; i++) {
    if (quitRequested) break;
    const url = urls[i].replace("https://hack.themind.gg", "http://localhost:3000");
    console.log(`\n[${i + 1}/${urls.length}] ${url}`);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
      await waitForReactIdle(page);

      // Apply replacements in the first textarea
      await replaceInFirstTextarea(page, replacementOps);

      // Optional approval loop
      if (APPROVAL) {
        while (true) {
          const action = await promptApproval(page, url, async () => {
            await replaceInFirstTextarea(page, replacementOps);
          });
          if (action === "reload") continue;
          if (action === "skip") throw new Error("Skipped by user");
          if (action === "quit") { quitRequested = true; throw new Error("Quit requested"); }
          break;
        }
      }

      // Read side/faction/kind and image_url
      const meta = await readMeta(page);
      const side = meta.side || "unknown_side";
      const faction = meta.faction || "unknown_faction";
      const kind = meta.kind || "unknown_kind";
      const subPathParts = [side, faction, kind];

      // Click "Build PNG"
      await clickByText(page, "Build PNG");

      // Wait for "Save PNG" data URI
      const { href: dataURI, downloadName } = await waitForDataHref(page, "Save PNG", { timeout: BUILD_READY_TIMEOUT });

      // Compose a filename: prefer <a download="...">, else page title + url tail
      let base = sanitizeFilename(downloadName, "");
      if (!base) {
        base = sanitizeFilename(await page.title(), "image");
        const u = new URL(page.url());
        const tail = sanitizeFilename(u.pathname.split("/").filter(Boolean).slice(-1)[0] || u.search || u.hash, "");
        if (tail) base += `__${tail}`;
      }
      base = ensurePngExt(base); // output is PNG

      // Output path = output/<side>/<faction>/<kind>/<base>
      const outSubdir = path.join(OUTDIR, ...subPathParts.map(sanitizeFilename));
      ensureDir(outSubdir);
      const outFile = path.join(outSubdir, base);

      // Decode and write generated PNG
      const buf = decodeDataURI(dataURI);
      fs.writeFileSync(outFile, buf);
      console.log(`✔ Saved: ${outFile}`);

      // Convert PNG to JPG using ffmpeg (web-optimized quality)
      const jpgFile = outFile.replace(/\.png$/i, '.jpg');
      execSync(`ffmpeg -i "${outFile}" -q:v 5 "${jpgFile}" -y`, { stdio: 'inherit' });
      console.log(`✔ Converted to JPG: ${jpgFile}`);

      // Originals: MUST match the same filename base, only extension differs.
      const preferredStem = stemOf(base); // e.g., "My Card__slug"
      const filteredImageUrl = meta.imageUrl.replace('_edit.', '.');
      const originalImagePath = await saveOriginalImage(filteredImageUrl, ORIGDIR, subPathParts, preferredStem);

      let originalJpgFile = null;
      if (originalImagePath && /\.png$/i.test(originalImagePath)) {
        originalJpgFile = originalImagePath.replace(/\.png$/i, '.jpg');
        execSync(`ffmpeg -i "${originalImagePath}" -q:v 5 "${originalJpgFile}" -y`, { stdio: 'inherit' });
        console.log(`✔ Converted original to JPG: ${originalJpgFile}`);
      }

      // Add card to JSON array
      if (originalImagePath || originalJpgFile) {
        const backPath = originalJpgFile || originalImagePath;
        const relFront = toRelUnix(path.resolve(jpgFile), path.resolve(OUTDIR));
        const relBack = toRelUnix(path.resolve(backPath), path.resolve(ORIGDIR));
        const filename = path.basename(jpgFile);
        const baseName = stripExt(filename).replace(/[-_]/g, " ");

        const key = [side, faction, kind, stripExt(filename).toLowerCase().replace(/\s+/g, "-")].join("_");

        cards.push({
          id: key,
          name: meta.name,
          side,
          faction,
          type: kind,
          subtypes: meta.subtypes,
          text: meta.text,
          front: `./${OUTDIR}/${relFront}`,
          back: `./${ORIGDIR}/${relBack}`
        });
      }

    } catch (err) {
      const msg = (err && err.message) || String(err);
      if (msg === "Quit requested") break;
      console.warn(`⚠ Error on ${url}: ${msg}`);
      // continue to next URL
    }
  }

  await browser.close();
  
  if (cards.length > 0) {
    fs.writeFileSync(JSON_OUT, JSON.stringify(cards, null, 2));
    console.log(`✅ Wrote ${cards.length} cards to ${JSON_OUT}`);
  }
  
  console.log("\nDone.");
})().catch(e => {
  console.error(e);
  process.exit(1);
});


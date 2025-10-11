#!/usr/bin/env node
/* build.js — sync version, now ignores dot-prefixed files/dirs (e.g., .DS_Store) */
const fs = require('fs');
const path = require('path');

const FRONT_DIR = path.resolve('front');
const BACK_DIR  = path.resolve('back');
const DIST_DIR  = path.resolve('dist');

/**
 * Recursively list files under dir (sync), skipping any entries whose name starts with a dot.
 * That excludes files like .DS_Store and directories like .git.
 */
function listFilesSync(dir) {
  const out = [];
  function walk(d) {
    let entries = [];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); }
    catch { return; }
    for (const ent of entries) {
      // Skip dot-prefixed entries
      if (!ent || !ent.name || ent.name.startsWith('.')) continue;

      const p = path.join(d, ent.name);
      if (ent.isDirectory()) {
        walk(p);
      } else {
        out.push(p);
      }
    }
  }
  walk(dir);
  return out;
}

function toKey(abs, root) {
  const rel = path.relative(root, abs).split(path.sep).join('/');
  const noExt = rel.replace(/\.[^.]+$/, '');
  return noExt.toLowerCase();
}

function mkdirpSync(p) {
  fs.mkdirSync(p, { recursive: true });
}

/**
 * Copy a directory tree to dist preserving structure, using listFilesSync
 * (which already excludes dotfiles/dirs).
 */
function copyTreeSync(src, dstRoot) {
  const files = listFilesSync(src);
  for (const abs of files) {
    const rel = path.relative(src, abs);
    const outPath = path.join(dstRoot, path.basename(src), rel);
    mkdirpSync(path.dirname(outPath));
    fs.copyFileSync(abs, outPath);
  }
}

function main() {
  const frontFiles = listFilesSync(FRONT_DIR);
  const backFiles  = listFilesSync(BACK_DIR);

  const fronts = new Map(frontFiles.map(f => [toKey(f, FRONT_DIR), f]));
  const backs  = new Map(backFiles.map(b => [toKey(b, BACK_DIR), b]));

  const allKeys = new Set([...fronts.keys(), ...backs.keys()]);
  const cards = [];

  for (const key of allKeys) {
    const frontAbs = fronts.get(key) || null;
    const backAbs  = backs.get(key)  || null;

    const parts = key.split('/');
    if (parts.length < 3) continue; // require side/faction/type/...

    const [side, faction, type, ...rest] = parts;
    const frontRel = frontAbs ? path.relative(process.cwd(), frontAbs).split(path.sep).join('/') : null;
    const backRel  = backAbs  ? path.relative(process.cwd(), backAbs).split(path.sep).join('/')  : null;
    const baseName = path.basename(frontAbs || backAbs, path.extname(frontAbs || backAbs));

    cards.push({
      id: key,
      name: baseName,
      side, faction, type,
      path: rest.length ? rest.join('/') : '',
      front: frontRel,
      back:  backRel
    });
  }

  cards.sort((a, b) =>
    a.side.localeCompare(b.side)
    || a.faction.localeCompare(b.faction)
    || a.type.localeCompare(b.type)
    || a.name.localeCompare(b.name)
  );

  mkdirpSync(DIST_DIR);
  fs.writeFileSync(path.join(DIST_DIR, 'cards.json'), JSON.stringify(cards, null, 2));

  copyTreeSync(FRONT_DIR, DIST_DIR);
  copyTreeSync(BACK_DIR, DIST_DIR);

  console.log(`Wrote ${cards.length} card records to dist/cards.json`);
}

main();


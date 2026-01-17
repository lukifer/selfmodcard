#!/usr/bin/env bash
set -euo pipefail

# Fetch VanJS once (pinned version) if missing
mkdir -p vendor
if [ ! -f vendor/van.min.js ]; then
  echo "Fetching VanJS…"
  curl -sSLf https://cdn.jsdelivr.net/npm/vanjs-core@1.5.3/van.min.js -o vendor/van.min.js
fi

# bun run makecarddata.js
cp ../cards.json ./assets/data/
cp -r ../originals ./assets/cards/back
cp -r ../output ./assets/cards/front

bun run build.ts
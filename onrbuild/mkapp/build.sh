#!/usr/bin/env bash
set -euo pipefail

# Clean and (re)create dist
rm -rf dist
mkdir -p dist

# Copy the static shell
cp -f index.html dist/index.html

# Run generator (writes dist/cards.json and copies images)
node build.js

echo "\n✅ Build complete. Upload the ./dist folder to your static host."

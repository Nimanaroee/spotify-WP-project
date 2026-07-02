#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> npm install"
npm install

echo "==> removing JS/JSX shims"
rm -f vite.config.js
find src -type f \( -name '*.js' -o -name '*.jsx' \) -delete

echo "==> typecheck"
npm run typecheck

echo "==> build"
npm run build

echo "==> test"
npm test -- --run

echo "==> all checks passed"

#!/usr/bin/env bash
set -euo pipefail

# Crowe Code quickstart
# Usage:
#   ./quickstart.sh                # install (if needed) and start dev server
#   ./quickstart.sh dev            # start dev server
#   ./quickstart.sh build          # type-check bundle
#   ./quickstart.sh preview        # serve the production build
#   ./quickstart.sh lint           # run eslint

command="${1:-dev}"

require() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' is not installed or not on PATH." >&2
    exit 1
  fi
}

require node
require npm

# Install dependencies if node_modules is missing
if [ ! -d node_modules ]; then
  echo "→ Installing dependencies..."
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
fi

case "$command" in
  dev)
    echo "→ Starting Vite dev server..."
    exec npm run dev
    ;;
  build)
    echo "→ Building project (tsc + vite)..."
    npm run build
    ;;
  preview)
    echo "→ Previewing production build..."
    npm run build
    exec npm run preview
    ;;
  lint)
    echo "→ Running ESLint..."
    exec npm run lint
    ;;
  *)
    echo "Unknown command: $command" >&2
    echo "Usage: $0 [dev|build|preview|lint]" >&2
    exit 2
    ;;
 esac

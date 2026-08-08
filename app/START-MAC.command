#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install it from https://nodejs.org/"
  read -r -p "Press Enter to close."
  exit 1
fi
( sleep 1; open http://127.0.0.1:4173/ ) &
exec node scripts/serve.js

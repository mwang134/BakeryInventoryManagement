#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install it from https://nodejs.org/"
  exit 1
fi
printf 'Open http://127.0.0.1:4173/ in your browser.\n'
exec node scripts/serve.js

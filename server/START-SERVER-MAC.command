#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install it from https://nodejs.org/"
  read -r -p "Press Enter to close."
  exit 1
fi

NODE_MAJOR_MINOR=$(node -e "const [maj, min] = process.versions.node.split('.').map(Number); console.log(maj * 100 + min);")
if [ "$NODE_MAJOR_MINOR" -lt 2206 ]; then
  echo "This server needs Node.js 22.6.0 or newer (found $(node --version))."
  echo "It uses node:sqlite and --experimental-strip-types, both added in 22.6.0."
  read -r -p "Press Enter to close."
  exit 1
fi

PORT="${PORT:-4000}"
( sleep 1; open "http://127.0.0.1:${PORT}/" ) &
exec env PORT="$PORT" npm run dev

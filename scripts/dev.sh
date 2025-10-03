#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORTS="3000 3001 3002 3003"

if command -v lsof >/dev/null 2>&1; then
  if PIDS=$(lsof -ti tcp:${PORTS// /,} 2>/dev/null); then
    if [ -n "$PIDS" ]; then
      echo "Killing stale processes on ports $PORTS"
      kill -9 $PIDS 2>/dev/null || true
    fi
  fi
fi

trap 'kill $(jobs -p) 2>/dev/null || true' EXIT

echo "Starting API on :3001"
pnpm --filter api start:dev &

echo "Waiting for API health..."
until curl -sf http://localhost:3001/healthz >/dev/null; do
  echo "waiting for API…"
  sleep 1
done

echo "Starting Next on :3000"
pnpm --filter next dev -p 3000

#!/usr/bin/env sh
# Capture Vercel production runtime logs into logs/vercel/ while this machine is on.
#   ./scripts/tail-vercel-logs.sh           # keep polling until Ctrl+C
#   ./scripts/tail-vercel-logs.sh --once    # one poll (for cron)
# Needs VERCEL_TOKEN (see docs/logging.md). Options are environment variables
# documented at the top of scripts/tail-vercel-logs.js.
set -eu

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "VERCEL_TOKEN is not set. Create a token at https://vercel.com/account/tokens and export it (see docs/logging.md)." >&2
  exit 2
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not on PATH. Install Node 20+." >&2
  exit 2
fi

cd "$(dirname "$0")/.."
exec node scripts/tail-vercel-logs.js "$@"

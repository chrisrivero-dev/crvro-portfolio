#!/bin/bash
# ============================================================
# Supervised entry point for the Public Captain worker.
#
# Loads PUBLIC_CAPTAIN_WORKER_SECRET (and any other worker env vars)
# from worker/.env.worker (gitignored, never committed) so the
# secret never has to sit in plaintext inside a launchd plist, which
# other local processes/users could potentially read.
#
# Runs the worker under Node's permission model as defense-in-depth:
#   --allow-fs-read scoped to this repo only (it never needs to read
#     anything outside it -- no home-directory access, no dotfiles)
#   no --allow-fs-write at all (the worker never writes a file)
#   no --allow-child-process (no shell-out capability)
#   no --allow-addons / --allow-wasi / --allow-worker (unused, so denied)
# This is a real, OS-enforced restriction, not just a code convention
# -- verified: writeFileSync and child_process.execSync both throw
# ERR_ACCESS_DENIED under this flag set. It is still defense-in-depth,
# not the primary security boundary -- the primary boundary is that
# the code itself never calls these APIs at all (see docs/PUBLIC_CAPTAIN.md).
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f worker/.env.worker ]; then
  set -a
  # shellcheck disable=SC1091
  source worker/.env.worker
  set +a
fi

# launchd runs this with a minimal environment that doesn't include the
# interactive shell's PATH, so resolve node explicitly rather than
# relying on `node` being found on PATH.
NODE_BIN="${NODE_BIN:-/Users/christopher/.hermes/node/bin/node}"
if ! [ -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi

exec "$NODE_BIN" \
  --permission \
  --allow-fs-read="$PWD" \
  worker/public-captain.mjs

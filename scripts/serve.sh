#!/usr/bin/env bash
# Build and serve a production build, reliably, without disturbing `npm run dev`.
#
#   scripts/serve.sh 4100
#
# Two hard-won rules are baked in here.
#
# **It never touches `.next`.** It builds into `.next-serve` via NEXT_DIST_DIR
# (see next.config.mjs). Sharing `.next` with a dev server is not a small
# inconvenience: the running dev server keeps its old routing manifest and
# server-action ids in memory while serving freshly built chunks off disk, and
# the browser then reports "Server Action was not found on the server", a 404
# on a route that plainly exists, and "RSC payload created by a development
# version of React while using a production version on the client". All three
# read as application bugs. None of them are.
#
# **It only kills its own servers.** An earlier version tried to kill every
# `next start` on the machine, which was both too broad (it would have taken
# out an unrelated project) and, because of a no-op `tr -d ''` and a `wmic`
# that no longer ships on current Windows, silently too narrow — it killed
# nothing at all and leaked a server per run. Matching on the dist dir is the
# precise thing: those processes are unambiguously ours.
set -euo pipefail

PORT="${1:-4100}"
DIST=".next-serve"
LOG="${TEMP:-/tmp}/tembera-serve-$PORT.log"
export NEXT_DIST_DIR="$DIST"

# 1. Stop our own previous servers. PowerShell rather than wmic: wmic is
#    deprecated and absent on current Windows, and its absence was silent.
if command -v powershell >/dev/null 2>&1; then
  powershell -NoProfile -Command "
    Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" |
      Where-Object { \$_.CommandLine -like '*NEXT_DIST_DIR*' -or \$_.CommandLine -like '*next*start*-p*$PORT*' } |
      ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue }
  " >/dev/null 2>&1 || true
fi

# Anything still holding the port, whoever it belongs to — we are about to bind
# it, so it has to go either way.
if command -v netstat >/dev/null 2>&1; then
  { netstat -ano | grep ":$PORT .*LISTENING" | awk '{print $5}' | sort -u || true; } |
    while read -r pid; do
      [ -n "$pid" ] && taskkill //PID "$pid" //F >/dev/null 2>&1 || true
    done
fi
sleep 2

# 2. Remove the old build, and REFUSE to continue if it did not go — building
#    on top of a partial directory produces a server that renders HTML and then
#    400s every asset, which gets debugged as a styling bug.
rm -rf "$DIST" 2>/dev/null || true
if [ -d "$DIST" ]; then
  sleep 3
  rm -rf "$DIST" 2>/dev/null || true
fi
if [ -d "$DIST" ]; then
  echo "FAILED: $DIST could not be removed — something still holds it open." >&2
  exit 1
fi

# 3. Build, and check the exit code rather than grepping the output. A build can
#    print "Compiled successfully" and still fail while collecting page data.
if ! npx next build > "$LOG" 2>&1; then
  echo "FAILED: build exited non-zero. Tail of $LOG:" >&2
  tail -25 "$LOG" >&2
  exit 1
fi

# 4. A build that produced no BUILD_ID produced nothing servable.
if [ ! -f "$DIST/BUILD_ID" ]; then
  echo "FAILED: build left no $DIST/BUILD_ID." >&2
  exit 1
fi

# 5. Serve, and wait until it actually answers.
npx next start -p "$PORT" > "$LOG" 2>&1 &
for _ in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" || true)
  if [ "$code" = "200" ]; then
    # 6. And check an ASSET, not just the page. HTML renders fine from a
    #    corrupted build; it is the CSS and JS that 400.
    asset=$(curl -s "http://localhost:$PORT/" | grep -oE '/_next/static/css/[^"]+\.css' | head -1 || true)
    if [ -n "$asset" ]; then
      acode=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT$asset" || true)
      if [ "$acode" != "200" ]; then
        echo "FAILED: the page serves but $asset answers $acode — the build is not intact." >&2
        exit 1
      fi
    fi
    echo "serving on http://localhost:$PORT (dist: $DIST, assets OK, log: $LOG)"
    exit 0
  fi
  sleep 1
done

echo "FAILED: server did not answer 200 on $PORT. Tail of $LOG:" >&2
tail -25 "$LOG" >&2
exit 1

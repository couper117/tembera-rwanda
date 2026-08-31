#!/usr/bin/env bash
# Build and serve a production build, reliably.
#
# Doing this by hand kept producing a half-written .next: killing `next start`
# does not immediately release its file handles on Windows, so an `rm -rf .next`
# issued straight afterwards fails partway and the next build writes into the
# wreckage. The result is a server that starts cleanly and then 404s every
# asset, or throws "Cannot find module ./NNNN.js" — neither of which looks like
# a stale build, so it gets debugged as an application bug.
#
#   scripts/serve.sh 4100
set -euo pipefail

PORT="${1:-4100}"
LOG="${TEMP:-/tmp}/tembera-serve-$PORT.log"

# 1. Stop EVERY next server, not just the one on this port.
#
# They all share one .next directory. Leaving an old server running while this
# one rebuilds leaves the old process holding files the new build replaces, and
# the result is a server that renders HTML fine but answers 400 to every asset
# request — a page with no CSS and no JavaScript, which reads as a styling bug
# rather than a build one. Killing only $PORT was not enough.
#
# `|| true` on the pipeline: with pipefail set, a grep matching nothing (the
# normal case when nothing is running) would take the script down silently.
if command -v wmic >/dev/null 2>&1; then
  { wmic process where "name='node.exe'" get processid,commandline /format:csv 2>/dev/null || true; } |
    grep -i "next.*start" |
    awk -F, '{print $NF}' |
    tr -d '' |
    while read -r pid; do
      [ -n "$pid" ] && taskkill //PID "$pid" //F >/dev/null 2>&1 || true
    done
fi

# Belt and braces: anything still listening on the target port.
if command -v netstat >/dev/null 2>&1; then
  { netstat -ano | grep ":$PORT.*LISTENING" | awk '{print $5}' | sort -u || true; } |
    while read -r pid; do
      taskkill //PID "$pid" //F >/dev/null 2>&1 || true
    done
fi
sleep 3

# 2. Remove the old build, and REFUSE to continue if it did not go — building
#    on top of a partial directory is exactly the failure this script exists
#    to prevent.
rm -rf .next 2>/dev/null || true
if [ -d .next ]; then
  sleep 3
  rm -rf .next 2>/dev/null || true
fi
if [ -d .next ]; then
  echo "FAILED: .next could not be removed — something still holds it open." >&2
  exit 1
fi

# 3. Build, and check the exit code rather than grepping the output. A build
#    can print "Compiled successfully" and still fail afterwards while
#    collecting page data.
if ! npx next build > "$LOG" 2>&1; then
  echo "FAILED: build exited non-zero. Tail of $LOG:" >&2
  tail -25 "$LOG" >&2
  exit 1
fi

# 4. A build that produced no BUILD_ID produced nothing servable.
if [ ! -f .next/BUILD_ID ]; then
  echo "FAILED: build left no .next/BUILD_ID." >&2
  exit 1
fi

# 5. Serve, and wait until it actually answers.
npx next start -p "$PORT" > "$LOG" 2>&1 &
for _ in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" || true)
  if [ "$code" = "200" ]; then
    # 6. And check an ASSET, not just the page. HTML renders fine from a
    #    corrupted build; it is the CSS and JS that 400, which is exactly the
    #    failure this script exists to catch.
    asset=$(curl -s "http://localhost:$PORT/" | grep -oE '/_next/static/css/[^"]+\.css' | head -1 || true)
    if [ -n "$asset" ]; then
      acode=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT$asset" || true)
      if [ "$acode" != "200" ]; then
        echo "FAILED: the page serves but $asset answers $acode — the build is not intact." >&2
        exit 1
      fi
    fi
    echo "serving on http://localhost:$PORT (assets OK, log: $LOG)"
    exit 0
  fi
  sleep 1
done

echo "FAILED: server did not answer 200 on $PORT. Tail of $LOG:" >&2
tail -25 "$LOG" >&2
exit 1

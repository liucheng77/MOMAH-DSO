#!/bin/bash
# Auto-sync watcher: watches this folder and automatically commits + pushes to
# GitHub (MOMAH-DSO) whenever you change/save a file. Double-click to start.
# Leave the Terminal window open; press Ctrl+C (or close it) to stop.
cd "$(dirname "$0")" || exit 1
echo "👀 Watching demo-DSO — auto-commit & push to GitHub on every change."
echo "   Keep this window open. Press Ctrl+C to stop."
echo
LAST=""
while true; do
  STATE="$(git status --porcelain)"
  if [ -n "$STATE" ]; then
    SIG="$(printf '%s' "$STATE" | shasum | cut -d' ' -f1)"
    if [ "$SIG" != "$LAST" ]; then
      sleep 2                                   # debounce rapid saves
      git add -A
      if ! git diff --cached --quiet; then
        git commit -m "auto: $(date '+%Y-%m-%d %H:%M:%S')" >/dev/null 2>&1
        if git push origin HEAD >/dev/null 2>&1; then
          echo "[$(date '+%H:%M:%S')] ✓ synced to GitHub"
        else
          echo "[$(date '+%H:%M:%S')] ✗ push failed (network/token?)"
        fi
      fi
      LAST="$(git status --porcelain | shasum | cut -d' ' -f1)"
    fi
  fi
  sleep 5
done

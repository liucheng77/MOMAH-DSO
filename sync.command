#!/bin/bash
# One-click sync: stage everything, commit, and push to GitHub (MOMAH-DSO).
# Double-click this file in Finder, or run:  bash sync.command
cd "$(dirname "$0")" || exit 1
echo "▶ Syncing demo-DSO → GitHub (MOMAH-DSO)…"
git add -A
if git diff --cached --quiet; then
  echo "· No new local changes."
else
  git commit -m "update: $(date '+%Y-%m-%d %H:%M:%S')"
fi
git push origin HEAD && echo "✓ Done — GitHub is up to date." || echo "✗ Push failed (check network / token)."
echo
echo "Press any key to close…"; read -n 1 -s

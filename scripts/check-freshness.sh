#!/usr/bin/env bash
# Warns when docs/ai/progress.md has gone stale relative to code commits.
# Usage: ./scripts/check-freshness.sh [max_commits]   (default 5)
# Exit 0 always by default; set STRICT=1 to fail CI on staleness.
set -euo pipefail
MAX=${1:-5}
PROGRESS="docs/ai/progress.md"

if [ ! -f "$PROGRESS" ]; then
  echo "⚠️  $PROGRESS not found — memory layer missing."
  [ "${STRICT:-0}" = "1" ] && exit 1 || exit 0
fi

LAST_PROGRESS_COMMIT=$(git log -1 --format=%H -- "$PROGRESS" 2>/dev/null || echo "")
if [ -z "$LAST_PROGRESS_COMMIT" ]; then
  echo "⚠️  $PROGRESS has never been committed."
  [ "${STRICT:-0}" = "1" ] && exit 1 || exit 0
fi

COMMITS_SINCE=$(git rev-list --count "$LAST_PROGRESS_COMMIT"..HEAD -- . ':(exclude)docs/ai' 2>/dev/null || echo 0)
if [ "$COMMITS_SINCE" -gt "$MAX" ]; then
  echo "⚠️  $PROGRESS is stale: $COMMITS_SINCE code commits since it was last updated (threshold: $MAX)."
  echo "    Run your end-session ritual (WORKFLOW.md 7.3)."
  [ "${STRICT:-0}" = "1" ] && exit 1 || exit 0
else
  echo "✅ $PROGRESS is fresh ($COMMITS_SINCE code commits since last update)."
fi

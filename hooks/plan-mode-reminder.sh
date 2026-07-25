#!/usr/bin/env bash
# Injects the plan-mode reminder only when the CLI is in plan mode.
# Receives the hook payload as JSON on stdin. Requires jq.
set -euo pipefail

input=$(cat)
mode=$(printf '%s' "$input" | jq -r '.permission_mode // empty')

if [ "$mode" = "plan" ]; then
  cat "$(dirname "$0")/messages/plan-mode.md"
fi

exit 0

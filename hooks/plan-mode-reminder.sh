#!/usr/bin/env bash
# Injeta o lembrete de plan mode apenas quando o CLI está em plan mode.
# Recebe o payload do hook em JSON via stdin. Requer jq.
set -euo pipefail

input=$(cat)
mode=$(printf '%s' "$input" | jq -r '.permission_mode // empty')

if [ "$mode" = "plan" ]; then
  cat "$(dirname "$0")/messages/plan-mode.md"
fi

exit 0

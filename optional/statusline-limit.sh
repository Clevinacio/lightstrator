#!/bin/bash
# Statusline: modelo + uso do limite de 5h e semanal com tempo até resetar.
# Os dados de rate_limits chegam via stdin (JSON) e só aparecem para
# assinantes Pro/Max e após a primeira resposta da API na sessão.

input=$(cat)

MODEL=$(echo "$input" | jq -r '.model.display_name // "Claude"')
DIR=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // ""')
DIR_NAME=$(basename "$DIR" 2>/dev/null)

FIVE_PCT=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
FIVE_RESET=$(echo "$input" | jq -r '.rate_limits.five_hour.resets_at // empty')
WEEK_PCT=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')
WEEK_RESET=$(echo "$input" | jq -r '.rate_limits.seven_day.resets_at // empty')

NOW=$(date +%s)

# Retorna string "Xh Ym" (ou "Xd Yh" se >= 1 dia) até o timestamp epoch informado.
fmt_restante() {
  local reset="$1"
  local left=$(( reset - NOW ))
  (( left < 0 )) && left=0
  local d=$(( left / 86400 ))
  local h=$(( (left % 86400) / 3600 ))
  local m=$(( (left % 3600) / 60 ))
  if (( d > 0 )); then
    printf '%dd %dh' "$d" "$h"
  else
    printf '%dh %dm' "$h" "$m"
  fi
}

# Cor conforme uso: verde < 50, amarelo < 80, vermelho >= 80.
cor_uso() {
  local pct=${1%.*}
  if (( pct >= 80 )); then printf '\033[31m'
  elif (( pct >= 50 )); then printf '\033[33m'
  else printf '\033[32m'; fi
}
RESET='\033[0m'
DIM='\033[2m'

PARTS=""

if [ -n "$FIVE_PCT" ]; then
  c=$(cor_uso "$FIVE_PCT")
  t=""
  [ -n "$FIVE_RESET" ] && t=" $(fmt_restante "$FIVE_RESET")"
  PARTS="${c}5h $(printf '%.0f' "$FIVE_PCT")%${RESET}${DIM}${t}${RESET}"
else
  PARTS="${DIM}5h --${RESET}"
fi

if [ -n "$WEEK_PCT" ]; then
  c=$(cor_uso "$WEEK_PCT")
  t=""
  [ -n "$WEEK_RESET" ] && t=" $(fmt_restante "$WEEK_RESET")"
  PARTS="${PARTS} ${DIM}|${RESET} ${c}Sem $(printf '%.0f' "$WEEK_PCT")%${RESET}${DIM}${t}${RESET}"
else
  PARTS="${PARTS} ${DIM}| Sem --${RESET}"
fi

printf '%b\n' "${DIM}${MODEL}${RESET}${DIR_NAME:+ ${DIM}${DIR_NAME}${RESET}}  ${PARTS}"

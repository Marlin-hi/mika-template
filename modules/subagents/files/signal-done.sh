#!/usr/bin/env bash
# Signal-Done: Wird vom Launch-Script aufgerufen wenn der Subagent beendet ist.
# Schreibt eine JSON-Signaldatei in .claude/signals/ die der Koordinator liest.
#
# Usage: signal-done.sh <project-name> [exit-code]
# Example: signal-done.sh feature-x 0

PROJECT="$1"
EXIT_CODE="${2:-0}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAULT_DIR="$(dirname "$SCRIPT_DIR")"
SIGNAL_DIR="${VAULT_DIR}/.claude/signals"

mkdir -p "$SIGNAL_DIR"

cat > "$SIGNAL_DIR/${PROJECT}.json" <<EOF
{
  "project": "$PROJECT",
  "exit_code": $EXIT_CODE,
  "timestamp": "$TIMESTAMP"
}
EOF

echo "Signal written: $SIGNAL_DIR/${PROJECT}.json"

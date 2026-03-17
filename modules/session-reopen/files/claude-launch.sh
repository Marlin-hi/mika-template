#!/usr/bin/env bash
# claude-launch — Startet Claude Code im Vault-Verzeichnis
# Optional: --resume <session-id> um eine bestimmte Session fortzusetzen

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAULT_DIR="$(dirname "$SCRIPT_DIR")"

unset CLAUDECODE
cd "$VAULT_DIR"

if [ -n "$1" ]; then
    exec claude --resume "$1"
else
    exec claude
fi

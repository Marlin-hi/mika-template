#!/usr/bin/env bash
# Fork Launcher
# Usage: launch-fork.sh <fork-name>

unset CLAUDECODE
FORK_NAME="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAULT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -z "$FORK_NAME" ]; then
    echo "Fehler: Kein Fork-Name angegeben."
    echo "Usage: launch-fork.sh <fork-name>"
    read
    exit 1
fi

cd "$VAULT_DIR"
claude "$FORK_NAME"

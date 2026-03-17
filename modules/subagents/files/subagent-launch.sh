#!/usr/bin/env bash
# subagent-launch.sh — Startet einen Subagent in einem isolierten Worktree
#
# Usage: subagent-launch.sh <project-dir> <branch-name> <prompt-file> [signal-name]
#
# Beispiel:
#   subagent-launch.sh /pfad/zum/projekt feature-x agent-prompt.txt feature-signal
#
# Was passiert:
# 1. Erstellt Worktree + Branch im Projekt
# 2. Symlinkt node_modules und .env.local (falls vorhanden)
# 3. Startet claude im Worktree
# 4. Nach Abschluss: merged Branch zurück auf master
# 5. Räumt Worktree auf
# 6. Signalisiert Abschluss (optional)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAULT_DIR="$(dirname "$SCRIPT_DIR")"

# Signal IMMER senden, auch bei Fehlern
trap 'EXIT_CODE=${EXIT_CODE:-$?}; "$SCRIPT_DIR/signal-done.sh" "$SIGNAL_NAME" "$EXIT_CODE"' EXIT

PROJECT_DIR="$1"
BRANCH_NAME="$2"
PROMPT_FILE="$3"
SIGNAL_NAME="${4:-$BRANCH_NAME}"

if [ -z "$PROJECT_DIR" ] || [ -z "$BRANCH_NAME" ] || [ -z "$PROMPT_FILE" ]; then
  echo "Usage: subagent-launch.sh <project-dir> <branch-name> <prompt-file> [signal-name]"
  exit 1
fi

unset CLAUDECODE

# Set generic subagent env var — the stop hook checks for *_SUBAGENT pattern
# Derive bot name from vault directory name (uppercase)
BOT_NAME_UPPER=$(basename "$VAULT_DIR" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
export "${BOT_NAME_UPPER}_SUBAGENT=1"

export GIT_LFS_SKIP_SMUDGE=1

WORKTREE_DIR="${PROJECT_DIR}/.worktrees/${BRANCH_NAME}"
FULL_BRANCH="subagent/${BRANCH_NAME}"

cd "$PROJECT_DIR"

# Uncommitted changes stashen (Sync, laufende Edits)
STASHED=false
if ! git diff --quiet 2>/dev/null; then
  git stash push -m "subagent-auto-stash-$(date +%s)" 2>/dev/null && STASHED=true || true
  [ "$STASHED" = true ] && echo "=== Uncommitted changes gestasht ==="
elif ! git diff --cached --quiet 2>/dev/null; then
  git stash push -m "subagent-auto-stash-$(date +%s)" 2>/dev/null && STASHED=true || true
  [ "$STASHED" = true ] && echo "=== Staged changes gestasht ==="
fi

# Sicherstellen dass master aktuell ist
git pull --rebase 2>/dev/null || true

# Alten Worktree aufräumen falls vorhanden
if [ -d "$WORKTREE_DIR" ]; then
  git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || rm -rf "$WORKTREE_DIR"
  git branch -D "$FULL_BRANCH" 2>/dev/null || true
fi

# Worktree erstellen
git worktree add "$WORKTREE_DIR" -b "$FULL_BRANCH" master

# Gestashte Änderungen wiederherstellen (im Hauptrepo)
if [ "$STASHED" = true ]; then
  git stash pop 2>/dev/null || echo "=== WARNUNG: Stash konnte nicht wiederhergestellt werden ==="
fi

# Symlinks für node_modules und env (falls vorhanden)
cd "$WORKTREE_DIR"
[ -d "../../node_modules" ] && ln -sf "../../node_modules" node_modules 2>/dev/null || true
[ -f "../../.env.local" ] && ln -sf "../../.env.local" .env.local 2>/dev/null || true
[ -f "../../.env" ] && ln -sf "../../.env" .env 2>/dev/null || true

# Claude im Worktree starten
echo "=== Subagent startet in Worktree: $WORKTREE_DIR ==="
echo "=== Branch: $FULL_BRANCH ==="

claude "$(cat "${PROJECT_DIR}/${PROMPT_FILE}")"
EXIT_CODE=$?

echo ""
echo "=== Subagent beendet (Exit: $EXIT_CODE) ==="

# Zurück zum Hauptverzeichnis für Merge
cd "$PROJECT_DIR"

# Prüfen ob es Commits auf dem Branch gibt
COMMITS_AHEAD=$(git rev-list master.."$FULL_BRANCH" --count 2>/dev/null || echo "0")

if [ "$COMMITS_AHEAD" -gt 0 ]; then
  echo "=== Merge: $COMMITS_AHEAD Commits von $FULL_BRANCH nach master ==="
  git checkout master 2>/dev/null
  git pull --rebase 2>/dev/null || true

  if git merge "$FULL_BRANCH" --no-edit; then
    echo "=== Merge erfolgreich ==="
    git push 2>/dev/null || echo "Push fehlgeschlagen — manuell pushen"
  else
    echo "=== MERGE-KONFLIKT — manuell auflösen! ==="
    echo "Branch $FULL_BRANCH bleibt erhalten."
    git merge --abort
    EXIT_CODE=2
  fi
else
  echo "=== Keine neuen Commits auf $FULL_BRANCH ==="
fi

# Worktree aufräumen (nur bei erfolgreichem Merge)
if [ "$EXIT_CODE" -eq 0 ] || [ -z "$EXIT_CODE" ]; then
  git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || true
  git branch -d "$FULL_BRANCH" 2>/dev/null || true
  echo "=== Worktree aufgeräumt ==="
else
  echo "=== Worktree bleibt erhalten: $WORKTREE_DIR ==="
fi

# Signal wird automatisch via EXIT-Trap gesendet

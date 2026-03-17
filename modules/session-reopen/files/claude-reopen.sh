#!/bin/bash
# claude-reopen — Öffnet Claude-Code-Sessions in neuen Terminal-Tabs
#
# Usage:
#   claude-reopen              # Letzte 4 Sessions
#   claude-reopen 2            # Letzte 2 Sessions
#   claude-reopen --list       # Sessions anzeigen ohne zu öffnen
#   claude-reopen abc123 def456  # Bestimmte Sessions (Prefix reicht)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAULT_DIR="$(dirname "$SCRIPT_DIR")"
LAUNCH="$SCRIPT_DIR/claude-launch.sh"

# --- Platform detection ---
OS="$(uname -s)"

# Aktuelles Projekt-Verzeichnis bestimmen (wie Claude Code es kodiert)
case "$OS" in
  MINGW*|MSYS*|CYGWIN*)
    PROJECT_DIR=$(pwd -W 2>/dev/null || pwd)
    ;;
  *)
    PROJECT_DIR=$(pwd)
    ;;
esac
PROJECT_KEY=$(echo "$PROJECT_DIR" | sed 's|[/:\\]|-|g; s|^-||')

# Case-insensitive match für den Conversations-Ordner
CONV_DIR=""
for dir in ~/.claude/projects/*/; do
    dir_name=$(basename "$dir")
    if [[ "${dir_name,,}" == "${PROJECT_KEY,,}" ]]; then
        CONV_DIR="$dir"
        break
    fi
done

if [[ -z "$CONV_DIR" || ! -d "$CONV_DIR" ]]; then
    echo "Keine Sessions gefunden für: $PROJECT_DIR"
    echo "Erwartet: ~/.claude/projects/$PROJECT_KEY/"
    exit 1
fi

COUNT=4
LIST_ONLY=false
EXPLICIT_IDS=()

for arg in "$@"; do
    if [[ "$arg" == "--list" || "$arg" == "-l" ]]; then
        LIST_ONLY=true
    elif [[ "$arg" =~ ^[0-9]+$ ]]; then
        COUNT=$arg
    elif [[ "$arg" =~ ^[a-f0-9]{6,} ]]; then
        EXPLICIT_IDS+=("$arg")
    fi
done

CURRENT_SESSION="${CLAUDE_SESSION_ID:-}"
SESSIONS=()

if [[ ${#EXPLICIT_IDS[@]} -gt 0 ]]; then
    # Explizite IDs: Prefix-Match gegen vorhandene JSONL-Dateien
    for prefix in "${EXPLICIT_IDS[@]}"; do
        match=$(ls "$CONV_DIR"${prefix}*.jsonl 2>/dev/null | head -1)
        if [[ -n "$match" ]]; then
            SESSIONS+=("$(basename "$match" .jsonl)")
        else
            echo "Keine Session gefunden für Prefix: $prefix"
        fi
    done
else
    # Standard: neueste Sessions (aktuelle überspringen)
    while IFS= read -r file; do
        sid=$(basename "$file" .jsonl)
        [[ "$sid" == "$CURRENT_SESSION" ]] && continue
        SESSIONS+=("$sid")
        [[ ${#SESSIONS[@]} -ge $COUNT ]] && break
    done < <(ls -t "$CONV_DIR"*.jsonl 2>/dev/null)
fi

if [[ ${#SESSIONS[@]} -eq 0 ]]; then
    echo "Keine Sessions gefunden."
    exit 1
fi

# Session-Zusammenfassungen anzeigen — platform-aware stat
echo "Letzte $COUNT Sessions in $(basename "$PROJECT_DIR"):"
echo ""
for sid in "${SESSIONS[@]}"; do
    file="$CONV_DIR$sid.jsonl"
    case "$OS" in
      Darwin)
        mod_time=$(stat -f "%Sm" -t "%H:%M" "$file" 2>/dev/null || echo "??:??")
        ;;
      Linux)
        mod_time=$(stat -c '%Y' "$file" 2>/dev/null | xargs -I{} date -d @{} "+%H:%M" 2>/dev/null || echo "??:??")
        ;;
      MINGW*|MSYS*|CYGWIN*)
        mod_time=$(date -r "$file" "+%H:%M" 2>/dev/null || echo "??:??")
        ;;
      *)
        mod_time=$(date -r "$file" "+%H:%M" 2>/dev/null || echo "??:??")
        ;;
    esac
    preview=$(grep -m1 '"type":"user"' "$file" 2>/dev/null \
        | sed 's/.*"content":"\([^"]*\)".*/\1/' \
        | head -c 80 2>/dev/null || echo "?")
    echo "  $mod_time  $sid"
    echo "         $preview"
    echo ""
done

if $LIST_ONLY; then
    exit 0
fi

# In neuen Tabs öffnen — platform-aware
echo "Öffne ${#SESSIONS[@]} Tabs..."
for sid in "${SESSIONS[@]}"; do
    case "$OS" in
      Darwin)
        osascript -e "tell app \"Terminal\" to do script \"'$LAUNCH' '$sid'\"" &
        ;;
      MINGW*|MSYS*|CYGWIN*)
        # Windows: Windows Terminal if available, else start cmd
        WT_PATH="$(command -v wt.exe 2>/dev/null || echo "")"
        if [[ -z "$WT_PATH" ]]; then
            # Try common location
            WT_CANDIDATE="/c/Users/$(whoami)/AppData/Local/Microsoft/WindowsApps/wt.exe"
            [[ -f "$WT_CANDIDATE" ]] && WT_PATH="$WT_CANDIDATE"
        fi
        if [[ -n "$WT_PATH" ]]; then
            BASH_EXE="$(command -v bash 2>/dev/null || echo "C:\\Program Files\\Git\\bin\\bash.exe")"
            "$WT_PATH" -w 0 new-tab --commandline "$BASH_EXE" --login "$LAUNCH" "$sid" &
        else
            start cmd /c "bash --login '$LAUNCH' '$sid'" &
        fi
        ;;
      Linux)
        if command -v gnome-terminal &>/dev/null; then
            gnome-terminal -- bash -c "'$LAUNCH' '$sid'; exec bash" &
        elif command -v xterm &>/dev/null; then
            xterm -e "'$LAUNCH' '$sid'" &
        else
            echo "Kein Terminal-Emulator gefunden. Starte manuell: $LAUNCH $sid"
        fi
        ;;
      *)
        echo "Unbekannte Plattform: $OS. Starte manuell: $LAUNCH $sid"
        ;;
    esac
done

echo "Fertig."

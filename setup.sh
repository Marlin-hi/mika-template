#!/bin/bash
set -euo pipefail

# ============================================================================
# setup.sh — Baut einen personalisierten KI-Vault aus config.json + Modulen
# ============================================================================
# Laeuft auf macOS, Linux und Windows (Git Bash).
# Usage: ./setup.sh [config.json]
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="${1:-$SCRIPT_DIR/config.json}"

# --- Helpers ----------------------------------------------------------------

die() { echo "FEHLER: $*" >&2; exit 1; }

info() { echo "  -> $*"; }

# Detect platform
detect_platform() {
  case "$(uname -s)" in
    Darwin*)  echo "macos" ;;
    Linux*)   echo "linux" ;;
    MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
    *)        echo "linux" ;;
  esac
}

# Check if module platform matches current platform
platform_matches() {
  local mod_platform="$1"
  local current="$2"
  [ "$mod_platform" = "all" ] || [ "$mod_platform" = "$current" ]
}

# --- Validate prerequisites ------------------------------------------------

command -v node >/dev/null 2>&1 || die "Node.js wird benoetigt (fuer JSON-Parsing). Bitte installieren: https://nodejs.org/"
command -v git >/dev/null 2>&1 || die "Git wird benoetigt. Bitte installieren: https://git-scm.com/"

[ -f "$CONFIG_FILE" ] || die "Config nicht gefunden: $CONFIG_FILE"

# --- Read config via Node ---------------------------------------------------

# Convert to absolute path for node require
CONFIG_ABS="$(cd "$(dirname "$CONFIG_FILE")" && pwd)/$(basename "$CONFIG_FILE")"

read_config() {
  node -e "
    const c = require(process.argv[1]);
    console.log(c.bot_name || '');
    console.log(c.bot_name_lower || '');
    console.log(c.user_name || '');
    console.log(c.vault_name || '');
  " "$CONFIG_ABS"
}

CONFIG_LINES="$(read_config)"
BOT_NAME="$(echo "$CONFIG_LINES" | sed -n '1p')"
BOT_NAME_LOWER="$(echo "$CONFIG_LINES" | sed -n '2p')"
USER_NAME="$(echo "$CONFIG_LINES" | sed -n '3p')"
VAULT_NAME="$(echo "$CONFIG_LINES" | sed -n '4p')"

[ -n "$BOT_NAME" ] || die "bot_name fehlt in config.json"
[ -n "$BOT_NAME_LOWER" ] || die "bot_name_lower fehlt in config.json"
[ -n "$USER_NAME" ] || die "user_name fehlt in config.json"
[ -n "$VAULT_NAME" ] || die "vault_name fehlt in config.json"

# Read modules list
MODULES="$(node -e "
  const c = require(process.argv[1]);
  (c.modules || []).forEach(m => console.log(m));
" "$CONFIG_ABS")"

PLATFORM="$(detect_platform)"
TARGET="$SCRIPT_DIR/$VAULT_NAME"

echo ""
echo "=== $BOT_NAME Setup ==="
echo ""
echo "  Bot:       $BOT_NAME ($BOT_NAME_LOWER)"
echo "  Nutzer:    $USER_NAME"
echo "  Vault:     $VAULT_NAME"
echo "  Platform:  $PLATFORM"
echo ""

# --- Create target directory ------------------------------------------------

[ ! -d "$TARGET" ] || die "Ziel-Verzeichnis existiert bereits: $TARGET"
mkdir -p "$TARGET"
info "Verzeichnis erstellt: $VAULT_NAME/"

# --- Copy base files --------------------------------------------------------

echo ""
echo "--- Base-Dateien ---"

cp "$SCRIPT_DIR/base/CLAUDE.md" "$TARGET/"
cp "$SCRIPT_DIR/base/_onboarding.md" "$TARGET/"
cp "$SCRIPT_DIR/base/Steckbrief.md" "$TARGET/"
cp "$SCRIPT_DIR/base/_auftraege.md" "$TARGET/"
cp "$SCRIPT_DIR/base/_log.md" "$TARGET/"
cp "$SCRIPT_DIR/base/Input Dump.md" "$TARGET/"
cp "$SCRIPT_DIR/base/.gitignore" "$TARGET/"
info "Markdown-Dateien kopiert"

# .obsidian with plugins
cp -r "$SCRIPT_DIR/base/.obsidian" "$TARGET/"
info ".obsidian/ kopiert (mit Plugins)"

# Template folders
cp -r "$SCRIPT_DIR/base/Vorlagen" "$TARGET/"
mkdir -p "$TARGET/Journal" "$TARGET/Gedanken" "$TARGET/Projekte"
touch "$TARGET/Journal/.gitkeep" "$TARGET/Gedanken/.gitkeep" "$TARGET/Projekte/.gitkeep"
info "Ordner erstellt: Journal/, Gedanken/, Projekte/, Vorlagen/"

# Ensure _skills and _scripts exist
mkdir -p "$TARGET/_skills"

# --- Process modules --------------------------------------------------------

echo ""
echo "--- Module ---"

# Temp files for collecting injection content
SECTIONS_FILE="$(mktemp)"
STRUCTURE_FILE="$(mktemp)"
TOOLS_FILE="$(mktemp)"
SKILLS_FILE="$(mktemp)"
PERMS_FILE="$(mktemp)"
GITIGNORE_FILE="$(mktemp)"
HOOKS_FILE="$(mktemp)"

# Initialize empty
> "$SECTIONS_FILE"
> "$STRUCTURE_FILE"
> "$TOOLS_FILE"
> "$SKILLS_FILE"
> "$PERMS_FILE"
> "$GITIGNORE_FILE"
> "$HOOKS_FILE"

ACTIVATED_MODULES=""
SKIPPED_MODULES=""

# First pass: validate requires
for mod in $MODULES; do
  MOD_DIR="$SCRIPT_DIR/modules/$mod"
  [ -d "$MOD_DIR" ] || die "Modul nicht gefunden: $mod (erwartet: modules/$mod/)"
  [ -f "$MOD_DIR/module.json" ] || die "module.json fehlt: modules/$mod/module.json"

  MOD_JSON="$MOD_DIR/module.json"
  REQUIRES="$(node -e "
    const c = require(process.argv[1]);
    (c.requires || []).forEach(r => console.log(r));
  " "$MOD_JSON")"

  for req in $REQUIRES; do
    [ -z "$req" ] && continue
    echo "$MODULES" | grep -qx "$req" || die "Modul '$mod' benoetigt '$req', aber '$req' ist nicht in config.json aktiviert"
  done
done

# Second pass: install modules
for mod in $MODULES; do
  MOD_DIR="$SCRIPT_DIR/modules/$mod"
  MOD_JSON="$MOD_DIR/module.json"

  # Check platform
  MOD_PLATFORM="$(node -e "const c=require(process.argv[1]); process.stdout.write(c.platform||'all');" "$MOD_JSON")"
  if ! platform_matches "$MOD_PLATFORM" "$PLATFORM"; then
    SKIPPED_MODULES="$SKIPPED_MODULES $mod($MOD_PLATFORM)"
    info "[$mod] uebersprungen (Platform: $MOD_PLATFORM, aktuell: $PLATFORM)"
    continue
  fi

  ACTIVATED_MODULES="$ACTIVATED_MODULES $mod"

  # Copy files (using node to read the files map)
  node -e "
    const c = require(process.argv[1]);
    const files = c.files || {};
    Object.entries(files).forEach(([dest, src]) => {
      console.log(dest + '|' + src);
    });
  " "$MOD_JSON" | while IFS='|' read -r dest src; do
    [ -z "$dest" ] && continue
    src_full="$MOD_DIR/$src"
    dest_full="$TARGET/$dest"
    if [ -f "$src_full" ]; then
      mkdir -p "$(dirname "$dest_full")"
      cp "$src_full" "$dest_full"
    fi
  done

  # Copy hooks
  node -e "
    const c = require(process.argv[1]);
    const hooks = c.hooks || {};
    Object.entries(hooks).forEach(([event, files]) => {
      (Array.isArray(files) ? files : [files]).forEach(f => {
        console.log(event + '|' + f);
      });
    });
  " "$MOD_JSON" | while IFS='|' read -r event hookfile; do
    [ -z "$event" ] && continue
    src_hook="$MOD_DIR/$hookfile"
    if [ -f "$src_hook" ]; then
      mkdir -p "$TARGET/.claude/hooks"
      hookbase="$(basename "$hookfile")"
      cp "$src_hook" "$TARGET/.claude/hooks/$hookbase"
      echo "$event|.claude/hooks/$hookbase" >> "$HOOKS_FILE"
    fi
  done

  # Create folders
  node -e "
    const c = require(process.argv[1]);
    (c.folders || []).forEach(f => console.log(f));
  " "$MOD_JSON" | while read -r folder; do
    [ -z "$folder" ] && continue
    mkdir -p "$TARGET/$folder"
    touch "$TARGET/$folder/.gitkeep"
  done

  # Collect permissions
  node -e "
    const c = require(process.argv[1]);
    (c.permissions || []).forEach(p => console.log(p));
  " "$MOD_JSON" >> "$PERMS_FILE"

  # Collect gitignore entries
  node -e "
    const c = require(process.argv[1]);
    (c.gitignore || []).forEach(g => console.log(g));
  " "$MOD_JSON" >> "$GITIGNORE_FILE"

  # Collect CLAUDE.md sections
  if [ -f "$MOD_DIR/claude-md.md" ]; then
    cat "$MOD_DIR/claude-md.md" >> "$SECTIONS_FILE"
    echo "" >> "$SECTIONS_FILE"
  fi

  # Collect onboarding sections
  if [ -f "$MOD_DIR/onboarding-md.md" ]; then
    while IFS= read -r oline; do
      [ -z "$oline" ] && continue
      prefix="${oline%%:*}"
      content="${oline#*: }"
      case "$prefix" in
        structure) echo "$content" >> "$STRUCTURE_FILE" ;;
        tools)     echo "$content" >> "$TOOLS_FILE" ;;
        skills)    echo "$content" >> "$SKILLS_FILE" ;;
      esac
    done < "$MOD_DIR/onboarding-md.md"
  fi

  MOD_DESC="$(node -e "const c=require(process.argv[1]); process.stdout.write(c.description||'');" "$MOD_JSON")"
  info "[$mod] $MOD_DESC"
done

# --- Inject content into CLAUDE.md and _onboarding.md -----------------------

echo ""
echo "--- Injection ---"

# Use node for all injections (reliable multi-line, cross-platform)
node -e "
  const fs = require('fs');
  const target = process.argv[1];

  // Read collected content
  const sections = fs.readFileSync(process.argv[2], 'utf8').trim();
  const structure = fs.readFileSync(process.argv[3], 'utf8').trim();
  const tools = fs.readFileSync(process.argv[4], 'utf8').trim();
  const skills = fs.readFileSync(process.argv[5], 'utf8').trim();

  // CLAUDE.md
  let claude = fs.readFileSync(target + '/CLAUDE.md', 'utf8');
  claude = claude.replace('<!-- MODULE_SECTIONS -->', sections || '');
  fs.writeFileSync(target + '/CLAUDE.md', claude);

  // _onboarding.md
  let onb = fs.readFileSync(target + '/_onboarding.md', 'utf8');
  onb = onb.replace('<!-- MODULE_STRUCTURE -->', structure || '');
  onb = onb.replace('<!-- MODULE_TOOLS -->', tools || '');
  onb = onb.replace('<!-- MODULE_SKILLS -->', skills || '');
  fs.writeFileSync(target + '/_onboarding.md', onb);
" "$TARGET" "$SECTIONS_FILE" "$STRUCTURE_FILE" "$TOOLS_FILE" "$SKILLS_FILE"

info "CLAUDE.md und _onboarding.md Sektionen injiziert"

# --- Generate .claude/settings.local.json -----------------------------------

echo ""
echo "--- Settings ---"

mkdir -p "$TARGET/.claude"

node -e "
  const fs = require('fs');
  const path = require('path');
  const target = process.argv[1];
  const platform = process.argv[2];
  const permsFile = process.argv[3];
  const hooksFile = process.argv[4];

  // Base permissions
  const perms = [
    'Bash(git *)',
    'Bash(node *)',
    'Bash(npm *)',
    'Bash(npx *)',
    'Bash(cat *)',
    'Bash(ls *)',
    'Bash(find *)',
    'Bash(head *)',
    'Bash(tail *)',
    'Bash(wc *)',
    'Bash(mkdir *)',
    'Bash(cp *)',
    'Bash(mv *)',
    'Bash(rm *)',
    'Bash(chmod *)',
    'Bash(date *)'
  ];

  // Platform-specific
  if (platform === 'macos') {
    perms.push('Bash(open *)', 'Bash(pbcopy *)', 'Bash(pbpaste *)');
  } else if (platform === 'windows') {
    perms.push('Bash(powershell.exe *)', 'Bash(cmd.exe *)');
  }

  // Module permissions
  const modPerms = fs.readFileSync(permsFile, 'utf8').trim().split('\n').filter(Boolean);
  modPerms.forEach(p => {
    if (!perms.includes(p)) perms.push(p);
  });

  const settings = {
    permissions: {
      allow: perms
    }
  };

  // Hooks
  const hookLines = fs.readFileSync(hooksFile, 'utf8').trim().split('\n').filter(Boolean);
  if (hookLines.length > 0) {
    const hooks = {};
    hookLines.forEach(line => {
      const [event, hookPath] = line.split('|');
      if (!event || !hookPath) return;
      if (!hooks[event]) hooks[event] = [];
      hooks[event].push({
        matcher: '',
        hooks: [{
          type: 'command',
          command: 'node ' + hookPath
        }]
      });
    });
    if (Object.keys(hooks).length > 0) {
      settings.hooks = hooks;
    }
  }

  fs.writeFileSync(
    path.join(target, '.claude', 'settings.local.json'),
    JSON.stringify(settings, null, 2)
  );
" "$TARGET" "$PLATFORM" "$PERMS_FILE" "$HOOKS_FILE"

info ".claude/settings.local.json generiert"

# --- Append to .gitignore ---------------------------------------------------

if [ -s "$GITIGNORE_FILE" ]; then
  echo "" >> "$TARGET/.gitignore"
  echo "# Module-spezifisch" >> "$TARGET/.gitignore"
  sort -u "$GITIGNORE_FILE" | while read -r gi_line; do
    [ -z "$gi_line" ] && continue
    echo "$gi_line" >> "$TARGET/.gitignore"
  done
  info ".gitignore ergaenzt"
fi

# --- Replace placeholders --------------------------------------------------

echo ""
echo "--- Platzhalter ersetzen ---"

node -e "
  const fs = require('fs');
  const path = require('path');

  const target = process.argv[1];
  const botName = process.argv[2];
  const botNameLower = process.argv[3];
  const userName = process.argv[4];
  const vaultName = process.argv[5];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip .git and binary dirs
        if (entry.name === '.git' || entry.name === 'node_modules') continue;
        // Skip plugin JS (mika-timestamps)
        if (entry.name === 'mika-timestamps') continue;
        walk(full);
      } else if (entry.isFile()) {
        // Skip binary files
        const ext = path.extname(entry.name).toLowerCase();
        if (['.png','.jpg','.jpeg','.gif','.ico','.woff','.woff2','.ttf','.eot'].includes(ext)) continue;
        try {
          let content = fs.readFileSync(full, 'utf8');
          const original = content;
          content = content.replace(/\[BotName\]/g, botName);
          content = content.replace(/\[BotName-klein\]/g, botNameLower);
          content = content.replace(/\[Nutzername\]/g, userName);
          content = content.replace(/\[vault-name\]/g, vaultName);
          if (content !== original) {
            fs.writeFileSync(full, content);
          }
        } catch (e) {
          // Skip files that can't be read as utf8
        }
      }
    }
  }

  walk(target);
" "$TARGET" "$BOT_NAME" "$BOT_NAME_LOWER" "$USER_NAME" "$VAULT_NAME"

info "Alle Platzhalter ersetzt: [BotName]=$BOT_NAME, [Nutzername]=$USER_NAME"

# --- Make scripts executable ------------------------------------------------

if [ -d "$TARGET/_scripts" ]; then
  find "$TARGET/_scripts" -name "*.sh" -exec chmod +x {} \;
  info "Scripts in _scripts/ ausfuehrbar gemacht"
fi

# --- Initialize git ---------------------------------------------------------

echo ""
echo "--- Git ---"
(cd "$TARGET" && git init -q && git add -A && git commit -q -m "$BOT_NAME eingerichtet")
info "Git-Repository initialisiert mit erstem Commit"

# --- Cleanup temp files -----------------------------------------------------

rm -f "$SECTIONS_FILE" "$STRUCTURE_FILE" "$TOOLS_FILE" "$SKILLS_FILE" "$PERMS_FILE" "$GITIGNORE_FILE" "$HOOKS_FILE"

# --- Summary ----------------------------------------------------------------

echo ""
echo "============================================"
echo "  $BOT_NAME ist bereit!"
echo "============================================"
echo ""
echo "  Vault:     $TARGET"
echo "  Module:   $(echo $ACTIVATED_MODULES | tr ' ' ', ')"
if [ -n "$SKIPPED_MODULES" ]; then
  echo "  Uebersprungen:$(echo $SKIPPED_MODULES | tr ' ' ', ')"
fi
echo ""
echo "  Naechste Schritte:"
echo "    1. cd $VAULT_NAME"
echo "    2. Obsidian oeffnen -> 'Open folder as vault' -> $VAULT_NAME"
echo "    3. Community Plugins aktivieren -> 'Mika Timestamps' einschalten"
echo "    4. Terminal im $VAULT_NAME-Ordner oeffnen -> 'claude' starten"
echo "    5. Steckbrief.md ausfuellen"
echo ""

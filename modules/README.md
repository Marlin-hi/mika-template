# Module

Jedes Modul erweitert die Werkstatt um eine Fähigkeit. Module werden über `config.json` aktiviert und von `setup.sh` installiert.

## Verfügbare Module

### Content-Module

| Modul | Beschreibung | Dateien |
|---|---|---|
| **aufgaben** | Zentrale Aufgabenliste mit Sektionen, Archiv und Zeiterfassung | `Aufgaben.md`, `Aufgaben Archiv.md`, `Zu tun/` |
| **bauplaene** | Maschinen-Backlog — Features die der Bot sich selbst baut | `Baupläne.md` |
| **menschen** | Personen-Notes mit Steckbriefen und Gesprächsnotizen | `Menschen/` |

### Workflow-Module

| Modul | Beschreibung | Dateien |
|---|---|---|
| **sprints** | Regelmäßige fokussierte Arbeitssessions | `Sprints/` |
| **forks** | Themen in eigene Tabs abzweigen mit Briefings | `_forks/` |
| **parallelarbeit** | Mehrere Claude-Code-Tabs koordinieren via Worktrees | `_arbeit.md` |
| **flags** | Mängel im Vorbeigehen festhalten | `_flags.md` |
| **subagents** | Subagents eigenständig starten für parallele Teilaufgaben | — |
| **durcharbeiten** | Autonomer Arbeitsmodus ohne Rückfragen | — |

### Tool-Module

| Modul | Beschreibung | Platform |
|---|---|---|
| **kalender** | CalDAV-Integration mit Kontext-Notes | alle |
| **screenshots** | Screenshot-Tool für visuelles Feedback | macOS |
| **session-reopen** | Script zum Wiedereröffnen von Sessions | alle |
| **tab-title** | Terminal-Tab-Titel auf Bot-Namen setzen | alle |

### Hook-Module

| Modul | Beschreibung | Hook-Event |
|---|---|---|
| **token-tracking** | Token-Verbrauch über Sessions tracken | Stop |
| **onboarding-hook** | Erinnerung an _onboarding.md-Update | Stop |

## Modul-Format

Jedes Modul ist ein Ordner in `modules/`:

```
modules/module-name/
├── module.json          <- Manifest (Pflicht)
├── files/               <- Dateien die in den Vault kopiert werden
│   ├── _skills/xyz.md
│   └── ...
├── hooks/               <- Hook-Scripts (nach .claude/hooks/ kopiert)
│   └── my-hook.js
├── claude-md.md         <- Sektion die in CLAUDE.md injiziert wird
└── onboarding-md.md     <- Zeilen für _onboarding.md
```

### module.json Schema

```json
{
  "name": "module-name",
  "description": "Was das Modul tut",
  "category": "content | workflow | tools | hooks",
  "requires": ["andere-module"],
  "files": {
    "ziel/pfad.md": "files/quell-pfad.md"
  },
  "hooks": {
    "Stop": ["hooks/mein-hook.js"],
    "PreToolUse": ["hooks/anderer-hook.js"]
  },
  "permissions": ["Bash(kommando *)"],
  "gitignore": ["pfad/zum/ignorieren"],
  "folders": ["ordner-name"],
  "platform": "all | macos | windows | linux"
}
```

**Felder:**

- `name` — Eindeutiger Modul-Name (= Ordner-Name)
- `description` — Kurze Beschreibung
- `category` — Kategorie: `content` (Vault-Inhalte), `workflow` (Arbeitsabläufe), `tools` (externe Tools), `hooks` (automatische Hooks)
- `requires` — Liste von Modul-Namen die Voraussetzung sind. Setup bricht ab wenn eine Abhängigkeit fehlt
- `files` — Map von Ziel-Pfad im Vault zu Quell-Pfad im Modul. Platzhalter werden automatisch ersetzt
- `hooks` — Map von Hook-Event zu Liste von Hook-Scripts. Scripts werden nach `.claude/hooks/` kopiert
- `permissions` — Zusätzliche Bash-Permissions für `.claude/settings.local.json`
- `gitignore` — Zeilen die zu `.gitignore` hinzugefügt werden
- `folders` — Ordner die im Vault erstellt werden (mit `.gitkeep`)
- `platform` — Auf welchen Plattformen das Modul läuft: `all`, `macos`, `windows`, `linux`

### onboarding-md.md Format

Zeilen mit Prefix bestimmen wo der Inhalt eingefügt wird:

```
structure: ├── Ordner/               — Beschreibung
tools: | `Datei.md` | Was die Datei liefert |
skills: - `_skills/xyz.md` — Kurzbeschreibung
```

- `structure:` — Wird in die Vault-Struktur-Übersicht eingefügt
- `tools:` — Wird in die Erste-Anlaufstellen-Tabelle eingefügt
- `skills:` — Wird in die Werkzeuge-&-Skills-Sektion eingefügt

### claude-md.md

Markdown-Inhalt der unter "## Aktive Module" in CLAUDE.md eingefügt wird. Typischerweise eine `### Modul-Name` Überschrift mit kurzer Beschreibung und Dateiverweis.

## Eigene Module erstellen

1. Ordner in `modules/` anlegen
2. `module.json` mit den Pflichtfeldern erstellen
3. Dateien in `files/` ablegen
4. Optional: `claude-md.md` und `onboarding-md.md` erstellen
5. Optional: Hook-Scripts in `hooks/` ablegen
6. Modul-Name in `config.json` → `modules` eintragen
7. `setup.sh` ausführen

Platzhalter `[BotName]`, `[BotName-klein]`, `[Nutzername]`, `[vault-name]` werden in allen kopierten Dateien automatisch ersetzt.

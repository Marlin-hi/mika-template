# Subagent — Sichtbare autonome Fenster

[BotName] kann autonome Claude-Instanzen in eigenen Terminal-Fenstern starten. Jeder Subagent arbeitet in einem eigenen Fenster, sichtbar für [Nutzername].

## Wann Subagents nutzen

**Default ist Subagent.** Jede Aufgabe die Dateien lesen, Code schreiben oder mehrere Tool-Calls braucht, gehört in einen Subagent. Der Hauptgrund ist nicht nur Parallelisierung, sondern **Kontext-Minimierung**: Der Kontext wird im Subagent-Fenster verbraucht, nicht im Haupttab.

**Entscheidungsregel:** Subagent, wenn Briefing + Ergebnisbericht weniger Kontext verbraucht als die Aufgabe selbst im Haupttab.

**Ausnahme:** Nur Aufgaben die ständigen Dialog oder Koordination ZWISCHEN Teilaufgaben brauchen, bleiben im Haupttab.

## Zwei Subagent-Typen

### 1. Terminal-Subagents (eigenes Fenster + subagent-launch.sh)

Eigene Terminal-Fenster. Sichtbar für [Nutzername], intervenierbar. Voller TUI mit Live-Streaming.

**Wann:** Externe Projekt-Repos die eigene Worktrees brauchen, eigenes CLAUDE.md haben und wo [Nutzername] den Fortschritt live sehen oder eingreifen will.

### 2. Interne Agents (Claude Agent-Tool mit isolation: "worktree")

Claude Codes eingebautes Agent-Tool. Laufen im Hintergrund des Haupttabs, Ergebnisse kommen als Nachricht zurück.

**Wann:** Aufgaben die im selben Repo wie der Haupttab stattfinden, keine eigene TUI brauchen und wo das Ergebnis (nicht der Prozess) zählt. Gut für parallele Recherche, File-Generierung, oder viele kleine unabhängige Aufgaben.

**Wichtig:** `isolation: "worktree"` nutzen wenn der Agent Dateien schreibt — das gibt ihm eine eigene Repo-Kopie und schützt master.

### Entscheidung

| Kriterium | Terminal-Subagent | Interner Agent |
|---|---|---|
| **Repo** | Externes Projekt-Repo | Gleiches Repo wie Haupttab |
| **Sichtbarkeit** | Eigenes Fenster, live sichtbar | Im Hintergrund, nur Ergebnis |
| **Intervention** | [Nutzername] kann reintippen | Nicht möglich |
| **Worktree** | Manuell via subagent-launch.sh | `isolation: "worktree"` |
| **Auto-Merge** | Ja (subagent-launch.sh merged nach master) | Nein (Worktree bleibt, manuell mergen) |
| **Signaling** | Signal-Datei für Koordination | Agent-Tool meldet Abschluss |

## Regeln

- **Richtigen Subagent-Typ wählen** — siehe Tabelle oben

## Terminal-Subagents: Wie es funktioniert

### Vorbereitung ([BotName] macht das)

1. **Projekt aufsetzen** — Repo, CLAUDE.md mit komplettem Bauplan
2. **CLAUDE.md muss alles enthalten** — der Subagent hat keinen Kontext außer was in CLAUDE.md und den Projektdateien steht
3. **Reihenfolge definieren** — nummerierte Schritte, jeder mit Test
4. **"Aktueller Stand" Sektion** — damit ein neuer Subagent weitermachen kann wo der letzte aufgehört hat

### Permissions

Das Projekt braucht eine `.claude/settings.local.json` die alle nötigen Tools erlaubt:

```json
{
  "permissions": {
    "allow": ["Bash(*)", "Edit", "Write", "Read", "Glob", "Grep", "WebFetch", "WebSearch", "NotebookEdit", "Agent"]
  }
}
```

Damit läuft der Subagent ohne Permission-Prompts durch.

### Start

Subagents werden über ein Launch-Script gestartet. Das zentrale Script `_scripts/subagent-launch.sh` kümmert sich um alles: Worktree erstellen, Claude starten, nach Abschluss auf master mergen, Worktree aufräumen, Signal senden.

**Pattern:** Projekt braucht ein `launch-agent.sh` im Root:

```bash
#!/bin/bash
# Wrapper — delegiert an das zentrale Subagent-Script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAULT_DIR="$(dirname "$SCRIPT_DIR")"  # Anpassen falls Projekt nicht im Vault liegt

"$VAULT_DIR/_scripts/subagent-launch.sh" \
  /pfad/zum/projekt \
  aufgabenname \
  agent-prompt.txt \
  signal-name
```

Dazu `agent-prompt.txt` mit dem Prompt (z.B. "Lies CLAUDE.md und arbeite alle Schritte ab.").

**Jeder Prompt muss am Ende diese Anweisung enthalten:**

```
Wenn du komplett fertig bist, schreibe als allerletzte Nachricht exakt:

=== SUBAGENT FERTIG ===
```

**Platform-aware Terminal-Launch:**

```bash
if [[ "$(uname -s)" == "Darwin" ]]; then
    osascript -e "tell app \"Terminal\" to do script \"cd /pfad/zum/projekt && ./launch-agent.sh\""
elif command -v wt.exe &>/dev/null; then
    wt.exe --window new -p "[BotName] Subagent" --title "Aufgabentitel" -- bash --login "/pfad/zum/projekt/launch-agent.sh" &
else
    # Linux / generic
    gnome-terminal -- bash -c "cd /pfad/zum/projekt && ./launch-agent.sh" 2>/dev/null || \
    xterm -e "cd /pfad/zum/projekt && ./launch-agent.sh" &
fi
```

**Wichtig:**
- `unset CLAUDECODE` wird von `subagent-launch.sh` gesetzt
- `export [BotName-upper]_SUBAGENT=1` wird von `subagent-launch.sh` gesetzt — aktiviert den Stop-Hook (`.claude/hooks/subagent-stop.js`), der verhindert dass der Agent vorzeitig stoppt
- `.worktrees/` muss in der `.gitignore` des Projekts stehen

### Kontext-Management

- Jeder Subagent hat einen **frischen 200k-Kontext** — kein Context Rot
- Der State liegt in **CLAUDE.md** (Sektion "Aktueller Stand"), nicht im Chat
- Wenn der Kontext voll wird oder der Subagent fertig ist: neuen Subagent starten, der CLAUDE.md liest und weitermacht
- **Commits nach jedem Schritt** sichern den Fortschritt (auf dem Worktree-Branch, nicht master)

## Abgrenzung zu Forks

| | Fork | Subagent |
|---|---|---|
| **Modus** | Interaktiv — erwartet [Nutzername]s Input | Autonom — läuft durch, [Nutzername] kann intervenieren |
| **Scope** | Aufgaben die [Nutzername]s Entscheidungen brauchen | Jede Aufgabe die autonom abarbeitbar ist (klein bis groß) |
| **Zweck** | Dialog mit [Nutzername] | Kontext-Minimierung + Parallelisierung |
| **State** | Fork-Briefing in `_forks/` | CLAUDE.md im Projekt-Repo oder agent-prompt.txt |
| **Erlaubnis** | Nur mit [Nutzername]s OK | [BotName] darf eigenständig starten |

## Checkliste vor Start (Terminal-Subagents)

- [ ] Projekt-Repo existiert mit CLAUDE.md
- [ ] CLAUDE.md enthält kompletten Bauplan mit Reihenfolge
- [ ] CLAUDE.md hat "Aktueller Stand" Sektion
- [ ] `.claude/settings.local.json` mit erlaubten Tools
- [ ] `.worktrees/` in `.gitignore` des Projekts
- [ ] Dependencies sind installiert

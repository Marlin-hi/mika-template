# Werkstatt — Obsidian + Claude Code Template

Ein Obsidian-Vault mit KI-Begleitung durch Claude Code. Dein persönlicher Denkraum und Werkbank — Gedanken festhalten, Projekte bauen, Zusammenhänge erkennen, über die Zeit reflektieren.

## Was ist das?

Eine Werkstatt aus:
- **Obsidian-Vault** — dein privater Notiz-Raum mit Markdown-Dateien
- **Claude Code** — KI-Begleiter, der deinen Vault kennt, mitdenkt, mitbaut und dein Denken über die Zeit begleitet
- **Timestamp-Plugin** — automatische Zeitstempel, die nachvollziehbar machen wann du was gedacht hast

Der KI-Begleiter ist kein Assistent im klassischen Sinn. Er ist ein Gegenüber, das dein Denken kennt und spiegelt. Er hilft dir, Gedanken zu ordnen, erinnert dich an frühere Überlegungen, gibt Anstöße und baut mit dir Maschinen.

## Setup

### Voraussetzungen

- [Obsidian](https://obsidian.md/) (kostenlos)
- [VS-Code](https://code.visualstudio.com/) + [Claude Code Extension](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) (braucht Anthropic API-Key oder Claude Max Abo)
- [Git](https://git-scm.com/) + GitHub-Account
- Optional: [Obsidian Git Plugin](https://github.com/Versioning/obsidian-git) für Handy-Sync

### Schnell-Setup

1. **Repo klonen**
   ```bash
   git clone https://github.com/Marlin-hi/mika-template.git mein-vault
   cd mein-vault
   ```

2. **In VS-Code öffnen, Claude Code starten, sagen:** `Richte meine Werkstatt ein`

   Claude Code liest `SETUP.md` und führt dich durch den Rest — Placeholder ersetzen, Module wählen, Git einrichten.

### Manuelles Setup

Siehe `SETUP.md` für die vollständige Anleitung.

## Kern

Immer dabei, nicht abwählbar:

```
Journal/       — Tägliche Gedanken, Reflexionen
Gedanken/      — Einzelne Gedanken zu Themen
Projekte/      — Laufende Projekte
Vorlagen/      — Obsidian-Templates
_skills/       — Modulare Workflow-Anleitungen
```

Plus: Steckbrief, Input Dump, Parallelarbeit, Timestamps, Git-Sync.

## Module

Optionale Erweiterungen — bei der Einrichtung wählbar, jederzeit aktivier-/deaktivierbar:

| Modul | Was es tut | Dateien |
|---|---|---|
| **Aufgaben** | Zentrale Aufgabenliste mit Sektionen und Archiv | `Aufgaben.md`, `Aufgaben Archiv.md`, `Zu tun/` |
| **Sprints** | Regelmäßige fokussierte Arbeitssessions | `Sprints/` |
| **Forks** | Parallele Recherche-Tabs mit Briefings | `_forks/` |
| **Kalender** | CalDAV-Integration mit Kontext-Notes | `Kalender/` |
| **Baupläne** | Maschinen-Backlog (Features die der Bot sich selbst baut) | `Baupläne.md` |
| **Menschen** | Personen-Notes mit Steckbriefen | `Menschen/` |

Module deaktivieren: Sektion aus `CLAUDE.md` → "Aktive Module" entfernen + zugehörige Dateien löschen.

## Wie es funktioniert

- **Du schreibst** in Obsidian — Gedanken, Journal-Einträge, Projekt-Notizen
- **Dein Bot** kennt alles im Vault und kann Zusammenhänge herstellen, an frühere Gedanken erinnern, Verknüpfungen vorschlagen
- **Timestamps** machen nachvollziehbar, wann du was geöffnet und bearbeitet hast
- **Parallelarbeit** ist möglich — mehrere Claude-Code-Tabs arbeiten über Git-Worktrees koordiniert
- **Module** erweitern die Werkstatt um Aufgaben, Sprints, Forks und mehr

## Beispiel-Dateien

In `Vorlagen/` liegen zwei Beispiele:
- `Beispiel-Journal.md` — zeigt wie ein Journal-Eintrag aussieht
- `Beispiel-Gedanke.md` — zeigt wie ein einzelner Gedanke aussieht

Lösche sie wenn du sie nicht mehr brauchst.

## Lizenz

Dieses Template ist frei nutzbar. Mach damit was du willst.

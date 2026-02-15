# Mika — Persönlicher Wissensmanager (Template)

Ein Obsidian-Vault mit KI-Begleitung durch Claude Code. Dein persönlicher Denkraum — Gedanken festhalten, Zusammenhänge erkennen, über die Zeit reflektieren.

## Was ist das?

Mika ist ein System aus:
- **Obsidian-Vault** — dein privater Notiz-Raum mit Markdown-Dateien
- **Claude Code** — KI-Begleiter, der deinen Vault kennt, Zusammenhänge sieht und dich beim Denken unterstützt
- **Timestamp-Plugin** — automatische Zeitstempel, die nachvollziehbar machen wann du was gedacht hast

Der KI-Begleiter ist kein Assistent im klassischen Sinn. Er kennt dich, begleitet dein Denken und spiegelt es. Er hilft dir, Gedanken zu ordnen, erinnert dich an frühere Überlegungen und gibt Anstöße.

## Setup

### Voraussetzungen

- [Obsidian](https://obsidian.md/) (kostenlos)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (CLI, braucht Anthropic API-Key oder Claude Max Abo)
- [Git](https://git-scm.com/) + GitHub-Account
- Optional: [Obsidian Git Plugin](https://github.com/Versioning/obsidian-git) für Handy-Sync

### Schritt für Schritt

1. **Repo forken/klonen**
   ```bash
   git clone https://github.com/Marlin-hi/mika-template.git mein-vault
   cd mein-vault
   ```

2. **Eigenes GitHub-Repo erstellen** (privat empfohlen)
   ```bash
   gh repo create mein-vault --private
   git remote set-url origin https://github.com/DEIN-USERNAME/mein-vault.git
   git push -u origin master
   ```

3. **Placeholder ersetzen** — Suche und ersetze in allen Dateien:
   - `[Nutzername]` → dein Name
   - `[BotName]` → Name deines KI-Begleiters (z.B. Mika, Niko, ...)
   - `[BotName-klein]` → Kleingeschriebene Version (z.B. mika, niko, ...)
   - `[vault-name]` → Name deines Vault-Ordners
   - `YYYY-MM-DDTHH:MM` in Frontmatter → aktuelles Datum/Uhrzeit

4. **Obsidian öffnen**
   - "Open folder as vault" → deinen Vault-Ordner wählen
   - Plugin aktivieren: Einstellungen → Community Plugins → "Mika Timestamps" aktivieren
   - Vorlagen-Ordner setzen: Einstellungen → Templates → "Vorlagen" eintragen

5. **Claude Code starten**
   ```bash
   cd mein-vault
   claude
   ```
   Der Bot liest automatisch `CLAUDE.md` und weiß wie er mit dem Vault arbeiten soll.

6. **Steckbrief ausfüllen** — Öffne `Steckbrief.md` und erzähl deinem Bot wer du bist. Das ist die Grundlage für alles Weitere.

## Struktur

```
Journal/       — Tägliche Gedanken, Reflexionen
Gedanken/      — Einzelne Gedanken zu Themen
Projekte/      — Laufende Projekte
Vorlagen/      — Obsidian-Templates (inkl. Beispiele)
```

Alles andere sind System-Dateien (`_*.md`, `CLAUDE.md`), die die KI-Begleitung koordinieren.

## Wie es funktioniert

- **Du schreibst** in Obsidian — Gedanken, Journal-Einträge, Projekt-Notizen
- **Dein Bot** kennt alles im Vault und kann Zusammenhänge herstellen, an frühere Gedanken erinnern, Verknüpfungen vorschlagen
- **Timestamps** machen nachvollziehbar, wann du was geöffnet und bearbeitet hast
- **Parallelarbeit** ist möglich — mehrere Claude-Code-Tabs arbeiten über Git-Worktrees koordiniert

## Beispiel-Dateien

In `Vorlagen/` liegen zwei Beispiele:
- `Beispiel-Journal.md` — zeigt wie ein Journal-Eintrag aussieht
- `Beispiel-Gedanke.md` — zeigt wie ein einzelner Gedanke aussieht

Lösche sie wenn du sie nicht mehr brauchst.

## Lizenz

Dieses Template ist frei nutzbar. Mach damit was du willst.

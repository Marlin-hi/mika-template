# Parallelarbeit

Mehrere Claude-Code-Tabs können gleichzeitig am Vault arbeiten. Koordination läuft über zwei Schichten:
1. **Prävention**: `_arbeit.md` listet pro Tab welche Dateien betroffen sind — neue Tabs vermeiden diese Dateien
2. **Schutz**: Jeder Tab arbeitet in einem eigenen Git Worktree — Konflikte werden beim Merge erkannt

## Beim Start jeder Session

1. Generiere eine Tab-ID: `tab-` + 4 zufällige Hex-Zeichen (z.B. `tab-a3f2`)
2. `git pull --rebase` im Vault-Verzeichnis
3. Lies `_onboarding.md` und `_arbeit.md`
4. Entferne Einträge in `_arbeit.md` die älter als 2 Stunden sind (mit Log-Eintrag)
5. Aufgabe wählen — **Dateien prüfen die in `_arbeit.md` als belegt gelistet sind und diese vermeiden**
6. In `_arbeit.md` eintragen mit ALLEN Dateien die du planst zu ändern
7. **`_arbeit.md` committen und pushen** — damit andere Tabs beim Pull sehen, was belegt ist
8. Branch + Worktree erstellen:
   ```bash
   git worktree add ../[vault-name]-tabs/tab-XXXX -b tab-XXXX/aufgabenname
   ```

## Während der Arbeit

- **Dateien editieren**: Absolute Pfade zum Worktree nutzen
- **Vault durchsuchen (MCP-Tools)**: Funktionieren normal — lesen aus dem Hauptvault (master-Stand). MCP zeigt den veröffentlichten Stand, der Tab arbeitet an seiner Kopie
- **Dateien im Worktree durchsuchen**: Standard-Tools (Read, Grep, Glob) mit Worktree-Pfad
- **Regelmäßig committen** im Worktree (auf dem eigenen Branch)

## Beim Beenden

1. Alle Änderungen im Worktree committen
2. Im Hauptverzeichnis — ausstehende Obsidian-Änderungen zuerst committen:
   ```bash
   git add -A && git commit -m "Obsidian-Änderungen vor Merge"
   git pull --rebase
   git merge tab-XXXX/aufgabenname
   ```
3. Konfliktauflösung (siehe unten)
4. Push auf remote
5. Aufräumen:
   ```bash
   git worktree remove ../[vault-name]-tabs/tab-XXXX
   git branch -d tab-XXXX/aufgabenname
   ```
6. Eigenen Eintrag aus `_arbeit.md` entfernen
7. `_onboarding.md` und `_log.md` aktualisieren

## Konfliktauflösung

**Selbst auflösen:**
- Verschiedene Dateien oder verschiedene Stellen in einer Datei → Git merged automatisch
- Additive Änderungen (`_log.md`, `Baupläne.md`) → beide behalten

**[Nutzername] fragen:**
- Gleiche Zeilen in einer Note geändert (echte Merge-Konflikte)
- Strukturelle Änderungen (Dateien verschoben, umbenannt, gelöscht)
- Widersprüchliche Änderungen an CLAUDE.md oder Steckbrief

Bei echtem Konflikt: beide Versionen zeigen, [Nutzername]s Entscheidung abwarten.

## Kein `git stash` verwenden

Obsidian schreibt ständig in Vault-Dateien (Timestamps, Log). Zwischen `stash` und `stash pop` können sich Dateien ändern, was zu Konflikten und Datenverlust führt. Stattdessen: ausstehende Änderungen committen (siehe Schritt 2 oben).

## Wichtig

- [Nutzername] darf immer alles ändern — Obsidian und Claude Code sind gleichberechtigt
- Wenn [Nutzername] einen Eintrag in `_arbeit.md` löscht, respektiere das stillschweigend
- `[vault-name]-tabs/` Verzeichnis wird nicht committed (in .gitignore)

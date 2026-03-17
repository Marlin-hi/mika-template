# Forks

Forks zweigen Themen in eigene Tabs ab. Der Ursprungs-Tab erstellt ein Briefing, der Fork-Tab arbeitet es selbstständig ab.

**Forks dürfen NUR nach expliziter Erlaubnis durch [Nutzername] gestartet werden.** Nie eigenständig Forks spawnen.

## Wann Forks nutzen

- Recherche-Aufgaben die den Hauptfluss unterbrechen würden
- Themen die isoliert bearbeitet werden können
- Parallele Arbeit an unabhängigen Fragen

## Briefing erstellen

Der Ursprungs-Tab erstellt eine Datei in `_forks/`:

Dateiname: `_forks/fork-[thema].md`

```yaml
---
created: YYYY-MM-DDTHH:MM
status: offen
origin: tab-XXXX
---
```

### Inhalt

- **Kontext**: Warum diese Frage relevant ist
- **Aufgabe**: Was genau recherchiert/gebaut werden soll
- **Relevante Dateien**: Welche Vault-Dateien Kontext liefern
- **Ergebnis**: Wo und wie das Ergebnis abgelegt werden soll

## Fork starten

Platform-aware Terminal-Launch:

```bash
# Detect platform and launch
if [[ "$(uname -s)" == "Darwin" ]]; then
    osascript -e "tell app \"Terminal\" to do script \"cd ~/[vault-name] && claude \\\"fork-name\\\"\""
elif command -v wt.exe &>/dev/null; then
    wt.exe --window new -p "Fork" -- bash -c "cd ~/[vault-name] && claude 'fork-name'" &
else
    # Linux / generic
    gnome-terminal -- bash -c "cd ~/[vault-name] && claude 'fork-name'" 2>/dev/null || \
    xterm -e "cd ~/[vault-name] && claude 'fork-name'" &
fi
```

Alternativ kann das Launch-Script verwendet werden:

```bash
_scripts/launch-fork.sh "fork-name"
```

## Fork-Tab

Der Fork-Tab:
1. Liest das Briefing statt normalem Onboarding
2. Arbeitet die Aufgabe ab
3. Legt das Ergebnis wie im Briefing beschrieben ab
4. Setzt `status: abgeschlossen` im Frontmatter

## Visuelle Prüfung

Bei visueller Arbeit (Webseiten, UI, etc.) immer ein Screenshot-Tool nutzen:

```bash
# Platform-aware Screenshot-Hinweis
if [[ "$(uname -s)" == "Darwin" ]]; then
    # macOS: screencapture oder Playwright
    echo "Nutze screencapture oder Playwright für visuelle Verifikation"
elif [[ "$(uname -s)" == "MINGW"* ]] || [[ "$(uname -s)" == "MSYS"* ]]; then
    # Windows: Playwright oder eigenes Screenshot-Tool
    echo "Nutze Playwright oder _scripts/ Screenshot-Tool für visuelle Verifikation"
else
    # Linux: Playwright oder import/scrot
    echo "Nutze Playwright oder scrot für visuelle Verifikation"
fi
```

Nie blind coden — immer visuell verifizieren.

## Verifikation

Vor dem endgültigen Abschluss prüft der Ursprungs-Tab:
1. **Ziel erreicht?** — Wurde die Frage beantwortet / die Aufgabe erledigt?
2. **Vollständig?** — Fehlt etwas Wesentliches?
3. **Konsistent?** — Passt das Ergebnis zum Rest des Vaults?

Die Verifikation soll kurz sein — keine Audit-Bürokratie.

## Worker-Briefings

Bei komplexeren Forks kann das Briefing Worker-Sektionen enthalten:

```markdown
## Worker 1: Recherche
- Finde alle relevanten Quellen zu [Thema]
- Fasse zusammen in max. 500 Wörtern

## Worker 2: Umsetzung
- Basierend auf Recherche-Ergebnis
- Erstelle [konkretes Artefakt]
```

Jeder Worker arbeitet seinen Teil ab und markiert ihn als erledigt.

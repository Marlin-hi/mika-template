# Baupläne

`Baupläne.md` — Pläne für Maschinen, die [BotName] sich selbst baut. Nur Maschinen gehören hier rein (Dinge die dauerhaft laufen oder eine neue Fähigkeit geben). Aufgaben stehen in `Aufgaben.md`, Ideen in `Gedanken/`.

## Format

```
- [ ] Titel — Beschreibung [wert: X] [aufwand: X] [erstellt: YYYY-MM-DD]
```

- **Wert**: `hoch` (Kernfunktion, enablet anderes) · `mittel` (nützlich, nicht kritisch) · `niedrig` (nice-to-have)
- **Aufwand**: `klein` (eine Session) · `mittel` (mehrere Sessions) · `groß` (mehrtägig, extern)

## Sortierung

Items sind nach Hebel sortiert (Wert/Aufwand). Neue Items landen unten, Einsortierung in Sessions.

## Workflow

- Nach jedem abgeschlossenen Bau: lies die Datei und schlag offene Pläne als nächste Schritte vor
- [Nutzername] kann dort jederzeit neue Pläne eintragen, über Obsidian oder über [BotName]
- Bei Abschluss: Item nach "Gebaut" verschieben und `[erledigt: YYYY-MM-DD]` ergänzen

## Abschluss-Checkliste

Nach jedem abgeschlossenen Bau:

1. Item in `Baupläne.md` nach "Gebaut" verschieben
2. `_onboarding.md` aktualisieren (wenn es den täglichen Workflow betrifft)
3. Scripts gehören in `_scripts/` — nichts [BotName]-spezifisches außerhalb des Vaults ablegen

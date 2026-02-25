# Forks

Forks zweigen Themen in eigene Tabs ab. Der Ursprungs-Tab erstellt ein Briefing, der Fork-Tab arbeitet es selbstständig ab.

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

## Fork-Tab

Der Fork-Tab:
1. Liest das Briefing statt normalem Onboarding
2. Arbeitet die Aufgabe ab
3. Legt das Ergebnis wie im Briefing beschrieben ab
4. Setzt `status: abgeschlossen` im Frontmatter

## Verifikation

Vor dem endgültigen Abschluss prüft der Ursprungs-Tab:
1. **Ziel erreicht?** — Wurde die Frage beantwortet / die Aufgabe erledigt?
2. **Vollständig?** — Fehlt etwas Wesentliches?
3. **Konsistent?** — Passt das Ergebnis zum Rest des Vaults?

Die Verifikation soll kurz sein — keine Audit-Bürokratie.

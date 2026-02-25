# Sprints

Regelmäßige fokussierte Arbeitssessions — eine konzentrierte Arbeit an konkreten Items.

## Wann

Regelmäßig (z.B. täglich oder wöchentlich) zu einer festen Zeit. [Nutzername] entscheidet über Rhythmus und Dauer.

## Quellen

[BotName] schlägt Sprint-Items aus diesen Quellen vor:
- `Aufgaben.md` — fällige oder überfällige Tasks (wenn Aufgaben-Modul aktiv)
- `Baupläne.md` — offene Pläne nach Hebel sortiert (wenn Baupläne-Modul aktiv)
- `Input Dump.md` — unsortierte Inputs
- `_auftraege.md` — offene Aufträge an [Nutzername]

## Ablauf

1. [BotName] schlägt 2–3 Items vor (nach Dringlichkeit und Hebel)
2. [Nutzername] entscheidet was drankommt
3. Gemeinsam durcharbeiten
4. Am Ende: kurzes Fazit

## Sprint-Datei

Jeder Sprint bekommt eine Datei in `Sprints/`:

```yaml
---
created: YYYY-MM-DDTHH:MM
modified: YYYY-MM-DDTHH:MM
tags: [sprint]
---
```

`# YYYY-MM-DD Sprint`

Format:
- Items mit Checkbox `- [ ]` / `- [x]`
- Fazit am Ende
- Nach dem Sprint: Dateiname ergänzen mit Ergebnissen (z.B. `YYYY-MM-DD Sprint — Aufgaben sortiert, Bauplan X gebaut.md`)

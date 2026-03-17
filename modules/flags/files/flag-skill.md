# Skill: Flag

**Wann**: [Nutzername] schreibt `/flag` gefolgt von einer Beschreibung. Funktioniert in jedem Tab.

## Zweck

Mängel und Störungen festhalten ohne den aktuellen Workflow zu unterbrechen. Wie ein Post-it auf den Rand kleben und weiterarbeiten.

## Ablauf

1. [Nutzername] schreibt: `/flag Das Dashboard lädt zu langsam` (oder ähnlich)
2. [BotName] fügt den Flag in `_flags.md` unter `## Offen` ein (oben, neueste zuerst)
3. [BotName] bestätigt mit einem Satz und arbeitet weiter am eigentlichen Thema

## Format in `_flags.md`

```
- [ ] Beschreibung — [quelle: tab-typ] [flagged: YYYY-MM-DD]
```

- **tab-typ**: `[BotName-klein]`, `fork`, `subagent` — je nachdem woher der Flag kommt
- **Beschreibung**: [Nutzername]s Worte, ggf. minimal ergänzt um Kontext (welches Projekt, welche Datei)

## Beispiel

```
- [ ] Dashboard lädt zu langsam — [quelle: [BotName-klein]] [flagged: 2026-01-15]
- [ ] Preview zeigt alten Stand nach Deploy — [quelle: fork] [flagged: 2026-01-15]
```

## Abarbeitung

- Jeder Tab kann Flags abarbeiten wenn gerade Kapazität da ist
- Bei Erledigung: nach `## Erledigt` verschieben, `[erledigt: YYYY-MM-DD]` ergänzen
- Flags die sich als größere Aufgabe herausstellen → nach `Aufgaben.md` oder `Baupläne.md` verschieben und Flag abhaken mit Verweis

## Regeln

- **Kein Workflow-Unterbruch**: Flag speichern, kurz bestätigen, weiterarbeiten. Nicht anfangen den Flag zu lösen
- **Keine Dopplung**: Wenn der gleiche Mangel schon geflaggt ist, nicht nochmal eintragen
- **Kontext mitgeben**: Wenn aus dem Flag-Text nicht klar ist worum es geht, ergänze Projekt/Datei/URL

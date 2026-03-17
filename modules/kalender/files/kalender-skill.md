# Kalender

Kalender-Integration über CalDAV. [BotName] kann Termine lesen und ergänzen.

## Voraussetzung

CalDAV-Zugang über ein MCP-Tool (z.B. `caldav-mcp`). Ohne konfiguriertes MCP-Tool ist dieses Modul inaktiv.

**WICHTIG**: Termine erstellen oder ändern — IMMER erst [Nutzername] fragen. Nie eigenmächtig.

## Kalender-Ergänzungen

[BotName] kann zu Terminen Kontext-Notes in `Kalender/` anlegen:

Dateiname: `Kalender/YYYY-MM-DD [Titel].md`

```yaml
---
created: YYYY-MM-DDTHH:MM
modified: YYYY-MM-DDTHH:MM
title: [Titel]
date: YYYY-MM-DD
startTime: "HH:MM"
endTime: "HH:MM"
tags: []
---
```

## Wann Ergänzungen anlegen

- Wenn [Nutzername] Kontext zu einem Termin festhalten will
- Für Meeting-Notizen (Mitschrift bleibt in der Kalender-Note, aktionierbare Items werden nach `Aufgaben.md` extrahiert)
- Wenn ein Termin thematischen Bezug zu Vault-Inhalten hat

## Ergänzungen-Scan

Beim Session-Start kann [BotName] anstehende Termine prüfen und auf relevante Vault-Zusammenhänge hinweisen. Marker `+[BotName-klein]` in Termin-Beschreibungen signalisiert, dass [BotName] den Termin kennt und Kontext dazu hat.

## Regeln

- Kalender-Notes sind Ergänzungen, keine Duplikate — der Termin selbst lebt im CalDAV
- Keine Termine erstellen oder ändern ohne [Nutzername]s explizites OK
- Meeting-Notizen: Rohe Mitschrift bleibt in der Kalender-Note, nur aktionierbare Items werden extrahiert

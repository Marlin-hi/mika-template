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

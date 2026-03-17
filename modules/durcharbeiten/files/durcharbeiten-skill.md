# Durcharbeiten

Fokussierte Bau-Sessions mit Zeitlimit. [BotName] arbeitet autonom an einer Aufgabe, der Stop-Hook verhindert vorzeitiges Beenden.

## Modi

### Standard-Modus (`/durcharbeiten`)

1. [Nutzername] gibt eine Aufgabe und optional ein Zeitlimit (Default: 60 min)
2. [BotName] erstellt State-File: `.claude/durcharbeiten.state`
3. [BotName] arbeitet autonom an der Aufgabe
4. `<fertig>Zusammenfassung</fertig>` beendet die Session
5. Bei Zeitlimit: Session wird automatisch beendet

### Plus-Modus (`/durcharbeiten-plus`)

Wie Standard, aber mit Polish-Phase:

1. **Build-Phase**: [BotName] baut die Aufgabe
2. `<fertig>Zusammenfassung</fertig>` → Transition zur Polish-Phase
3. **Polish-Phase**: Validierungs-Checkliste abarbeiten
   - Visuell geprüft (Screenshot-Tool)
   - Alle Links/Buttons funktionieren
   - Mobile-Viewport getestet
   - Keine Console-Errors
   - Texte auf Tippfehler
   - Theme/Design konsistent
   - Edge Cases (leere Daten, lange Texte)
4. `<poliert>Zusammenfassung</poliert>` beendet die Polish-Phase
5. Weiter zum nächsten Modul oder Session beenden

## State-File

`.claude/durcharbeiten.state` — Key-Value-Format:

```
mode=standard
start_time=1710000000
limit_minutes=60
session_id=abc123
task=Beschreibung der Aufgabe
```

Plus-Modus zusätzlich:
```
mode=plus
polishing=false
```

Das State-File wird bei Session-Ende oder Zeitlimit gelöscht.

## Session starten

```bash
# State-File erstellen
cat > .claude/durcharbeiten.state <<EOF
mode=standard
start_time=$(date +%s)
limit_minutes=60
session_id=${SESSION_ID}
task=Aufgabenbeschreibung
EOF
```

## Token-Checkup

Alle 5 Minuten zeigt der Stop-Hook Token-Verbrauch und Kosten an:

```
--- TOKEN-CHECKUP ---
Verbraucht: 45.2K (davon 12.1K Output) | Kosten: $0.82 | Zeit: 15/60 min
```

## Wichtig

- Der Stop-Hook prüft die `session_id` — nur der Tab der die Session gestartet hat wird blockiert
- Andere parallele Tabs werden nicht beeinflusst
- Bei kaputtem State-File wird die Session automatisch beendet
- `[Nutzername]` kann die Session jederzeit beenden indem er das State-File löscht

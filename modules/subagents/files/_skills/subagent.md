# Subagents

Subagents sind eigenständige Claude-Code-Prozesse die [BotName] für Teilaufgaben starten kann — kein OK von [Nutzername] nötig.

## Wann Subagents nutzen

- Parallelisierbare Teilaufgaben
- Recherche die den Hauptfluss nicht blockieren soll
- Aufgaben die klar abgegrenzt sind

## Wie starten

Subagents werden über das Terminal gestartet (violette Fenster). Der Hauptprozess gibt eine klare Aufgabe mit und wartet auf das Ergebnis.

## Wichtig

- Subagents arbeiten im selben Vault — Dateikonflikte vermeiden
- Klare Aufgabenstellung mitgeben
- Ergebnis am Ende zusammenfassen

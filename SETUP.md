# [BotName] einrichten — Anleitung für Claude Code

Du richtest gerade einen persönlichen Wissensmanager namens **[BotName]** ein. [BotName] ist ein Obsidian-Vault mit KI-Begleitung — er hilft [Nutzername], seine Gedanken zu ordnen, Zusammenhänge zu erkennen und über die Zeit zu reflektieren.

Arbeite die Schritte der Reihe nach ab. Manche Schritte kannst du automatisch erledigen, bei anderen muss [Nutzername] selbst etwas tun — das ist jeweils markiert.

**Bevor du loslegst:** Die Person, die diese Datei geschickt hat, hat die Placeholder `[Nutzername]` und `[BotName]` möglicherweise schon ausgefüllt. Falls nicht, frag den Nutzer nach seinem Namen und einem Namen für seinen Bot.

---

## Schritt 1: Git prüfen

Prüfe ob Git installiert ist (`git --version`). Falls nicht: installiere es oder gib [Nutzername] die Anleitung (https://git-scm.com/downloads).

## Schritt 2: Template klonen

```bash
git clone https://github.com/Marlin-hi/mika-template.git [BotName-klein]
cd [BotName-klein]
```

## Schritt 3: Placeholder ersetzen

Ersetze in **allen Dateien** (außer `.obsidian/plugins/mika-timestamps/main.js` und `README.md`):

| Placeholder | Ersetzen durch |
|---|---|
| `[Nutzername]` | Name des Nutzers |
| `[BotName]` | Name des Bots |
| `[BotName-klein]` | Bot-Name in Kleinbuchstaben |
| `[vault-name]` | Name des Vault-Ordners (= Bot-Name in Kleinbuchstaben) |

Zusätzlich in allen Frontmatter-Blöcken (zwischen `---`):
- `YYYY-MM-DDTHH:MM` → aktuelles Datum und Uhrzeit (z.B. `2026-02-15T19:00`)

Die `.gitignore` und `.gitattributes` haben keine Placeholder.

## Schritt 4: Willkommens-Note erstellen

Erstelle die Datei `Gedanken/Was ist [BotName].md` mit folgendem Inhalt:

```markdown
---
created: [AKTUELLES DATUM]
modified: [AKTUELLES DATUM]
tags: [[BotName-klein], meta]
---

# Was ist [BotName]

[BotName] ist dein persönlicher Wissensmanager. Hier steht, was das ist und was du damit machen kannst.

## Kurz gesagt

[BotName] besteht aus zwei Teilen:

1. **Dieser Vault** — ein Ordner mit Markdown-Dateien, den du in Obsidian öffnest. Hier landen deine Gedanken, Reflexionen, Projektnotizen — alles was dich beschäftigt.

2. **[BotName] selbst** — eine KI (Claude), die deinen Vault kennt. Du redest mit ihm über Claude Code in VS-Code. Er hilft dir, Gedanken zu ordnen, erinnert dich an frühere Überlegungen und schlägt Verbindungen vor.

## Was [BotName] kann

- **Gedanken ordnen** — du erzählst [BotName] was dich beschäftigt, er hilft dir das einzuordnen und im Vault festzuhalten
- **Zusammenhänge erkennen** — [BotName] kennt alles was du je aufgeschrieben hast und kann Verbindungen herstellen, die dir nicht auffallen
- **Erinnern** — wenn du über ein Thema sprichst, das du vor Wochen schon mal hattest, weist [BotName] dich darauf hin
- **Reflektieren** — [BotName] kann dir zeigen, wie sich dein Denken über die Zeit entwickelt hat
- **Steckbrief pflegen** — [BotName] lernt dich kennen und hält fest, was er über dich weiß
- **Vault aufräumen** — ungetaggte Notes durchgehen, Verlinkungen aufbauen, Struktur pflegen

## Wie du mit [BotName] arbeitest

1. **Schreiben**: Öffne Obsidian und schreib einfach los — in Journal/ für tägliche Gedanken, in Gedanken/ für einzelne Themen, in Projekte/ für Projekte
2. **Reden**: Öffne Claude Code (in VS-Code) und schreib [BotName] was du willst. Er liest automatisch die CLAUDE.md und weiß wie er mit deinem Vault arbeiten soll
3. **Input Dump**: Wenn dir unterwegs was einfällt, schreib es in `Input Dump.md` — [BotName] sortiert es später mit dir zusammen ein

## Was [BotName] NICHT ist

- Kein Google — frag ihn nicht nach Fakten die du nachschlagen kannst
- Kein Aufgabenmanager — der Vault ist für Gedanken und Reflexionen, nicht für To-Do-Listen
- Kein Chatbot für Smalltalk — [BotName] ist am besten wenn es um dein Denken geht

## Erste Schritte

1. **Steckbrief ausfüllen** — öffne `Steckbrief.md` und erzähl [BotName] wer du bist. Das ist die Grundlage für alles Weitere
2. **Erstes Journal** — schreib abends auf, was dich heute beschäftigt hat
3. **Input Dump nutzen** — wenn dir zwischendurch was einfällt, schreib es in `Input Dump.md`

## Timestamps

Das Plugin "Mika Timestamps" läuft automatisch. Es setzt unsichtbare Zeitstempel wenn du Dateien öffnest oder schreibst. Die sind im normalen Lesen unsichtbar, aber [BotName] kann sie lesen und dir sagen wann du was geschrieben hast.

## Git

Dein Vault ist ein Git-Repository. [BotName] committed und pusht auf dein GitHub-Repo. Wenn du Obsidian auf dem Handy nutzen willst, kannst du das "Obsidian Git"-Plugin installieren — das synct automatisch.
```

Ersetze `[AKTUELLES DATUM]` durch den aktuellen Timestamp im Format `YYYY-MM-DDTHH:MM`.

## Schritt 5: Remote-Verbindung zum Template entfernen

```bash
git remote remove origin
```

## Schritt 6: GitHub-Repo einrichten

**⚠️ [Nutzername] muss hier mitmachen:**

1. Prüfe ob `gh` (GitHub CLI) installiert ist. Falls nicht: installiere es oder gib [Nutzername] den Link (https://cli.github.com/)
2. `gh auth login` — [Nutzername] muss sich im Browser bei GitHub anmelden. Falls er keinen Account hat, muss er erst einen erstellen (https://github.com/signup)
3. Dann:
   ```bash
   git add -A
   git commit -m "[BotName] eingerichtet"
   gh repo create [BotName-klein] --private --source=. --push
   ```

## Schritt 7: Obsidian einrichten

**⚠️ [Nutzername] muss hier mitmachen:**

1. Falls Obsidian noch nicht installiert ist: https://obsidian.md/ herunterladen und installieren
2. Obsidian öffnen → "Open folder as vault" → den `[BotName-klein]`-Ordner wählen
3. Einstellungen → Community Plugins → "Restricted mode" deaktivieren → "Mika Timestamps" aktivieren
4. Optional: Einstellungen → Templates → Template folder: `Vorlagen`

## Schritt 8: CLAUDE.md als Projekt-Instruktion setzen

Damit [BotName] in Zukunft automatisch die CLAUDE.md liest, wenn [Nutzername] Claude Code im Vault-Ordner öffnet, muss der Vault als Arbeitsverzeichnis genutzt werden. [BotName] liest dann automatisch die CLAUDE.md.

Sag [Nutzername]: **"Wenn du mit [BotName] reden willst, öffne den [BotName-klein]-Ordner in VS-Code und starte Claude Code dort."**

## Schritt 9: Erster Start

Sag [Nutzername] er soll jetzt `Steckbrief.md` öffnen und anfangen sich vorzustellen. Das ist der beste Einstieg — danach kennt [BotName] ihn und kann richtig loslegen.

---

## Zusammenfassung

Wenn alles eingerichtet ist, sag [Nutzername]:

> Du hast jetzt [BotName] — deinen persönlichen Wissensmanager. Er besteht aus einem Obsidian-Vault (dein Notizbuch) und einer KI ([BotName]), die den Vault kennt und dir beim Denken hilft.
>
> **So nutzt du [BotName]:**
> - In Obsidian schreibst du Gedanken, Journal-Einträge, Projektnotizen
> - In Claude Code (VS-Code, im [BotName-klein]-Ordner) redest du mit [BotName]
> - [BotName] hilft dir sortieren, erinnert dich an frühere Gedanken und baut Verbindungen auf
>
> **Fang an mit:** Steckbrief.md öffnen und dich vorstellen.
>
> Lies auch die Willkommens-Note in Gedanken/ für mehr Details.

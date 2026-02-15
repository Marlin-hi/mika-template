'use strict';

/*
 * ============================================================
 *  Mika Timestamps — Obsidian Plugin
 * ============================================================
 *
 *  Setzt granulare Zeitstempel als HTML-Kommentare in Vault-Dateien.
 *  HTML-Kommentare sind im Reading View unsichtbar, im Source View sichtbar.
 *
 *  Zwei Arten von Inline-Timestamps:
 *    <!--o:02-12 20:15-->   Beim Öffnen einer Datei (nach Frontmatter)
 *    <!--e:02-12 20:18-->   Beim Tippen nach ≥30s Pause (vor dem Cursor)
 *
 *  Zentrales Log:
 *    Jedes Event wird in _log.md protokolliert (neueste oben).
 *
 *  Ausgeschlossen:
 *    - Vorlagen/ (Templates sollen sauber bleiben)
 *    - _log.md selbst (keine Endlos-Rekursion)
 *
 *  Autor: Marlin & Mika
 *  Version: 0.1.0
 * ============================================================
 */

const { Plugin, MarkdownView } = require('obsidian');

// --- Konfiguration ---

const PAUSE_THRESHOLD = 30000;      // Pause in ms bevor ein neuer Edit-Timestamp gesetzt wird
const LOG_FILE = '_log.md';          // Pfad zur zentralen Log-Datei
const EXCLUDED_FILES = ['_log.md', '_onboarding.md']; // Einzeldateien ohne Timestamps
const EXCLUDED_FOLDERS = ['Vorlagen']; // Ordner ohne Timestamps
const FILE_OPEN_DELAY = 200;         // Delay in ms nach file-open, damit Editor bereit ist
const INSERT_GUARD_DELAY = 100;      // Delay in ms für isInserting-Flag Reset

class MikaTimestampsPlugin extends Plugin {

    // Pro Datei den Zeitpunkt des letzten Tastendrucks merken,
    // damit wir nur nach echten Pausen einen Timestamp setzen.
    lastEditTimes = {};

    // Flag gegen Rekursion: wenn wir selbst Text einfügen,
    // feuert editor-change erneut — das ignorieren wir.
    isInserting = false;

    async onload() {
        console.log('Mika Timestamps geladen');

        // ----- Event: Datei wird geöffnet -----
        // Setzt einen <!-- opened: ... --> Kommentar nach dem Frontmatter.
        // Loggt "geöffnet" in _log.md.
        this.registerEvent(
            this.app.workspace.on('file-open', (file) => {
                if (!file || this.isExcluded(file.path)) return;

                // Kleiner Delay: nach file-open ist der Editor
                // manchmal noch nicht vollständig initialisiert.
                setTimeout(() => {
                    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                    if (!view || view.file?.path !== file.path) return;

                    this.insertOpenedTimestamp(view.editor);
                    this.logToFile(file.basename, 'geöffnet');
                }, FILE_OPEN_DELAY);
            })
        );

        // ----- Event: Editor-Inhalt ändert sich -----
        // Wenn seit dem letzten Tastendruck ≥30s vergangen sind,
        // setze einen <!-- edit: ... --> Kommentar VOR die Cursorposition.
        this.registerEvent(
            this.app.workspace.on('editor-change', (editor, info) => {
                if (this.isInserting) return;

                const file = info.file;
                if (!file || this.isExcluded(file.path)) return;

                const now = Date.now();
                const lastEdit = this.lastEditTimes[file.path] || 0;

                if (now - lastEdit > PAUSE_THRESHOLD) {
                    this.insertEditTimestamp(editor);
                    this.logToFile(file.basename, 'bearbeitet');
                }

                this.lastEditTimes[file.path] = now;
            })
        );
    }

    onunload() {
        console.log('Mika Timestamps entladen');
    }

    // =========================================================
    //  Timestamps einfügen
    // =========================================================

    /**
     * Opened-Timestamp: wird nach dem Frontmatter eingefügt.
     * Markiert den Zeitpunkt, an dem der Nutzer die Datei geöffnet hat.
     */
    insertOpenedTimestamp(editor) {
        this.isInserting = true;
        try {
            const insertLine = this.findEndOfFrontmatter(editor);
            const ts = `<!-- opened: ${this.getTimestamp()} -->\n`;
            editor.replaceRange(ts, { line: insertLine, ch: 0 });
        } finally {
            setTimeout(() => { this.isInserting = false; }, INSERT_GUARD_DELAY);
        }
    }

    /**
     * Edit-Timestamp: wird VOR der aktuellen Cursorposition eingefügt.
     * Markiert den Beginn einer neuen Schreib-Session nach einer Pause.
     *
     * Einfügestrategie: Neue Zeile am Ende der vorherigen Zeile anhängen,
     * sodass der Timestamp oberhalb des Cursors erscheint und der
     * Cursor auf seiner Zeile bleibt.
     */
    insertEditTimestamp(editor) {
        this.isInserting = true;
        try {
            const cursor = editor.getCursor();
            const ts = `<!-- edit: ${this.getTimestamp()} -->`;

            if (cursor.line > 0) {
                // Timestamp als neue Zeile zwischen vorheriger Zeile und Cursor-Zeile
                const prevLine = cursor.line - 1;
                const prevLineLen = editor.getLine(prevLine).length;
                editor.replaceRange('\n' + ts, { line: prevLine, ch: prevLineLen });
            } else {
                // Cursor ist ganz oben — Timestamp davor setzen
                editor.replaceRange(ts + '\n', { line: 0, ch: 0 });
            }
        } finally {
            setTimeout(() => { this.isInserting = false; }, INSERT_GUARD_DELAY);
        }
    }

    // =========================================================
    //  Zentrales Aktivitätslog (_log.md)
    // =========================================================

    /**
     * Schreibt einen Eintrag in _log.md.
     * Format: "YYYY-MM-DDTHH:MM — Dateiname — Aktion"
     * Neueste Einträge stehen oben (direkt nach dem Header).
     * Legt _log.md automatisch an, falls sie noch nicht existiert.
     */
    async logToFile(filename, action) {
        const entry = `${this.getTimestamp()} — ${filename} — ${action}`;
        const adapter = this.app.vault.adapter;

        let content;
        try {
            content = await adapter.read(LOG_FILE);
        } catch {
            // Log-Datei existiert noch nicht — mit Frontmatter anlegen
            content = [
                '---',
                `created: ${this.getTimestamp()}`,
                `modified: ${this.getTimestamp()}`,
                'tags: [meta, log]',
                '---',
                '',
                '# Aktivitätslog',
                ''
            ].join('\n');
        }

        // Eintrag direkt nach "# Aktivitätslog" einfügen
        const insertPos = this.findLogInsertPosition(content);
        const newContent =
            content.slice(0, insertPos) +
            entry + '\n' +
            content.slice(insertPos);

        await adapter.write(LOG_FILE, newContent);
    }

    /**
     * Findet die Position in _log.md direkt nach der Header-Zeile,
     * damit neue Einträge oben (chronologisch neueste zuerst) stehen.
     */
    findLogInsertPosition(content) {
        const headerMatch = content.indexOf('# Aktivitätslog');
        if (headerMatch !== -1) {
            const afterHeader = content.indexOf('\n', headerMatch);
            if (afterHeader !== -1) {
                return afterHeader + 1;
            }
        }
        return content.length;
    }

    // =========================================================
    //  Hilfsfunktionen
    // =========================================================

    /** Gibt den aktuellen Zeitpunkt als ISO-String zurück: YYYY-MM-DDTHH:MM */
    getTimestamp() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }

    /**
     * Findet die erste Zeile nach dem YAML-Frontmatter (--- ... ---).
     * Falls kein Frontmatter vorhanden: Zeile 0.
     */
    findEndOfFrontmatter(editor) {
        const lineCount = editor.lineCount();
        if (editor.getLine(0).trim() === '---') {
            for (let i = 1; i < lineCount; i++) {
                if (editor.getLine(i).trim() === '---') {
                    return i + 1;
                }
            }
        }
        return 0;
    }

    /**
     * Prüft ob eine Datei von Timestamps ausgeschlossen ist.
     * Ausgeschlossen: _log.md und alle Dateien in EXCLUDED_FOLDERS.
     */
    isExcluded(path) {
        if (EXCLUDED_FILES.includes(path)) return true;
        for (const folder of EXCLUDED_FOLDERS) {
            if (path.startsWith(folder + '/')) return true;
        }
        return false;
    }
}

module.exports = MikaTimestampsPlugin;

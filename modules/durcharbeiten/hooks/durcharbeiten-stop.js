// Durcharbeiten Stop Hook
// Blocks Claude from stopping while a "durcharbeiten" session is active.
// Standard mode: lets Claude stop on <fertig> or time limit
// Plus mode: <fertig> triggers polish phase, only <poliert> truly finishes

const fs = require('fs');
const path = require('path');

// Resolve vault root relative to this hook file
// Hook lives at: <vault>/.claude/hooks/durcharbeiten-stop.js
const VAULT_ROOT = path.resolve(__dirname, '..', '..');
const STATE_FILE = path.join(VAULT_ROOT, '.claude', 'durcharbeiten.state');

// Token checkup: read JSONL transcript and calculate usage
function getTokenUsage(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return null;
  try {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    const lines = content.trim().split('\n');
    let ti = 0, to = 0, tcc = 0, tcr = 0;
    for (const line of lines) {
      try {
        const o = JSON.parse(line);
        if (o.message && o.message.usage) {
          const u = o.message.usage;
          ti += u.input_tokens || 0;
          to += u.output_tokens || 0;
          tcc += u.cache_creation_input_tokens || 0;
          tcr += u.cache_read_input_tokens || 0;
        }
      } catch (e) {}
    }
    const total = ti + to + tcc + tcr;
    const cost = (ti * 15 + to * 75 + tcc * 3.75 + tcr * 0.30) / 1e6;
    return { total, cost, output: to };
  } catch (e) {
    return null;
  }
}

// Format token count
function fmtTokens(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  // No active session — allow stop
  if (!fs.existsSync(STATE_FILE)) {
    process.exit(0);
  }

  const hookData = JSON.parse(input);
  const stateContent = fs.readFileSync(STATE_FILE, 'utf8');

  // Parse state file (key=value format)
  const state = {};
  for (const line of stateContent.split('\n')) {
    const idx = line.indexOf('=');
    if (idx > 0) {
      state[line.slice(0, idx)] = line.slice(idx + 1);
    }
  }

  // Only block the tab that started durcharbeiten (not other parallel tabs)
  if (state.session_id && hookData.session_id && state.session_id !== hookData.session_id) {
    process.exit(0);
  }

  const startTime = parseInt(state.start_time);
  const limitMinutes = parseInt(state.limit_minutes);

  if (isNaN(startTime) || isNaN(limitMinutes)) {
    process.stderr.write('Durcharbeiten: State-File kaputt, stoppe.\n');
    fs.unlinkSync(STATE_FILE);
    process.exit(0);
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const elapsedMinutes = Math.floor((nowSeconds - startTime) / 60);
  const remaining = limitMinutes - elapsedMinutes;

  // Time limit reached — always stop
  if (elapsedMinutes >= limitMinutes) {
    process.stderr.write(`Durcharbeiten: Zeitlimit erreicht (${limitMinutes}min). Session beendet.\n`);
    fs.unlinkSync(STATE_FILE);
    process.exit(0);
  }

  const lastMsg = hookData.last_assistant_message || '';
  const isPlus = state.mode === 'plus';
  const polishing = state.polishing === 'true';

  // --- PLUS MODE ---
  if (isPlus) {
    // Phase 2: Polishing. Only <poliert> lets through.
    if (polishing) {
      if (/<poliert>[\s\S]*?<\/poliert>/.test(lastMsg)) {
        process.stderr.write('Durcharbeiten-Plus: Modul poliert. Weiter zum nächsten.\n');
        // Reset polishing for next module
        const resetState = stateContent.replace(/polishing=.*/, 'polishing=false');
        fs.writeFileSync(STATE_FILE, resetState);
        process.exit(0);
      }
      // Still polishing — block and remind
      const usage = getTokenUsage(hookData.transcript_path);
      const tokenInfo = usage ? ` | Tokens: ${fmtTokens(usage.total)} ($${usage.cost.toFixed(2)})` : '';

      const result = {
        decision: 'block',
        reason: `POLISH-PHASE. Checkliste abarbeiten:\n` +
          `- [ ] Visuell geprüft (Screenshot-Tool)\n` +
          `- [ ] Alle Links/Buttons funktionieren\n` +
          `- [ ] Mobile-Viewport getestet\n` +
          `- [ ] Keine Console-Errors\n` +
          `- [ ] Texte auf Tippfehler\n` +
          `- [ ] Theme/Design konsistent\n` +
          `- [ ] Edge Cases (leere Daten, lange Texte)\n\n` +
          `Wenn ALLES geprüft und gefixt: <poliert>Zusammenfassung</poliert>\n` +
          `Noch ${remaining} Minuten.${tokenInfo}`,
        systemMessage: `Durcharbeiten-Plus: ${elapsedMinutes}/${limitMinutes} min [POLISH]${tokenInfo}`
      };
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    }

    // Phase 1: Building. <fertig> transitions to polish phase.
    if (/<fertig>[\s\S]*?<\/fertig>/.test(lastMsg)) {
      // Transition to polish phase
      const updatedState = stateContent.includes('polishing=')
        ? stateContent.replace(/polishing=.*/, 'polishing=true')
        : stateContent + '\npolishing=true';
      fs.writeFileSync(STATE_FILE, updatedState);

      const usage = getTokenUsage(hookData.transcript_path);
      const tokenInfo = usage ? ` | Tokens: ${fmtTokens(usage.total)} ($${usage.cost.toFixed(2)})` : '';

      const result = {
        decision: 'block',
        reason: `Gut gebaut! Jetzt POLISH-PHASE. Arbeite die Validierungs-Checkliste ab:\n` +
          `- [ ] Visuell geprüft (Screenshot-Tool)\n` +
          `- [ ] Alle Links/Buttons funktionieren\n` +
          `- [ ] Mobile-Viewport getestet\n` +
          `- [ ] Keine Console-Errors\n` +
          `- [ ] Texte auf Tippfehler\n` +
          `- [ ] Theme/Design konsistent\n` +
          `- [ ] Edge Cases (leere Daten, lange Texte)\n\n` +
          `Finde und fixe Probleme. Wenn ALLES sauber: <poliert>Zusammenfassung</poliert>\n` +
          `Noch ${remaining} Minuten.${tokenInfo}`,
        systemMessage: `Durcharbeiten-Plus: ${elapsedMinutes}/${limitMinutes} min [POLISH START]${tokenInfo}`
      };
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    }
  }

  // --- STANDARD MODE ---
  if (!isPlus && /<fertig>[\s\S]*?<\/fertig>/.test(lastMsg)) {
    process.stderr.write('Durcharbeiten: Aufgabe abgeschlossen.\n');
    fs.unlinkSync(STATE_FILE);
    process.exit(0);
  }

  // --- TOKEN CHECKUP (every 5 minutes) ---
  const lastCheckup = parseInt(state.last_checkup || '0');
  const minutesSinceCheckup = Math.floor((nowSeconds - (lastCheckup || startTime)) / 60);
  let tokenCheckup = '';

  if (minutesSinceCheckup >= 5) {
    const usage = getTokenUsage(hookData.transcript_path);
    if (usage) {
      tokenCheckup = `\n\n--- TOKEN-CHECKUP ---\nVerbraucht: ${fmtTokens(usage.total)} (davon ${fmtTokens(usage.output)} Output) | Kosten: $${usage.cost.toFixed(2)} | Zeit: ${elapsedMinutes}/${limitMinutes} min`;
      // Update last checkup time in state
      const updatedState = stateContent.includes('last_checkup=')
        ? stateContent.replace(/last_checkup=.*/, `last_checkup=${nowSeconds}`)
        : stateContent + `\nlast_checkup=${nowSeconds}`;
      fs.writeFileSync(STATE_FILE, updatedState);
    }
  }

  // Not done — block and continue
  let phaseHint;
  if (isPlus && polishing) {
    phaseHint = ` Du bist in der POLISH-PHASE. Checkliste weiter abarbeiten. Wenn alles sauber: <poliert>Zusammenfassung</poliert>`;
  } else if (isPlus) {
    phaseHint = ` Du bist in der BUILD-PHASE. Wenn das Modul gebaut ist: <fertig>Zusammenfassung</fertig> — dann startet die Polish-Phase.`;
  } else {
    phaseHint = ` Wenn alles erledigt und getestet: <fertig>Zusammenfassung</fertig>`;
  }

  const result = {
    decision: 'block',
    reason: `Du bist noch nicht fertig. Arbeite weiter. Noch ${remaining} Minuten.${phaseHint}${tokenCheckup}`,
    systemMessage: `Durcharbeiten${isPlus ? '-Plus' : ''}: ${elapsedMinutes}/${limitMinutes} min${isPlus ? (polishing ? ' [POLISH]' : ' [BUILD]') : ''}`
  };

  process.stdout.write(JSON.stringify(result));
  process.exit(0);
});

// Subagent Stop Hook
// Blocks Claude from stopping until "=== SUBAGENT FERTIG ==="
// Activated by <BOT_NAME_UPPER>_SUBAGENT env var (generic pattern)
//
// The hook checks if ANY environment variable ending in _SUBAGENT is set to "1".
// This way it works regardless of the bot name (MIKA_SUBAGENT, ATLAS_SUBAGENT, etc.)

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  // Check all possible env vars (*_SUBAGENT pattern)
  const isSubagent = Object.keys(process.env).some(
    k => k.endsWith('_SUBAGENT') && process.env[k] === '1'
  );

  // Not a subagent session — allow stop
  if (!isSubagent) {
    process.exit(0);
  }

  const hookData = JSON.parse(input);
  const lastMsg = hookData.last_assistant_message || '';

  // Check if agent signaled completion
  if (lastMsg.includes('=== SUBAGENT FERTIG ===')) {
    process.exit(0);
  }

  // Not done yet — block and continue
  const result = {
    decision: 'block',
    reason: 'Du bist noch nicht fertig. Arbeite weiter an der Aufgabe. Wenn alles erledigt ist, schreibe als allerletzte Nachricht exakt: === SUBAGENT FERTIG ==='
  };

  process.stdout.write(JSON.stringify(result));
  process.exit(0);
});

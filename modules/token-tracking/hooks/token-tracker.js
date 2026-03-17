#!/usr/bin/env node
/**
 * Token Tracker Hook (Stop event)
 * Reads the JSONL transcript, sums up token usage, appends to a log file.
 * Parses subagent transcripts as well.
 * No VPS push — purely local logging.
 */

const fs = require('fs');
const path = require('path');

const vaultRoot = path.resolve(__dirname, '../..');

async function main() {
  // Read hook input from stdin
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let hookData;
  try {
    hookData = JSON.parse(input);
  } catch (e) {
    return; // Not valid JSON, skip
  }

  const transcriptPath = hookData.transcript_path;
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return;

  // Parse JSONL transcript
  const content = fs.readFileSync(transcriptPath, 'utf8');
  const lines = content.trim().split('\n');

  let totalInput = 0;
  let totalOutput = 0;
  let totalCacheCreate = 0;
  let totalCacheRead = 0;
  let responseCount = 0;
  let toolUseCount = 0;
  let sessionId = hookData.session_id || 'unknown';
  const toolBreakdown = {}; // tool_name -> call count

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);

      if (entry.message && entry.message.usage) {
        const u = entry.message.usage;
        totalInput += u.input_tokens || 0;
        totalOutput += u.output_tokens || 0;
        totalCacheCreate += u.cache_creation_input_tokens || 0;
        totalCacheRead += u.cache_read_input_tokens || 0;
        responseCount++;
      }

      if (entry.type === 'assistant' && entry.message && entry.message.content) {
        const c = entry.message.content;
        if (Array.isArray(c)) {
          for (const block of c) {
            if (block.type === 'tool_use') {
              toolUseCount++;
              const name = block.name || 'unknown';
              toolBreakdown[name] = (toolBreakdown[name] || 0) + 1;
            }
          }
        }
      }
    } catch (e) {
      // Skip malformed lines
    }
  }

  // Parse subagent transcripts (if any)
  const subagents = [];
  const sessionDir = transcriptPath.replace(/\.jsonl$/, '');
  const subagentDir = path.join(sessionDir, 'subagents');
  try {
    if (fs.existsSync(subagentDir)) {
      const files = fs.readdirSync(subagentDir).filter(f => f.endsWith('.jsonl'));
      for (const file of files) {
        const agentId = file.replace('.jsonl', '');
        const metaPath = path.join(subagentDir, agentId + '.meta.json');
        let agentType = 'unknown';
        try {
          agentType = JSON.parse(fs.readFileSync(metaPath, 'utf8')).agentType || 'unknown';
        } catch (e) {}

        const agentContent = fs.readFileSync(path.join(subagentDir, file), 'utf8');
        const agentLines = agentContent.trim().split('\n');
        let aInput = 0, aOutput = 0, aCacheCreate = 0, aCacheRead = 0, aResponses = 0, aToolUses = 0;
        const aToolBreakdown = {};

        for (const al of agentLines) {
          try {
            const ae = JSON.parse(al);
            if (ae.message && ae.message.usage) {
              const u = ae.message.usage;
              aInput += u.input_tokens || 0;
              aOutput += u.output_tokens || 0;
              aCacheCreate += u.cache_creation_input_tokens || 0;
              aCacheRead += u.cache_read_input_tokens || 0;
              aResponses++;
            }
            if (ae.type === 'assistant' && Array.isArray(ae.message?.content)) {
              for (const block of ae.message.content) {
                if (block.type === 'tool_use') {
                  aToolUses++;
                  const name = block.name || 'unknown';
                  aToolBreakdown[name] = (aToolBreakdown[name] || 0) + 1;
                }
              }
            }
          } catch (e) {}
        }

        const aTotal = aInput + aOutput + aCacheCreate + aCacheRead;
        const aCost = (aInput * 15 + aOutput * 75 + aCacheCreate * 3.75 + aCacheRead * 0.30) / 1e6;

        subagents.push({
          agent_id: agentId,
          agent_type: agentType,
          responses: aResponses,
          tool_uses: aToolUses,
          tokens: { input: aInput, output: aOutput, cache_create: aCacheCreate, cache_read: aCacheRead, total: aTotal },
          estimated_cost_usd: Math.round(aCost * 100) / 100,
          tool_breakdown: aToolBreakdown,
        });
      }
    }
  } catch (e) {}

  // Calculate estimated cost (Opus pricing: $15/M input, $75/M output, $3.75/M cache write, $0.30/M cache read)
  const cost = (totalInput * 15 + totalOutput * 75 + totalCacheCreate * 3.75 + totalCacheRead * 0.30) / 1e6;

  // Try to get a human-readable name from durcharbeiten state or fork briefing
  let sessionName = sessionId;
  const stateFile = path.join(vaultRoot, '.claude', 'durcharbeiten.state');
  try {
    if (fs.existsSync(stateFile)) {
      const state = fs.readFileSync(stateFile, 'utf8');
      const taskMatch = state.match(/^task=(.+)$/m);
      if (taskMatch) sessionName = taskMatch[1].slice(0, 60);
    }
  } catch (e) {}

  // Check if this is a fork session
  if (sessionName === sessionId) {
    try {
      const forksDir = path.join(vaultRoot, '_forks');
      if (fs.existsSync(forksDir)) {
        const forkFiles = fs.readdirSync(forksDir);
        for (const f of forkFiles) {
          if (f.startsWith('fork-') && f.endsWith('.md')) {
            const forkContent = fs.readFileSync(path.join(forksDir, f), 'utf8');
            if (forkContent.includes('status: erledigt') || forkContent.includes('status: offen')) {
              sessionName = 'Fork: ' + f.replace('fork-', '').replace('.md', '');
              break;
            }
          }
        }
      }
    } catch (e) {}
  }

  const record = {
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    name: sessionName,
    responses: responseCount,
    tool_uses: toolUseCount,
    tokens: {
      input: totalInput,
      output: totalOutput,
      cache_create: totalCacheCreate,
      cache_read: totalCacheRead,
      total: totalInput + totalOutput + totalCacheCreate + totalCacheRead,
    },
    estimated_cost_usd: Math.round(cost * 100) / 100,
    tool_breakdown: toolBreakdown,
    subagents: subagents.length > 0 ? subagents : undefined,
  };

  // Append to log file
  const logPath = path.join(vaultRoot, '_scripts', 'token-log.json');
  let log = [];
  try {
    log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
  } catch (e) {
    // File doesn't exist yet
  }

  // Update existing session entry or add new one
  const existingIdx = log.findIndex(r => r.session_id === sessionId);
  if (existingIdx >= 0) {
    log[existingIdx] = record;
  } else {
    log.push(record);
  }

  // Keep last 100 sessions
  if (log.length > 100) log = log.slice(-100);

  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
}

main().catch(() => {});

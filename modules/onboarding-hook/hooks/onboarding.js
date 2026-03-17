// Onboarding Hook — fires on SessionStart
// Loads _onboarding.md and _mika-memory.md directly into session context.
// Lists open forks if any exist.

const fs = require("fs");
const path = require("path");

const vaultRoot = path.resolve(__dirname, "../..");

function readFile(name) {
  const filePath = path.join(vaultRoot, name);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, "utf8");
  }
  return `[${name} nicht gefunden]`;
}

// Check if there's a pending fork briefing
const forksDir = path.join(vaultRoot, "_forks");
let forkFiles = [];
if (fs.existsSync(forksDir)) {
  forkFiles = fs.readdirSync(forksDir).filter(f => f.endsWith(".md"));
}

const output = [];

// Always load onboarding + memory into context
output.push("=== _onboarding.md ===");
output.push(readFile("_onboarding.md"));
output.push("");
output.push("=== _mika-memory.md ===");
output.push(readFile("_mika-memory.md"));

if (forkFiles.length > 0) {
  output.push("");
  output.push(
    "Es gibt offene Forks in _forks/. " +
    "Falls du als Fork-Tab gestartet wurdest: lies dein Briefing in _forks/ und arbeite es ab."
  );
  output.push("");
  output.push("Offene Forks: " + forkFiles.join(", "));
}

console.log(output.join("\n"));

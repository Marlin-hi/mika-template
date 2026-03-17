// Token-Tracking Hook: Loggt Token-Verbrauch am Session-Ende
const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "..", "..", "_scripts", "token-log.json");

let input = "";
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const entry = {
      timestamp: new Date().toISOString(),
      session_id: data.session_id || "unknown",
      total_tokens_in: data.total_tokens_in || 0,
      total_tokens_out: data.total_tokens_out || 0
    };

    let log = [];
    if (fs.existsSync(logFile)) {
      try { log = JSON.parse(fs.readFileSync(logFile, "utf8")); } catch (e) {}
    }
    log.push(entry);

    const dir = path.dirname(logFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
  } catch (e) {}
});

// Tab-Title Hook: Setzt den Terminal-Tab-Titel
process.stdout.write("\x1b]0;[BotName]\x07");
let input = "";
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {});

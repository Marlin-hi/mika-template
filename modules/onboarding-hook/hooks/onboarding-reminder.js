// Onboarding-Hook: Erinnert am Session-Ende, _onboarding.md zu aktualisieren
let input = "";
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  process.stdout.write("Denk daran, _onboarding.md zu aktualisieren falls sich etwas geaendert hat.");
});

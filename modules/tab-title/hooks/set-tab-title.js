// set-tab-title.js — Setzt den Terminal-Tab-Titel
// basierend auf der aktiven durcharbeiten-Session.
// Platform-aware: schreibt OSC-Sequenz auf das passende TTY-Device.
// Laeuft als Stop-Hook.

const fs = require('fs');
const path = require('path');

const vaultRoot = path.resolve(__dirname, '../..');
const STATE_FILE = path.join(vaultRoot, '.claude', 'durcharbeiten.state');

try {
  let title = '[BotName]';

  if (fs.existsSync(STATE_FILE)) {
    const content = fs.readFileSync(STATE_FILE, 'utf8');
    const match = content.match(/^task=(.+)/m);
    if (match) {
      // Max 6 Woerter
      const words = match[1].trim().split(/\s+/).slice(0, 6).join(' ');
      title = '[BotName]: ' + words;
    }
  }

  const osc = '\x1b]0;' + title + '\x07';

  // Platform-aware TTY write — bypass stdout/stderr pipes
  const platform = process.platform;
  let ttyDevice;

  if (platform === 'win32') {
    ttyDevice = 'CONOUT$';
  } else {
    // macOS and Linux both use /dev/tty
    ttyDevice = '/dev/tty';
  }

  const fd = fs.openSync(ttyDevice, 'w');
  fs.writeSync(fd, osc);
  fs.closeSync(fd);
} catch (e) {
  // Stille Fehler — Tab-Titel ist nice-to-have, nicht kritisch
}

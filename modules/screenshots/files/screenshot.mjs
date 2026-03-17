import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Platform-aware Chrome detection ---
function findChrome() {
  const platform = process.platform;
  const paths = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ],
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA
        ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
        : null,
    ].filter(Boolean),
    linux: [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ],
  };

  const candidates = paths[platform] || [];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }

  // Fallback: try all platforms
  for (const list of Object.values(paths)) {
    for (const p of list) {
      if (existsSync(p)) return p;
    }
  }

  throw new Error('Chrome nicht gefunden. Bitte installieren.');
}

// --- Config ---
const CHROME_PATH = findChrome();
const DEFAULT_OUTPUT = resolve(__dirname, 'output.png');
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;
const MAX_DIM = 7900; // Stay under Claude's 8000px API limit

// --- Parse args ---
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  console.log(`Usage: node screenshot.mjs <url-or-file> [options]

Arguments:
  url-or-file          URL (https://...) or local file path

Options:
  --viewport WxH       Viewport size (default: 1280x720)
  --selector "css"     Screenshot only a specific element
  --full-page          Capture full scrollable page
  --output path        Output file path (default: output.png)
  --wait ms            Extra wait time in ms after load (default: 0)
  --dark               Use dark color scheme`);
  process.exit(0);
}

function getArg(name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1];
}

const hasFlag = (name) => args.includes(name);

const target = args[0];
const viewportArg = getArg('--viewport');
const selector = getArg('--selector');
const fullPage = hasFlag('--full-page');
const output = getArg('--output') || DEFAULT_OUTPUT;
const waitMs = parseInt(getArg('--wait') || '0', 10);
const dark = hasFlag('--dark');

// Parse viewport
let width = DEFAULT_WIDTH;
let height = DEFAULT_HEIGHT;
if (viewportArg) {
  const parts = viewportArg.toLowerCase().split('x');
  width = parseInt(parts[0], 10);
  height = parseInt(parts[1], 10);
}

// Resolve target to URL — platform-aware file:// handling
let url;
if (target.startsWith('http://') || target.startsWith('https://')) {
  url = target;
} else {
  const absPath = resolve(target);
  if (!existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }
  if (process.platform === 'win32') {
    // Windows: backslashes to forward slashes for file:// URL
    url = `file:///${absPath.replace(/\\/g, '/')}`;
  } else {
    // macOS/Linux: path is already forward-slash
    url = `file://${absPath}`;
  }
}

// --- Screenshot ---
let browser;
try {
  browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    userDataDir: resolve(__dirname, '.chrome-screenshot-profile'),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      `--window-size=${width},${height}`,
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: fullPage ? 1 : 2 });

  if (dark) {
    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: 'dark' },
    ]);
  }

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  // Extra wait for JS hydration
  await new Promise((r) => setTimeout(r, 2000));

  if (waitMs > 0) {
    await new Promise((r) => setTimeout(r, waitMs));
  }

  // Scroll through the page to trigger IntersectionObservers (scroll animations)
  if (fullPage) {
    await page.evaluate(async () => {
      const step = window.innerHeight;
      const total = document.body.scrollHeight;
      for (let y = 0; y < total; y += step) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 100));
      }
      // Scroll to very bottom to catch everything
      window.scrollTo(0, total);
      await new Promise(r => setTimeout(r, 200));
      // Back to top for the screenshot
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 100));
    });
  }

  const screenshotOptions = { path: output, type: 'png' };

  if (selector) {
    const element = await page.$(selector);
    if (!element) {
      console.error(`Selector not found: ${selector}`);
      process.exit(1);
    }
    await element.screenshot(screenshotOptions);
  } else if (fullPage) {
    // Measure actual page height, then cap to stay under 8000px
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    if (pageHeight > MAX_DIM) {
      // Clip to max height instead of capturing the full (too-tall) page
      screenshotOptions.clip = { x: 0, y: 0, width, height: MAX_DIM };
    } else {
      screenshotOptions.fullPage = true;
    }
    await page.screenshot(screenshotOptions);
  } else {
    await page.screenshot(screenshotOptions);
  }

  console.log(output);
} catch (err) {
  console.error(`Screenshot failed: ${err.message}`);
  process.exit(1);
} finally {
  if (browser) await browser.close();
}

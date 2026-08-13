/**
 * Drives ieb.html in a real browser for capture.
 *
 * It does NOT record anything itself — export.sh has ffmpeg grabbing the X
 * display. This script's job is to open the page, take the one user gesture the
 * browser needs before it will play audio, and stay out of the way for the whole
 * run. It writes markers.json so export.sh knows exactly where the animation
 * starts inside the raw capture and how tall the browser's chrome is.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL_ = process.env.IEB_URL || 'http://localhost:8934/ieb.html';
const OUT = process.env.IEB_OUT || __dirname;
const RUN_SECONDS = Number(process.env.IEB_RUN_SECONDS || 56);
const WIDTH = Number(process.env.IEB_WIDTH || 1920);
const HEIGHT = Number(process.env.IEB_HEIGHT || 1168);

// Optional: serve local media in place of the .mp4s (used when the capture box
// has no H.264 decoder — see export.sh).
const SUBS = process.env.IEB_SUBS ? JSON.parse(process.env.IEB_SUBS) : {};

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.IEB_CHROME || undefined,
    headless: false,
    args: [
      '--window-position=0,0',
      `--window-size=${WIDTH},${HEIGHT}`,
      '--no-sandbox',
      '--noerrdialogs',
      '--disable-infobars',
      '--disable-session-crashed-bubble',
      '--autoplay-policy=no-user-gesture-required',
      // keep compositing on the GPU path and uncapped so we can actually hit 60
      '--disable-frame-rate-limit',
      '--disable-gpu-vsync',
      '--force-device-scale-factor=1',
    ],
  });

  const page = await browser.newPage({ viewport: null });
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE:', m.text()); });

  for (const [pattern, file] of Object.entries(SUBS)) {
    const body = fs.readFileSync(file);
    const type = file.endsWith('.webm') ? 'video/webm'
      : file.endsWith('.js') ? 'application/javascript'
      : file.endsWith('.mp3') ? 'audio/mpeg' : 'application/octet-stream';
    await page.route(pattern, r => r.fulfill({ body, contentType: type }));
  }

  await page.goto(URL_, { waitUntil: 'load' });
  // the recording must not show a mouse pointer
  await page.addStyleTag({ content: '*, *::before, *::after { cursor: none !important; }' });
  await page.waitForTimeout(1200);

  const chromeOffset = await page.evaluate(() => window.outerHeight - window.innerHeight);
  const innerSize = await page.evaluate(() => [window.innerWidth, window.innerHeight]);

  // This click is the gesture that unmutes the intro clip and unlocks WebAudio,
  // and it is also frame zero of the finished video.
  await page.click('#start-gate');
  const clickedAt = Date.now() / 1000;
  await page.mouse.move(WIDTH - 1, HEIGHT - 1);

  fs.writeFileSync(path.join(OUT, 'markers.json'), JSON.stringify({
    clickedAt, chromeOffset, innerWidth: innerSize[0], innerHeight: innerSize[1],
  }, null, 2));
  console.log('CLICK', clickedAt, 'chromeOffset', chromeOffset, 'inner', innerSize.join('x'));

  // Stop when the animation says it's done (?once=1 sets this once the outro is
  // up and held), not on a stopwatch — that's what previously let the recording
  // run past the end and into the next loop.
  try {
    await page.waitForFunction(() => window.__iebDone === true, null,
      { timeout: RUN_SECONDS * 1000, polling: 100 });
    console.log('DONE signalled at', ((Date.now() / 1000) - clickedAt).toFixed(2), 's after click');
  } catch (e) {
    console.log('WARN: no done signal within', RUN_SECONDS, 's — stopping anyway');
  }
  await page.waitForTimeout(400);
  await browser.close();
})();

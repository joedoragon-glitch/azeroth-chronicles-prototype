'use strict';
// Dedicated nonshipping SFX A/B path. This checks real Chromium interactions,
// not an owner's by-ear judgment, physical device, or a playable campaign.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const prefix = '/azeroth-chronicles-prototype/';
const known = [
  'paladin-sword-swing', 'paladin-sword-impact', 'ranger-arrow-release',
  'ranger-arrow-impact', 'mage-arcane-release', 'mage-arcane-impact',
  'rogue-bell-basic', 'rogue-bell-performance', 'enemy-claw-contact',
  'critical-warning-study',
];

(async () => {
  assert(fs.existsSync(path.join(root, 'assets/vendor/pixi-8.22.0.min.js')),
    'Prepare pinned PixiJS before starting the real Sound Library browser');
  for (const id of known)
    assert(fs.existsSync(path.join(root, 'tools/audio/sfx-pilot-previews', id + '.wav')),
      'Missing branch-local preview: ' + id);
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (!pathname.startsWith(prefix)) { res.writeHead(404); res.end(); return; }
    const file = path.resolve(root, decodeURIComponent(pathname.slice(prefix.length)) || 'index.html');
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404); res.end(); return;
    }
    const types = { '.js': 'text/javascript', '.css': 'text/css',
      '.json': 'application/json', '.wav': 'audio/wav', '.mp3': 'audio/mpeg' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'text/html');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await pw.chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE,
      args: ['--no-sandbox', '--disable-dev-shm-usage'] } : {}) });
  try {
    for (const phone of [false, true]) {
      const context = await browser.newContext({
        viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 780 },
        isMobile: phone, hasTouch: phone, serviceWorkers: 'block',
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        localStorage.setItem('sfx-pilot-save-sentinel', 'preserve-me');
      });
      const url = 'http://127.0.0.1:' + server.address().port + prefix +
        'tools/audio/index.html?study=rogue-bell-basic';
      try {
        await page.goto(url);
        await page.waitForFunction(() => window.AudioAudition?.sfxStudies?.length === 10 &&
          window.AudioAudition?.audio.recordingManifest);
        assert.equal(await page.locator('#sfx-study option').count(), 10);
        assert.equal(await page.locator('#sfx-study').inputValue(), 'rogue-bell-basic');
        assert.equal(await page.evaluate(() => AudioAudition.audio.ctx), null,
          'No preview may autoplay or force a saved-game audio context');
        assert.equal(await page.locator('#recording option').count(), 148);
        assert.equal(await page.evaluate(() => localStorage.getItem('sfx-pilot-save-sentinel')),
          'preserve-me');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true,
          'SFX section must fit narrow phone viewport');
        await page.evaluate(() => {
          window.__sfxEvents = [];
          window.__sfxRecorded = [];
          const a = AudioAudition.audio;
          const originalEffect = a.effect.bind(a);
          const originalRecording = a.playRecording.bind(a);
          a.effect = e => { window.__sfxEvents.push(e); return originalEffect(e); };
          a.playRecording = (id, opts) => {
            window.__sfxRecorded.push({ id, opts });
            return originalRecording(id, opts);
          };
        });
        const press = async selector => phone ? page.locator(selector).tap() : page.locator(selector).click();
        // Test actual engine-generated Rogue baseline; don't fake it as a recording.
        await press('#sfx-original');
        await page.waitForFunction(() =>
          document.querySelector('#sfx-study-status').textContent.includes('Played current'));
        assert.equal(await page.evaluate(() => window.__sfxEvents.at(-1)?.type), 'rogueBellBasic');
        assert.equal(await page.evaluate(() => window.__sfxRecorded.length), 0);
        // The preview is a real WAV decoded into the existing effects mixer.
        await press('#sfx-candidate');
        await page.waitForFunction(() =>
          document.querySelector('#sfx-study-status').textContent.includes('Played unapproved'));
        assert.equal(await page.evaluate(() => AudioAudition.audio.ctx?.state), 'running');
        assert((await page.locator('#sfx-study-status').textContent()).includes('NOT a level-matched'));
        // The original Paladin stage must use its actual registered material recording.
        await page.locator('#sfx-study').selectOption('paladin-sword-swing');
        await press('#sfx-original');
        await page.waitForFunction(() =>
          document.querySelector('#sfx-study-status').textContent.includes('Played current'));
        assert.equal(await page.evaluate(() => window.__sfxRecorded.at(-1)?.id), 'sfx-hero-steel-swing');
        // One short warning reference must not get mislabeled as a regular impact.
        await page.locator('#sfx-study').selectOption('critical-warning-study');
        await press('#sfx-original');
        await page.waitForFunction(() =>
          document.querySelector('#sfx-study-status').textContent.includes('Played current'));
        assert.equal(await page.evaluate(() => window.__sfxRecorded.at(-1)?.id), 'sfx-critical-warning');
        // A missing preview must report failure, not play a misleading alternative.
        await page.route('**/sfx-pilot-previews/mage-arcane-impact.wav', route =>
          route.fulfill({ status: 404, contentType: 'text/plain', body: 'Missing preview fixture' }));
        await page.locator('#sfx-study').selectOption('mage-arcane-impact');
        await press('#sfx-candidate');
        await page.waitForFunction(() =>
          document.querySelector('#message').textContent.includes('missing (404)'));
        assert.equal(await page.evaluate(() => localStorage.getItem('sfx-pilot-save-sentinel')),
          'preserve-me');
        assert.deepEqual(errors, [], 'Browser JavaScript errors');
      } finally {
        await context.close();
      }
    }
    console.log('PASS: branch-only desktop/mobile SFX A/B, no autoplay/saves, accurate origins, missing-asset guard');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

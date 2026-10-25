'use strict';
// Stage 4 focused real-browser PCM/mixer smoke. Service-worker/offline is Stage 5.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const prefix = '/azeroth-chronicles-prototype/';
(async () => {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relative = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : null;
    const file = relative === null ? '' : path.resolve(root, relative || 'index.html');
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404);
      res.end();
      return;
    }
    const types = { '.js': 'text/javascript', '.html': 'text/html', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.json': 'application/json' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    const launch = { headless: true };
    if (process.env.CHROMIUM_EXECUTABLE) {
      launch.executablePath = process.env.CHROMIUM_EXECUTABLE;
      launch.args = ['--no-sandbox', '--disable-dev-shm-usage'];
    }
    browser = await pw.chromium.launch(launch);
    for (const phone of [false, true]) {
      const context = await browser.newContext({
        viewport: phone ? { width: 375, height: 812 } : { width: 1280, height: 800 },
        isMobile: phone, hasTouch: phone, serviceWorkers: 'block',
      });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', (e) => pageErrors.push(e.message));
      const click = async (id) => phone ? page.locator(id).tap() : page.locator(id).click();
      await page.addInitScript(() => localStorage.setItem('stage4-audio-save-sentinel', '{"preserved":true}'));
      await page.goto('http://127.0.0.1:' + server.address().port + prefix + 'tools/audio/index.html');
      await page.waitForFunction(() => !!window.AudioAudition?.audio?.recordingManifest, null, { timeout: 15000 });
      assert.equal(await page.evaluate(() => AudioAudition.audio.ctx), null);
      assert.equal(await page.locator('#boss option').count(), 12);
      await click('#stem-play');
      await page.waitForFunction(() => AudioAudition.audio.recordedScore?.voices.length === 2, null, { timeout: 15000 });
      const diagnostic = await page.evaluate(() => {
        const a = AudioAudition.audio, voices = a.recordedScore.voices;
        let peak = 0, power = 0;
        const pcm = voices[0].item.buffer.getChannelData(0);
        for (const n of pcm) { if (!Number.isFinite(n)) throw Error('Nonfinite PCM'); peak = Math.max(peak, Math.abs(n)); power += n*n; }
        a.setSceneMix('menu');
        const menuEffects = a.mixLevel('effects'), menuUI = a.mixLevel('interface');
        a.setSceneMix('world');
        return { at: voices.map(v => v.at), peak, rms: Math.sqrt(power/pcm.length),
          menuEffects, menuUI, worldEffects: a.mixLevel('effects'), sampleRate: voices[0].item.buffer.sampleRate,
          contextState: a.ctx.state };
      });
      assert.equal(diagnostic.at[0], diagnostic.at[1]);
      assert(diagnostic.peak > 0.05 && diagnostic.peak < 0.98);
      assert(diagnostic.rms > 0.005);
      assert.equal(diagnostic.menuEffects, 0);
      assert(diagnostic.menuUI > 0 && diagnostic.worldEffects > 0);
      assert.equal(diagnostic.contextState, 'running');
      // One authored MP3 provides real codec + soundtrack proof, not a full catalog.
      await page.locator('#source').selectOption('production');
      await page.waitForFunction(() => !!AudioAudition.audio.recordingManifest?.assets?.['place-vale'], null, { timeout: 15000 });
      await page.locator('#recording').selectOption('place-vale');
      await click('#record-play');
      await page.waitForFunction(() => AudioAudition.audio.recordedScore?.id === 'place-vale', null, { timeout: 20000 });
      const production = await page.evaluate(() => {
        const a = AudioAudition.audio, v = a.recordedScore.voices[0];
        return { id: v.id, duration: v.item.buffer.duration, sampleRate: v.item.buffer.sampleRate,
          decoded: !!v.item.buffer.getChannelData(0).length, state: a.ctx.state };
      });
      assert.equal(production.id, 'place-vale');
      assert(production.duration > 10 && production.decoded && production.sampleRate > 0);
      assert.equal(production.state, 'running');
      assert.deepEqual(pageErrors, []);
      assert.equal(await page.evaluate(() => localStorage.getItem('stage4-audio-save-sentinel')), '{"preserved":true}');
      console.log('PASS Stage 4 ' + (phone ? 'phone-sized' : 'desktop') +
        ' browser: diagnostic synchronized PCM, menu/foreground mix, decoded authored MP3, no save changes');
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });

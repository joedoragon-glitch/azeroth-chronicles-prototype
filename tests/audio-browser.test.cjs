'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict'),
  pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..'),
  engine = process.env.AUDIO_BROWSER_ENGINE || 'chromium';
(async () => {
  const server = http.createServer((req, res) => {
    const file = path.resolve(
      root,
      (req.url || '/').split('?')[0].replace(/^\//, '') || 'index.html',
    );
    if (
      !file.startsWith(root + path.sep) ||
      !fs.existsSync(file) ||
      fs.statSync(file).isDirectory()
    ) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader(
      'Content-Type',
      file.endsWith('.js')
        ? 'text/javascript'
        : file.endsWith('.css')
          ? 'text/css'
          : file.endsWith('.json')
            ? 'application/json'
            : 'text/html',
    );
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    const launch = { headless: true };
    if (engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE) {
      launch.executablePath = process.env.CHROMIUM_EXECUTABLE;
      launch.args = ['--no-sandbox', '--disable-dev-shm-usage'];
    }
    browser = await pw[engine].launch(launch);
    for (const entry of ['index.html', 'phone.html']) {
      const phone = entry === 'phone.html',
        page = await browser.newPage({
          viewport: phone ? { width: 375, height: 812 } : { width: 1280, height: 800 },
          hasTouch: phone,
          isMobile: phone,
        }),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto('http://127.0.0.1:' + server.address().port + '/' + entry);
      assert.equal(await page.evaluate(() => Prototype.audio.ctx), null);
      await page.locator('#modal-actions button').first().click();
      await page.locator('#modal-actions button').first().click();
      await page.waitForFunction(() => Prototype.audio.ctx?.state === 'running');
      await page.waitForFunction(() => !!Prototype.audio.recordedScore);
      await page.waitForFunction(() => Prototype.audio.environmentVoice?.id === 'env-woodland-day');
      assert(await page.evaluate(() => Prototype.audio.noise === null));
      await page.waitForTimeout(120);
      const before = await page.evaluate(() => ({
        status: Prototype.audio.status(),
        scene: Prototype.game.snapshot(),
      }));
      assert(before.status.voices > 0);
      assert(before.status.voices <= 64);
      assert(before.status.context.region === 'vale');
      const replaced = await page.evaluate(() => {
        const a = Prototype.audio,
          current = { id: a.recordedScore.id, at: a.recordedScore.at };
        a.configureRecordings(a.recordingManifest);
        return current;
      });
      await page.waitForFunction((id) => Prototype.audio.recordedScore?.id === id, replaced.id);
      assert((await page.evaluate(() => Prototype.audio.recordedScore.at)) > replaced.at);
      await page.evaluate(() => Prototype.openMenu('Audio housekeeping check', '', []));
      await page.waitForFunction(
        () => Prototype.audio.ctx.state === 'running' && Prototype.audio.mixScene === 'menu',
      );
      await page.waitForFunction(() => !!Prototype.audio.environmentVoice);
      const environmentalStart = await page.evaluate(() => Prototype.audio.environmentVoice.at);
      const saved = await page.evaluate(() => JSON.stringify(Prototype.game.snapshot()));
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => JSON.stringify(Prototype.game.snapshot())), saved);
      await page.evaluate(() => Prototype.closeMenu());
      await page.waitForFunction(() => Prototype.audio.ctx.state === 'running');
      await page.evaluate(() => dispatchEvent(new Event('blur')));
      await page.waitForFunction(() => Prototype.audio.ctx.state === 'suspended');
      await page.evaluate(() => dispatchEvent(new Event('focus')));
      await page.waitForFunction(() => Prototype.audio.ctx.state === 'running');
      assert.equal(
        await page.evaluate(() => Prototype.audio.environmentVoice.at),
        environmentalStart,
      );
      await page.evaluate(() => {
        const a = Prototype.audio;
        for (let i = 0; i < 300; i++) a.noiseBurst(a.ctx.currentTime);
      });
      assert(await page.evaluate(() => Prototype.audio.voices.size <= 64));
      await page.waitForTimeout(400);
      assert(await page.evaluate(() => Prototype.audio.voices.size < 20));
      const recordings = await page.evaluate(async () => {
        const results = [];
        for (const theme of PrototypeAudio.themes)
          for (const peace of [false, true]) {
            const context = new OfflineAudioContext(1, 4 * 22050, 22050),
              audio = new PrototypeAudio();
            let now = 0;
            audio.ctx = new Proxy(context, {
              get(target, key) {
                if (key === 'currentTime') return now;
                if (key === 'state') return 'running';
                const value = Reflect.get(target, key, target);
                return typeof value === 'function' ? value.bind(target) : value;
              },
            });
            audio.buses = {};
            for (const key of ['master', 'music', 'ambience', 'effects'])
              audio.buses[key] = context.createGain();
            audio.buses.master.connect(context.destination);
            for (const key of ['music', 'ambience', 'effects'])
              audio.buses[key].connect(audio.buses.master);
            audio.applySettings();
            audio.cue = { id: theme.id, region: 'vale', peace, night: false };
            audio.transitionScore(audio.cue);
            audio.next = 0.05;
            for (now = 0; now < 2.5; now += 0.05) audio.schedule();
            const buffer = await context.startRendering(),
              data = buffer.getChannelData(0);
            let square = 0,
              peak = 0;
            for (const n of data) {
              if (!Number.isFinite(n)) throw Error('Non-finite sample');
              square += n * n;
              peak = Math.max(peak, Math.abs(n));
            }
            results.push({ id: theme.id, peace, rms: Math.sqrt(square / data.length), peak });
          }
        return results;
      });
      assert.equal(recordings.length, 28);
      for (const r of recordings) {
        assert(r.rms > 0.0001, 'silent score ' + r.id);
        assert(r.peak < 1, 'clipped score ' + r.id);
      }
      // Real rendering proves audio output, not musical polish or actual iPhone speaker comfort.
      assert.deepEqual(errors, []);
      console.log(
        'PASS ' +
          engine +
          ' ' +
          entry +
          ': gesture unlock, soft menu/background suspend, unchanged frozen saves, bounded/released voices and 28 non-silent finite unclipped score renders',
      );
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

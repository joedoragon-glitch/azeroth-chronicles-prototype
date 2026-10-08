'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict'),
  pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..'),
  engine = process.env.AUDIO_BROWSER_ENGINE || 'chromium',
  prefix = '/azeroth-chronicles-prototype/';
(async () => {
  const server = http.createServer((req, res) => {
    const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(
        prefix.length,
      ),
      file = path.resolve(root, relative || 'index.html');
    if (
      !req.url.startsWith(prefix) ||
      !file.startsWith(root + path.sep) ||
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile()
    ) {
      res.writeHead(404);
      res.end();
      return;
    }
    const ext = path.extname(file),
      types = {
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.wav': 'audio/wav',
      };
    res.setHeader('Content-Type', types[ext] || 'text/html');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  let browser;
  try {
    const launch = { headless: true };
    if (engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE) {
      launch.executablePath = process.env.CHROMIUM_EXECUTABLE;
      launch.args = ['--no-sandbox', '--disable-dev-shm-usage'];
    }
    browser = await pw[engine].launch(launch);
    for (const phone of [false, true]) {
      const context = await browser.newContext({
        viewport: phone ? { width: 375, height: 812 } : { width: 1280, height: 800 },
        hasTouch: phone,
        isMobile: phone,
      });
      const page = await context.newPage(),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript(() => {
        localStorage.setItem('azeroth-save-sentinel', '{"keep":"original"}');
      });
      await page.goto(
        'http://127.0.0.1:' + server.address().port + prefix + 'tools/audio/index.html',
      );
      await page.waitForFunction(() => window.AudioAudition?.audio.recordingManifest);
      assert.equal(await page.evaluate(() => AudioAudition.audio.ctx), null);
      assert.equal(await page.locator('#boss option').count(), 12);
      const saved = await page.evaluate(() => JSON.stringify(localStorage));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator('#stem-play').click();
      await page.waitForFunction(() => AudioAudition.audio.recordedScore?.voices.length === 2);
      const initial = await page.evaluate(() => {
        const a = AudioAudition.audio,
          v = a.recordedScore.voices;
        return {
          starts: v.map((n) => n.at),
          status: a.status(),
          duration: v[0].item.buffer.duration,
          sampleRate: v[0].item.buffer.sampleRate,
        };
      });
      assert.equal(initial.starts[0], initial.starts[1]);
      assert(Math.abs(initial.duration - 2) <= 2 / initial.sampleRate);
      assert(initial.status.recordings.assets.decodedBytes < 2 * 1024 * 1024);
      await page.locator('#mix-scene').selectOption('menu');
      await page.locator('#ui-play').click();
      await page.waitForFunction(() =>
        [...AudioAudition.audio.voices].some((v) => v.bus === 'interface'),
      );
      assert.equal(await page.evaluate(() => AudioAudition.audio.mixLevel('effects')), 0);
      assert(await page.evaluate(() => AudioAudition.audio.mixLevel('interface') > 0));
      await page.locator('#mute').check();
      await page.locator('#warning').click();
      assert.equal(await page.evaluate(() => AudioAudition.audio.mixLevel('master')), 0);
      await page.locator('#mute').uncheck();
      await page.locator('#pause').click();
      await page.waitForFunction(() => AudioAudition.audio.ctx.state === 'suspended');
      const pausedAt = await page.evaluate(() => AudioAudition.audio.ctx.currentTime);
      await page.waitForTimeout(100);
      assert.equal(await page.evaluate(() => AudioAudition.audio.ctx.currentTime), pausedAt);
      await page.locator('#pause').click();
      await page.waitForFunction(() => AudioAudition.audio.ctx.state === 'running');
      await page.locator('#profile').selectOption('phone');
      await page.locator('#mix-scene').selectOption('world');
      await page.locator('#scene-play').click();
      await page.waitForFunction(() => AudioAudition.audio.cue?.id === 'vale');
      await page.locator('#boss').selectOption('darklord');
      await page.locator('#form').selectOption('true');
      await page.locator('#scene-play').click();
      await page.waitForFunction(() => AudioAudition.audio.cue?.id === 'darklord-boss');
      assert.equal(await page.evaluate(() => AudioAudition.audio.context.boss.form), 'true');
      await page.locator('#source').selectOption('production');
      await page.waitForFunction(
        () =>
          AudioAudition.audio.recordingManifest &&
          Object.keys(AudioAudition.audio.recordingManifest.assets).length === 0,
      );
      await page.locator('#record-play').click();
      assert((await page.locator('#message').textContent()).includes('No production recording'));
      assert.equal(await page.evaluate(() => AudioAudition.audio.recordedScore), null);

      // Actual decode + OfflineAudioContext render: synchronized samples remain finite, audible and below clipping.
      const output = await page.evaluate(async () => {
        const f = await AudioAudition.ready,
          ctx = new OfflineAudioContext(2, 3 * 22050, 22050),
          a = new PrototypeAudio();
        a.ctx = new Proxy(ctx, {
          get(target, key) {
            if (key === 'state') return 'running';
            const value = Reflect.get(target, key, target);
            return typeof value === 'function' ? value.bind(target) : value;
          },
        });
        a.buses = {};
        for (const key of ['master', 'music', 'ambience', 'effects', 'interface'])
          a.buses[key] = ctx.createGain();
        a.buses.master.connect(ctx.destination);
        for (const key of ['music', 'ambience', 'effects', 'interface'])
          a.buses[key].connect(a.buses.master);
        a.applySettings();
        a.configureRecordings(f.manifest, {
          baseUrl: new URL('../../', location.href).href,
          fetch: f.fetch,
        });
        if (
          !(await a.setRecordedScore({ stems: [{ id: 'diagnostic-a' }, { id: 'diagnostic-b' }] }))
        )
          throw Error(a.recordingError);
        const result = await ctx.startRendering(),
          data = result.getChannelData(0);
        let peak = 0,
          square = 0;
        for (const n of data) {
          if (!Number.isFinite(n)) throw Error('Nonfinite sample');
          peak = Math.max(peak, Math.abs(n));
          square += n * n;
        }
        return { peak, rms: Math.sqrt(square / data.length) };
      });
      assert(output.peak < 1);
      assert(output.rms > 0.0001);
      assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), saved);
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      await context.setOffline(true);
      await page.reload();
      await page.waitForFunction(() => window.AudioAudition?.audio.recordingManifest);
      assert.equal(await page.title(), 'Azeroth Chronicles · Audio audition');
      await page.locator('#stem-play').click();
      await page.waitForFunction(() => AudioAudition.audio.recordedScore?.voices.length === 2);
      await page.locator('#stop').click();
      assert.equal(await page.evaluate(() => AudioAudition.audio.voices.size), 0);
      await page.locator('#record-play').click();
      await page.waitForFunction(() => AudioAudition.audio.recordedScore);
      assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), saved);
      assert.deepEqual(errors, []);
      fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
      await page.screenshot({
        path: path.join(
          root,
          'test-results/audio-audition-' + engine + (phone ? '-phone' : '-desktop') + '.png',
        ),
        fullPage: true,
      });
      console.log(
        'PASS ' +
          engine +
          (phone ? ' phone' : ' desktop') +
          ': diagnostic WAV decode/render, shared stems, menu/UI mix, pause clock, actual TRUE boss, untouched saves, offline subpath audition and reopen',
      );
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

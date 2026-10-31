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
  assert(fs.existsSync(path.join(root, 'assets/vendor/pixi-8.22.0.min.js')), 'Prepare pinned local PixiJS with node scripts/vendor-pixi.cjs --ensure before offline audition acceptance');
  let outage = false,
    outageRequests = 0;
  const server = http.createServer((req, res) => {
    if (outage) {
      outageRequests++;
      res.writeHead(503);
      res.end('Network unavailable');
      return;
    }
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
        '.mp3': 'audio/mpeg',
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
      outage = false;
      outageRequests = 0;
      const context = await browser.newContext({
        viewport: phone ? { width: 375, height: 812 } : { width: 1280, height: 800 },
        hasTouch: phone,
        isMobile: phone,
      });
      const page = await context.newPage(),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      const press = async (selector) => {
        const target = page.locator(selector);
        if (phone) await target.tap();
        else await target.click();
      };
      try {
        await page.addInitScript(() => {
          localStorage.setItem('azeroth-save-sentinel', '{"keep":"original"}');
        });
        await page.goto(
          'http://127.0.0.1:' + server.address().port + prefix + 'tools/audio/index.html',
        );
        await page.waitForFunction(() => window.AudioAudition?.audio.recordingManifest);
        assert.equal(await page.evaluate(() => AudioAudition.audio.ctx), null);
        assert.equal(await page.locator('#boss option').count(), 12);
        assert.equal(await page.locator('#recording option').count(), 131);
        assert.equal(await page.locator('#library-grid .sound-card').count(), 24);
        assert((await page.locator('#result-count').textContent()).includes('131 matching'));
        await page.locator('#kind').selectOption('ambience');
        assert.equal(await page.locator('#recording option').count(), 18);
        assert.equal(await page.locator('#library-grid .sound-card').count(), 18);
        await page.locator('#search').fill('Old Signal Keep');
        assert((await page.locator('#recording option').count()) >= 1);
        await press('#reset-library');
        await page.locator('#kind').selectOption('generated');
        assert((await page.locator('#generated-grid .sound-card').count()) > 35);
        assert.equal(await page.locator('#recorded-panel').isVisible(), false);
        await page.locator('#kind').selectOption('music');
        assert.equal(await page.locator('#recording option').count(), 83);
        await page.locator('#collection').selectOption('dark-crown');
        assert.equal(await page.locator('#recording option').count(), 18);
        await page.locator('#collection').selectOption('new-score');
        assert.equal(await page.locator('#recording option').count(), 65);
        await press('#reset-library');
        assert((await page.locator('#catalog-count').textContent()).includes('131 registered'));
        assert.equal(await page.locator('#advanced').getAttribute('open'), null);
        await page.locator('#advanced').evaluate((el) => { el.open = true; });
        await page.locator('#source').selectOption('diagnostic');
        await page.waitForFunction(() =>
          Object.keys(AudioAudition.audio.recordingManifest?.assets || {}).length === 3,
        );
        const saved = await page.evaluate(() => JSON.stringify(localStorage));
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await press('#stem-play');
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
        await press('#ui-play');
        await page.waitForFunction(() =>
          [...AudioAudition.audio.voices].some((v) => v.bus === 'interface'),
        );
        assert.equal(await page.evaluate(() => AudioAudition.audio.mixLevel('effects')), 0);
        assert(await page.evaluate(() => AudioAudition.audio.mixLevel('interface') > 0));
        await page.locator('#mute').check();
        await press('#warning');
        assert.equal(await page.evaluate(() => AudioAudition.audio.mixLevel('master')), 0);
        await page.locator('#mute').uncheck();
        await press('#pause');
        await page.waitForFunction(() => AudioAudition.audio.ctx.state === 'suspended');
        const pausedAt = await page.evaluate(() => AudioAudition.audio.ctx.currentTime);
        await page.waitForTimeout(100);
        assert.equal(await page.evaluate(() => AudioAudition.audio.ctx.currentTime), pausedAt);
        await press('#pause');
        await page.waitForFunction(() => AudioAudition.audio.ctx.state === 'running');
        await page.locator('#profile').selectOption('phone');
        await page.locator('#mix-scene').selectOption('world');
        await press('#scene-play');
        await page.waitForFunction(() => AudioAudition.audio.context?.zone === 'vale' && AudioAudition.audio.recordedScore?.id === 'place-vale');
        await page.locator('#scene-mode').selectOption('combat');
        await press('#scene-play');
        await page.waitForFunction(() => AudioAudition.audio.recordedScore?.id === 'place-vale');
        assert.equal(await page.evaluate(() => AudioAudition.audio.recordedScore.voices.length), 2);
        assert((await page.locator('#scene-description').textContent()).includes('2 synchronized'));
        await page.locator('#scene-mode').selectOption('night');
        await press('#scene-play');
        await page.waitForFunction(() => AudioAudition.audio.recordedScore?.id === 'night-vale');
        await page.locator('#scene-mode').selectOption('peace');
        await press('#scene-play');
        await page.waitForFunction(() => AudioAudition.audio.recordedScore?.id === 'peace-vale');
        await page.locator('#boss').selectOption('darklord');
        await page.locator('#form').selectOption('true');
        await press('#scene-play');
        await page.waitForFunction(() => AudioAudition.audio.context?.boss?.family === 'darklord');
        assert.equal(await page.evaluate(() => AudioAudition.audio.context.boss.form), 'true');
        await page.waitForFunction(() => AudioAudition.audio.recordedScore?.id === 'boss-darklord');
        const bossStarts = await page.evaluate(() =>
          AudioAudition.audio.recordedScore.voices.map((v) => v.at),
        );
        assert.equal(bossStarts.length, 2);
        assert.equal(bossStarts[0], bossStarts[1]);
        await page.waitForFunction(
          () => AudioAudition.audio.environmentVoice?.id === 'env-crown-courtyard',
        );
        assert(
          await page.evaluate(() => AudioAudition.audio.environmentVoice.targetGain <= 0.36 * 0.25),
        );
        await page.locator('#source').selectOption('production');
        await page.waitForFunction(
          () =>
            AudioAudition.audio.recordingManifest &&
            Object.keys(AudioAudition.audio.recordingManifest.assets).length === 131,
        );
        await page.locator('#kind').selectOption('music');
        await page.locator('#recording').selectOption('place-vale');
        await press('#record-play');
        await page.waitForFunction(() => AudioAudition.audio.recordedScore?.id === 'place-vale');
        assert.equal(await page.locator('#next').isDisabled(), false);
        await press('#next');
        assert.notEqual(await page.locator('#recording').inputValue(), 'place-vale');
        await press('#prev');
        assert.equal(await page.locator('#recording').inputValue(), 'place-vale');
        assert((await page.locator('#guide-recipe').textContent()).includes('phase3-themes.json'));
        assert((await page.locator('#message').textContent()).includes('Playing place-vale'));
        assert((await page.locator('#guide-text').inputValue()).includes('phase3'));
        assert((await page.locator('#guide-recipe').textContent()).includes('phase3-themes.json'));
        assert.equal(
          await page.locator('#guide-event option').count(),
          Object.keys(require('../assets/audio/manifest.json').director.eventGuides).length + 1,
        );
        await page.locator('#guide-event').selectOption('step.wet');
        assert((await page.locator('#guide-text').inputValue()).includes('wet footstep'));
        await page.locator('#guide-event').selectOption('');

        if (!phone) {
          console.log('Audition browser: decoding all 131 production recordings');
          const decoded = await page.evaluate(async () => {
            const a = AudioAudition.audio,
              output = [];
            a.stopRecordedScore();
            for (const id of Object.keys(a.recordingManifest.assets)) {
              const item = await a.recordingAssets.load(id);
              let peak = 0,
                sum = 0;
              for (const n of item.buffer.getChannelData(0)) {
                if (!Number.isFinite(n)) throw Error('Nonfinite ' + id);
                peak = Math.max(peak, Math.abs(n));
                sum += n * n;
              }
              output.push({
                id,
                peak,
                rms: Math.sqrt(sum / item.buffer.length),
                bytes: a.recordingAssets.bytes,
              });
            }
            return output;
          });
          console.log('Audition browser: complete catalog decoded');
          assert.equal(
            decoded.length,
            Object.keys(require('../assets/audio/manifest.json').assets).length,
          );
          for (const item of decoded) {
            assert(item.peak < 0.98 && item.rms > 0.005, item.id);
            assert(item.bytes <= 128 * 1024 * 1024, item.id);
          }
        }

        await page.locator('#kind').selectOption('ambience');
        await page.locator('#recording').selectOption('env-marsh-day');
        assert((await page.locator('#guide-text').inputValue()).includes('shallow water'));
        assert(
          (await page.locator('#guide-recipe').textContent()).includes('environment-book.json'),
        );
        await press('#record-play');
        await page.waitForFunction(() =>
          [...AudioAudition.audio.voices].some((v) => v.id === 'env-marsh-day'),
        );
        await press('#record-play');
        assert.equal(
          await page.evaluate(
            () =>
              [...AudioAudition.audio.voices].filter((v) => v.recorded && v.bus === 'ambience')
                .length,
          ),
          1,
        );

        // Generated cues are engine-driven and deliberately not counted as MP3 recordings.
        await page.locator('#kind').selectOption('generated');
        await page.locator('#search').fill('Menu · Confirm');
        assert.equal(await page.locator('#generated-grid .sound-card').count(), 1);
        await press('#generated-grid .quick-play');
        await page.waitForFunction(() => document.querySelector('#message')?.textContent.includes('Played Menu · Confirm'));
        await page.locator('#search').fill('Paladin sword strike');
        assert.equal(await page.locator('#generated-grid .sound-card').count(), 1);
        await press('#generated-grid .quick-play');
        await page.waitForFunction(() => document.querySelector('#message')?.textContent.includes('Played Paladin sword strike'));
        await press('#reset-library');

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
        console.log('Audition browser: verifying offline service-worker installation');
        await page.evaluate(async () => {
          await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, reject) => setTimeout(() => reject(Error('Offline service worker did not become ready within 90 seconds')), 90000)),
          ]);
        });
        await page.waitForFunction(() => !!navigator.serviceWorker.controller);
        outage = true;
        // WebKit's setOffline + service-worker reload can raise an internal browser error.
        // A server outage still proves every entry/script comes from cache: zero network reads.
        if (engine === 'chromium') await context.setOffline(true);
        console.log('Audition browser: offline reload on ' + (phone ? 'phone' : 'desktop'));
        await page.reload();
        await page.waitForFunction(() => window.AudioAudition?.audio.recordingManifest);
        assert.equal(await page.title(), "So I Became the Dark Lord's Problem · Game sound library");
        assert.equal(outageRequests, 0);
        await page.locator('#advanced').evaluate((el) => { el.open = true; });
        await page.locator('#source').selectOption('production');
        await press('#record-play');
        await page.waitForFunction(() => AudioAudition.audio.recordedScore?.id === 'place-vale');
        assert.equal(outageRequests, 0);
        await press('#stop');
        assert.equal(await page.evaluate(() => AudioAudition.audio.voices.size), 0);
        await press('#record-play');
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
      } catch (error) {
        fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
        await page.screenshot({
          path: path.join(
            root,
            'test-results/audio-audition-failure-' + engine + '-' + phone + '.png',
          ),
          fullPage: true,
        });
        console.log(
          await page.evaluate(() => ({
            scrollY,
            scale: visualViewport?.scale,
            width: innerWidth,
            targets: [...document.querySelectorAll('button')].map((b) => ({
              id: b.id,
              rect: JSON.stringify(b.getBoundingClientRect()),
            })),
          })),
        );
        throw error;
      }
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

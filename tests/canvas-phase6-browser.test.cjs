'use strict';
// Phase 6: bounded real-browser Canvas validation and capture. This is NOT a
// hardware/device benchmark or a substitute for the owner's release sign-off.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'test-results');
const engine = process.env.BROWSER_ENGINE || 'chromium';
const profiles = [
  { name: 'desktop', file: 'index.html', width: 1280, height: 800, dpr: 1, touch: false },
  { name: 'phone-emulated', file: 'phone.html', width: 393, height: 852, dpr: 2, touch: true },
];
const mime = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
};
const server = http.createServer((req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (url === '/' ? '/index.html' : url));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404); res.end(); return;
    }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  } catch (_) { res.writeHead(400); res.end(); }
});
const percentile = (values, fraction) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return Number(sorted[Math.ceil(fraction * sorted.length) - 1].toFixed(3));
};
function chromiumBinary() {
  if (process.env.CHROMIUM_EXECUTABLE) return process.env.CHROMIUM_EXECUTABLE;
  for (const binary of ['google-chrome', 'google-chrome-stable', 'chromium']) {
    try { return cp.execFileSync('which', [binary], { encoding: 'utf8' }).trim(); }
    catch (_) {}
  }
  return null;
}
(async () => {
  let browser, active;
  fs.mkdirSync(output, { recursive: true });
  const evidence = {
    kind: 'phase6-emulated-browser-source-evidence',
    automatedCertification: 'browser-only',
    physicalDeviceCertified: false,
    hardwareFpsCertified: false,
    renderer: 'canvas2d',
    engine,
    gitCommit: process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA || 'unknown',
    profiles: [],
  };
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const launch = engine === 'chromium' && chromiumBinary()
      ? { executablePath: chromiumBinary(), args: ['--no-sandbox', '--disable-dev-shm-usage'] }
      : {};
    browser = await pw[engine].launch(launch);
    const base = 'http://127.0.0.1:' + server.address().port + '/';
    for (const profile of profiles) {
      const context = await browser.newContext({
        viewport: { width: profile.width, height: profile.height },
        deviceScaleFactor: profile.dpr, hasTouch: profile.touch,
        isMobile: profile.touch, acceptDownloads: true,
      });
      const page = await context.newPage();
      active = page;
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.setDefaultTimeout(20000);
      try {
        await page.goto(base + profile.file);
        await page.waitForFunction(() => !!window.Prototype?.renderer);
        await require('./helpers/language-browser.cjs').selectEnglish(page);
        // Follow each visible menu action explicitly. Pressing F twice is
        // not sufficient: the current title requires mode, language,
        // challenge condition and class selection before starting play.
        await page.locator('#title-new').click();
        await page.getByRole('button', { name: 'New Normal game', exact: true }).click();
        await require('./helpers/language-browser.cjs').selectEnglish(page);
        await page.getByRole('button', {
          name: 'Standard death and refuge recovery', exact: true,
        }).click();
        await page.getByRole('button', { name: /Paladin/ }).click();
        await page.waitForFunction(() => Prototype.started &&
          document.querySelector('#modal').hidden);
        assert.equal(await page.evaluate(() => Prototype.experimentalGraphics.mode), 'canvas2d');
        await page.evaluate(() => {
          Prototype.game.tick = () => {}; // freeze simulation for read-only raster comparisons
          window.__p6 = { draws: [] };
          const renderer = Prototype.renderer, previous = renderer.draw;
          renderer.draw = function (...args) {
            const item = {
              zone: Prototype.game.zoneId, covered: Prototype.sceneLoading,
              time: Prototype.game.s.time,
              started: performance.now(),
            };
            try { return previous.apply(this, args); }
            finally {
              item.ms = performance.now() - item.started;
              if (__p6.draws.length < 256) __p6.draws.push(item);
            }
          };
        });
        // Two actual title/Continue journeys on the same restored campaign.
        // Keep idle callbacks out of the measurement to isolate the accepted
        // Phase 2 prepared-vs-unprepared single-ground-raster comparison.
        const journeys = [];
        for (const prepared of [false, true]) {
          await page.evaluate(() => { window.requestIdleCallback = () => 0; });
          await page.locator('#menu-button').click();
          await page.getByRole('button', { name: 'Return to Main Menu', exact: true }).click();
          await page.waitForFunction(() => !Prototype.started && !document.querySelector('#title-screen').hidden);
          const before = await page.evaluate(prepared => {
            const r = Prototype.renderer;
            r.setGroundReuse(true); // release old raster before this matched trial
            const snapshot = JSON.stringify(Prototype.game.snapshot());
            const beforeMetrics = r.metrics();
            const warmed = prepared ? r.prepareCurrentGround() : false;
            return {
              snapshot, warmed, beforeMetrics, preparedMetrics: r.metrics(),
              zone: Prototype.game.zoneId, time: Prototype.game.s.time,
            };
          }, prepared);
          if (prepared) {
            assert.equal(before.warmed, true,
              'the same constructed outdoor view supports title-only warmup');
            assert(before.preparedMetrics.groundCache.bytes > 0,
              'title preparation owns a bounded outdoor raster');
          } else {
            assert.equal(before.preparedMetrics.groundCache.bytes, 0,
              'cold trial starts without the Canvas ground raster');
          }
          assert(before.preparedMetrics.groundCache.bytes <= 64 * 1024 * 1024);
          assert.equal(await page.evaluate(() => JSON.stringify(Prototype.game.snapshot())),
            before.snapshot, 'title prepaint cannot change gameplay state');
          await page.evaluate(() => {
            __p6.draws.length = 0;
            window.__p6Start = performance.now();
          });
          await page.locator('#title-continue').click();
          await page.waitForFunction(() => Prototype.started && document.querySelector('#title-screen').hidden);
          const after = await page.evaluate(() => ({
            elapsedMs: performance.now() - __p6Start,
            metrics: Prototype.renderer.metrics(),
            draws: __p6.draws.slice(),
            zone: Prototype.game.zoneId,
            time: Prototype.game.s.time,
            graphics: Prototype.experimentalGraphics.mode,
          }));
          assert.equal(after.graphics, 'canvas2d');
          assert.equal(after.zone, before.zone, 'Continue cannot teleport the campaign');
          assert(after.draws.length > 0, 'Continue must actually draw the first Canvas scene');
          assert(after.draws.every(d => d.zone === before.zone), 'no stale-region first-frame draw');
          assert(after.metrics.groundCache.bytes <= 64 * 1024 * 1024);
          journeys.push({
            prepared, prepaintedBytes: before.preparedMetrics.groundCache.bytes,
            prepaintedBuilds: before.preparedMetrics.groundCache.builds -
              before.beforeMetrics.groundCache.builds,
            clickToVisibleMs: Number(after.elapsedMs.toFixed(3)),
            firstDrawMs: Number(after.draws[0].ms.toFixed(3)),
            firstDrawCovered: after.draws[0].covered,
            groundBuildsDuringContinue:
              after.metrics.groundCache.builds - before.preparedMetrics.groundCache.builds,
            groundBytes: after.metrics.groundCache.bytes,
          });
        }
        assert.equal(journeys.length, 2);
        // A frozen same-frame direct-vs-cached Canvas comparison; existing
        // ground-cache-browser independently covers more regions and zooms.
        const visuals = await page.evaluate(() => {
          const game = Prototype.game, r = Prototype.renderer;
          const snapshot = JSON.stringify(game.snapshot());
          const canvas = document.getElementById('world'), ctx = canvas.getContext('2d');
          r.setGroundReuse(false);
          r.draw();
          const direct = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          r.setGroundReuse(true);
          r.draw();
          const cached = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let sum = 0, max = 0, severe = 0;
          for (let k = 0; k < direct.length; k++) {
            const delta = Math.abs(direct[k] - cached[k]);
            sum += delta; max = Math.max(max, delta);
            if (delta > 24) severe++;
          }
          // Draw-only controlled samples: not whole game FPS nor physical-device p95.
          const samples = [];
          for (let k = 0; k < 24; k++) {
            const start = performance.now();
            r.draw();
            samples.push(performance.now() - start);
          }
          return {
            meanChannelDelta: sum / direct.length,
            maxChannelDelta: max, severeChannelFraction: severe / direct.length,
            drawMs: samples,
            stateUnchanged: JSON.stringify(game.snapshot()) === snapshot,
            groundCache: r.metrics().groundCache,
            frameProfile: Prototype.frameProfile.report(),
            browserMemoryBytes: performance.memory?.usedJSHeapSize ?? null,
          };
        });
        assert(visuals.stateUnchanged, 'controlled raster capture must not mutate campaign');
        assert(visuals.meanChannelDelta < .6,
          'existing Canvas floor reuse must preserve near-equivalent appearance');
        assert(visuals.groundCache.bytes <= 64 * 1024 * 1024);
        assert.deepEqual(errors, [], 'browser page exceptions');
        await page.locator('#world').screenshot({
          path: path.join(output, 'canvas-phase6-' + engine + '-' + profile.name + '-outdoor.png'),
          animations: 'disabled',
        });
        evidence.profiles.push({
          profile: profile.name,
          emulated: true,
          viewport: { width: profile.width, height: profile.height, dpr: profile.dpr },
          journeys, visuals: {
            ...visuals, drawMs: undefined,
            drawOnlyP50Ms: percentile(visuals.drawMs, .5),
            drawOnlyP95Ms: percentile(visuals.drawMs, .95),
            drawOnlyP99Ms: percentile(visuals.drawMs, .99),
            drawOnlySamples: visuals.drawMs.length,
          },
          browserErrors: errors,
        });
        console.log('PASS Phase 6 ' + engine + '/' + profile.name +
          ' cold/warm Continue, browser pixels, retained bytes and save isolation');
      } catch (error) {
        await page.screenshot({
          path: path.join(output, 'canvas-phase6-' + engine + '-' + profile.name + '-failure.png'),
        }).catch(() => {});
        throw error;
      } finally {
        await context.close();
      }
    }
  } finally {
    fs.writeFileSync(
      path.join(output, 'canvas-phase6-' + engine + '-evidence.json'),
      JSON.stringify(evidence, null, 2) + '\n',
    );
    await browser?.close();
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

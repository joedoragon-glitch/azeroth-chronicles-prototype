'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
function installedChromium() {
  if (process.env.CHROMIUM_EXECUTABLE) return process.env.CHROMIUM_EXECUTABLE;
  for (const binary of ['google-chrome', 'google-chrome-stable', 'chromium']) {
    try { return cp.execFileSync('which', [binary], {encoding:'utf8'}).trim(); }
    catch (_) {}
  }
  return null;
}
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.webmanifest': 'application/manifest+json',
};
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const engine = process.env.BROWSER_ENGINE || 'chromium';
    browser = await pw[engine].launch(
      engine === 'webkit'
        ? {}
        : {
            ...(installedChromium() ? { executablePath: installedChromium() } : {}),
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
          },
    );
    for (const phone of [false, true]) {
      const context = await browser.newContext({
        viewport: { width: phone ? 393 : 1280, height: phone ? 852 : 800 },
        hasTouch: phone,
        isMobile: phone,
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        'http://127.0.0.1:' + server.address().port + (phone ? '/phone.html' : '/index.html'),
      );
      await page.waitForFunction(() => !!window.Prototype);
      await require('./helpers/language-browser.cjs').selectEnglish(page);
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      const openSettings = async () => {
        await page.locator('#menu-button').click();
        await page.getByRole('button', { name: 'Game and settings', exact: true }).click();
        await page.getByRole('button', { name: 'Screen and performance', exact: true }).click();
      };
      await openSettings();
      for (const [value] of [
        ['20', '20 FPS'],
        ['30', '30 FPS'],
        ['60', '60 FPS'],
        ['auto60', 'Auto 30–60 FPS'],
        ['auto', 'Auto 20–30 FPS'],
      ]) {
        const before = await page.evaluate(() => JSON.stringify(Prototype.game.snapshot()));
        await page.locator('select[aria-label="Frame rate"]').selectOption(value);
        assert.deepEqual(
          await page.evaluate(() => ({
            preference: Prototype.fps.preference,
            target: Prototype.fps.target,
            stored: localStorage.getItem(PrototypeRuntime.fpsPreferenceKey),
          })),
          { preference: value, target: value === '60' ? 60 : value === '20' ? 20 : 30, stored: value },
        );
        assert.equal(
          await page.evaluate(() => JSON.stringify(Prototype.game.snapshot())),
          before,
          'Changing rendering preferences cannot mutate a paused campaign',
        );
      }
      await page.locator('select[aria-label="Frame rate"]').selectOption('60');
      await page.reload();
      await page.waitForFunction(() => !!window.Prototype);
      assert.equal(
        await page.evaluate(() => Prototype.fps.preference),
        '60',
        'UI preference survives reload',
      );
      await page.evaluate(() => Prototype.closeMenu());
      await openSettings();
      await page.locator('select[aria-label="Frame rate"]').selectOption('30');
      await page.evaluate(() => {
        Prototype.closeMenu();
        window.__fpsCounts = { ticks: 0, updates: 0, observations: 0, draws: 0 };
        const { game, renderer, fps } = Prototype;
        for (const [owner, method, counter] of [
          [game, 'tick', 'ticks'],
          [renderer, 'update', 'updates'],
          [renderer, 'draw', 'draws'],
          [fps, 'observe', 'observations'],
        ]) {
          const original = owner[method];
          owner[method] = function (...args) {
            __fpsCounts[counter]++;
            return original.apply(this, args);
          };
        }
        // Force rendering to skip while exercising the actual app callback.
        fps.shouldDraw = () => false;
      });
      await page.waitForFunction(() => __fpsCounts.ticks >= 8);
      const counts = await page.evaluate(() => ({ ...__fpsCounts }));
      assert.equal(counts.draws, 0, 'Rendering was skipped');
      assert.equal(
        counts.ticks,
        counts.observations,
        'Simulation still executes on every active callback',
      );
      assert.equal(
        counts.updates,
        counts.ticks,
        'Effect advancement still executes on every active callback',
      );
      assert.deepEqual(errors, []);
      console.log(
        'PASS FPS settings, persistence, save isolation and ungated simulation: ' +
          engine +
          '/' +
          (phone ? 'phone' : 'desktop'),
      );
      await context.close();
      // High-DPR cold start and reload exercise the setting before the first
      // material/audio request, then restore normal backing density.
      const hiContext = await browser.newContext({
        viewport: { width: phone ? 393 : 1280, height: phone ? 852 : 800 },
        deviceScaleFactor: 3,
        hasTouch: phone,
        isMobile: phone,
      });
      const hi = await hiContext.newPage();
      await hi.addInitScript(() => {
        // Seed only the first load; subsequent reloads must honor saved changes.
        if (!sessionStorage.getItem('optimization-seeded')) {
          localStorage.setItem('azeroth-optimization-mode-v1', 'on');
          // This test exercises deliberate user choices after the one-time
          // upgrade, not the first-launch preference migration.
          localStorage.setItem('azeroth-optimization-auto-default-v1', 'applied');
          localStorage.setItem('azeroth-performance-defaults-dev170-v1', 'applied');
          sessionStorage.setItem('optimization-seeded', 'true');
        }
      });
      await hi.goto(
        'http://127.0.0.1:' + server.address().port + (phone ? '/phone.html' : '/index.html'),
      );
      await hi.waitForFunction(() => !!window.Prototype);
      const optimized = await hi.evaluate(() => ({
        canvas: document.getElementById('world').width,
        viewport: innerWidth,
        materials: PrototypeMaterials.status(),
        renderer: Prototype.renderer.metrics(),
        audio: Prototype.audio.status(),
      }));
      assert.equal(optimized.canvas, optimized.viewport, 'optimized boot caps internal DPR at 1');
      assert.equal(optimized.materials.optimizationMode, true);
      assert.equal(
        optimized.materials.definitions,
        0,
        'no texture manifest fetched on optimized cold boot',
      );
      assert.equal(optimized.audio.optimizationMode, true);
      assert.equal(optimized.renderer.optimizationMode, 'on');
      await hi.evaluate(() => localStorage.setItem('azeroth-optimization-mode-v1', 'off'));
      await hi.reload();
      await hi.waitForFunction(() => !!window.Prototype);
      const restored = await hi.evaluate(() => ({
        canvas: document.getElementById('world').width,
        viewport: innerWidth,
        materials: PrototypeMaterials.status().optimizationMode,
        audio: Prototype.audio.status().optimizationMode,
      }));
      assert(restored.canvas > restored.viewport, 'normal boot restores higher DPR');
      assert.equal(restored.materials, false);
      assert.equal(restored.audio, false);
      await hiContext.close();
    }
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

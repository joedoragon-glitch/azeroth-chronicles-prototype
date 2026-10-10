'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
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
            executablePath: process.env.CHROMIUM_EXECUTABLE,
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
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      const openSettings = async () => {
        await page.locator('#menu-button').click();
        await page.getByRole('button', { name: 'Game and settings', exact: true }).click();
        await page.getByRole('button', { name: 'Screen and performance', exact: true }).click();
      };
      await openSettings();
      for (const [value, label] of [
        ['30', '30 FPS'],
        ['60', '60 FPS'],
        ['auto', 'Auto'],
      ]) {
        const before = await page.evaluate(() => JSON.stringify(Prototype.game.snapshot()));
        await page.getByRole('button', { name: new RegExp('Frame rate · ' + label) }).click();
        assert.deepEqual(
          await page.evaluate(() => ({
            preference: Prototype.fps.preference,
            target: Prototype.fps.target,
            stored: localStorage.getItem(PrototypeRuntime.fpsPreferenceKey),
          })),
          { preference: value, target: value === '60' ? 60 : 30, stored: value },
        );
        assert.equal(
          await page.evaluate(() => JSON.stringify(Prototype.game.snapshot())),
          before,
          'Changing rendering preferences cannot mutate a paused campaign',
        );
      }
      await page.getByRole('button', { name: /Frame rate · 60 FPS/ }).click();
      await page.reload();
      await page.waitForFunction(() => !!window.Prototype);
      assert.equal(
        await page.evaluate(() => Prototype.fps.preference),
        '60',
        'UI preference survives reload',
      );
      await page.evaluate(() => Prototype.closeMenu());
      await openSettings();
      await page.getByRole('button', { name: /Frame rate · 30 FPS/ }).click();
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
    }
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

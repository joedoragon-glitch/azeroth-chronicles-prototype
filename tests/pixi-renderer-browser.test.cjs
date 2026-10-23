'use strict';
// Focused real-browser acceptance for the optional PixiJS presentation.
// A software browser may lack WebGL2; in that case Canvas fallback is required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const engine = process.env.BROWSER_ENGINE || 'chromium';
const types = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.json': 'application/json', '.css': 'text/css',
  '.png': 'image/png', '.webp': 'image/webp',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const name = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
  const filename = path.resolve(root, name);
  if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename) ||
      !fs.statSync(filename).isFile()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, {'Content-Type': types[path.extname(filename)] || 'application/octet-stream'});
  fs.createReadStream(filename).pipe(res);
});
async function run() {
  let browser;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const options = engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE
      ? {executablePath: process.env.CHROMIUM_EXECUTABLE,
        args: ['--no-sandbox', '--disable-dev-shm-usage']}
      : {};
    browser = await playwright[engine].launch(options);
    for (const phone of [false, true]) {
      const context = await browser.newContext({
        viewport: phone ? {width: 393, height: 852} : {width: 1280, height: 800},
        isMobile: phone, hasTouch: phone,
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      const host = 'http://127.0.0.1:' + server.address().port + '/';
      await page.goto(host + (phone ? 'phone.html' : 'index.html'));
      await page.waitForFunction(() => !!window.Prototype && !!window.Prototype.renderer);
      assert.equal(await page.evaluate(() => Prototype.experimentalGraphics.mode), 'canvas2d');
      await require('./helpers/language-browser.cjs').selectEnglish(page);
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      await page.evaluate(() => {window.__gpuTestCampaign = Prototype.game;});
      await page.locator('#menu-button').click();
      await page.getByRole('button', {name: 'Game and settings', exact: true}).click();
      await page.getByRole('button', {name: 'Screen and performance', exact: true}).click();
      await page.getByRole('button', {name: 'Graphics renderer', exact: true}).click();
      await page.getByRole('button', {name: /^PixiJS WebGL2/}).click();
      await page.waitForFunction(() =>
        ['trial', 'canvas', 'confirmed'].includes(Prototype.experimentalGraphics.phase),
        {timeout: 25000});
      // Preparation is asynchronous; wait for a terminal failure or visible trial.
      await page.waitForFunction(() =>
        Prototype.experimentalGraphics.phase !== 'preparing', null, {timeout: 30000});
      const outcome = await page.evaluate(() => ({
        ...Prototype.experimentalGraphics,
        sameGame: Prototype.game === window.__gpuTestCampaign,
      }));
      assert(outcome.sameGame, 'The GPU choice must never replace the Campaign');
      if (outcome.mode === 'webgl2') {
        assert.equal(outcome.phase, 'trial', 'GPU must be opt-in and unconfirmed');
        assert.equal(await page.locator('#gpu-renderer-trial').isVisible(), true);
        const gpuSurface = await page.evaluate(() => {
          const node = document.getElementById('world-pixi-experimental');
          return {
            visible: !!node && getComputedStyle(node).display !== 'none',
            loadedTextures: Prototype.experimentalGraphics.loadedTextures,
            canvasVisible: getComputedStyle(document.getElementById('world')).display !== 'none',
          };
        });
        assert(gpuSurface.visible && gpuSurface.canvasVisible,
          'PixiJS scene and transparent Canvas cues must coexist');
        assert(gpuSurface.loadedTextures > 0, 'Approved original sprite art must load');
        // Exercise live actor/camera updates, not merely successful GPU startup.
        await page.evaluate(() => {
          const hero = Prototype.game.hero;
          hero.x += 6;
          hero.y += 4;
          Prototype.platform.selectCameraZoom(1.75);
        });
        await page.waitForTimeout(200);
        assert.equal(await page.evaluate(() => Prototype.experimentalGraphics.mode), 'webgl2',
          'Camera zoom must not abandon an otherwise valid GPU scene');
        assert.equal(await page.evaluate(() => Prototype.game === window.__gpuTestCampaign), true);
        await page.getByRole('button', {name: 'Keep WebGL2'}).click();
        assert.equal(await page.evaluate(() => Prototype.experimentalGraphics.phase), 'confirmed');
        assert.equal(await page.evaluate(() => localStorage.getItem('azeroth-renderer-choice-v1')),
          'webgl2');
        await page.reload();
        await page.waitForFunction(() => window.Prototype?.experimentalGraphics);
        await page.waitForFunction(() =>
          Prototype.experimentalGraphics.phase !== 'preparing', null, {timeout: 30000});
        const after = await page.evaluate(() => Prototype.experimentalGraphics);
        assert(['confirmed', 'canvas'].includes(after.phase), 'Restart must safely show a renderer');
        // Context loss must restore the untouched Canvas even after Keep/reload.
        if (after.mode === 'webgl2') {
          await page.evaluate(() => {
            const node = document.getElementById('world-pixi-experimental');
            assertGpuPresent(node);
            function assertGpuPresent(canvas) {
              if (!canvas) throw Error('Confirmed WebGL canvas missing');
            }
            node.dispatchEvent(new Event('webglcontextlost', {cancelable: true}));
          });
          await page.waitForFunction(() => Prototype.experimentalGraphics.mode === 'canvas2d');
          assert.equal(await page.evaluate(() =>
            localStorage.getItem('azeroth-renderer-choice-v1')), 'canvas2d',
          'Context loss must clear the failed device preference');
        }
      } else {
        assert.equal(outcome.mode, 'canvas2d', 'Failed WebGL initialization must retain Canvas');
        assert.equal(await page.evaluate(() => Prototype.renderer.draw !== undefined), true);
      }
      assert.deepEqual(errors, [], 'Browser startup and graphics selection must not crash');
      console.log('PASS PixiJS graphics selection ' + engine + '/' + (phone ? 'phone' : 'desktop')
        + ' (' + outcome.mode + ')');
      await context.close();
    }
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
run().catch((error) => {console.error(error); process.exitCode = 1;});

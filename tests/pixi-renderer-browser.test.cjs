'use strict';
// Focused real-browser acceptance for the optional PixiJS presentation.
// A software browser may lack WebGL2; in that case Canvas fallback is required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const engine = process.env.BROWSER_ENGINE || 'chromium';
const requireWebGL = process.env.REQUIRE_WEBGL2 === '1';
// Use the runner's Chromium if available, including its software WebGL2
// implementation. This is a functionality check, never a hardware FPS claim.
function installedChromium() {
  if (process.env.CHROMIUM_EXECUTABLE) return process.env.CHROMIUM_EXECUTABLE;
  for (const command of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'])
    try {
      return cp.execFileSync('which', [command], {encoding:'utf8'}).trim();
    } catch (_) {}
  return null;
}
async function selectPixi(page) {
  await page.locator('#menu-button').click();
  await page.getByRole('button', {name: 'Game and settings', exact: true}).click();
  await page.getByRole('button', {name: 'Screen and performance', exact: true}).click();
  // The current UI exposes an inline SELECT, not the old Graphics submenu.
  await page.locator('select[aria-label="Graphics renderer"]').selectOption('webgl2');
  await page.waitForFunction(() => {
    const r=Prototype.experimentalGraphics;
    return r.phase==='trial' ||
      (r.phase==='canvas' && !!(r.lastError || r.lastFallbackReason));
  }, null, {timeout:45000});
  return page.evaluate(() => Prototype.experimentalGraphics);
}
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
    if (!process.env.PLAYTEST_URL)
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const binary = engine === 'chromium' ? installedChromium() : null;
    const options = engine === 'chromium'
      ? {
          ...(binary ? {executablePath: binary} : {}),
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
            '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
        }
      : {};
    browser = await playwright[engine].launch(options);
    for (const phone of [false, true]) {
      const context = await browser.newContext({
        viewport: phone ? {width: 393, height: 852} : {width: 1280, height: 800},
        isMobile: phone, hasTouch: phone, acceptDownloads: true,
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      const host = process.env.PLAYTEST_URL
        ? process.env.PLAYTEST_URL.replace(/\/?$/, '/')
        : 'http://127.0.0.1:' + server.address().port + '/';
      await page.goto(host + (phone ? 'phone.html' : 'index.html'));
      await page.waitForFunction(() => !!window.Prototype && !!window.Prototype.renderer);
      assert.equal(await page.evaluate(() => Prototype.experimentalGraphics.mode), 'canvas2d');
      await require('./helpers/language-browser.cjs').selectEnglish(page);
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      await page.evaluate(() => {window.__gpuTestCampaign = Prototype.game;});
      await selectPixi(page);
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
            backingRatio: node.width / Math.max(1, node.getBoundingClientRect().width),
            canvasRatio: document.getElementById('world').width /
              Math.max(1, document.getElementById('world').getBoundingClientRect().width),
          };
        });
        assert(gpuSurface.visible && gpuSurface.canvasVisible,
          'PixiJS scene and transparent Canvas cues must coexist');
        assert(gpuSurface.loadedTextures > 0, 'Approved original sprite art must load');
        assert(outcome.sceneMetrics?.actors > 0, 'Pixi must render actual world actors');
        assert(outcome.sceneMetrics?.textureSources > 0,
          'Actual Pixi scene texture sources must be reported');
        assert(Math.abs(gpuSurface.backingRatio - gpuSurface.canvasRatio) < .02,
          'GPU backing resolution must match Canvas sharpness');
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
        await page.waitForFunction(() => {
          const r=Prototype.frameProfile.report();
          return r.stages.pixiMs.samples>0 && r.stages.canvasOverlayMs.samples>0;
        }, null, {timeout:30000});
        // Open the real export menu: verify the user-facing playtest JSON,
        // not merely an internal profiler object or a static source assertion.
        await page.locator('#menu-button').click();
        await page.getByRole('button', {name:'Game and settings', exact:true}).click();
        await page.getByRole('button', {name:'Save and game management', exact:true}).click();
        const downloadPromise=page.waitForEvent('download');
        await page.getByRole('button', {name:'Export playtest report', exact:true}).click();
        const download=await downloadPromise;
        const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
        assert.equal(exported.performance.graphicsRenderer.activeRenderer, 'pixijs-webgl2');
        assert(exported.performance.graphicsRenderer.sceneMetrics.actors>0);
        assert.equal(exported.performance.render.measuredLayer,'canvas-combat-overlay');
        assert(exported.performance.frameProfile.stages.pixiMs.samples>0);
        assert(exported.performance.frameProfile.stages.canvasOverlayMs.samples>0);
        assert(exported.performance.frameProfile.stages.renderMs.samples>0,
          'Legacy combined render timing must remain available');
        console.log('PASS exported Pixi actor counts and separate Pixi/Canvas draw timings');
        await page.evaluate(() => Prototype.closeMenu());
        // Exercise the real game loop through sunset, night and sunrise.
        // Restore the clock afterward: renderer testing must not change saves.
        const lightAudit = await page.evaluate(async () => {
          const game = Prototype.game, original = game.s.clock, audit = [];
          try {
            for (const clock of [0,345,359.99,360,570,585,599.99]) {
              game.s.clock = clock;
              await new Promise(resolve => setTimeout(resolve, 120));
              audit.push({
                phase:game.daylightPhase().phase,
                mode:Prototype.experimentalGraphics.mode,
                error:Prototype.experimentalGraphics.lastError,
              });
              if (Prototype.experimentalGraphics.mode !== 'webgl2') break;
            }
          } finally {game.s.clock = original;}
          return audit;
        });
        assert.equal(lightAudit.length,7,'All lighting transitions must remain in WebGL');
        assert(lightAudit.every(x => x.mode === 'webgl2'),
          'Unexpected Pixi fallback during daylight transitions: '+JSON.stringify(lightAudit));
        await page.reload();
        await page.waitForFunction(() => window.Prototype?.experimentalGraphics);
        await page.waitForFunction(() =>
          Prototype.experimentalGraphics.phase !== 'preparing', null, {timeout: 30000});
        let after = await page.evaluate(() => Prototype.experimentalGraphics);
        assert(['confirmed', 'canvas'].includes(after.phase), 'Restart must safely show a renderer');
        // A software browser may safely restore Canvas. If this is our
        // explicit WebGL-capable CI run, opt in again to exercise recovery.
        if (after.mode !== 'webgl2' && requireWebGL) {
          const retry = await selectPixi(page);
          assert.equal(retry.mode,'webgl2','WebGL2 must work after safe restart');
          await page.getByRole('button', {name:'Keep WebGL2'}).click();
          after = await page.evaluate(() => Prototype.experimentalGraphics);
        }
        // Exercise both real viewport resize and simulated GL context loss,
        // without suppressing the existing production resize/UI routines.
        if (after.mode === 'webgl2') {
          if (phone) {
            await page.setViewportSize({width: 375, height: 800});
          } else {
            await page.evaluate(() => {
              const node = document.getElementById('world-pixi-experimental');
              if (!node) throw Error('Confirmed WebGL canvas missing');
              node.dispatchEvent(new Event('webglcontextlost', {cancelable: true}));
            });
          }
          await page.waitForFunction(() => Prototype.experimentalGraphics.mode === 'canvas2d');
          const failure = await page.evaluate(() => Prototype.experimentalGraphics);
          assert.equal(failure.lastFallbackReason, 'webgl-context-or-render-failure',
            'The original fallback field must remain compatible');
          assert.equal(failure.lastFailure?.type, phone ? 'viewport-changed' : 'context-loss');
          assert(failure.lastFailure?.stage && failure.lastFailure?.timestampMs,
            'The precise error cause and timestamp must survive Canvas fallback');
          assert(failure.lastFailure?.resources?.loadedTextures > 0,
            'Pre-teardown texture counts must be retained');
          assert.equal(await page.evaluate(() =>
            localStorage.getItem('azeroth-renderer-choice-v1')), 'canvas2d',
          'Graphics failure or viewport resize must restore Canvas and clear the device preference');
          assert.equal(await page.evaluate(() =>
            getComputedStyle(document.getElementById('world')).display !== 'none'), true);
        }
      } else {
        assert.equal(outcome.mode, 'canvas2d', 'Failed WebGL initialization must retain Canvas');
        assert.equal(await page.evaluate(() => Prototype.renderer.draw !== undefined), true);
        assert(!requireWebGL,
          'Required Pixi WebGL2 is unavailable on this software test runner: ' +
            JSON.stringify({lastError:outcome.lastError,lastFailure:outcome.lastFailure}));
      }
      assert.deepEqual(errors, [], 'Browser startup and graphics selection must not crash');
      console.log('PASS PixiJS graphics selection ' + engine + '/' + (phone ? 'phone' : 'desktop')
        + ' (' + outcome.mode + ')');
      await context.close();
    }
  } finally {
    await browser?.close();
    if (server.listening) await new Promise((resolve) => server.close(resolve));
  }
}
run().catch((error) => {console.error(error); process.exitCode = 1;});

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
// An isolated browser smoke may run before the general build step. Ensure
// the exact pinned local Pixi bundle exists, just like the actual PWA build.
if (!fs.existsSync(path.join(root,'assets/vendor/pixi-8.22.0.min.js')))
  cp.execFileSync(process.execPath,['scripts/vendor-pixi.cjs','--ensure'],
    {cwd:root,stdio:'inherit'});
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
// Use a real screen-coordinate touch on phone. Playwright locator.click() may
// scroll the fixed 15-second trial panel during mobile restart, potentially
// changing the visual viewport and invalidating the graphics trial itself.
// Never bypass the user-facing button or extend/disable the safety deadline.
async function keepPixiTrial(page, phone, checkpoint) {
  const target = await page.evaluate(() => {
    const panel = document.querySelector('#gpu-renderer-trial');
    const button = panel?.querySelector('button');
    const rect = button?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : -1;
    const y = rect ? rect.top + rect.height / 2 : -1;
    const top = document.elementFromPoint(x, y);
    return {
      x, y, width: rect?.width || 0, height: rect?.height || 0,
      hit: !!button && (top === button || button.contains(top)),
      panelVisible: !!panel && !panel.hidden,
      graphics: Prototype.experimentalGraphics,
    };
  });
  assert.equal(target.graphics.phase, 'trial',
    checkpoint + ': confirmation requires an active, unexpired trial: ' + JSON.stringify(target));
  assert(target.graphics.secondsRemaining > 0 && target.panelVisible,
    checkpoint + ': Keep prompt disappeared before user confirmation: ' + JSON.stringify(target));
  assert(target.hit && target.width >= 44 && target.height >= 44,
    checkpoint + ': Keep must be touchable at its visible center: ' + JSON.stringify(target));
  if (phone)
    await page.touchscreen.tap(target.x, target.y);
  else
    // A coordinate click does not auto-scroll the fixed safety panel or
    // accidentally change the viewport during the 15-second trial.
    await page.mouse.click(target.x, target.y);
  const result = await page.evaluate(() => Prototype.experimentalGraphics);
  assert.equal(result.phase, 'confirmed',
    checkpoint + ': the real Keep action must confirm, not time out or revert: ' +
      JSON.stringify({before: target.graphics, after: result}));
  return result;
}
// One narrowly scoped, real Chromium drawing check on BOTH the Canvas path
// and the PixiJS Canvas-combat overlay. Simulation timing is tested separately.
async function inspectMageBeamOverlay(page, expectedMode) {
  const result = await page.evaluate(() => {
    const game = Prototype.game, renderer = Prototype.renderer,
      art = window.PrototypeHeroPresentation;
    const saved = {
      cls: game.hero.class, x: game.hero.x, y: game.hero.y,
      shots: game.s.projectiles, effects: game._heroSkillEffects,
      draw: art.draw, projectile: art.projectile,
    };
    const charged = [], normal = [];
    try {
      game.hero.class = 'mage';
      art.draw = function (ctx, screen, effect, opts) {
        if (effect.stage === 'skill1-wide-beam')
          charged.push({x: effect.x, y: effect.y, endX: effect.endX,
            endY: effect.endY, width: effect.halfWidth, live: effect.simulatedFront});
        return saved.draw.call(this, ctx, screen, effect, opts);
      };
      art.projectile = function (ctx, screen, shot, cls, reduced, caster) {
        if (shot.mageSkill1Homing)
          normal.push({x: shot.x, y: shot.y, casterX: caster?.x,
            casterY: caster?.y, visualWidth: shot.beamWidthScale});
        return saved.projectile.call(this, ctx, screen, shot, cls, reduced, caster);
      };
      const from = {x: saved.x, y: saved.y};
      const beam = {
        kind: 'wide-beam', zone: game.zoneId,
        deaths: game.s.statistics.deaths, from,
        endX: from.x + 90, endY: from.y,
        halfWidth: 20,
      };
      game._heroSkillEffects = [...(saved.effects || []), beam];
      game.s.projectiles = [...saved.shots, {
        id: 'beam-overlay-smoke', source: 'hero', style: 'beam',
        slot: 1, charged: false, x: from.x + 65, y: from.y,
        originX: from.x, originY: from.y, dx: 1, dy: 0,
        beamWidthScale: 2, mageSkill1Homing: true, delay: 0,
        trailPoints: [from, {x: from.x + 30, y: from.y}],
      }];
      renderer.queue([{type: 'heroSkillArea', actor: 'hero', class: 'mage',
        slot: 1, effect: 'wide-arcane-beam', phase: 'launch',
        x: from.x, y: from.y, endX: beam.endX, endY: beam.endY,
        halfWidth: beam.halfWidth, travelSeconds: 0.625, hits: 0}]);
      renderer.draw();
      game.hero.x += 24;
      game.hero.y += 16;
      beam.from = {x: game.hero.x, y: game.hero.y};
      beam.endX = from.x + 90;
      beam.endY = from.y;
      renderer.draw();
      // Verify actual raster drawing, not only that callbacks were reached.
      const surface = document.createElement('canvas');
      surface.width = 300; surface.height = 180;
      const ctx = surface.getContext('2d');
      saved.draw(ctx, point => point, {
        stage: 'skill1-wide-beam', x: 30, y: 80,
        endX: 180, endY: 110, halfWidth: 20,
        simulatedFront: true, max: 0.83, life: 0.55,
      }, {reduced: false, width: 300, height: 180});
      const pixels = ctx.getImageData(0, 0, 300, 180).data;
      let painted = 0;
      for (let i = 3; i < pixels.length; i += 4)
        if (pixels[i]) painted++;
      return {mode: Prototype.experimentalGraphics.mode, charged, normal, painted};
    } finally {
      art.draw = saved.draw;
      art.projectile = saved.projectile;
      game.hero.class = saved.cls;
      game.hero.x = saved.x;
      game.hero.y = saved.y;
      game.s.projectiles = saved.shots;
      game._heroSkillEffects = saved.effects;
      renderer.update(1);
    }
  });
  assert.equal(result.mode, expectedMode, 'Renderer mode should not switch during beam drawing');
  assert(result.charged.length >= 2, 'Both real renderer draws must show the charged beam');
  assert(result.normal.length >= 2, 'Both real renderer draws must show the normal beam');
  assert.equal(result.charged[0].live, true, 'Charged art uses simulation-owned geometry');
  assert.equal(result.charged[0].width, 20);
  assert.equal(result.charged[0].x + 24, result.charged.at(-1).x,
    'Charged near end follows the moving caster');
  assert.equal(result.charged[0].endX, result.charged.at(-1).endX,
    'Charged far world aim remains fixed');
  assert.equal(result.normal[0].visualWidth, 2);
  assert.equal(result.normal[0].x, result.normal.at(-1).x,
    'Normal damaging projectile head does not teleport with caster');
  assert.equal(result.normal[0].casterX + 24, result.normal.at(-1).casterX,
    'Normal trail attaches to live caster');
  assert(result.painted > 250, 'Charged art must actually paint a readable beam corridor');
  console.log('PASS Mage Skill 1 Canvas combat-overlay drawing (' + expectedMode + ')');
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
    const host = process.env.PLAYTEST_URL
      ? process.env.PLAYTEST_URL.replace(/\/?$/, '/')
      : 'http://127.0.0.1:' + server.address().port + '/';
    // Complete Mage-specific desktop and phone presentation first. A failure in
    // the separate generic WebGL recovery journey must not prevent recording
    // whether Mage Skill 1 itself draws on Canvas and the Pixi combat overlay.
    // The original recovery journey below remains unchanged and is not waived.
    for (const phone of [false, true]) {
      // Separate graphics acceptance context: exercising synthetic beam
      // geometry must never contaminate the renderer recovery journey above.
      const beamContext = await browser.newContext({
        viewport: phone ? {width: 393, height: 852} : {width: 1280, height: 800},
        isMobile: phone, hasTouch: phone,
      });
      try {
        const beamPage = await beamContext.newPage();
        await beamPage.goto(host + (phone ? 'phone.html' : 'index.html'));
        await beamPage.waitForFunction(() => !!window.Prototype?.renderer);
        await require('./helpers/language-browser.cjs').selectEnglish(beamPage);
        await beamPage.keyboard.press('f');
        await beamPage.keyboard.press('f');
        await beamPage.waitForFunction(() => document.querySelector('#modal').hidden);
        await inspectMageBeamOverlay(beamPage, 'canvas2d');
        const mageGpu = await selectPixi(beamPage);
        if (mageGpu.mode === 'webgl2')
          await inspectMageBeamOverlay(beamPage, 'webgl2');
        else
          assert(!requireWebGL, 'Mage beam overlay needs the required WebGL2 scene');
      } finally {
        await beamContext.close();
      }
    }
    for (const phone of [false, true]) {
      const context = await browser.newContext({
        viewport: phone ? {width: 393, height: 852} : {width: 1280, height: 800},
        isMobile: phone, hasTouch: phone, acceptDownloads: true,
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', (e) => errors.push(e.message));

      await page.goto(host + (phone ? 'phone.html' : 'index.html'));
      await page.waitForFunction(() => !!window.Prototype && !!window.Prototype.renderer);
      assert.equal(await page.evaluate(() => Prototype.experimentalGraphics.mode), 'canvas2d');
      await require('./helpers/language-browser.cjs').selectEnglish(page);
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      await page.evaluate(() => {window.__gpuTestCampaign = Prototype.game;});
      // Canvas remains functional under the new three-way optimization policy.
      assert.equal(await page.evaluate(() =>
        localStorage.getItem('azeroth-optimization-mode-v1')), 'auto');
      await page.locator('#menu-button').click();
      await page.getByRole('button', {name: 'Game and settings', exact: true}).click();
      await page.getByRole('button', {name: 'Screen and performance', exact: true}).click();
      const optimization = page.locator('select[aria-label="Optimization Mode"]');
      await optimization.selectOption('on');
      assert.equal(await page.evaluate(() => Prototype.renderer.metrics().optimizationMode), 'on');
      await optimization.selectOption('off');
      assert.equal(await page.evaluate(() => Prototype.renderer.metrics().optimizationMode), 'off');
      await optimization.selectOption('auto');
      assert.equal(await page.evaluate(() =>
        localStorage.getItem('azeroth-optimization-mode-v1')), 'auto');
      await page.evaluate(() => Prototype.closeMenu());
      assert.equal(await page.evaluate(() => Prototype.game === window.__gpuTestCampaign), true);
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
        await keepPixiTrial(page, phone, 'initial graphics trial');
        // The retained Pixi background must immediately reflect presentation
        // transitions without walking, zooming or a zone transition.
        await page.waitForFunction(() =>
          typeof Prototype.experimentalGraphics.backgroundOptimized === 'boolean',
          null, {timeout:15000});
        await page.locator('#menu-button').click();
        await page.getByRole('button', {name:'Game and settings', exact:true}).click();
        await page.getByRole('button', {name:'Screen and performance', exact:true}).click();
        // Settings intentionally pauses world drawing. A preference change must
        // be observed only after normal gameplay resumes, not while the menu is open.
        // Preserve the existing 15-second WebGL2 Keep/Revert trial unchanged.
        await page.locator('select[aria-label="Optimization Mode"]').selectOption('on');
        assert.equal(await page.evaluate(() =>
          localStorage.getItem('azeroth-optimization-mode-v1')), 'on');
        await page.evaluate(() => Prototype.closeMenu());
        await page.waitForFunction(() =>
          Prototype.experimentalGraphics.backgroundOptimized === true,
          null, {timeout:15000});
        assert.equal(await page.evaluate(() => Prototype.experimentalGraphics.mode), 'webgl2');

        await page.locator('#menu-button').click();
        await page.getByRole('button', {name:'Game and settings', exact:true}).click();
        await page.getByRole('button', {name:'Screen and performance', exact:true}).click();
        await page.locator('select[aria-label="Optimization Mode"]').selectOption('off');
        assert.equal(await page.evaluate(() =>
          localStorage.getItem('azeroth-optimization-mode-v1')), 'off');
        await page.evaluate(() => Prototype.closeMenu());
        await page.waitForFunction(() =>
          Prototype.experimentalGraphics.backgroundOptimized === false,
          null, {timeout:15000});

        await page.locator('#menu-button').click();
        await page.getByRole('button', {name:'Game and settings', exact:true}).click();
        await page.getByRole('button', {name:'Screen and performance', exact:true}).click();
        await page.locator('select[aria-label="Optimization Mode"]').selectOption('auto');
        assert.equal(await page.evaluate(() =>
          localStorage.getItem('azeroth-optimization-mode-v1')), 'auto');
        await page.evaluate(() => Prototype.closeMenu());
        assert.equal(await page.evaluate(() => localStorage.getItem('azeroth-renderer-choice-v1')),
          'webgl2');
        // Auto may legitimately change the active optimization tier under a
        // loaded headless runner, resetting the bounded timing buffer.
        // Profile in a fixed user-selectable tier, after testing Auto itself.
        await page.locator('#menu-button').click();
        await page.getByRole('button', {name:'Game and settings', exact:true}).click();
        await page.getByRole('button', {name:'Screen and performance', exact:true}).click();
        await page.locator('select[aria-label="Optimization Mode"]').selectOption('on');
        await page.evaluate(() => Prototype.closeMenu());
        await page.waitForFunction(() =>
          Prototype.experimentalGraphics.backgroundOptimized === true &&
          Prototype.experimentalGraphics.mode === 'webgl2', null, {timeout:15000});
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
        // Real software WebGL may legitimately lose its context under the
        // heavier live scene. The safe Canvas fallback is the protection to
        // verify, not an unconditional promise of GPU availability.
        assert(lightAudit.length >= 3,
          'Inspect a representative daylight sequence before any fallback');
        const firstCanvas = lightAudit.findIndex(x => x.mode !== 'webgl2');
        if (firstCanvas >= 0) {
          // ANGLE may dispatch webglcontextlost one task after an earlier
          // draw exception. Require the final typed cause, not just Canvas.
          await page.waitForFunction(() =>
            Prototype.experimentalGraphics.lastFailure?.type === 'context-loss',
            null, {timeout:3000});
          assert(lightAudit.slice(0, firstCanvas).every(x => x.mode === 'webgl2'),
            'The GPU scene must remain coherent until the actual context loss');
          assert.equal(lightAudit[firstCanvas].mode, 'canvas2d');
          assert.match(lightAudit[firstCanvas].error || '', /WebGL context lost/,
            'Only a typed context loss permits early Canvas fallback');
          const fallback = await page.evaluate(() => ({
            graphics: Prototype.experimentalGraphics,
            canvasVisible: getComputedStyle(document.getElementById('world')).display !== 'none',
            sameCampaign: Prototype.game === window.__gpuTestCampaign,
          }));
          assert.equal(fallback.graphics.lastFailure?.type, 'context-loss',
            'Context loss must retain the precise failure diagnosis');
          assert(fallback.canvasVisible && fallback.sameCampaign,
            'The fallback must keep the original live campaign and Canvas visible');
        } else {
          assert.equal(lightAudit.length, 7,
            'An active WebGL scene must complete all lighting transitions');
        }
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
          after = await keepPixiTrial(page, phone, 'post-restart graphics trial');
        }
        // A confirmed phone session must handle an ordinary viewport change,
        // including one that iOS can deliver on app background/foreground.
        // The 15-second *unconfirmed* trial remains separately guarded.
        if (after.mode === 'webgl2') {
          if (phone) {
            await page.setViewportSize({width: 375, height: 800});
            await page.waitForFunction(() => {
              const gpu = document.getElementById('world-pixi-experimental');
              const canvas = document.getElementById('world');
              return Prototype.experimentalGraphics.mode === 'webgl2' &&
                Prototype.experimentalGraphics.phase === 'confirmed' &&
                gpu && Math.abs(gpu.width / gpu.getBoundingClientRect().width -
                  canvas.width / canvas.getBoundingClientRect().width) < .02;
            });
            assert.equal(await page.evaluate(() =>
              localStorage.getItem('azeroth-renderer-choice-v1')), 'webgl2',
            'A confirmed viewport resize must not discard the saved graphics choice');
          }
          // A genuine WebGL context loss must still return to the reliable
          // independent Canvas scene and clear the saved GPU preference.
          await page.evaluate(() => {
            const node = document.getElementById('world-pixi-experimental');
            if (!node) throw Error('Confirmed WebGL canvas missing');
            node.dispatchEvent(new Event('webglcontextlost', {cancelable: true}));
          });
          await page.waitForFunction(() => Prototype.experimentalGraphics.mode === 'canvas2d');
          const failure = await page.evaluate(() => Prototype.experimentalGraphics);
          assert.equal(failure.lastFallbackReason, 'webgl-context-or-render-failure',
            'The original fallback field must remain compatible');
          assert.equal(failure.lastFailure?.type, 'context-loss');
          assert(failure.lastFailure?.stage && failure.lastFailure?.timestampMs,
            'The precise error cause and timestamp must survive Canvas fallback');
          assert(failure.lastFailure?.resources?.loadedTextures > 0,
            'Pre-teardown texture counts must be retained');
          assert.equal(await page.evaluate(() =>
            localStorage.getItem('azeroth-renderer-choice-v1')), 'canvas2d',
          'A genuine graphics failure must restore Canvas and clear the device preference');
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

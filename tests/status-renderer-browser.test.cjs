'use strict';
// Audit-only: deterministic condition status and crowd pixels in real game renderer modes.
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
  try {
    // A complete current-region atlas can legitimately take much longer than
    // the old fringe-only Pixi startup, especially with software WebGL2.
    // This is a *test observation limit*, never a game loading deadline.
    await page.waitForFunction(() => {
      const r=Prototype.experimentalGraphics;
      return r.phase==='trial' ||
        (r.phase==='canvas' && !!(r.lastError || r.lastFallbackReason));
    }, null, {timeout:240000});
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      renderer: Prototype.experimentalGraphics,
      titleLoading: document.querySelector('#title-loading')?.textContent,
      sceneLoading: document.querySelector('#scene-loading-text')?.textContent,
      gpuPreparation: document.querySelector('#gpu-renderer-trial')?.textContent,
      titleHidden: document.querySelector('#title-screen')?.hidden,
      gameStarted: Prototype.started,
    }));
    throw Error('Pixi regional preload did not complete: ' +
      JSON.stringify(diagnostic) + '; ' + String(error));
  }
  return page.evaluate(() => Prototype.experimentalGraphics);
}
// Drive the actual modern title-screen flow. Earlier graphics tests relied
// on automatic gameplay startup and could silently skip preloading entirely.
async function enterPlayableGame(page) {
  await page.waitForFunction(() => !!window.Prototype?.renderer);
  await require('./helpers/language-browser.cjs').selectEnglish(page);
  const title = page.locator('#title-screen');
  if (await title.evaluate((el) => !el.hidden)) {
    if (!(await page.locator('#title-continue').isDisabled())) {
      await page.locator('#title-continue').click();
    } else {
      await page.locator('#title-new').click();
      await page.getByRole('button', {name:'New Normal game', exact:true}).click();
      await page.getByRole('button', {name:/^English(?: ✓)?$/}).click();
      await page.getByRole('button',
        {name:'Standard death and refuge recovery', exact:true}).click();
      await page.getByRole('button', {name:/Paladin/}).first().click();
    }
  }
  await page.waitForFunction(() =>
    !!window.Prototype?.started && document.querySelector('#title-screen')?.hidden &&
    document.querySelector('#scene-loading')?.hidden !== false,
    null, { timeout: 180000 });
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
// Audit-only real renderer-path status test. Both paths use the real world
// canvas: opaque full Canvas versus Pixi's transparent Canvas cue overlay.
// Capture the status-only raster from the real renderer callback, not the
// ordinary enemy sprites beneath it. This measures 24/25 priority and offscreen
// selection in BOTH full Canvas and the Pixi Canvas-overlay draw branches.
async function inspectStatusCrowd(page, expectedMode) {
  const result = await page.evaluate(() => {
    const g = Prototype.game, z = g.zone(), r = Prototype.renderer;
    const art = window.PrototypeHeroPresentation;
    const before = {
      enemies: z.enemies, target: g.s.heroTarget,
      manual: g.manualHeroTargetId, zone: g.manualHeroTargetZone,
      order: g.hero.order, time: g.s.time,
    };
    const original = art.statuses;
    let raster = null;
    function diff(a, b) {
      if (a.length !== b.length) return Infinity;
      let count = 0;
      for (let i = 0; i < a.length; i += 4)
        if (a[i] !== b[i] || a[i + 1] !== b[i + 1] ||
            a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) count++;
      return count;
    }
    try {
      g.s.time = 120; g.s.heroTarget = null;
      g.manualHeroTargetId = null; g.manualHeroTargetZone = null;
      g.hero.order = null;
      const enemies = Array.from({ length: 25 }, (_, i) => {
        const e = g.makeEnemy({
          species: 'goblin', name: 'Crowd priority audit', level: 1,
          hp: 1000, damage: 0, gold: 0, xp: 0,
        }, {
          x: g.hero.x + ((i % 5) - 2) * 30,
          y: g.hero.y + (Math.floor(i / 5) - 2) * 30,
        });
        e.returning = 0; e.neutral = false; e.weakenUntil = 125;
        return e;
      });
      art.statuses = function (ctx, project, game, width, height) {
        const scratch = document.createElement('canvas');
        scratch.width = Math.ceil(width); scratch.height = Math.ceil(height);
        const sc = scratch.getContext('2d');
        original.call(this, sc, project, game, width, height);
        raster = new Uint8ClampedArray(sc.getImageData(
          0, 0, scratch.width, scratch.height).data);
        return original.call(this, ctx, project, game, width, height);
      };
      const paint = (members) => {
        z.enemies = members; raster = null; r.draw();
        if (!raster) throw Error('Real renderer skipped status callback');
        return raster;
      };
      const twentyFour = paint(enemies.slice(0, 24));
      const twentyFive = paint(enemies);
      enemies[24].type = 'boss';
      const boss = paint(enemies);
      delete enemies[24].type;
      g.s.heroTarget = enemies[24].id;
      const selected = paint(enemies);
      let visible = 0;
      for (let i = 3; i < twentyFour.length; i += 4)
        if (twentyFour[i]) visible++;
      return {
        mode: Prototype.experimentalGraphics.mode,
        visible,
        ordinaryDelta: diff(twentyFour, twentyFive),
        bossDelta: diff(twentyFour, boss),
        selectedDelta: diff(twentyFour, selected),
      };
    } finally {
      art.statuses = original;
      z.enemies = before.enemies;
      g.s.heroTarget = before.target;
      g.manualHeroTargetId = before.manual;
      g.manualHeroTargetZone = before.zone;
      g.hero.order = before.order;
      g.s.time = before.time;
      r.draw();
    }
  });
  assert.equal(result.mode, expectedMode);
  assert(result.visible > 0, '24 active statuses must produce real pixels');
  assert.equal(result.ordinaryDelta, 0, 'Ordinary 25th enemy may not exceed 24-slot budget');
  assert(result.bossDelta > 0, 'Late boss must displace an ordinary status in actual pixels');
  assert(result.selectedDelta > 0, 'Late selected target must displace in actual pixels');
  console.log('PASS real status crowd priority ' + expectedMode + ': ' +
    JSON.stringify(result));
}

async function inspectStatusPixels(page, expectedMode) {
  const result = await page.evaluate(() => {
    const g = Prototype.game, r = Prototype.renderer, z = g.zone();
    const surface = document.getElementById('world');
    const ctx = surface.getContext('2d');
    const before = {
      enemies: z.enemies, target: g.s.heroTarget, time: g.s.time,
      field: g.hero.silenceField, manual: g.manualHeroTargetId,
      manualZone: g.manualHeroTargetZone,
    };
    const e = g.makeEnemy({
      species: 'goblin', name: 'Status visibility verification',
      level: 1, hp: 100000, damage: 0, gold: 0, xp: 0,
    }, { x: g.hero.x + 43, y: g.hero.y + 23 });
    const writtenText = [], originalText = ctx.fillText;
    const statusArt = window.PrototypeHeroPresentation;
    const originalStatuses = statusArt.statuses;
    let latestStatusLayer = null;
    const observedMode = Prototype.experimentalGraphics.mode;
    const gpu = document.getElementById('world-pixi-experimental');
    const actualWebGL = !!gpu && getComputedStyle(gpu).display !== 'none';
    const keys = ['silence', 'taunt', 'slow', 'fracture', 'weaken'];
    function set(keysOn) {
      e.tauntUntil = 0; e.slow = 0; e.fractureUntil = 0; e.weakenUntil = 0;
      delete e.slowStacks;
      g.hero.silenceField = null;
      if (keysOn.includes('silence')) g.hero.silenceField = {
        x: e.x, y: e.y, radius: 50, zone: g.zoneId, until: g.s.time + 5,
      };
      if (keysOn.includes('taunt')) e.tauntUntil = g.s.time + 5;
      if (keysOn.includes('slow')) g.applySlow(e, 3);
      if (keysOn.includes('fracture')) g.fractureEnemy(e, 0.2, 5);
      if (keysOn.includes('weaken')) g.weakenEnemy(e, 1);
    }
    function paint(keysOn) {
      set(keysOn);
      writtenText.length = 0;
      latestStatusLayer = null;
      r.draw();
      if (!latestStatusLayer) throw Error('Actual renderer skipped its status paint');
      return {
        statusLayer: latestStatusLayer,
        pixels: new Uint8ClampedArray(ctx.getImageData(
          0, 0, surface.width, surface.height).data),
        labels: [...writtenText],
      };
    }
    function delta(a, b) {
      let count = 0;
      for (let i = 0; i < a.length; i += 4)
        if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) +
          Math.abs(a[i + 2] - b[i + 2]) + Math.abs(a[i + 3] - b[i + 3]) > 24)
          count++;
      return count;
    }
    try {
      z.enemies = [e]; e.neutral = false; e.returning = 0;
      g.s.time = 120;
      g.s.heroTarget = e.id;
      g.manualHeroTargetId = null;
      statusArt.statuses = function (target, project, game, width, height) {
        const scratch = document.createElement('canvas');
        scratch.width = Math.ceil(width); scratch.height = Math.ceil(height);
        const layerCtx = scratch.getContext('2d');
        originalStatuses.call(this, layerCtx, project, game, width, height);
        latestStatusLayer = new Uint8ClampedArray(layerCtx.getImageData(
          0, 0, scratch.width, scratch.height).data);
        return originalStatuses.call(this, target, project, game, width, height);
      };
      ctx.fillText = function (message, ...args) {
        if (/^\+\d+$/.test(String(message))) writtenText.push(String(message));
        return originalText.call(this, message, ...args);
      };
      const empty = paint([]);
      const unique = keys.map(key => ({
        key, changed: delta(empty.pixels, paint([key]).pixels),
      }));
      const three = paint(keys.slice(0, 3));
      const four = paint(keys.slice(0, 4));
      const five = paint(keys);
      const repeatFive = paint(keys);
      return {
        mode: observedMode, webglVisible: actualWebGL,
        unique, threeLabels: three.labels, fourLabels: four.labels,
        fiveLabels: five.labels,
        threeToFourPixels: delta(three.pixels, four.pixels),
        fourToFivePixels: delta(four.pixels, five.pixels),
        repeatFivePixels: delta(five.statusLayer, repeatFive.statusLayer),
        screen: r.screen(e), width: surface.width, height: surface.height,
      };
    } finally {
      statusArt.statuses = originalStatuses;
      ctx.fillText = originalText;
      z.enemies = before.enemies;
      g.s.heroTarget = before.target;
      g.hero.silenceField = before.field;
      g.s.time = before.time;
      g.manualHeroTargetId = before.manual;
      g.manualHeroTargetZone = before.manualZone;
      r.draw();
    }
  });
  assert.equal(result.mode, expectedMode, 'Audit must use the selected real renderer');
  if (expectedMode === 'webgl2')
    assert(result.webglVisible, 'Pixi GPU surface must coexist with real Canvas status overlay');
  assert(result.unique.every(x => x.changed > 0),
    'Every isolated status must alter real ' + expectedMode + ' pixels: ' +
      JSON.stringify(result.unique));
  assert.deepEqual(result.threeLabels, []);
  assert.deepEqual(result.fourLabels, ['+2']);
  assert.deepEqual(result.fiveLabels, ['+3']);
  assert(result.threeToFourPixels > 0 && result.fourToFivePixels > 0,
    'Both overflow transitions must change actual output pixels: ' + JSON.stringify(result));
  assert.equal(result.repeatFivePixels, 0, 'Fixed status state must paint identical pixels');
  console.log('PASS real status/overflow pixels ' + expectedMode + ': ' +
    JSON.stringify({unique:result.unique, four:result.threeToFourPixels,
      five:result.fourToFivePixels}));
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
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const binary = engine === 'chromium' ? installedChromium() : null;
    browser = await playwright[engine].launch(engine === 'chromium'
      ? { ...(binary ? { executablePath: binary } : {}),
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
            '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }
      : {});
    const host = process.env.PLAYTEST_URL
      ? process.env.PLAYTEST_URL.replace(/\/?$/, '/')
      : 'http://127.0.0.1:' + server.address().port + '/';
    for (const phone of [false, true]) {
      const context = await browser.newContext({
        viewport: phone ? { width: 393, height: 852 } : { width: 1280, height: 800 },
        isMobile: phone, hasTouch: phone,
      });
      try {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(host + (phone ? 'phone.html' : 'index.html'));
        await page.waitForFunction(() => !!window.Prototype?.renderer);
        await enterPlayableGame(page);
        await page.waitForFunction(() => document.querySelector('#modal').hidden);
        assert.equal(await page.evaluate(() => Prototype.experimentalGraphics.mode), 'canvas2d');
        await inspectStatusPixels(page, 'canvas2d');
        await inspectStatusCrowd(page, 'canvas2d');
        const selection = await selectPixi(page);
        if (selection.mode !== 'webgl2') {
          assert(!requireWebGL, 'WebGL2 unavailable: ' + JSON.stringify(selection));
        } else {
          await keepPixiTrial(page, phone, 'status-renderer acceptance');
          await inspectStatusPixels(page, 'webgl2');
          await inspectStatusCrowd(page, 'webgl2');
        }
        assert.deepEqual(errors, [], 'Status renderer browser may not crash');
        console.log('PASS status renderer acceptance ' + engine + '/' +
          (phone ? 'phone-emulated' : 'desktop') + '/Canvas+PixiJS');
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser?.close();
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });

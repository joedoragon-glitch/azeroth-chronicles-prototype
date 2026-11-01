// Focused desktop/phone default-renderer migration, isolated from the
// longer manual Pixi/Canvas fidelity and recovery browser journey.
// Both tests are intentionally separate so the standard six-minute per-test
// ceiling remains strict; no graphics-preparation deadline is extended.
'use strict';
// Focused real-browser acceptance for the PixiJS-default rollout.
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
// The dedicated CI workflow runs desktop and phone independently. A direct
// local invocation still exercises both, with the same real title/UI actions.
const deviceCases = process.env.PIXI_BROWSER_DEVICE === 'desktop' ? [false]
  : process.env.PIXI_BROWSER_DEVICE === 'phone' ? [true] : [false, true];
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

    // Exercise both form factors through current title/new/continue preparation.
    // A previous Canvas choice is superseded only on the first migrated boot.
    for (const phone of deviceCases) {
      const migrationContext = await browser.newContext({
        viewport: phone ? {width:393,height:852} : {width:1280,height:800},
        isMobile: phone, hasTouch: phone,
      });
      try {
        await migrationContext.addInitScript(() => {
          if (!localStorage.getItem('azeroth-renderer-webgl-primary-v1'))
            localStorage.setItem('azeroth-renderer-choice-v1', 'canvas2d');
        });
        const migrationPage = await migrationContext.newPage();
        await migrationPage.goto(host + (phone ? 'phone.html' : 'index.html'));
        await migrationPage.waitForFunction(() => !!window.Prototype?.renderer);
        const migrated = await migrationPage.evaluate(() => ({
          marker: localStorage.getItem('azeroth-renderer-webgl-primary-v1'),
          choice: localStorage.getItem('azeroth-renderer-choice-v1'),
          phase: Prototype.experimentalGraphics.phase,
        }));
        assert.equal(migrated.marker, 'applied');
        assert.equal(migrated.choice, 'webgl2');
        assert.equal(migrated.phase, 'canvas',
          'Title screen must not start expensive GPU preparation automatically');
        await enterPlayableGame(migrationPage);
        const active = await migrationPage.evaluate(() => Prototype.experimentalGraphics);
        assert.equal(active.preferredRenderer, 'webgl2');
        if (active.mode === 'webgl2')
          assert.equal(active.phase, 'confirmed',
            'Default Pixi is confirmed without the manual trial countdown');
        else
          assert(active.mode === 'canvas2d' &&
            (active.lastError || active.lastFallbackReason || active.recoveryPaused),
            'Unusable GPU must fall back to Canvas with a diagnostic reason');
        if (!phone) {
          await migrationPage.locator('#menu-button').click();
          await migrationPage.getByRole('button',
            {name:'Game and settings', exact:true}).click();
          await migrationPage.getByRole('button',
            {name:'Screen and performance', exact:true}).click();
          await migrationPage.locator('select[aria-label="Graphics renderer"]')
            .selectOption('canvas2d');
          await migrationPage.reload();
          await migrationPage.waitForFunction(() => !!window.Prototype?.renderer);
          assert.equal(await migrationPage.evaluate(() =>
            localStorage.getItem('azeroth-renderer-choice-v1')), 'canvas2d');
          await enterPlayableGame(migrationPage);
          assert.equal(await migrationPage.evaluate(() =>
            Prototype.experimentalGraphics.mode), 'canvas2d');
          const manual = await selectPixi(migrationPage);
          if (manual.mode === 'webgl2') assert.equal(manual.phase,'trial');
        }
        console.log('PASS default Pixi migration, title, manual Canvas (' +
          (phone ? 'phone' : 'desktop') + ')');
      } finally {
        await migrationContext.close();
      }
    }
  } finally {
    await browser?.close();
    if (server.listening) await new Promise((resolve) => server.close(resolve));
  }
}
run().catch((error) => {console.error(error); process.exitCode = 1;});
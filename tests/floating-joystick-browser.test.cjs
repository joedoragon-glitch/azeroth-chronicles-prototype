// Focused Chromium touch acceptance for the optional phone floating joystick.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const name = decodeURIComponent((req.url || '/').split('?')[0].replace(/^\//, ''));
  const file = path.resolve(root, name || 'phone.html');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  const types = { '.html': 'text/html', '.js': 'application/javascript',
    '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
async function waitForPlay(page) {
  await page.goto('http://127.0.0.1:' + server.address().port + '/phone.html');
  await page.waitForFunction(() => !!window.Prototype?.game);
  await require('./helpers/language-browser.cjs').selectEnglish(page);
  await page.keyboard.press('f');
  await page.keyboard.press('f');
  await page.waitForFunction(() => document.querySelector('#modal').hidden);
}
(async () => {
  let browser;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch();
    for (const size of [{ width: 800, height: 375 }, { width: 375, height: 800 },
      { width: 844, height: 390, leftHand: true }]) {
      const page = await browser.newPage({ viewport: size, isMobile: true, hasTouch: true });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await waitForPlay(page);
      assert.equal(await page.evaluate(() => Prototype.input.preferences.joystickMode), 'fixed');
      await page.evaluate((leftHand) => {
        const game = Prototype.game;
        game.enter('vale');
        game.zone().enemies = [];
        game.zone().npcs = [];
        game.zone().nodes = [];
        game.zone().buildings = [];
        game.s.party = [];
        Object.assign(game.hero, { x: 750, y: 950, order: null, path: [] });
        if (leftHand) {
          Prototype.input.select('phoneLayout', 'left-hand');
          document.body.dataset.phoneLayout = 'left-hand';
        }
        Prototype.input.select('joystickMode', 'floating');
        document.body.dataset.joystickMode = 'floating';
        Prototype.updateHUD();
      }, !!size.leftHand);
      const start = { x: 60, y: size.height - 48 };
      const before = await page.evaluate(() => ({ x: Prototype.game.hero.x, y: Prototype.game.hero.y }));
      const session = await page.context().newCDPSession(page);
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart', touchPoints: [{ x: start.x, y: start.y, id: 11 }],
      });
      await page.waitForFunction(() => document.body.classList.contains('floating-joystick-active'));
      assert.equal(await page.locator('#joystick').evaluate((e) => getComputedStyle(e).pointerEvents), 'none');
      assert.equal(await page.evaluate(() => Prototype.game.hero.order), null, 'stationary touch does not issue route');
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove', touchPoints: [{ x: start.x + 55, y: start.y - 8, id: 11 }],
      });
      await page.waitForFunction((p) => {
        const hero = Prototype.game.hero;
        return Math.hypot(hero.x - p.x, hero.y - p.y) > 1;
      }, before, { timeout: 4000 });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForFunction(() => !document.body.classList.contains('floating-joystick-active'));
      assert.equal(await page.evaluate(() => Prototype.game.hero.order), null);
      await page.evaluate(() => { Prototype.game.hero.order = null; Prototype.game.hero.path = []; });
      await page.touchscreen.tap(start.x, start.y);
      assert.equal(await page.evaluate(() => Prototype.game.hero.order), null, 'tap in thumb zone does not navigate');
      assert.equal(await page.locator('#menu-button').isVisible(), true);
      await page.locator('#menu-button').tap();
      assert.equal(await page.locator('#joystick').evaluate((e) => getComputedStyle(e).opacity), '1',
        'menu restores fixed joystick');
      assert.equal(await page.locator('#joystick').getAttribute('aria-hidden'), 'false');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#joystick').getAttribute('aria-hidden'), 'true');
      assert.deepEqual(errors, []);
      await page.close();
      console.log('PASS floating touch input/menu override ' + size.width + 'x' + size.height);
    }
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });

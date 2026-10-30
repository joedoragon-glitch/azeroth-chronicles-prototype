'use strict';
// Focused real-PWA update: current shell -> changed worker/cache, notice,
// user acceptance, save-before-reload and offline reopening on both entries.
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..'),
  version = require('../package.json').version;
let generation = 'a',
  failUpdateCheck = false;
const cacheName = () => 'azeroth-app-v' + version + '-notice-' + generation;
const server = http.createServer((req, res) => {
  const relative = new URL(req.url, 'http://localhost').pathname,
    file = path.resolve(root, '.' + (relative === '/' ? '/index.html' : relative));
  if (relative === '/sw.js' && failUpdateCheck) {
    res.writeHead(503);
    return res.end('offline update fixture');
  }
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type':
      {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.webp': 'image/webp',
        '.png': 'image/png',
        '.mp3': 'audio/mpeg',
        '.ogg': 'audio/ogg',
        '.webmanifest': 'application/manifest+json',
      }[path.extname(file)] || 'application/octet-stream',
  });
  if (relative === '/sw.js')
    return res.end(
      fs
        .readFileSync(file, 'utf8')
        .replace('"azeroth-app-v' + version + '"', JSON.stringify(cacheName())),
    );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_EXECUTABLE,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const url = 'http://127.0.0.1:' + server.address().port;
    for (const phone of [false, true]) {
      generation = 'a';
      failUpdateCheck = false;
      const context = await browser.newContext({
          viewport: phone ? { width: 375, height: 800 } : { width: 1280, height: 800 },
          isMobile: phone,
          hasTouch: phone,
        }),
        page = await context.newPage(),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      if (phone)
        await page.addInitScript(() => localStorage.setItem('azeroth-display-language-v1', 'es'));
      await page.goto(url + (phone ? '/phone.html' : '/index.html'));
      await page.waitForFunction(() => window.Prototype && !!navigator.serviceWorker.controller);
      if (!phone) await require('./helpers/language-browser.cjs').selectEnglish(page);
      else await page.getByRole('button', { name: /^Español/ }).click();
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.waitForFunction(() => document.getElementById('modal').hidden);
      await page.evaluate(() => {
        Prototype.game.hero.gold = 42424;
        Prototype.game.tick = () => {};
      });
      assert(await page.locator('#update-button').isHidden(), 'first install has no update notice');
      generation = 'b';
      await page.evaluate(async () => {
        const r = await navigator.serviceWorker.getRegistration();
        await r.update();
      });
      await page.waitForFunction(
        async () => !!(await navigator.serviceWorker.getRegistration()).waiting,
      );
      await page.waitForFunction(() => !document.getElementById('update-button').hidden);
      const ready = await page.evaluate(async () => ({
        gold: Prototype.game.hero.gold,
        waiting: !!(await navigator.serviceWorker.getRegistration()).waiting,
        language: document.documentElement.lang,
      }));
      assert.equal(ready.gold, 42424);
      assert(ready.waiting, 'new worker waits for player acceptance');
      assert.equal(
        await page.locator('#update-button').textContent(),
        phone ? 'Actualización disponible' : 'Update available',
      );
      const layout = await page.evaluate(() => {
        const b = document.getElementById('update-button').getBoundingClientRect(),
          h = document.getElementById('hud').getBoundingClientRect();
        return {
          inside: b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight,
          separate:
            b.left >= h.right || b.right <= h.left || b.top >= h.bottom || b.bottom <= h.top,
          height: b.height,
        };
      });
      assert(layout.inside && layout.separate && layout.height >= 40, 'notice fits beside HUD');
      if (process.env.UPDATE_NOTICE_EVIDENCE_DIR) {
        fs.mkdirSync(process.env.UPDATE_NOTICE_EVIDENCE_DIR, { recursive: true });
        await require('sharp')(await page.screenshot())
          .webp({ quality: 88 })
          .toFile(
            path.join(
              process.env.UPDATE_NOTICE_EVIDENCE_DIR,
              phone ? 'update-phone.webp' : 'update-desktop.webp',
            ),
          );
      }
      await page.locator('#menu-button').click();
      const label = phone ? 'Instalar actualización' : 'Install available game update';
      assert(
        await page
          .locator('#modal-actions')
          .getByRole('button', { name: label, exact: true })
          .isVisible(),
        'update is first-level menu action',
      );
      await page
        .locator('#modal-actions')
        .getByRole('button', { name: phone ? 'Juego y ajustes' : 'Game and settings', exact: true })
        .click();
      assert(
        await page
          .locator('#modal-actions')
          .getByRole('button', { name: label, exact: true })
          .isVisible(),
        'settings retain direct update action',
      );
      await page.evaluate(() => Prototype.closeMenu());
      await page.evaluate(() => {
        const write = Storage.prototype.setItem;
        window.failUpdateSave = true;
        Storage.prototype.setItem = function (key, value) {
          if (window.failUpdateSave && key.startsWith('azeroth-v4-'))
            throw Error('storage unavailable');
          return write.call(this, key, value);
        };
      });
      await page.locator('#update-button').click();
      assert(
        await page.evaluate(
          async () => !!(await navigator.serviceWorker.getRegistration()).waiting,
        ),
        'failed save prevents activation',
      );
      assert(!(await page.evaluate(() => Prototype.paused)), 'failed install leaves play unpaused');
      await page.evaluate(() => {
        window.failUpdateSave = false;
      });
      // Ready installation must not need a successful network check.
      await context.setOffline(true);
      const loaded = page.waitForEvent('domcontentloaded');
      await page.locator('#update-button').click();
      await loaded;
      await page.waitForFunction(() =>
        document.getElementById('startup-update').hidden &&
        !document.getElementById('title-screen').hidden &&
        window.Prototype?.game.hero.gold === 42424);
      assert(await page.locator('#update-button').isHidden());
      await page.locator('#title-continue').click();
      await page.waitForFunction(() => window.Prototype?.started);
      const cachesAfter = await page.evaluate(() => caches.keys());
      assert(cachesAfter.includes(cacheName()));
      assert(!cachesAfter.includes('azeroth-app-v' + version + '-notice-a'));
      await page.reload();
      await page.waitForFunction(() =>
        document.getElementById('startup-update').hidden &&
        !document.getElementById('title-screen').hidden &&
        window.Prototype?.game.hero.gold === 42424);
      const offlineNotice = await page.locator('#startup-update-notice').textContent();
      assert.match(offlineNotice, phone
        ? /Sin conexión.*No se pudieron buscar actualizaciones/i
        : /offline.*could not check for updates/i);
      await page.locator('#title-continue').click();
      await page.waitForFunction(() => window.Prototype?.started);
      failUpdateCheck = true;
      await page.locator('#menu-button').click();
      await page
        .locator('#modal-actions')
        .getByRole('button', { name: phone ? 'Juego y ajustes' : 'Game and settings', exact: true })
        .click();
      await page
        .locator('#modal-actions')
        .getByRole('button', {
          name: phone ? 'Buscar actualización' : 'Check for game update',
          exact: true,
        })
        .click();
      await page
        .waitForFunction(
          () =>
            document
              .getElementById('status')
              .textContent.includes(
                document.documentElement.lang === 'es-419'
                  ? 'No se pudo actualizar'
                  : 'Update unavailable',
              ),
          null,
          { timeout: 5000 },
        )
        .catch(async () => {
          throw Error(
            'Failed-update status: ' +
              (await page.evaluate(() =>
                JSON.stringify({
                  text: document.getElementById('status').textContent,
                  paused: Prototype.paused,
                  ready: !document.getElementById('update-button').hidden,
                  language: document.documentElement.lang,
                }),
              )),
          );
        });
      await page.evaluate(() => Prototype.closeMenu());
      assert(
        !(await page.evaluate(() => Prototype.paused)),
        'failed network check does not freeze play',
      );
      assert.deepEqual(errors, []);
      console.log(
        'PASS ready notice, localized layout/menu access, waiting activation, offline install, save retention and offline reload: ' +
          (phone ? 'phone' : 'desktop'),
      );
      await context.close();
    }
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

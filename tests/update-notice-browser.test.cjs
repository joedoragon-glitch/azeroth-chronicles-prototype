'use strict';
// Focused real-PWA update: current shell -> changed worker/cache, notice,
// user acceptance, save-before-reload and offline reopening on both entries.
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  crypto = require('node:crypto'),
  { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..'),
  version = require('../package.json').version;
let generation = 'a',
  failUpdateCheck = false;
const cacheName = () => 'azeroth-app-v' + version + '-notice-' + generation;
const requestLog = [];
const releaseFile = (relative) => {
  const file = path.resolve(root, '.' + (relative === '/' ? '/index.html' : relative));
  const source = fs.readFileSync(file, 'utf8');
  if (generation !== 'c') return source;
  if (['/', '/index.html', '/phone.html'].includes(relative))
    return source.replace('<nav aria-label="Main menu">',
      '<nav aria-label="Main menu" data-menu-revision="c">');
  if (relative === '/src/prototype/app.js')
    return source + "\ndocument.body.dataset.menuRevision = 'c';\n";
  return source;
};
const gitBlobHash = (source) => {
  const bytes = Buffer.from(source);
  return crypto.createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
};
const releaseWorker = (file) => {
  let worker = fs.readFileSync(file, 'utf8')
    .replace('"azeroth-app-v' + version + '"', JSON.stringify(cacheName()));
  if (generation !== 'c') return worker;
  // Model real published bytes: changed HTML and JS also change the worker's
  // build-generated content fingerprints. Otherwise the fixture is not a release.
  const prefix = 'const APP_FINGERPRINTS = ';
  const before = worker.split(prefix)[1].split(';')[0],
    hashes = JSON.parse(before);
  for (const [asset, relative] of [
    ['./', '/index.html'], ['./index.html', '/index.html'],
    ['./phone.html', '/phone.html'],
    ['./src/prototype/app.js', '/src/prototype/app.js'],
  ]) hashes[asset] = gitBlobHash(releaseFile(relative));
  worker = worker.replace(prefix + before + ';', prefix + JSON.stringify(hashes) + ';');
  return worker;
};
const server = http.createServer((req, res) => {
  const relative = new URL(req.url, 'http://localhost').pathname,
    file = path.resolve(root, '.' + (relative === '/' ? '/index.html' : relative));
  requestLog.push({ generation, relative });
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
  if (relative === '/sw.js') return res.end(releaseWorker(file));
  if (generation === 'c' &&
      ['/', '/index.html', '/phone.html', '/src/prototype/app.js'].includes(relative))
    return res.end(releaseFile(relative));
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
      // The current player flow begins on the title screen, not directly in-game.
      // Create a real saved run before testing manual updates during gameplay.
      await page.waitForFunction(() =>
        document.getElementById('startup-update').hidden &&
        !document.getElementById('title-screen').hidden &&
        !document.getElementById('title-new').disabled);
      await page.locator('#title-new').click();
      await page.locator('#modal-actions').getByRole('button', { name: /Normal/i }).first().click();
      await page.locator('#modal-actions').getByRole('button', {
        name: phone ? /^Español/ : /^English/,
      }).click();
      await page.locator('#modal-actions').getByRole('button').first().click();
      await page.locator('#modal-actions').getByRole('button').first().click();
      await page.waitForFunction(() => window.Prototype?.started, null, { timeout: 90000 });
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
      const offlineState = await page.evaluate(async () => ({
        notice: document.getElementById('startup-update-notice').textContent,
        noticeHidden: document.getElementById('startup-update-notice').hidden,
        online: navigator.onLine,
        controller: !!navigator.serviceWorker.controller,
        waiting: !!(await navigator.serviceWorker.getRegistration()).waiting,
        titleVisible: !document.getElementById('title-screen').hidden,
        lang: document.documentElement.lang,
      }));
      assert.match(offlineState.notice, phone
        ? /Sin conexión.*No se pudieron buscar actualizaciones/i
        : /offline.*could not check for updates/i,
      'offline status after reloading a cached release: ' + JSON.stringify(offlineState));
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

      // An ordinary next launch discovers another release automatically.
      // Changed HTML and JS must both be present before unlocking its menu.
      failUpdateCheck = false;
      await context.setOffline(false);
      generation = 'c';
      requestLog.length = 0;
      await page.reload();
      await page.waitForFunction(async () => {
        const name = 'azeroth-app-v' + window.PrototypeBuild.version + '-notice-c';
        if (!(await caches.keys()).includes(name)) return false;
        const cache = await caches.open(name);
        const files = await Promise.all(['./index.html', './phone.html',
          './src/prototype/app.js'].map((file) => cache.match(file)));
        // Cache names appear at the *beginning* of installation; wait for
        // the required bytes, not merely a newly created empty cache.
        const cacheReady = files.every(Boolean);
        return cacheReady &&
          document.getElementById('startup-update').hidden &&
          !document.getElementById('title-screen').hidden &&
          document.querySelector('#title-screen nav')?.dataset.menuRevision === 'c' &&
          document.body.dataset.menuRevision === 'c';
      }, null, { timeout: 90000 });
      assert.equal(await page.evaluate(() => window.Prototype?.game.hero.gold), 42424);
      const releaseRequests = requestLog.filter((entry) => entry.generation === 'c')
        .map((entry) => entry.relative);
      const releaseCache = await page.evaluate(async () => {
        const cache = await caches.open('azeroth-app-v' + PrototypeBuild.version + '-notice-c');
        const inspect = async (file, marker) => {
          const response = await cache.match('./' + file);
          return response ? (await response.text()).includes(marker) : null;
        };
        return {
          index: await inspect('index.html', 'data-menu-revision="c"'),
          phone: await inspect('phone.html', 'data-menu-revision="c"'),
          script: await inspect('src/prototype/app.js', "dataset.menuRevision = 'c'"),
        };
      });
      const workerStatus = await page.evaluate(async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        const cache = await caches.open('azeroth-app-v' + PrototypeBuild.version + '-notice-c');
        return {
          controller: navigator.serviceWorker.controller?.state,
          active: reg.active?.state,
          installing: reg.installing?.state,
          waiting: reg.waiting?.state,
          cacheEntries: (await cache.keys()).length,
        };
      });
      console.log('Release c service worker: ' + JSON.stringify(workerStatus));
      console.log('Release c transfers and offline cache: ' +
        JSON.stringify({ phone, releaseRequests, releaseCache }));
      for (const changed of ['/index.html', '/phone.html', '/src/prototype/app.js'])
        assert(releaseRequests.includes(changed), 'changed release bytes must download: ' + changed);
      for (const unchanged of ['/src/prototype/renderer.js', '/assets/audio/music/title.mp3'])
        assert(!releaseRequests.includes(unchanged),
          'unchanged browser-cached assets must not download: ' + unchanged);
      assert(await page.locator('#update-button').isHidden(),
        'automatic preflight never asks for an update tap');
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

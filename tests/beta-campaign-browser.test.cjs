'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const zlib = require('node:zlib');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const engine = process.env.BROWSER_ENGINE || 'chromium';
const results = path.join(root, 'test-results', 'beta-' + engine);
fs.mkdirSync(results, { recursive: true });
const fixtures = process.env.BETA_FIXTURE_DIR || path.join(root, 'test-results', 'beta-historical');
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.webmanifest': 'application/manifest+json',
};
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Content-Length', fs.statSync(file).size);
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await pw[engine].launch(
    engine === 'webkit'
      ? {}
      : {
          executablePath: process.env.CHROMIUM_EXECUTABLE,
          args: ['--no-sandbox', '--disable-dev-shm-usage'],
        },
  );
  try {
    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 375, height: 800 },
      { width: 800, height: 375 },
    ])
      for (const cls of ['paladin', 'mage', 'ranger']) {
        const phone = viewport.width !== 1280;
        const context = await browser.newContext({ viewport, hasTouch: phone, isMobile: phone });
        const page = await context.newPage(),
          errors = [],
          diagnostics = [];
        let phase = 'fresh';
        page.on('pageerror', (e) => {
          errors.push(e.message);
          diagnostics.push({ at: Date.now(), phase, event: 'pageerror', message: e.message });
        });
        page.on('requestfailed', (request) =>
          diagnostics.push({
            at: Date.now(),
            phase,
            event: 'requestfailed',
            url: request.url(),
            failure: request.failure(),
          }),
        );
        const finishAssetWork = async (waitForAudioPause = false) => {
          // After keyboard pause, the existing frame owner observes it on its
          // next frame. Menus alone intentionally leave audio running.
          if (waitForAudioPause)
            await page.waitForFunction(
              () => window.Prototype?.paused && window.Prototype.audio.status().paused,
            );
          await page.waitForLoadState('networkidle');
          const observed = await page.evaluate(() => Prototype.audio.recordingStatus().assets);
          diagnostics.push({ at: Date.now(), phase, event: 'networkidle', assets: observed });
          if (observed?.pending)
            console.log(
              `WAIT ${engine} ${cls} ${viewport.width} ${phase}: ${observed.pending} queued/active audio loads after networkidle`,
            );
          // The loader serializes queued fetches behind decoding. Network idle
          // alone can precede its next fetch; paused playback does not empty it.
          await page.waitForFunction(() => {
            const assets = window.Prototype?.audio?.recordingStatus().assets;
            return !assets || assets.pending === 0;
          });
          await page.waitForLoadState('networkidle');
          diagnostics.push({
            at: Date.now(),
            phase,
            event: 'quiescent',
            assets: await page.evaluate(() => Prototype.audio.recordingStatus().assets),
            audioPaused: await page.evaluate(() => Prototype.audio.status().paused),
          });
        };
        const url =
          'http://127.0.0.1:' + server.address().port + '/' + (phone ? 'phone.html' : 'index.html');
        try {
          await page.goto(url);
          await page
            .getByRole('button', { name: 'Standard death and refuge recovery', exact: true })
            .click();
          await page.getByRole('button', { name: new RegExp(cls + ' ') }).click();
          await page.waitForFunction(() => document.querySelector('#modal').hidden);
          assert.equal(await page.evaluate(() => Prototype.game.hero.class), cls);
          assert.deepEqual(
            await page.evaluate(() => Prototype.game.hero.skills),
            [1, 0, 0, 0, 0, 0, 0, 0],
          );
          assert.equal(await page.evaluate(() => Prototype.platform.cameraZoom), 1.5);
          await page.locator('#menu-button').click();
          await page.getByRole('button', { name: 'Inventory and support', exact: true }).click();
          assert(
            (await page.locator('#modal-description').textContent()).includes(
              'Preparation Tonics: 0 stored',
            ),
          );
          await page.screenshot({
            path: path.join(results, cls + '-' + viewport.width + '-inventory.png'),
          });

          for (const mode of ['normal', 'nightmare']) {
            const fixture = fs.readFileSync(
              path.join(fixtures, mode + '-' + cls + '-v08118.json.gz'),
            );
            const buffer = zlib.gunzipSync(fixture),
              before = JSON.parse(buffer);
            // Let real audio/asset fetches finish before replacing the campaign.
            // WebKit can surface a canceled streaming body as a page error on unload.
            phase = 'before-import-' + mode;
            await finishAssetWork();
            phase = 'import-' + mode;
            await page
              .locator('#import-file')
              .setInputFiles({ name: 'historical-v4.json', mimeType: 'application/json', buffer });
            await page.waitForFunction(
              ({ mode, cls }) =>
                Prototype.game.s.mode === mode &&
                Prototype.game.hero.class === cls &&
                Prototype.game.zoneId === 'abyss',
              { mode, cls },
            );
            // Freeze a successfully imported checkpoint; mechanics are sampled via real owners.
            if (!(await page.evaluate(() => Prototype.paused))) await page.keyboard.press('p');
            const read = () =>
              page.evaluate(() => ({
                mode: Prototype.game.s.mode,
                cls: Prototype.game.hero.class,
                gold: Prototype.game.hero.gold,
                stock: Prototype.game.preparationTonicStock(),
                tonic: Prototype.game.hero.tonic,
                zone: Prototype.game.zoneId,
                weapon: Prototype.game.hero.weapon,
                armor: Prototype.game.hero.armorTier,
                rescued: Prototype.game.s.rescued,
                fallen: Prototype.game.s.party.filter((u) => u.hp <= 0).length,
              }));
            const imported = await read();
            assert.equal(imported.gold, before.hero.gold);
            assert.equal(imported.stock, 2);
            assert(imported.tonic);
            assert.equal(imported.weapon, 4);
            assert.equal(imported.armor, 4);
            assert(imported.fallen >= 1);
            // The shell exposes save through its actual persistence adapter.
            assert(await page.evaluate(() => Prototype.save()));
            phase = 'before-reload-' + mode;
            await finishAssetWork(true);
            phase = 'reload-' + mode;
            await page.reload();
            await page.waitForFunction(() => window.Prototype);
            if (!(await page.evaluate(() => Prototype.paused))) await page.keyboard.press('p');
            phase = 'after-reload-' + mode;
            await finishAssetWork(true);
            assert.deepEqual(await read(), imported);
            assert.deepEqual(errors, []);
          }
          fs.writeFileSync(
            path.join(results, 'trace-' + cls + '-' + viewport.width + '.json'),
            JSON.stringify({ engine, cls, viewport, errors, diagnostics }, null, 2) + '\n',
          );
          console.log(
            'PASS ' +
              engine +
              ' ' +
              cls +
              ' ' +
              viewport.width +
              'x' +
              viewport.height +
              ' real fresh UI, 150% camera, inventory, historical Normal/Nightmare file import, save and refresh',
          );
        } catch (e) {
          fs.writeFileSync(
            path.join(results, 'failure-' + cls + '-' + viewport.width + '.json'),
            JSON.stringify(
              {
                engine,
                cls,
                viewport,
                phase,
                errors,
                diagnostics,
                assets: await page
                  .evaluate(() => window.Prototype?.audio?.recordingStatus().assets)
                  .catch(() => null),
              },
              null,
              2,
            ) + '\n',
          );
          await page
            .screenshot({
              path: path.join(results, 'failure-' + cls + '-' + viewport.width + '.png'),
            })
            .catch(() => {});
          throw e;
        } finally {
          await context.close();
        }
      }
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});

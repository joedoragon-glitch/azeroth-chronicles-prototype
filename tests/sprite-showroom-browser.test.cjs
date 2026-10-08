'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const pipeline = require('../scripts/sprite-pipeline.cjs');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
(async () => {
  let server, browser;
  const temp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'azeroth-showroom-'));
  const checkout = path.join(temp, 'checkout');
  const preview = path.join(checkout, '_sprite-preview');
  try {
    fs.mkdirSync(checkout);
    for (const name of ['scripts', 'tools', 'src', 'assets', 'docs'])
      fs.cpSync(path.join(root, name), path.join(checkout, name), { recursive: true });
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(checkout, 'node_modules'), 'dir');
    fs.copyFileSync(path.join(root, 'package.json'), path.join(checkout, 'package.json'));
    fs.writeFileSync(
      path.join(checkout, 'source.png'),
      pipeline.reference(pipeline.contractFor('hero:paladin')),
    );
    const run = (...args) =>
      JSON.parse(
        require('node:child_process').execFileSync(
          process.execPath,
          ['scripts/sprite-pipeline.cjs', ...args],
          { cwd: checkout, encoding: 'utf8' },
        ),
      );
    const prepared = run('prepare', 'hero:paladin', 'source.png');
    run('showroom', path.join(prepared.directory, 'candidate.json'));
    server = http.createServer((request, response) => {
      const relative = new URL(request.url, 'http://localhost').pathname.slice(1) || 'index.html';
      const gameRoute = relative.startsWith('game/');
      if (relative === 'game/assets/sprites/manifest.json') {
        const manifest = JSON.parse(
          fs.readFileSync(path.join(root, 'assets/sprites/manifest.json')),
        );
        manifest.sprites = {
          'hero:paladin': {
            src: './assets/sprites/reference-fixture.png',
            ...prepared.record.runtime,
          },
        };
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(manifest));
        return;
      }
      if (relative === 'game/assets/sprites/reference-fixture.png') {
        response.writeHead(200, { 'Content-Type': 'image/png' });
        response.end(fs.readFileSync(path.join(prepared.directory, 'candidate.png')));
        return;
      }
      const base = gameRoute ? root : preview;
      const route = gameRoute ? relative.slice(5) || 'index.html' : relative;
      const file = path.resolve(base, route);
      if (
        !file.startsWith(base + path.sep) ||
        !fs.existsSync(file) ||
        !fs.statSync(file).isFile()
      ) {
        response.writeHead(404);
        response.end();
        return;
      }
      const types = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.webp': 'image/webp',
      };
      response.writeHead(200, {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      });
      response.end(fs.readFileSync(file));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const launch = { headless: true };
    if (process.env.CHROMIUM_EXECUTABLE) {
      launch.executablePath = process.env.CHROMIUM_EXECUTABLE;
      launch.args = ['--no-sandbox', '--disable-dev-shm-usage'];
    }
    browser = await pw.chromium.launch(launch);
    fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
    for (const [width, height] of require('../tools/sprites/specifications.json').policy
      .viewports) {
      const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 900 });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('http://127.0.0.1:' + server.address().port + '/');
      await page.waitForFunction(() => window.SpriteShowroom?.ready);
      assert.deepEqual(errors, []);
      assert.equal(await page.locator('#name').textContent(), 'Hero — Paladin');
      assert.equal(await page.locator('#viewport option').count(), 8);
      await page.locator('#viewport').selectOption({ label: width + ' × ' + height + ' · day' });
      await page.waitForFunction(() =>
        [...document.querySelectorAll('.scenes img')].every(
          (image) => image.complete && image.naturalWidth > 0,
        ),
      );
      assert.equal(
        await page.locator('#current-scene').evaluate((image) => image.naturalWidth),
        width,
      );
      assert.equal(
        await page.locator('#current-scene').evaluate((image) => image.naturalHeight),
        height,
      );
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        'comparison fits viewport',
      );
      const before = await page.locator('#overlay').evaluate((canvas) => canvas.toDataURL());
      await page.locator('#guides').uncheck();
      assert.notEqual(
        await page.locator('#overlay').evaluate((canvas) => canvas.toDataURL()),
        before,
        'guides are interactive',
      );
      await page.locator('#blend').fill('100');
      assert.match(await page.locator('#question').textContent(), /preserve the existing identity/);
      assert.equal(await page.locator('#error').isHidden(), true);
      await page.screenshot({
        path: path.join(root, 'test-results', 'sprite-showroom-' + width + 'x' + height + '.png'),
        fullPage: true,
      });
      await page.close();
      console.log(
        'PASS local development showroom, actual decoded candidate, controls and viewport ' +
          width +
          'x' +
          height,
      );
    }
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const gamePage = await context.newPage();
    const origin = 'http://127.0.0.1:' + server.address().port;
    await gamePage.goto(origin + '/game/');
    await gamePage.waitForFunction(() => window.PrototypeSprites?.status().loaded === 1);
    await gamePage.evaluate(() => {
      const original = PrototypeSprites.draw;
      window.__spriteDraws = 0;
      PrototypeSprites.draw = function (...args) {
        const drawn = original(...args);
        if (drawn) window.__spriteDraws++;
        return drawn;
      };
    });
    await gamePage.keyboard.press('f');
    await gamePage.keyboard.press('f');
    await gamePage.waitForFunction(() => window.__spriteDraws > 0);
    assert.equal(
      await gamePage.evaluate(() =>
        PrototypeSprites.definitionFor({ renderKind: 'enemy', species: 'goblin', ranged: true }),
      ),
      null,
    );
    await gamePage.evaluate(() => navigator.serviceWorker.ready);
    await gamePage.waitForFunction(() => navigator.serviceWorker.controller !== null);
    const online = await gamePage.evaluate(async () => {
      const response = await fetch('./assets/sprites/reference-fixture.png?online=1');
      return Array.from(new Uint8Array(await response.arrayBuffer()));
    });
    assert.equal(pipeline.hash(Buffer.from(online)), prepared.record.output.hash);
    const saved = await gamePage.evaluate(() => {
      Prototype.game.hero.gold = 137;
      Prototype.save();
      return Prototype.game.snapshot();
    });
    await context.setOffline(true);
    await gamePage.goto(origin + '/game/phone.html?experience=phone');
    await gamePage.waitForFunction(() => window.PrototypeSprites?.status().loaded === 1);
    const offline = await gamePage.evaluate(async () => {
      const response = await fetch('./assets/sprites/reference-fixture.png?offline=1');
      return Array.from(new Uint8Array(await response.arrayBuffer()));
    });
    assert.equal(
      pipeline.hash(Buffer.from(offline)),
      prepared.record.output.hash,
      'real image served offline under project subpath with a query',
    );
    assert.equal(
      await gamePage.evaluate(() => Prototype.game.hero.class),
      saved.hero.class,
      'sprite/cache paths preserve campaign class',
    );
    assert.equal(
      await gamePage.evaluate(() => Prototype.game.hero.gold),
      137,
      'offline phone reload retains the saved crowns',
    );
    await context.close();
    console.log(
      'PASS real transparent binary loads through game Canvas and offline phone/project-subpath cache; exact variant fallback and saves preserved',
    );
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const webkit = process.env.BROWSER_ENGINE === 'webkit';
  const browser = await (webkit ? pw.webkit : pw.chromium).launch(
    webkit
      ? {}
      : {
          executablePath: process.env.CHROMIUM_EXECUTABLE,
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        },
  );
  try {
    const context = await browser.newContext({
      viewport: { width: webkit ? 375 : 1280, height: 800 },
      hasTouch: webkit,
      isMobile: webkit,
    });
    const page = await context.newPage();
    await page.goto(
      'http://127.0.0.1:' + server.address().port + '/' + (webkit ? 'phone.html' : 'index.html'),
    );
    await page.waitForFunction(() => window.Prototype);
    await page.keyboard.press('f');
    await page.keyboard.press('f');
    await page.waitForFunction(() => document.querySelector('#modal').hidden);
    await page.evaluate(() => {
      const g = Prototype.game;
      g.zone().props = [];
      g.zone().npcs = [];
      g.zone().nodes = [];
      g.zone().buildings = [];
      g.s.party = [];
      g.s.mercyTime = 0;
      g.updateEnemies = () => {};
      g.updatePacks = () => {};
      g.updateNight = () => {};
      g.updateElites = () => {};
      window.__cooldownCasts = [];
      const cast = g.cast;
      g.cast = function (slot, target, charged) {
        const result = cast.call(this, slot, target, charged);
        if (result)
          __cooldownCasts.push({
            slot,
            charged: !!charged,
            cd: this.hero.cd[slot - 1],
            mp: this.hero.mp,
          });
        return result;
      };
    });
    const press = async (slot) => {
      if (webkit)
        await page.locator('#skill-' + slot).evaluate((el) => {
          el.setPointerCapture = () => {};
          el.onpointerdown({ pointerType: 'touch', pointerId: 91, preventDefault() {} });
        });
      else await page.keyboard.down(String(slot));
    };
    const release = async (slot) => {
      if (webkit)
        await page
          .locator('#skill-' + slot)
          .evaluate((el) => el.onpointerup({ pointerType: 'touch', pointerId: 91 }));
      else await page.keyboard.up(String(slot));
    };
    let count = 0;
    for (const cls of ['paladin', 'mage', 'ranger'])
      for (let rank = 0; rank <= 5; rank++)
        for (const slot of [1, 2, 3]) {
          await page.evaluate(
            ({ cls, rank, slot }) => {
              const g = Prototype.game,
                h = g.hero;
              Object.assign(h, {
                class: cls,
                power: Campaign.classes[cls].power,
                x: 600,
                y: 900,
                order: null,
                mp: 0,
                hp: 50,
                maxHp: 500,
              });
              h.skills = Array(8).fill(1);
              h.talents = [0, rank, 0, 0];
              h.cd = Array(8).fill(0);
              h.cd[slot - 1] = 5;
              const e = g.makeEnemy(
                {
                  species: 'goblin',
                  name: 'Input fixture',
                  level: 1,
                  hp: 10000,
                  damage: 0,
                  xp: 0,
                  gold: 0,
                },
                { x: 680, y: 900 },
              );
              g.zone().enemies = [e];
              g.s.heroTarget = e.id;
              g.s.projectiles = [];
              window.__cooldownCasts = [];
              Prototype.updateHUD();
            },
            { cls, rank, slot },
          );
          await press(slot);
          const waiting = await page.evaluate(() => Prototype.chargePresentation());
          assert(
            waiting.waiting && waiting.progress === 0,
            'queued charge does not preload its hold',
          );
          assert.equal(await page.evaluate(() => __cooldownCasts.length), 0);
          await page.evaluate((slot) => {
            Prototype.game.hero.cd[slot - 1] = 0.05;
          }, slot);
          await page.waitForFunction(() => Prototype.chargePresentation()?.state === 'charging');
          await page.waitForFunction(() => Prototype.chargePresentation()?.ready, null, {
            timeout: 3000,
          });
          await release(slot);
          const rows = await page.evaluate(() => __cooldownCasts);
          assert.equal(rows.length, 1, JSON.stringify({ cls, rank, slot, rows }));
          assert(rows[0].charged);
          assert.equal(rows[0].mp, 0);
          const expected = [0, 3, 6, 20][slot] * (1 - 0.04 * rank);
          assert(
            Math.abs(rows[0].cd - expected) < 1e-9,
            JSON.stringify({ cls, rank, slot, rows, expected }),
          );
          count++;
        }
    // Releasing a queued hold before readiness never spends or resets the slot.
    await page.evaluate(() => {
      Prototype.game.hero.cd[0] = 5;
      window.__cooldownCasts = [];
    });
    await press(1);
    await release(1);
    assert.equal(await page.evaluate(() => __cooldownCasts.length), 0);
    assert(await page.evaluate(() => Prototype.game.hero.cd[0] > 4));
    console.log(
      'PASS ' +
        (webkit ? 'WebKit touch' : 'Chromium keyboard') +
        ' ' +
        count +
        ' zero-MP queued charges across all classes, ranks 0–5 and charged slots, plus cancellation',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});

'use strict';
// Deterministic actual-game visual inspection; no player save is accessed.
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict'),
  pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..'),
  out = path.join(root, 'test-results', 'enemy-vfx', process.env.VFX_CAPTURE_TAG || 'before');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const server = http.createServer((req, res) => {
    const file = path.resolve(
      root,
      decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '') || 'index.html',
    );
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
      res.writeHead(404);
      return res.end();
    }
    res.setHeader(
      'Content-Type',
      {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.webmanifest': 'application/manifest+json',
      }[path.extname(file)] || 'application/octet-stream',
    );
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await pw[process.env.VFX_BROWSER_ENGINE || 'chromium'].launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE && process.env.VFX_BROWSER_ENGINE !== 'webkit'
      ? {
          executablePath: process.env.CHROMIUM_EXECUTABLE,
          args: ['--no-sandbox', '--disable-dev-shm-usage'],
        }
      : {}),
  });
  const report = [];
  try {
    for (const [width, height, touch] of [
      [1280, 800, false],
      [375, 812, true],
      [812, 375, true],
    ]) {
      const page = await browser.newPage({
          viewport: { width, height },
          hasTouch: touch,
          isMobile: touch,
        }),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(
        'http://127.0.0.1:' +
          server.address().port +
          '/?experience=' +
          (touch ? 'phone' : 'desktop'),
      );
      await page.waitForFunction(() => !!window.Prototype);
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      await page.evaluate(() => {
        Prototype.closeMenu();
        Prototype.game.tick = () => {};
        window.requestAnimationFrame = () => 0;
      });
      await page.waitForTimeout(100);
      for (const zoom of [1, 1.5, 1.75]) {
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: 'Game and settings', exact: true }).click();
        await page.getByRole('button', { name: 'Screen and performance', exact: true }).click();
        await page
          .getByRole('button', {
            name: 'Camera ' + Math.round(zoom * 100) + '%' + (zoom === 1 ? ' · original' : ''),
            exact: true,
          })
          .click();
        for (const night of [false, true])
          for (const pilot of ['pounce', 'volley', 'summon', 'rings', 'carapace']) {
            await page.evaluate(
              ({ night, pilot }) => {
                const c = Prototype.game;
                c.enter('vale');
                const z = c.zone();
                z.props = [];
                z.nodes = [];
                z.npcs = [];
                z.buildings = [];
                z.enemies = [];
                c.s.party = [];
                c.s.projectiles = [];
                c.s.hazards = [];
                c.s.clock = night ? 600 : 200;
                c.s.mercyTime = 0;
                Object.assign(c.hero, {
                  x: 1400,
                  y: 1700,
                  hp: 100000,
                  maxHp: 100000,
                  mp: 100000,
                  maxMp: 100000,
                  order: null,
                });
                c.line = () => true;
                c.blocked = () => false;
                c.move = (e, t, s, dt) => {
                  const d = Math.hypot(t.x - e.x, t.y - e.y),
                    n = Math.min(d, s * dt);
                  e.x += ((t.x - e.x) / Math.max(1, d)) * n;
                  e.y += ((t.y - e.y) / Math.max(1, d)) * n;
                  return n > 0;
                };
                const family = {
                    pounce: 'thorn',
                    volley: 'crypt',
                    summon: 'mire',
                    rings: 'mine',
                    carapace: 'cindermaw',
                  }[pilot],
                  e = c.bossEnemy(c.boss(family), night ? 'true' : 'normal', { x: 1500, y: 1640 });
                z.enemies = [e];
                e.aggro = true;
                for (let j = 0; j < 6; j++) {
                  const u = c.unit(
                    j % 2 ? 'archer' : 'soldier',
                    1400 + (j - 3) * 27,
                    1665 + (j % 3) * 22,
                  );
                  c.s.party.push(u);
                }
                if (pilot === 'carapace') {
                  e.type = 'mob';
                  e.captain = true;
                  e.captainProfile = 'supply-crown';
                  e.hp = e.maxHp * 0.4;
                  c.triggerCaptainPhase(e);
                } else {
                  const index = { pounce: 1, volley: 1, summon: 3, rings: 2 }[pilot];
                  c.startAttack(e, c.hero, index);
                }
                window.__vfxActor = e;
                window.__vfxPilot = pilot;
                Prototype.renderer.queue(c.effects.splice(0));
                Prototype.renderer.update(10);
                Prototype.updateHUD();
                Prototype.renderer.draw();
              },
              { night, pilot },
            );
            const prefix =
              width + 'x' + height + '-' + zoom + '-' + (night ? 'night' : 'day') + '-' + pilot;
            await page.screenshot({ path: path.join(out, prefix + '-windup.png') });
            await page.evaluate(() => {
              const c = Prototype.game,
                e = __vfxActor;
              if (__vfxPilot !== 'carapace') {
                c.resolveAttack(e);
                e.telegraph = null;
                if (e.motion) {
                  for (let j = 0; j < 12 && e.motion; j++) c.advanceMotion(e, 0.05);
                }
                if (__vfxPilot === 'volley') c.updateProjectiles(0.15);
                if (__vfxPilot === 'rings') c.updateProjectiles(0.7);
              }
              Prototype.renderer.queue(c.effects.splice(0));
              Prototype.renderer.update(0.12);
              Prototype.renderer.draw();
            });
            await page.screenshot({ path: path.join(out, prefix + '-active.png') });
            const stats = await page.evaluate(() => {
              const start = performance.now();
              for (let j = 0; j < 30; j++) Prototype.renderer.draw();
              return {
                averageDrawMs: (performance.now() - start) / 30,
                renderer: Prototype.renderer.metrics(),
                sprites: PrototypeSprites.status(),
              };
            });
            report.push({ width, height, zoom, night, pilot, ...stats });
          }
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    fs.writeFileSync(path.join(out, 'measurements.json'), JSON.stringify(report, null, 2));
    console.log(
      'PASS actual-game captures: ' +
        report.length +
        ' scenes / ' +
        report.length * 2 +
        ' images; desktop/phone portrait/landscape, day/night TRUE/crowd, three zooms',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

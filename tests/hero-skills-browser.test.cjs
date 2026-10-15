'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..'),
  engine = process.env.BROWSER_ENGINE || 'chromium';
const out = path.join(root, 'test-results/hero-skills-' + engine);
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.resolve(
    root,
    '.' + new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '/index.html'),
  );
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader(
    'Content-Type',
    {
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.webmanifest': 'application/manifest+json',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
    }[path.extname(file)] || 'text/html',
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await pw[engine].launch(
      engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE
        ? {
            executablePath: process.env.CHROMIUM_EXECUTABLE,
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
          }
        : {},
    );
    for (const entry of ['index.html', 'prototype.html', 'phone.html']) {
      const phone = entry === 'phone.html';
      const page = await browser.newPage({
        viewport: phone ? { width: 375, height: 800 } : { width: 1280, height: 800 },
        hasTouch: phone,
        isMobile: phone,
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto('http://127.0.0.1:' + server.address().port + '/' + entry);
      await page.locator('#modal-actions button').first().click();
      await page.locator('#modal-actions button').first().click();
      await page.waitForFunction(() => Prototype.audio.ctx?.state === 'running');
      for (const motion of ['reduce', 'no-preference']) {
        await page.emulateMedia({ reducedMotion: motion });
        const report = await page.evaluate(async () => {
          const need = (v, s) => {
            if (!v) throw Error(s);
          };
          document.querySelector('#hero-av-sheet')?.remove();
          const C = Prototype.game.constructor,
            art = PrototypeHeroPresentation;
          const canvas = document.createElement('canvas');
          canvas.width = 960;
          canvas.height = 640;
          const sheet = document.createElement('canvas');
          sheet.id = 'hero-av-sheet';
          Object.assign(sheet.style, { position: 'fixed', zIndex: '99999', left: '0', top: '0' });
          sheet.width = 1440;
          sheet.height = 1440;
          document.body.append(sheet);
          const sc = sheet.getContext('2d');
          let game = new C('normal', 'paladin', () => 0.9);
          const platform = { cameraZoom: 1.5, cameraAnchor: () => ({ x: 480, y: 340 }) };
          const renderer = PrototypeRenderer.create({
            canvas: { width: 960, height: 640 },
            ctx: canvas.getContext('2d'),
            getGame: () => game,
            platform,
            chargePresentation: () => null,
            isPaused: () => false,
            Campaign: C,
            PrototypeVisuals,
            PrototypeCombatVisuals,
            PrototypeSprites,
            PrototypeMaterials,
          });
          renderer.setGroundReuse(false);
          await PrototypeSprites.preload();
          const results = [];
          let maxFx = 0;
          for (const rank of [1, 4, 8])
            for (const [ci, cls] of ['paladin', 'mage', 'ranger'].entries())
              for (let slot = 1; slot <= 8; slot++)
                for (const charged of [false, true]) {
                  game = new C('normal', cls, () => 0.9);
                  Object.assign(game.hero, {
                    x: 1100,
                    y: 1100,
                    hp: 50,
                    skills: Array(8).fill(rank),
                    cd: Array(8).fill(0),
                    order: null,
                  });
                  game.s.mercyTime = 0;
                  game.s.clock = rank === 8 ? 500 : 0;
                  const z = game.zone();
                  z.props = [];
                  z.buildings = [];
                  z.npcs = [];
                  z.nodes = [];
                  const e = game.makeEnemy(
                    {
                      species: 'goblin',
                      name: 'AV target',
                      level: 1,
                      hp: 100000,
                      damage: 10,
                      gold: 0,
                      xp: 0,
                    },
                    { x: 1170, y: 1100 },
                  );
                  z.enemies = [e];
                  game.s.party = [game.unit('soldier', 1080, 1130)];
                  game.s.companionCombatTraining = 2;
                  if (cls === 'mage' && slot === 3 && !charged)
                    e.rangedAim = { remaining: 0.4, max: 0.4, targetId: 'hero' };
                  need(
                    game.cast(slot, e.id, charged),
                    cls + ' ' + slot + ' ' + charged + ' admission rank ' + rank,
                  );
                  const events = [...game.effects],
                    cast = events.find((x) => x.type === 'heroSkillCast');
                  need(!!art.profile(cast), 'profile');
                  for (let i = 0; i < 12; i++) {
                    game.effects = [];
                    game.updateProjectiles(0.05);
                    events.push(...game.effects);
                  }
                  // Audition the actual resolver receipts through the installed
                  // Web Audio facade; bounded spacing permits voice cleanup.
                  for (const receipt of events) Prototype.audio.effect(receipt);
                  await new Promise((resolve) => setTimeout(resolve, 120));
                  need(Prototype.audio.voices.size <= 64, 'shared audio voice ceiling');
                  renderer.update(10);
                  renderer.queue(events);
                  const before = JSON.stringify({
                    hero: game.hero,
                    enemies: z.enemies,
                    party: game.s.party,
                    time: game.s.time,
                  });
                  const scales = rank === 4 ? [1, 1.5, 1.75] : [1.5];
                  for (const scale of scales) {
                    platform.cameraZoom = scale;
                    renderer.draw();
                  }
                  need(
                    before ===
                      JSON.stringify({
                        hero: game.hero,
                        enemies: z.enemies,
                        party: game.s.party,
                        time: game.s.time,
                      }),
                    'render mutation',
                  );
                  need(renderer.metrics().transientEffects <= 40, 'FX ceiling');
                  maxFx = Math.max(maxFx, renderer.metrics().transientEffects);
                  if (rank === 4) {
                    platform.cameraZoom = 1.5;
                    renderer.draw();
                    const col = ci * 2 + Number(charged),
                      row = slot - 1;
                    sc.drawImage(canvas, 240, 130, 480, 360, col * 240, row * 180, 240, 180);
                    sc.fillStyle = '#fff';
                    sc.font = '12px sans-serif';
                    sc.fillText(
                      cls + ' ' + slot + (charged ? ' charged' : ' tap'),
                      col * 240 + 4,
                      row * 180 + 14,
                    );
                  }
                  results.push({
                    cls,
                    slot,
                    charged,
                    rank,
                    events: events.length,
                    projectiles: events.filter((x) => x.type === 'heroProjectileFlight').length,
                  });
                }
          return { forms: results.length, maxFx, results };
        });
        assert.equal(report.forms, 144);
        await page
          .locator('#hero-av-sheet')
          .screenshot({ path: path.join(out, entry + '-' + motion + '.png') });
        // Re-draw the entire sheet with normal OS motion preference through the same live owners.
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        const normal = await page.evaluate(() => {
          Prototype.renderer.draw();
          return Prototype.renderer.metrics();
        });
        assert(normal.transientEffects <= 40);
        assert.deepEqual(errors, []);
        fs.writeFileSync(
          path.join(out, entry + '-' + motion + '.json'),
          JSON.stringify(report, null, 2) + '\n',
        );
        console.log(
          'PASS ' +
            engine +
            ' ' +
            entry +
            ': 144 rank 1/4/8 forms; real projectiles, reduced motion, 100/150/175% Canvas, bounded queue and render purity',
        );
      }
      await page.close();
    }
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
  server.close();
});

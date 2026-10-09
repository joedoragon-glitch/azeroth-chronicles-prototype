'use strict';
// Actual browser canvas coverage, independent of the five photographic pilot fixtures.
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright'),
  Inventory = require('../scripts/enemy-vfx-inventory.cjs');
const future = require('./fixtures/enemy-vfx-rogue-signatures.json');
const rows = Inventory.collect(),
  pending = future.filter((f) => !rows.some((r) => r.id === f.id)),
  catalog = [...rows, ...pending];
const root = path.resolve(__dirname, '..'),
  engine = process.env.VFX_BROWSER_ENGINE || 'chromium',
  out = path.join(root, 'test-results', 'enemy-vfx-catalog-' + engine);
fs.mkdirSync(out, { recursive: true });
(async () => {
  const server = http.createServer((req, res) => {
    const file = path.resolve(
      root,
      decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '') || 'index.html',
    );
    if (
      !file.startsWith(root + path.sep) ||
      !fs.existsSync(file) ||
      fs.statSync(file).isDirectory()
    ) {
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
        '.webp': 'image/webp',
        '.png': 'image/png',
      }[path.extname(file)] || 'application/octet-stream',
    );
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  let browser;
  try {
    browser = await pw[engine].launch({
      headless: true,
      ...(engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE
        ? {
            executablePath: process.env.CHROMIUM_EXECUTABLE,
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
          }
        : {}),
    });
    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 375, height: 812 },
    ]) {
      const page = await browser.newPage({
          viewport,
          hasTouch: viewport.width === 375,
          isMobile: viewport.width === 375,
        }),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(
        'http://127.0.0.1:' +
          server.address().port +
          '/?experience=' +
          (viewport.width === 375 ? 'phone' : 'desktop'),
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
      const results = await page.evaluate((rows) => {
        const c = Prototype.game,
          r = Prototype.renderer,
          A = PrototypeEnemyVfxArt,
          V = PrototypeEnemyVfx,
          C = c.constructor;
        const captainLooks = {};
        for (const id of Object.keys(C.rules.roomCaptains)) {
          c.enter(id === 'frontier-overseer' ? 'frontier' : id);
          const native = c.zone().enemies.find((e) => e.captainProfile === id);
          captainLooks[id] = Object.fromEntries(
            ['name', 'species', 'visualScale', 'captainMentor', 'captainVisualIdol'].map((k) => [
              k,
              native[k],
            ]),
          );
        }
        c.enter('vale');
        const z = c.zone();
        z.props = [];
        z.nodes = [];
        z.npcs = [];
        z.buildings = [];
        c.s.party = [];
        c.line = () => true;
        c.blocked = () => false;
        c.move = (e, t, s, dt) => {
          const d = Math.hypot(t.x - e.x, t.y - e.y),
            n = Math.min(d, s * dt);
          e.x += ((t.x - e.x) / Math.max(1, d)) * n;
          e.y += ((t.y - e.y) / Math.max(1, d)) * n;
          return n > 0;
        };
        const sheets = [],
          report = [];
        let serial = 1000000,
          sheet,
          ctx,
          cell = 0;
        function capture(label) {
          if (cell % 24 === 0) {
            sheet = document.createElement('canvas');
            sheet.width = 1200;
            sheet.height = 1080;
            ctx = sheet.getContext('2d');
            ctx.fillStyle = '#18211e';
            ctx.fillRect(0, 0, 1200, 1080);
          }
          const j = cell % 24,
            x = (j % 4) * 300,
            y = Math.floor(j / 4) * 180;
          const scene = document.querySelector('canvas'),
            cropWidth = Math.min(scene.width, 600),
            cropHeight = (cropWidth * 160) / 300;
          ctx.drawImage(
            scene,
            (scene.width - cropWidth) / 2,
            (scene.height - cropHeight) / 2,
            cropWidth,
            cropHeight,
            x,
            y,
            300,
            160,
          );
          ctx.fillStyle = '#f0e9d8';
          ctx.font = '12px sans-serif';
          ctx.fillText(label, x + 4, y + 174, 292);
          cell++;
          if (cell % 24 === 0) sheets.push(sheet.toDataURL('image/png'));
        }
        for (const row of rows)
          for (const form of row.group === 'boss' ? ['normal', 'true'] : ['normal']) {
            c.s.projectiles = [];
            c.s.hazards = [];
            c.effects = [];
            r.update(10);
            Object.assign(c.hero, { x: 1400, y: 1700, hp: 100000, maxHp: 100000, order: null });
            c.s.clock = cell % 2 ? 450 : 200;
            const p = row.id.split('/');
            let e = c.makeEnemy(
              {
                species: 'orc',
                name: row.owner || row.name,
                level: 5,
                hp: 10000,
                damage: 10,
                gold: 0,
                xp: 0,
              },
              { x: 1480, y: 1680 },
            );
            if (p[0] === 'boss' || (p[0] === 'rogue' && p[1] === 'boss'))
              e = c.bossEnemy(c.boss(p[p[0] === 'rogue' ? 2 : 1]), form, { x: 1480, y: 1680 });
            else if (p[0] === 'captain' || (p[0] === 'rogue' && p[1] === 'captain'))
              Object.assign(e, {
                captain: true,
                captainProfile: p[p[0] === 'rogue' ? 2 : 1],
                ...captainLooks[p[p[0] === 'rogue' ? 2 : 1]],
              });
            else {
              e.species = p[0] === 'rogue' ? p[3] : p[1];
              if (p[0] === 'rogue')
                Object.assign(e, {
                  guard: p[1] === 'guardian',
                  form: p[1] === 'ringleader' ? 'ringleader' : 'normal',
                  ranged: p[2] === 'ranged',
                });
            }
            c.zone();
            e.aggro = true;
            z.enemies = [e];
            let a = {
              kind: 'circle',
              name: row.name,
              x: 1400,
              y: 1700,
              fromX: e.x,
              fromY: e.y,
              angle: Math.atan2(20, -80),
              radius: 100,
              timer: 0.4,
              total: 0.8,
              index: Number(p[2]),
              style: row.kind,
              effect: row.kind,
            };
            if (row.group === 'boss') {
              c.startAttack(e, c.hero, Number(p[2]));
              a = e.telegraph;
            } else if (row.group === 'captain') {
              a = {
                ...a,
                ...C.rules.roomCaptains[p[1]].attacks[Number(p[2])],
                captainSkill: true,
                index: Number(p[2]),
              };
            } else if (row.group === 'night') {
              c.startNightSkill(e, c.hero);
              a = e.telegraph;
            } else if (row.group === 'rogue-basic') {
              c.tacticalRogueMove(e, c.hero);
              a = e.telegraph || { ...a, rogueMove: true };
            } else if (row.group === 'basic-attack') a = { ...a, kind: 'melee', basic: true };
            else if (row.group === 'frenzy') a = { ...a, kind: 'frenzy' };
            if (row.geometry) a = { ...a, ...row.geometry };
            const identity = {
              id: row.id,
              tier: V.tierOf(e),
              role: e.ranged ? 'ranged' : 'melee',
              variant: form,
              kind: a.kind,
            };
            if (!A.recipe(identity, a, e)) throw Error('Missing ' + row.id);
            e.telegraph = row.stages.includes('windup') ? a : null;
            // Normalize fixture migrations exactly as normal zone entry does.
            c.zone();
            const saved = JSON.stringify(c.snapshot());
            r.draw();
            if (JSON.stringify(c.snapshot()) !== saved) throw Error('Draw mutated ' + row.id);
            if (['boss', 'captain', 'night', 'rogue-basic'].includes(row.group)) {
              e.telegraph = a;
              c.resolveAttack(e);
              e.telegraph = null;
              if (e.motion) for (let j = 0; j < 30 && e.motion; j++) c.advanceMotion(e, 0.05);
              c.updateProjectiles(0.12);
              r.queue(c.effects.splice(0));
            }
            // Exercise every presentation stage even if the real resolution missed a victim.
            const stages = row.stages
              .filter((s) => s !== 'windup' && s !== 'travel' && s !== 'linger')
              .map((stage) => ({
                type: 'enemyVfx',
                eventId: serial++,
                epoch: c.enemyVfxEpoch(),
                zone: c.zoneId,
                at: c.s.time,
                source: e.id,
                identity,
                geometry: a,
                x: stage === 'release' ? e.x : 1400,
                y: stage === 'release' ? e.y : 1700,
                stage,
                duration: 0.65,
              }));
            r.queue(stages);
            r.update(0.12);
            const before = JSON.stringify(c.snapshot()),
              start = performance.now();
            for (let frame = 0; frame < 5; frame++) r.draw();
            if (JSON.stringify(c.snapshot()) !== before)
              throw Error('Resolved draw mutated ' + row.id);
            const ms = (performance.now() - start) / 5;
            capture(row.id + ' · ' + form);
            report.push({ id: row.id, form, drawMs: ms, effects: r.metrics().enemyVfxEffects });
          }
        if (cell % 24) sheets.push(sheet.toDataURL('image/png'));
        // Presentation lifetime follows paused time and drops on source death/reentry.
        const n = r.metrics().enemyVfxEffects;
        r.update(0);
        if (r.metrics().enemyVfxEffects !== n) throw Error('Pause advanced effects');
        z.enemies[0].hp = 0;
        r.queue([]);
        if (r.metrics().enemyVfxEffects) throw Error('Dead source retained effects');
        c.enter(c.zoneId);
        r.queue([]);
        if (r.metrics().enemyVfxEffects) throw Error('Travel retained effects');
        return { sheets, report };
      }, catalog);
      for (const [i, url] of results.sheets.entries())
        fs.writeFileSync(
          path.join(out, viewport.width + '-sheet-' + i + '.png'),
          Buffer.from(url.split(',')[1], 'base64'),
        );
      fs.writeFileSync(
        path.join(out, viewport.width + '-measurements.json'),
        JSON.stringify(results.report, null, 2),
      );
      assert.equal(results.report.length, catalog.length + 46);
      assert.deepEqual(errors, []);
      console.log(
        'PASS ' +
          engine +
          ' ' +
          viewport.width +
          'px: ' +
          results.report.length +
          ' catalog/TRUE scenes, real resolutions, render purity, pause/death/travel',
      );
      await page.close();
    }
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

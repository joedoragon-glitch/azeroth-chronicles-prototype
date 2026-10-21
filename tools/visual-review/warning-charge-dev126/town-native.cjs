'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  cp = require('node:child_process'),
  { chromium } = require('playwright');
const root = path.resolve(__dirname, '../../..'),
  out = path.join(__dirname, 'captures');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.join(root, new URL(req.url, 'http://local').pathname);
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader(
    'Content-Type',
    {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
    }[path.extname(file)] || 'application/octet-stream',
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_EXECUTABLE,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    const errors = [],
      results = {};
    const open = async () => {
      const p = await browser.newPage({
        viewport: { width: 844, height: 390 },
        isMobile: true,
        hasTouch: true,
      });
      p.on('pageerror', (e) => errors.push(e.message));

      await p.goto('http://127.0.0.1:' + server.address().port + '/phone.html');
      await p.waitForFunction(() => window.Prototype?.game);
      await require('../../../tests/helpers/language-browser.cjs').selectEnglish(p);
      await p.keyboard.press('f');
      await p.keyboard.press('f');
      await p.waitForFunction(() => document.getElementById('modal').hidden);
      return p;
    };
    let p = await open();
    const perf = await p.evaluate(
      (baseline) => {
        const current = PrototypeCombatVisuals,
          final = current.ground;
        (0, eval)(baseline);
        const original = PrototypeCombatVisuals.ground;
        window.PrototypeCombatVisuals = current;
        const g = Prototype.game,
          r = Prototype.renderer;
        Object.defineProperty(performance, 'now', { value: () => 5000 });
        g.tick = () => {};
        r.update(100000);
        r.update = () => {};
        g.effects = [];
        g.enter('vale');
        g.s.party = [];
        g.s.mercyTime = 0;
        g.s.clock = 120;
        g.line = () => true;
        g.clearSegment = () => true;
        g.blocked = () => false;
        g.tacticalAutoRogue = () => false;
        Object.assign(g.hero, { x: 1580, y: 1700, hp: 1e8, maxHp: 1e8, immune: 999, order: null });
        const e = g.bossEnemy(g.boss('warlord'), 'normal', { x: 1400, y: 1700 });
        e.home = { x: e.x, y: e.y };
        g.zone().enemies = [e];
        g.engage(e);
        g.startAttack(e, g.hero, 0);
        let impact = false;
        for (let i = 0; i < 400 && !impact; i++) {
          g.s.time += 0.02;
          g.updateEnemies(0.02);
          g.updateProjectiles(0.02);
          const events = g.effects.splice(0);
          impact = events.some((f) => f.type === 'enemyVfx' && f.stage === 'impact');
          r.queue(events);
        }
        for (let i = 0; i < 40; i++) r.draw();
        const rows = [];
        for (const [name, fn] of [
          ['before', original],
          ['after', final],
          ['before', original],
          ['after', final],
        ]) {
          current.ground = fn;
          r.draw();
          const start = Date.now();
          for (let i = 0; i < 20; i++) r.draw();
          rows.push({ name, msPerDraw: (Date.now() - start) / 20 });
        }
        current.ground = final;
        return {
          rows,
          scope:
            'Clean native phone canvas, no pixel interception/readback; static color alpha, same effect passes and surfaces. Host timings only.',
        };
      },
      cp.execFileSync('git', ['show', 'f203801:src/prototype/combat-visuals.js'], {
        cwd: root,
        encoding: 'utf8',
      }),
    );
    console.log('Clean paint cost', JSON.stringify(perf));
    await p.close();
    p = await open();
    await p.setViewportSize({ width: 844, height: 514 });
    await p.evaluate(() => {
      const g = Prototype.game;
      g.enter('march');
      const refuge = g.zone().npcs.find((n) => n.id === 'rest');
      g.hero.class = 'mage';
      g.hero.x = refuge.x + 90;
      g.hero.y = refuge.y + 60;
      g.tick = () => {};
      Prototype.renderer.update(100000);
      Prototype.renderer.update = () => {};
      g.s.clock = 120;
      g.zone().enemies = [];
      g.s.party = [
        g.unit('soldier', g.hero.x + 30, g.hero.y + 25),
        g.unit('soldier', g.hero.x + 65, g.hero.y),
        g.unit('archer', g.hero.x + 50, g.hero.y + 50),
      ];
      const old = {
        'aesthetic-town-0': [185, 1085],
        'aesthetic-town-5': [125, 1120],
        'aesthetic-town-7': [315, 915],
        'aesthetic-town-99': [50, 1115],
      };
      window.afterRecruiter = { ...g.zone().npcs.find((n) => n.id === 'recruiter') };
      Object.assign(
        g.zone().npcs.find((n) => n.id === 'recruiter'),
        { x: 225, y: 1190 },
      );
      window.afterTown = g
        .zone()
        .props.filter((p) => old[p.id])
        .map((p) => ({ id: p.id, x: p.x, y: p.y }));
      for (const prop of g.zone().props) if (old[prop.id]) [prop.x, prop.y] = old[prop.id];
      Prototype.renderer.draw();
    });
    await p.waitForTimeout(100);
    await p.screenshot({ path: path.join(out, 'reedport-before.jpg'), type: 'jpeg', quality: 85 });
    await p.evaluate(() => {
      const z = Prototype.game.zone();
      Object.assign(
        z.npcs.find((n) => n.id === 'recruiter'),
        afterRecruiter,
      );
      for (const point of afterTown)
        Object.assign(
          z.props.find((p) => p.id === point.id),
          point,
        );
      Prototype.renderer.draw();
    });
    await p.screenshot({ path: path.join(out, 'reedport-after.jpg'), type: 'jpeg', quality: 85 });
    const file = __dirname + '/checks.json',
      old = JSON.parse(fs.readFileSync(file));
    old.paintCost = perf;
    old.reedport = { moved: 5, errors };
    fs.writeFileSync(file, JSON.stringify(old, null, 2) + '\n');
    assert.deepEqual(errors, []);
    console.log('PASS Reedport native before/after, no JavaScript errors');
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

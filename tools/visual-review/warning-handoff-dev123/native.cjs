'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  { chromium, webkit } = require('playwright');
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
    const p = await browser.newPage({
        viewport: { width: 844, height: 390 },
        isMobile: true,
        hasTouch: true,
      }),
      errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('http://127.0.0.1:' + server.address().port + '/phone.html');
    await p.waitForFunction(() => window.Prototype?.game);
    await require('../../../tests/helpers/language-browser.cjs').selectEnglish(p);
    await p.keyboard.press('f');
    await p.keyboard.press('f');
    await p.waitForFunction(() => document.getElementById('modal').hidden);
    await p.evaluate(() => {
      Prototype.game.tick = () => {};
      window.advanceAuditEffects = Prototype.renderer.update;
      Prototype.renderer.update = () => {};
      Prototype.closeMenu();
    });
    const cases = [];
    for (const [family, form, index] of [
      ['mire', 'normal', 0],
      ['warlord', 'normal', 0],
      ['crypt', 'normal', 1],
    ]) {
      await p.evaluate(
        ({ family, form, index }) => {
          const g = Prototype.game;
          g.enter('vale');
          g.s.party = [];
          g.s.mercyTime = 0;
          g.s.clock = 120;
          g.s.holdFire = true;
          g.line = () => true;
          g.clearSegment = () => true;
          g.blocked = () => false;
          g.tacticalAutoRogue = () => false;
          Object.assign(g.hero, {
            x: 1580,
            y: 1700,
            hp: 1e8,
            maxHp: 1e8,
            immune: 999,
            order: null,
          });
          const e = g.bossEnemy(g.boss(family), form, { x: 1400, y: 1700 });
          e.home = { x: e.x, y: e.y };
          g.zone().enemies = [e];
          g.engage(e);
          g.effects = [];
          g.startAttack(e, g.hero, index);
          window.auditBoss = e;
          window.auditPlan = e.telegraph;
          Prototype.renderer.queue(g.effects.splice(0));
          Prototype.renderer.draw();
        },
        { family, form, index },
      );
      await p.screenshot({
        path: path.join(out, family + '-warning.jpg'),
        type: 'jpeg',
        quality: 80,
      });
      const release = await p.evaluate(() => {
        const g = Prototype.game,
          e = auditBoss,
          old = auditPlan;
        let released = false,
          impact = false;
        for (let i = 0; i < 400; i++) {
          g.s.time += 0.02;
          g.updateEnemies(0.02);
          g.updateProjectiles(0.02);
          const events = g.effects.splice(0);
          released ||= events.some((f) => f.type === 'enemyVfx' && f.stage === 'release');
          impact ||= events.some((f) => f.type === 'enemyVfx' && f.stage === 'impact');
          advanceAuditEffects(0.02);
          Prototype.renderer.queue(events);
          if (released) {
            Prototype.renderer.draw();
            return {
              released,
              impact,
              oldWarning: e.telegraph === old,
              nextWarning: !!e.telegraph,
            };
          }
        }
        return { released };
      });
      assert(release.released);
      assert.equal(release.oldWarning, false);
      cases.push({ family, form, ...release });
      if (!release.impact) {
        await p.screenshot({
          path: path.join(out, family + '-release.jpg'),
          type: 'jpeg',
          quality: 80,
        });
        const contact = await p.evaluate(() => {
          const g = Prototype.game,
            e = auditBoss;
          for (let i = 0; i < 250; i++) {
            g.s.time += 0.02;
            g.updateEnemies(0.02);
            g.updateProjectiles(0.02);
            const events = g.effects.splice(0),
              hit = events.some(
                (f) => f.type === 'enemyVfx' && f.source === e.id && f.stage === 'impact',
              );
            advanceAuditEffects(0.02);
            Prototype.renderer.queue(events);
            if (hit) {
              Prototype.renderer.draw();
              return { impact: true, nextWarningAtImpact: !!e.telegraph };
            }
          }
          return { impact: false };
        });
        assert(contact.impact, family + ' actual projectile contact');
        Object.assign(cases[cases.length - 1], contact);
      }
      await p.screenshot({
        path: path.join(out, family + '-impact.jpg'),
        type: 'jpeg',
        quality: 80,
      });
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      __dirname + '/native-review.json',
      JSON.stringify(
        { version: await p.evaluate(() => PrototypeBuild.version), cases, errors },
        null,
        2,
      ) + '\n',
    );
    console.log(JSON.stringify({ cases, errors }));
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

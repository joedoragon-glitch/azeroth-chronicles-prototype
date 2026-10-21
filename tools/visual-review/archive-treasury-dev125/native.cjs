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
    const result = await p.evaluate(() => {
      const g = Prototype.game;
      g.enter('archive');
      g.s.party = [];
      g.zone().enemies = [];
      Object.assign(g.hero, { x: 940, y: 1200 });
      Prototype.renderer.draw();
      const before = { x: g.hero.x, y: g.hero.y };
      for (let i = 0; i < 24; i++) {
        g.s.time += 0.05;
        g.move(g.hero, { x: 1010, y: 1200 }, 100, 0.05);
      }
      Prototype.updateHUD();
      Prototype.renderer.draw();
      return {
        version: PrototypeBuild.version,
        before,
        after: { x: g.hero.x, y: g.hero.y },
        outerWall: g.blocked(940, 1380),
        partition: g.blocked(990, 1050),
      };
    });
    assert(result.after.x >= 1005);
    assert(result.outerWall && result.partition);
    await p.screenshot({
      path: path.join(out, 'lower-hall-passage.jpg'),
      type: 'jpeg',
      quality: 80,
    });
    result.treasuries = await p.evaluate(() => {
      const g = Prototype.game;
      return ['supply-vale', 'supply-march', 'supply-highlands', 'supply-crown'].map((id) => {
        g.enter(id);
        const enemies = g.zone().enemies.filter((e) => e.hp > 0 && !e.neutral),
          captain = enemies.find((e) => e.roomCaptain);
        Prototype.renderer.draw();
        return {
          id,
          count: enemies.length,
          fortified: enemies.filter((e) => g.enemyFort(e)).length,
          captain: !!g.enemyFort(captain),
        };
      });
    });
    assert(result.treasuries.every((r) => r.count === r.fortified && r.captain));
    await p.screenshot({
      path: path.join(out, 'treasury-fortified.jpg'),
      type: 'jpeg',
      quality: 80,
    });
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      __dirname + '/native-review.json',
      JSON.stringify({ ...result, errors }, null, 2) + '\n',
    );
    console.log(JSON.stringify({ ...result, errors }));
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

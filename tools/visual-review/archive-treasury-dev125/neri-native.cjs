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
      const boss = g.zone().enemies.find((e) => e.type === 'boss' && e.family === 'archive');
      boss.hp = 0;
      g.kill(boss);
      if (!g.rescue('archive') || !g.promiseKeeper()) throw Error('Rescue/promise fixture failed');
      g.zone().enemies = [];
      const n = g.visibleNPCs().find((n) => n.id === 'archive-restorer'),
        before = { x: n.x, y: n.y };
      for (let i = 0; i < 200; i++) {
        g.s.time += 0.1;
        g.updateArchiveRestoration(0.1);
      }
      Object.assign(g.hero, { x: n.x + 100, y: n.y + 100 });
      Prototype.renderer.draw();
      return {
        version: PrototypeBuild.version,
        before,
        after: { x: n.x, y: n.y },
        free: n.kind === 'alchemist',
        oldCaptiveVisible: g.visibleNPCs().some((n) => n.id === 'cage-archive'),
      };
    });
    assert(result.free && !result.oldCaptiveVisible);
    assert(Math.hypot(result.after.x - result.before.x, result.after.y - result.before.y) > 100);
    await p.screenshot({
      path: path.join(out, 'neri-free-restoration.jpg'),
      type: 'jpeg',
      quality: 85,
    });
    const lifecycle = await p.evaluate(() => {
      const g = Prototype.game;
      g.s.pending.archive = { kind: 'dungeon', count: 1 };
      g.activatePending();
      const hidden = !g.visibleNPCs().some((n) => n.id === 'archive-restorer');
      const boss = g
        .zone()
        .enemies.find(
          (e) => e.type === 'boss' && e.family === 'archive' && e.form === 'true' && e.hp > 0,
        );
      boss.hp = 0;
      g.kill(boss);
      return {
        hiddenDuringTrue: hidden,
        returnsAfterTrue: g.visibleNPCs().some((n) => n.id === 'archive-restorer'),
      };
    });
    assert(lifecycle.hiddenDuringTrue && lifecycle.returnsAfterTrue);
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      __dirname + '/neri-native.json',
      JSON.stringify({ ...result, ...lifecycle, errors }, null, 2) + '\n',
    );
    console.log(JSON.stringify({ ...result, ...lifecycle, errors }));
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

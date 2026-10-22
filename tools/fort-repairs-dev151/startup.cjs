'use strict';
const fs = require('node:fs'),
  http = require('node:http'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..'),
  { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = http.createServer((req, res) => {
  const f = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!f.startsWith(root + '/') || !fs.existsSync(f)) {
    res.writeHead(404);
    return res.end();
  }
  res.setHeader(
    'Content-Type',
    {
      '.js': 'application/javascript',
      '.html': 'text/html',
      '.css': 'text/css',
      '.json': 'application/json',
      '.mp3': 'audio/mpeg',
      '.webp': 'image/webp',
      '.png': 'image/png',
    }[path.extname(f)] || 'application/octet-stream',
  );
  fs.createReadStream(f).pipe(res);
});
(async () => {
  let b;
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    b = await chromium.launch({
      executablePath: process.env.CHROMIUM_EXECUTABLE,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    for (const phone of [false, true]) {
      const p = await b.newPage({
          viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 },
          hasTouch: phone,
          isMobile: phone,
        }),
        errors = [];
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(
        'http://127.0.0.1:' + server.address().port + (phone ? '/phone.html' : '/index.html'),
      );
      await p.waitForFunction(() => window.Prototype?.game);
      for (let n = 0; n < 3; n++) await p.locator('#modal-actions button').first().click();
      await p.waitForFunction(() => Prototype.audio.context?.started === true);
      const r = await p.evaluate(() => {
        const C = Prototype.game.constructor,
          c = new C('normal', 'mage', () => 0.9);
        c.enter('frontier');
        c.s.party = [];
        c.s.mercyTime = 0;
        const site = c.treasuryRecoverySite('frontier'),
          e = c.treasuryCaptain(c.zone(), site),
          others = c.zone().enemies.filter((u) => u !== e && u.hp > 0 && !u.neutral);
        Object.assign(c.hero, c.safe(e.x + 40, e.y), { immune: 1e6, hp: 1e6, maxHp: 1e6 });
        c.hero.cd.fill(60);
        c.damage(e, 1e8, 'hero', { piercing: true });
        c.tick(0.05);
        return {
          version: PrototypeBuild.version,
          shell: Prototype.platform.mode,
          unrelatedBefore: others.length,
          unrelatedAfter: others.filter((u) => u.hp > 0).length,
          bossAlive: others.some((u) => u.type === 'boss' && u.hp > 0),
        };
      });
      assert.equal(r.version, '0.9.1+snapshot.dev.151');
      assert.equal(r.unrelatedAfter, r.unrelatedBefore);
      assert(r.bossAlive);
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ ...r, pageErrors: errors }));
      await p.close();
    }
  } finally {
    await b?.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

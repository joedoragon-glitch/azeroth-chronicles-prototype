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
    const cases = await p.evaluate(() => {
      const g = Prototype.game;
      g.enter('vale');
      g.s.party = [];
      g.zone().enemies = [];
      g.notices = [];
      g.hero.talentPoints = 0;
      g.hero.talents = g.hero.talents.map(() => 0);
      g.hero.xp = 0;
      g.xp(g.xpRequired());
      Prototype.updateHUD();
      return { points: g.hero.talentPoints };
    });
    assert.equal(cases.points, 1);
    await p.waitForFunction(() =>
      /Training point available/i.test(document.getElementById('message').textContent),
    );
    await p.evaluate(() => {
      if (!Prototype.game.talent(0)) throw Error('Talent spending failed');
      Prototype.updateHUD();
    });
    assert(!/Training point available/i.test(await p.locator('#message').textContent()));
    const recovery = await p.evaluate(() => {
      const g = Prototype.game;
      g.enter('vale');
      g.zone().buildings.push({
        id: 'native-camp',
        kind: 'barracks',
        name: 'Barracks',
        theme: 'vale',
        x: 800,
        y: 750,
        progress: 4,
        queue: 0,
        full: false,
      });
      if (!g.setBarracksRespawn('native-camp')) throw Error('Camp selection failed');
      g.enter('march');
      const cleared = g.s.barracksRespawn === null;
      g.die();
      Prototype.updateHUD();
      return { cleared, zone: g.zoneId, refuge: g.s.refugeSite.zone };
    });
    assert.deepEqual(recovery, { cleared: true, zone: 'march', refuge: 'march' });
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      __dirname + '/fixes-native.json',
      JSON.stringify(
        {
          version: await p.evaluate(() => PrototypeBuild.version),
          talentReminderRemoved: true,
          recovery,
          errors,
        },
        null,
        2,
      ) + '\n',
    );
    console.log(
      'PASS phone startup, visible talent reminder removed after spending, cross-region camp cleared and local death recovery; no JavaScript errors',
    );
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

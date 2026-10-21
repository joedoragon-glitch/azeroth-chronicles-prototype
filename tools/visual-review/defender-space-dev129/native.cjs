'use strict';
const http = require('node:http'),
  fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  { chromium } = require('playwright');
(async () => {
  const root = path.resolve(__dirname, '../../..');
  const server = http.createServer((req, res) => {
    const file = path.join(root, new URL(req.url, 'http://local').pathname);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404);
      return res.end();
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
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    ...(process.env.PLAYTEST_URL && process.env.HTTPS_PROXY
      ? { proxy: { server: process.env.HTTPS_PROXY } }
      : {}),
  });
  try {
    const page = await browser.newPage({
      ignoreHTTPSErrors: true,
      viewport: { width: 375, height: 812 },
      hasTouch: true,
      isMobile: true,
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(
      process.env.PLAYTEST_URL || 'http://127.0.0.1:' + server.address().port + '/phone.html',
    );
    await page.waitForFunction(() => window.Prototype?.game);
    await require('../../../tests/helpers/language-browser.cjs').selectEnglish(page);
    await page.keyboard.press('f');
    await page.keyboard.press('f');
    await page.waitForFunction(() => document.getElementById('modal').hidden);
    const result = await page.evaluate(() => {
      const g = Prototype.game;
      g.tick = () => {};
      g.s.mercyTime = 0;
      g.s.expeditionRank = 6;
      g.s.party = Array.from({ length: 6 }, () => g.unit('soldier', g.hero.x, g.hero.y));
      g.enter('citadel');
      Prototype.updateHUD();
      const units = [g.hero, ...g.activeLivingParty()];
      return {
        title: document.title,
        entry: { x: g.hero.x, y: g.hero.y },
        visibleAcquisition: g
          .zone()
          .enemies.filter((e) =>
            units.some(
              (u) =>
                Math.hypot(u.x - e.x, u.y - e.y) < g.enemyAcquisitionRange(e) &&
                g.enemyRangedLine(e, u),
            ),
          ).length,
      };
    });
    assert.deepEqual(result.entry, { x: 120, y: 140 });
    assert.equal(result.visibleAcquisition, 0);
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(__dirname, 'citadel-arrival-phone.png') });
    await page.locator('#touch-interact-button').tap();
    await page.waitForFunction(() => Prototype.game.zoneId === 'crown');
    result.touchExit = true;
    result.keeper = await page.evaluate(() => {
      const g = Prototype.game;
      g.s.party = [];
      g.enter('archive');
      const e = g.zone().enemies.find((e) => e.type === 'boss');
      Object.assign(g.hero, { x: e.x - 100, y: e.y });
      if (!g.startAttack(e, g.hero, 1)) throw Error('Keeper channels failed');
      Prototype.updateHUD();
      return { home: e.home, channels: e.telegraph.arenaLines.length };
    });
    assert.equal(result.keeper.channels, 2);
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(__dirname, 'keeper-defense-phone.png') });
    result.crag = await page.evaluate(() => {
      const g = Prototype.game;
      g.enter('supply-highlands');
      const e = g.zone().enemies.find((e) => e.roomCaptain);
      Object.assign(g.hero, { x: 570, y: 430 });
      if (!g.startCaptainAttack(e, g.hero)) throw Error('Crag skill failed');
      Prototype.updateHUD();
      return { home: e.home, bodyClear: !g.blocked(e.x, e.y, g.zoneId, g.actorRadius(e)) };
    });
    assert(result.crag.bodyClear);
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(__dirname, 'crag-defense-phone.png') });
    assert.deepEqual(errors, []);
    result.errors = errors;
    fs.writeFileSync(
      path.join(__dirname, process.env.PLAYTEST_URL ? 'live-result.json' : 'native-result.json'),
      JSON.stringify(result, null, 2) + '\n',
    );
    console.log(JSON.stringify(result));
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

'use strict';
const http = require('node:http'),
  { chromium } = require('playwright'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
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
      g.s.party = [];
      g.s.mercyTime = 0;
      g.hero.gold = 100;
      g.applyDeathPenalty();
      g.hero.gold = 200;
      g.applyDeathPenalty();
      g.enter('supply-vale');
      const captain = g.zone().enemies.find((e) => e.roomCaptain);
      let origin;
      for (let j = 0; j < 24; j++) {
        const a = (j * Math.PI) / 12,
          p = { x: captain.x + Math.cos(a) * 100, y: captain.y + Math.sin(a) * 100 };
        if (!g.blocked(p.x, p.y) && g.line(p, captain)) {
          origin = p;
          break;
        }
      }
      if (!origin) throw Error('No visible approach for actual captain hit');
      Object.assign(g.hero, origin);
      captain.hp = 1;
      if (!g.damage(captain, 10000, 'hero', { piercing: true })) throw Error('Captain hit failed');
      g.syncTreasuryRecovery(g.zone());
      const cache = g.zone().npcs.find((n) => n.treasuryRecovery);
      if (!cache) throw Error('No seized-crowns cache');
      Prototype.updateHUD();
      return {
        captain: captain.name,
        cache: { ...cache },
        wallet: g.hero.gold,
        balance: g.treasuryLostCrowns(),
      };
    });
    assert.equal(result.balance, 60);
    assert.equal(result.wallet, 160, 'captain victory does not automatically pay recovery');
    await page.waitForFunction(() =>
      document.querySelector('#message')?.innerText.includes('60 crowns recoverable'),
    );
    await page.screenshot({ path: path.join(__dirname, 'captain-defeated-phone.png') });
    await page.evaluate(() => {
      const g = Prototype.game,
        cache = g.zone().npcs.find((n) => n.treasuryRecovery);
      Object.assign(g.hero, { x: cache.x, y: cache.y });
      Prototype.updateHUD();
    });
    await page.locator('#touch-interact-button').tap();
    await page.waitForFunction(() => Prototype.game.treasuryLostCrowns() === 0);
    assert.equal(await page.evaluate(() => Prototype.game.hero.gold), 220);
    await page.waitForFunction(
      () => document.querySelector('#message')?.innerText.includes('Recovered 60 lost crowns'),
      null,
      { timeout: 20000 },
    );
    await page.screenshot({ path: path.join(__dirname, 'crowns-recovered-phone.png') });
    const saved = await page.evaluate(() => {
      Prototype.save();
      return {
        balance: Prototype.game.treasuryLostCrowns(),
        wallet: Prototype.game.hero.gold,
        visibleRecovery: Prototype.game.visibleNPCs().filter((n) => n.treasuryRecovery).length,
        receipt: Prototype.game.noticeHistory.findLast((n) => n.text.includes('Recovered 60')),
      };
    });
    assert.equal(saved.visibleRecovery, 0);
    await page.reload();
    await page.waitForFunction(() => window.Prototype?.game);
    assert.equal(await page.evaluate(() => Prototype.game.hero.gold), 220);
    assert.equal(await page.evaluate(() => Prototype.game.treasuryLostCrowns('vale')), 0);
    const frontier = await page.evaluate(() => {
      const g = Prototype.game;
      g.tick = () => {};
      g.s.party = [];
      g.s.mercyTime = 0;
      g.enter('frontier');
      g.hero.gold = 100;
      g.applyDeathPenalty();
      const captain = g.zone().enemies.find((e) => e.fieldCaptain);
      Object.assign(captain, g.safe(captain.home.x + 200, captain.home.y + 130));
      const diedAt = { x: captain.x, y: captain.y };
      let origin;
      for (let j = 0; j < 24; j++) {
        const a = (j * Math.PI) / 12,
          p = { x: captain.x + Math.cos(a) * 80, y: captain.y + Math.sin(a) * 80 };
        if (!g.blocked(p.x, p.y) && g.line(p, captain)) {
          origin = p;
          break;
        }
      }
      if (!origin) throw Error('No visible Frontier hit origin');
      Object.assign(g.hero, origin);
      captain.hp = 1;
      if (!g.damage(captain, 10000, 'hero', { piercing: true })) throw Error('Frontier hit failed');
      g.syncTreasuryRecovery(g.zone());
      const drop = g.zone().npcs.find((n) => n.treasuryRecovery);
      if (!drop) throw Error('Frontier captain dropped no cache');
      Prototype.save();
      Prototype.updateHUD();
      return { diedAt, drop: { x: drop.x, y: drop.y }, balance: g.treasuryLostCrowns('frontier') };
    });
    assert.equal(frontier.balance, 20);
    assert(
      Math.hypot(frontier.drop.x - frontier.diedAt.x, frontier.drop.y - frontier.diedAt.y) <= 140,
    );
    await page.waitForFunction(() =>
      document.querySelector('#message')?.innerText.includes('20 crowns recoverable'),
    );
    await page.screenshot({ path: path.join(__dirname, 'frontier-drop-phone.png') });
    await page.reload();
    await page.waitForFunction(() => window.Prototype?.game);
    const frontierPurse = await page.evaluate(() => {
      const g = Prototype.game;
      g.tick = () => {};
      const cache = g.zone().npcs.find((n) => n.treasuryRecovery);
      if (!cache) throw Error('Dropped cache missing after reload');
      window.frontierRestoredPoint = { x: cache.x, y: cache.y };
      Object.assign(g.hero, { x: cache.x, y: cache.y });
      Prototype.updateHUD();
      return g.hero.gold;
    });
    assert.deepEqual(await page.evaluate(() => frontierRestoredPoint), frontier.drop);
    await page.locator('#touch-interact-button').tap();
    await page.waitForFunction(() => Prototype.game.treasuryLostCrowns('frontier') === 0);
    assert.equal(await page.evaluate(() => Prototype.game.hero.gold), frontierPurse + 20);
    assert.deepEqual(errors, []);
    const receipt = {
      url: process.env.PLAYTEST_URL || 'local candidate',
      phone: '375x812',
      captainAnnouncement: result.captain + ' defeated · 60 crowns recoverable',
      automaticPayout: false,
      frontierDroppedAtKill: frontier,
      frontierTouchRecoveryAfterReload: true,
      touchCacheCollection: true,
      recovered: 60,
      wallet: 220,
      saveReload: true,
      javascriptErrors: errors,
    };
    fs.writeFileSync(
      path.join(__dirname, 'native-result.json'),
      JSON.stringify(receipt, null, 2) + '\n',
    );
    console.log(JSON.stringify(receipt));
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

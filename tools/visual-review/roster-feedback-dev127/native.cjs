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
    await page.evaluate(() => {
      const g = Prototype.game;
      g.tick = () => {};
      g.zone().enemies = [];
      g.s.party = ['soldier', 'archer', 'soldier'].map((t) => g.unit(t, g.hero.x + 40, g.hero.y));
      g.s.expeditionRank = 3;
      g.hero.gold = 1000;
      g.s.true.thorn = g.s.normal.thorn = true;
      const b = {
        id: 'roster-native',
        kind: 'barracks',
        name: 'Barracks',
        x: g.hero.x + 80,
        y: g.hero.y,
        progress: 4,
        queue: 0,
        queueType: null,
        full: false,
      };
      g.zone().buildings.push(b);
      window.rosterMenu = PrototypeMenus.create({
        getGame: () => g,
        Campaign,
        D: PrototypeData,
        action: (label, action, detail = '', disabled = false) => ({
          label,
          action,
          detail,
          disabled,
        }),
        openMenu: Prototype.openMenu,
        closeMenu: Prototype.closeMenu,
        recallSquad() {},
        showMap() {},
        finaleMenu() {},
      });
      window.rosterBase = b;
      rosterMenu.barracksMenu(b);
    });
    await page.getByRole('button', { name: /^Company/ }).click();
    await page.getByRole('button', { name: /^Manage active group/ }).click();
    await page
      .getByRole('button', { name: /^Rest / })
      .first()
      .click();
    assert.equal(await page.evaluate(() => Prototype.game.activeParty().length), 2);
    await page.locator('#close-button').click();
    await page.getByRole('button', { name: /^Boss pet collection/ }).click();
    await page.getByRole('button', { name: /Thorn/ }).click();
    await page.getByRole('button', { name: /^Recruit · FREE/ }).click();
    assert.equal(await page.evaluate(() => Prototype.game.activeParty().length), 3);
    await page.evaluate(() => {
      const g = Prototype.game;
      g.zone().enemies = [
        { id: 'threat', hp: 100, x: g.hero.x + 50, y: g.hero.y, aggro: true, neutral: false },
      ];
      rosterMenu.barracksMenu(rosterBase);
    });
    await page.getByRole('button', { name: /^Company/ }).click();
    await page.getByRole('button', { name: /^Manage active group/ }).click();
    const blocked = page.getByRole('button', { name: /^Rest / }).first();
    assert.equal(await blocked.isDisabled(), true);
    assert.match(await blocked.innerText(), /nearby enemies are engaged/);
    await blocked.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(__dirname, 'blocked-combat-phone.png') });
    assert.deepEqual(errors, []);
    const receipt = {
      startup: 'phone',
      url: process.env.PLAYTEST_URL || 'local candidate',
      viewport: '375x812',
      restRecruitPet: '3 → 2 → 3 through actual buttons',
      blockedReasonVisible: true,
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

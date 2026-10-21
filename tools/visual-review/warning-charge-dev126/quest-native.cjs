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
    const p = await open();
    await p.evaluate(() => {
      const g = Prototype.game;
      g.hero.class = 'mage';
      g.hero.skills = Array(8).fill(1);
      g.hero.hp = g.hero.maxHp = 10000;
      g.s.mercyTime = 999;
      window.questName = g.questDefs().find((q) => q.id === 'quest-4').name;
    });
    await p.locator('#menu-button').click();
    await p.locator('#modal-actions > button').filter({ hasText: 'Quest journal' }).first().click();
    await p
      .locator('#modal-actions > button')
      .filter({ hasText: await p.evaluate(() => questName) })
      .first()
      .click();
    await p.waitForFunction(
      () => Prototype.trackedQuest === 'quest-4' && Prototype.trackedWaypoint.points.length > 0,
    );
    const initial = await p.evaluate(() => Prototype.trackedWaypoint);
    await p.evaluate(() => {
      const g = Prototype.game,
        e = g.zone().enemies.find((e) => e.hp > 0 && !e.neutral);
      g.engage(e, true);
      g.hero.order = { type: 'attack', id: e.id };
      g.hero.cd[0] = 10;
    });
    await p.waitForTimeout(250);
    assert.equal(await p.evaluate(() => Prototype.trackedQuest), 'quest-4');
    assert((await p.evaluate(() => Prototype.trackedWaypoint.points.length)) > 0);
    await p.screenshot({
      path: path.join(out, 'quest-combat-waypoint.jpg'),
      type: 'jpeg',
      quality: 85,
    });
    await p.evaluate(() => {
      const g = Prototype.game,
        q = g.questDefs().find((q) => q.id === 'quest-4');
      for (const id of q.sites) g.s.discovered[q.region + ':' + id] = true;
      g.checkQuests();
    });
    await p.waitForFunction(() => Prototype.trackedQuest === null);
    // Select the cache quest through the same journal, then travel into its Treasury.
    await p.locator('#menu-button').click();
    await p.locator('#modal-actions > button').filter({ hasText: 'Quest journal' }).first().click();
    const cacheName = await p.evaluate(
      () => Prototype.game.questDefs().find((q) => q.id === 'quest-2').name,
    );
    await p.locator('#modal-actions > button').filter({ hasText: cacheName }).first().click();
    await p.evaluate(() => {
      const g = Prototype.game;
      g.s.expeditionRank = 6;
      g.s.party = Array.from({ length: 6 }, () => g.unit('soldier', 300, 130));
      g.enter('supply-vale');
    });
    await p.waitForFunction(() => Prototype.trackedWaypoint?.zone === 'supply-vale');
    await p.evaluate(() => {
      Prototype.game.tick = () => {};
      Prototype.renderer.draw();
    });
    await p.screenshot({ path: path.join(out, 'treasury-entry.jpg'), type: 'jpeg', quality: 85 });
    const cache = await p.evaluate(() => {
      const g = Prototype.game,
        n = g.zone().npcs.find((n) => n.kind === 'bundle');
      g.hero.x = n.x - 70;
      g.hero.y = n.y + 50;
      Prototype.renderer.draw();
      return { id: n.id, x: n.x, y: n.y };
    });
    await p.screenshot({
      path: path.join(out, 'treasury-cache-cue.jpg'),
      type: 'jpeg',
      quality: 85,
    });
    const collected = await p.evaluate((id) => {
      const g = Prototype.game;
      for (const e of g.zone().enemies) e.hp = 0;
      for (const [id, record] of Object.entries(g.s.pending))
        if (record.zone === g.zoneId) delete g.s.pending[id];
      const n = g.zone().npcs.find((n) => n.id === id);
      return g.interact(n) && !g.visibleNPCs().some((n) => n.id === id);
    }, cache.id);
    assert(collected);
    const file = __dirname + '/checks.json',
      result = JSON.parse(fs.readFileSync(file));
    result.questNavigation = {
      combatPersists: true,
      clearsOnCompletion: true,
      treasuryTransition: true,
      initialPoints: initial.points.length,
      cacheCollectedCueRemoved: true,
      errors,
    };
    fs.writeFileSync(file, JSON.stringify(result, null, 2) + '\n');
    assert.deepEqual(errors, []);
    console.log(
      'PASS actual quest-journal input, combat-persistent route, completion cleanup, Treasury transition, entry and cache cue',
    );
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

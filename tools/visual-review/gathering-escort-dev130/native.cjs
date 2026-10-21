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
    const setup = await page.evaluate(() => {
      const g = Prototype.game;
      g.tick = () => {};
      g.s.expeditionRank = 2;
      g.s.mercyTime = 0;
      g.zone().enemies = [];
      g.s.party = Array.from({ length: 4 }, () => g.unit('soldier', 2000, 2000));
      g.s.party[0].carry = 35;
      g.s.party[1].carry = 0;
      g.s.party[2].carry = 0.6;
      g.s.party[2].active = false;
      g.s.party[3].carry = 0.4;
      g.s.party[3].active = false;
      g.s.party[3].hp = 0;
      const n = g.zone().npcs.find((n) => n.kind === 'supplier');
      Object.assign(g.hero, { x: n.x, y: n.y });
      Prototype.updateHUD();
      return { gold: g.hero.gold, node: g.visibleResourceNodes()[0].id };
    });
    await page.locator('#touch-interact-button').tap();
    await page.waitForFunction(() => !document.getElementById('modal').hidden);
    assert.equal(await page.evaluate(() => Prototype.game.hero.gold), setup.gold + 36);
    assert(await page.evaluate(() => Prototype.game.s.party.every((u) => u.carry === 0)));
    assert.equal(await page.evaluate(() => Prototype.game.s.party[3].hp), 0);
    await page.screenshot({ path: path.join(__dirname, 'supplies-phone.png') });
    await page.getByRole('button', { name: /^Gather resources/ }).tap();
    await page
      .getByRole('button', { name: /^Recover Dark Lord Tribute/ })
      .first()
      .tap();
    await page.waitForFunction(
      () =>
        Prototype.trackedWaypoint?.kind === 'gathering' &&
        Prototype.trackedWaypoint.points.length > 0,
    );
    const dispatched = await page.evaluate(() => ({
      target: Prototype.game.s.gatheringTarget,
      assigned: Prototype.game.activeLivingParty().filter((u) => u.order?.type === 'gather').length,
      waypoint: Prototype.trackedWaypoint,
    }));
    assert.equal(dispatched.assigned, 2);
    assert.equal(dispatched.target.id, setup.node);
    await page.screenshot({ path: path.join(__dirname, 'escort-route-phone.png') });
    const combat = await page.evaluate(() => {
      const g = Prototype.game,
        u = g.activeLivingParty()[0],
        n = g.zone().nodes.find((n) => n.id === g.s.gatheringTarget.id);
      Object.assign(g.hero, g.safe(n.x - 120, n.y));
      Object.assign(u, g.safe(g.hero.x + 30, g.hero.y));
      const e = g.makeEnemy(
        { species: 'goblin', level: 1, hp: 1000, damage: 5, gold: 0, xp: 0 },
        g.safe(u.x + 40, u.y),
      );
      g.zone().enemies.push(e);
      g.engage(e);
      const hp = e.hp,
        amount = n.amount;
      g.s.time += 0.1;
      for (let i = 0; i < 15 && e.hp === hp && !g._companionCharges?.has(u.id); i++) {
        g.s.time += 0.1;
        g.updateParty(0.1);
      }
      const result = {
        fought: e.hp < hp || !!g._companionCharges?.has(u.id),
        paused: n.amount === amount,
        order: u.order?.id,
        visible: g.line(u, e),
        distance: Math.hypot(u.x - e.x, u.y - e.y),
        cd: u.cd,
        target: g._tacticalPartyTargets?.get(u.id),
        retreating: g.companionRetreating(u),
      };
      g.recallParty();
      Prototype.updateHUD();
      Prototype.save();
      return result;
    });
    assert(combat.fought && combat.paused, JSON.stringify(combat));
    assert.equal(combat.order, setup.node);
    await page.waitForFunction(() => Prototype.trackedWaypoint?.kind === 'gathering');
    await page.reload();
    await page.waitForFunction(() => window.Prototype?.game);
    await page.waitForFunction(() => Prototype.trackedWaypoint?.kind === 'gathering');
    await page.evaluate(() => {
      const g = Prototype.game;
      g.tick = () => {};
      g.zone().enemies = [];
      const n = g.zone().npcs.find((n) => n.kind === 'supplier');
      Object.assign(g.hero, { x: n.x, y: n.y });
      Prototype.updateHUD();
    });
    await page.locator('#touch-interact-button').tap();
    await page.getByRole('button', { name: /^Gather resources/ }).tap();
    await page.getByRole('button', { name: /^Locate & gather hidden/ }).tap();
    await page.waitForFunction(() => {
      const g = Prototype.game,
        n = g.zone().nodes.find((n) => n.id === g.s.gatheringTarget?.id);
      return n?.hidden && g.tributeKnown(n) && Prototype.trackedWaypoint?.id === n.id;
    });
    const hidden = await page.evaluate(() => Prototype.game.s.gatheringTarget.id);
    await page.evaluate(() => {
      const g = Prototype.game,
        n = g.zone().nodes.find((n) => n.id === g.s.gatheringTarget.id);
      n.amount = 1;
      for (const u of g.activeLivingParty()) Object.assign(u, { x: n.x, y: n.y, carry: 0 });
      g.s.time += 0.1;
      g.updateParty(0.1);
    });
    await page.waitForFunction(() => Prototype.trackedWaypoint === null);
    // Known source remains directly actionable without going back to either service.
    const direct = await page.evaluate(() => {
      const g = Prototype.game,
        n = g.visibleResourceNodes().find((n) => !n.hidden);
      g.recallParty();
      Object.assign(g.hero, { x: n.x, y: n.y });
      return g.interact(n) && g.s.gatheringTarget.id === n.id;
    });
    assert(direct);
    const expedition = await page.evaluate(() => {
      const g = Prototype.game;
      g.recallParty();
      g.enter('march');
      g.zone().enemies = [];
      g.s.expeditionRank = 2;
      g.s.rescued.crypt = true;
      g.s.rescued.thorn = true;
      g.s.normal.ridge = true;
      g.s.true.ridge = true;
      g.checkQuests();
      g.s.party = [g.unit('soldier', g.hero.x, g.hero.y)];
      if (!g.build()) throw new Error('Native fixture Full Barracks construction failed');
      const b = g.zone().buildings.at(-1);
      Object.assign(b, { progress: 4, full: true });
      g.s.party[0].order = null;
      const treasurer = g.unit('pet', g.hero.x, g.hero.y, 'ridge');
      g.s.party.push(treasurer);
      Object.assign(g.hero, { x: b.x, y: b.y });
      Prototype.updateHUD();
      return {
        gold: g.hero.gold,
        worker: treasurer.id,
        region: 'Greenwood Vale',
        total: g.s.zones.vale.nodes.reduce((sum, n) => sum + n.amount, 0),
      };
    });
    await page.locator('#touch-interact-button').tap();
    await page.getByRole('button', { name: /^Resource expeditions/ }).tap();
    await page.getByRole('button', { name: /^Greenwood/ }).tap();
    await page.getByRole('button', { name: /^Little Treasurer/ }).tap();
    assert(await page.evaluate(() => Prototype.game.s.resourceExpeditions.length === 1));
    await page.screenshot({ path: path.join(__dirname, 'expedition-phone.png') });
    await page.evaluate(() => Prototype.save());
    await page.reload();
    await page.waitForFunction(() => window.Prototype?.game?.s.resourceExpeditions.length === 1);
    const returned = await page.evaluate(() => {
      const g = Prototype.game;
      g.tick = () => {};
      const job = g.s.resourceExpeditions[0];
      g.s.time = job.finishAt;
      g.advanceResourceExpeditions();
      Prototype.updateHUD();
      Prototype.save();
      return {
        gold: g.hero.gold,
        jobs: g.s.resourceExpeditions.length,
        pet: g.s.party.find((u) => u.id === job.workerId),
      };
    });
    assert.equal(returned.gold, expedition.gold + expedition.total);
    assert.equal(returned.jobs, 0);
    assert.equal(returned.pet.petFamily, 'ridge');
    assert(!returned.pet.expeditionId);
    await page.reload();
    await page.waitForFunction(() => window.Prototype?.game);
    assert.equal(await page.evaluate(() => Prototype.game.hero.gold), returned.gold);
    assert.deepEqual(errors, []);
    const result = {
      version: await page.evaluate(() => PrototypeBuild.version),
      suppliesPayout: 36,
      allCompanyCargoCleared: true,
      fallenStayedFallen: true,
      assigned: dispatched.assigned,
      guidePersistsCombatRecallReload: true,
      combat,
      hidden,
      exhaustionClearsGuide: true,
      directKnownSite: direct,
      expedition: {
        treasurerSelectedByTouch: true,
        savedWhileAway: true,
        recovered: expedition.total,
        returnedOnce: true,
      },
      errors,
    };
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

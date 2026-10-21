'use strict';
const http = require('node:http'),
  fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  { chromium } = require('playwright');
(async () => {
  const root = path.resolve(__dirname, '../../..'),
    server = http.createServer((req, res) => {
      const p = path.join(root, new URL(req.url, 'http://local').pathname);
      if (!fs.existsSync(p) || !fs.statSync(p).isFile()) {
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
        }[path.extname(p)] || 'application/octet-stream',
      );
      fs.createReadStream(p).pipe(res);
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
    page.setDefaultTimeout(15000);
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
      const n = g.zone().npcs.find((n) => n.family === 'crypt');
      Object.assign(g.hero, { x: n.x, y: n.y });
      g.s.party = [g.unit('soldier', n.x, n.y)];
      Prototype.updateHUD();
    });
    await page.locator('#touch-interact-button').tap();
    await page.waitForFunction(() => !document.getElementById('modal').hidden);
    assert.equal(
      await page.evaluate(() => Prototype.game.zoneId),
      'vale',
      'interaction opens menu before entering',
    );
    assert.equal(await page.locator('#modal-actions button').count(), 2);
    await page.screenshot({ path: path.join(__dirname, 'entrance-phone.png') });
    await page.getByRole('button', { name: /^Build Barracks & set recovery/ }).tap();
    assert.equal(await page.evaluate(() => Prototype.game.zone().buildings.length), 1);
    assert.equal(await page.evaluate(() => Prototype.game.selectedBarracksRespawn()), null);
    await page.evaluate(() => Prototype.save());
    await page.reload();
    await page.waitForFunction(() => window.Prototype?.game);
    const camp = await page.evaluate(() => {
      const g = Prototype.game;
      g.tick = () => {};
      g.zone().enemies = [];
      const b = g.zone().buildings[0],
        u = g.s.party[0];
      if (u.order?.type !== 'build') throw Error('Construction assignment lost on reload');
      Object.assign(u, { x: b.x, y: b.y });
      for (let i = 0; i < 45; i++) {
        g.s.time += 0.1;
        g.updateParty(0.1);
      }
      Prototype.updateHUD();
      return { id: b.id, selected: g.selectedBarracksRespawn()?.barracks.id, progress: b.progress };
    });
    assert.equal(camp.progress, 4);
    assert.equal(camp.id, camp.selected);
    await page.locator('#touch-interact-button').tap();
    await page.waitForFunction(() => Prototype.game.zoneId === 'crypt');
    assert(
      await page.evaluate(() => document.getElementById('modal').hidden),
      'prepared camp skips repeat menu',
    );
    const combat = await page.evaluate(() => {
      const g = Prototype.game,
        z = g.zone(),
        guards = z.enemies.filter((e) => e.guard && !e.reinforcement),
        boss = z.enemies.find((e) => e.type === 'boss');
      const ids = guards.slice(0, 2).map((e) => e.id);
      for (const e of guards.slice(0, 2)) {
        e.hp = 0;
        e.heroParticipated = true;
        g.kill(e);
      }
      boss.hp = 1;
      const exit = z.npcs.find((n) => n.kind === 'exit');
      Object.assign(g.hero, { x: exit.x, y: exit.y });
      Prototype.updateHUD();
      return { ids, boss: boss.id, count: guards.length };
    });
    await page.locator('#touch-interact-button').tap();
    await page.waitForFunction(() => Prototype.game.zoneId === 'vale');
    const restored = await page.evaluate(() => {
      const g = Prototype.game,
        n = g.zone().npcs.find((n) => n.family === 'crypt'),
        z = g.s.zones.crypt;
      return {
        arrival: Math.hypot(g.hero.x - n.x, g.hero.y - n.y),
        guards: z.enemies.filter((e) => e.guard && e.hp > 0).length,
        bossFull:
          z.enemies.find((e) => e.type === 'boss').hp ===
          z.enemies.find((e) => e.type === 'boss').baseHp,
      };
    });
    assert(restored.arrival < 100);
    assert.equal(restored.guards, combat.count);
    assert(restored.bossFull);
    await page.screenshot({ path: path.join(__dirname, 'outside-camp-phone.png') });
    await page.evaluate(() => {
      const g = Prototype.game;
      g.enter('crypt');
      g.die();
      Prototype.updateHUD();
      Prototype.save();
    });
    const recovered = await page.evaluate(() => {
      const g = Prototype.game,
        b = g.selectedBarracksRespawn()?.barracks;
      return {
        zone: g.zoneId,
        selected: b?.id,
        distance: b && Math.hypot(g.hero.x - b.x, g.hero.y - b.y),
      };
    });
    assert.equal(recovered.zone, 'vale');
    assert.equal(recovered.selected, camp.id);
    assert(recovered.distance < 120);
    await page.evaluate(() => {
      const g = Prototype.game;
      g.enter('vale');
      const n = g.zone().npcs.find((n) => n.family === 'supply-vale');
      Object.assign(g.hero, { x: n.x, y: n.y });
      Prototype.updateHUD();
    });
    await page.locator('#touch-interact-button').tap();
    await page.getByRole('button', { name: /^Enter dungeon/ }).tap();
    await page.waitForFunction(() => Prototype.game.zoneId === 'supply-vale');
    const treasury = await page.evaluate(() => {
      const g = Prototype.game,
        site = g.treasuryRecoverySite(),
        captain = g.treasuryCaptain(g.zone(), site),
        count = g.zone().enemies.filter((e) => e.roomGuard && !e.reinforcement).length;
      captain.hp = 0;
      captain.heroParticipated = true;
      g.kill(captain);
      const empty = g.zone().enemies.every((e) => e.neutral || e.hp <= 0),
        deadline = g.treasuryRecoveryState().respawnAt;
      const exit = g.zone().npcs.find((n) => n.kind === 'exit');
      Object.assign(g.hero, { x: exit.x, y: exit.y });
      Prototype.updateHUD();
      return { empty, deadline, count };
    });
    assert(treasury.empty);
    await page.locator('#touch-interact-button').tap();
    await page.waitForFunction(() => Prototype.game.zoneId === 'vale');
    await page.locator('#touch-interact-button').tap();
    await page.getByRole('button', { name: /^Enter dungeon/ }).tap();
    await page.waitForFunction(() => Prototype.game.zoneId === 'supply-vale');
    assert(
      await page.evaluate(() => Prototype.game.zone().enemies.every((e) => e.neutral || e.hp <= 0)),
    );
    assert.equal(
      await page.evaluate(() => Prototype.game.treasuryRecoveryState().respawnAt),
      treasury.deadline,
    );
    await page.evaluate((deadline) => {
      const g = Prototype.game;
      g.enter('vale');
      g.s.time = deadline + 1;
      const n = g.zone().npcs.find((n) => n.family === 'supply-vale');
      Object.assign(g.hero, { x: n.x, y: n.y });
      Prototype.updateHUD();
    }, treasury.deadline);
    await page.locator('#touch-interact-button').tap();
    await page.getByRole('button', { name: /^Enter dungeon/ }).tap();
    await page.waitForFunction(() => Prototype.game.zoneId === 'supply-vale');
    assert.equal(
      await page.evaluate(
        () => Prototype.game.zone().enemies.filter((e) => e.roomGuard && e.hp > 0).length,
      ),
      treasury.count,
    );
    assert(
      await page.evaluate(() =>
        Prototype.game.zone().enemies.some((e) => e.roomCaptain && e.hp > 0),
      ),
    );
    await page.evaluate(() => {
      const g = Prototype.game;
      g.enter('vale');
      const n = g.zone().npcs.find((n) => n.family === 'side-vale-cellars');
      Object.assign(g.hero, { x: n.x, y: n.y });
      Prototype.updateHUD();
    });
    await page.locator('#touch-interact-button').tap();
    await page.waitForFunction(() => Prototype.game.zoneId === 'side-vale-cellars');
    assert(await page.evaluate(() => document.getElementById('modal').hidden));
    assert.deepEqual(errors, []);
    const result = {
      version: await page.evaluate(() => PrototypeBuild.version),
      twoChoiceEntrance: true,
      directRepeatEntry: true,
      camp,
      campAssignmentSurvivesReload: true,
      restored,
      recovered,
      treasury: {
        emptyUntilDue: true,
        deadlineUnchangedByDoors: true,
        fullGarrisonReturnsWithCaptain: true,
      },
      sideDungeonDirect: true,
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

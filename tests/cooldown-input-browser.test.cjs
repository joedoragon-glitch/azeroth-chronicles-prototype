'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const webkit = process.env.BROWSER_ENGINE === 'webkit';
  const browser = await (webkit ? pw.webkit : pw.chromium).launch(
    webkit
      ? {}
      : {
          executablePath: process.env.CHROMIUM_EXECUTABLE,
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        },
  );
  try {
    const context = await browser.newContext({
      viewport: { width: webkit ? 375 : 1280, height: 800 },
      hasTouch: webkit,
      isMobile: webkit,
    });
    const page = await context.newPage();
    await page.goto(
      'http://127.0.0.1:' + server.address().port + '/' + (webkit ? 'phone.html' : 'index.html'),
    );
    await page.waitForFunction(() => window.Prototype);
    await page.keyboard.press('f');
    await page.keyboard.press('f');
    await page.waitForFunction(() => document.querySelector('#modal').hidden);
    await page.evaluate(() => {
      const g = Prototype.game;
      g.zone().props = [];
      g.zone().npcs = [];
      g.zone().nodes = [];
      g.zone().buildings = [];
      g.s.party = [];
      g.s.mercyTime = 0;
      g.updateEnemies = () => {};
      g.updatePacks = () => {};
      g.updateNight = () => {};
      g.updateElites = () => {};
      window.__cooldownCasts = [];
      const cast = g.cast;
      g.cast = function (slot, target, charged, ...rest) {
        const result = cast.call(this, slot, target, charged, ...rest);
        if (result)
          __cooldownCasts.push({
            slot,
            targetId: target ?? null,
            charged: !!charged,
            cd: this.hero.cd[slot - 1],
            mp: this.hero.mp,
          });
        return result;
      };
    });
    const press = async (slot) => {
      if (webkit)
        await page.locator('#skill-' + slot).evaluate((el) => {
          el.setPointerCapture = () => {};
          el.onpointerdown({ pointerType: 'touch', pointerId: 91, preventDefault() {} });
        });
      else await page.keyboard.down(String(slot));
    };
    const release = async (slot) => {
      if (webkit)
        await page
          .locator('#skill-' + slot)
          .evaluate((el) => el.onpointerup({ pointerType: 'touch', pointerId: 91 }));
      else await page.keyboard.up(String(slot));
    };
    let count = 0;
    for (const cls of ['paladin', 'mage', 'ranger'])
      for (let rank = 0; rank <= 5; rank++)
        for (const slot of [1, 2, 3]) {
          await page.evaluate(
            ({ cls, rank, slot }) => {
              const g = Prototype.game,
                h = g.hero;
              Object.assign(h, {
                class: cls,
                power: Campaign.classes[cls].power,
                x: 600,
                y: 900,
                order: null,
                mp: 0,
                hp: 50,
                maxHp: 500,
              });
              h.skills = Array(8).fill(1);
              h.talents = [0, rank, 0, 0];
              h.cd = Array(8).fill(0);
              h.cd[slot - 1] = 5;
              const e = g.makeEnemy(
                {
                  species: 'goblin',
                  name: 'Input fixture',
                  level: 1,
                  hp: 10000,
                  damage: 0,
                  xp: 0,
                  gold: 0,
                },
                { x: 680, y: 900 },
              );
              g.zone().enemies = [e];
              g.s.heroTarget = e.id;
              g.s.projectiles = [];
              window.__cooldownCasts = [];
              Prototype.updateHUD();
            },
            { cls, rank, slot },
          );
          await press(slot);
          const waiting = await page.evaluate(() => Prototype.chargePresentation());
          assert(
            waiting.waiting && waiting.progress === 0,
            'queued charge does not preload its hold',
          );
          assert.equal(await page.evaluate(() => __cooldownCasts.length), 0);
          await page.evaluate((slot) => {
            Prototype.game.hero.cd[slot - 1] = 0.05;
          }, slot);
          await page.waitForFunction(() => Prototype.chargePresentation()?.state === 'charging');
          await page.waitForFunction(() => Prototype.chargePresentation()?.ready, null, {
            timeout: 3000,
          });
          await release(slot);
          const rows = await page.evaluate(() => __cooldownCasts);
          assert.equal(rows.length, 1, JSON.stringify({ cls, rank, slot, rows }));
          assert(rows[0].charged);
          assert.equal(rows[0].mp, 0);
          const expected = [0, 3, 6, 20][slot] * (1 - 0.04 * rank);
          assert(
            Math.abs(rows[0].cd - expected) < 1e-9,
            JSON.stringify({ cls, rank, slot, rows, expected }),
          );
          count++;
        }
    // Real keyboard/touch holds must carry the pre-aggro receipt to impact.
    for (const kind of ['boss', 'captain']) {
      await page.evaluate((kind) => {
        const g = Prototype.game;
        const e = g.makeEnemy(
          { species: 'goblin', name: 'Opener', level: 1, hp: 10000, damage: 0, xp: 0, gold: 0 },
          { x: 680, y: 900 },
        );
        if (kind === 'boss') e.type = 'boss';
        else e.captain = true;
        g.zone().enemies = [e];
        g.s.projectiles = [];
        Object.assign(g.hero, { class: 'ranger', x: 600, y: 900, order: null });
        g.hero.skills[0] = 1;
        g.hero.cd[0] = 0;
        g.s.heroTarget = e.id;
        Prototype.updateHUD();
      }, kind);
      await press(1);
      await page.waitForFunction(() => Prototype.chargePresentation()?.ready, null, {
        timeout: 3000,
      });
      const earlierHit = await page.evaluate(() => {
        const g = Prototype.game;
        const e = g.zone().enemies[0];
        g.engage(e);
        const ally = g.s.party.find((unit) => unit.hp > 0);
        if (ally) Object.assign(ally, { x: g.hero.x, y: g.hero.y });
        const landed = g.damage(e, 37, ally?.id || 'hero');
        return { landed, hp: e.hp, maxHp: e.maxHp };
      });
      assert(earlierHit.landed && earlierHit.hp < earlierHit.maxHp);
      await release(1);
      const deflected = await page.evaluate(() => {
        const g = Prototype.game;
        g.updateProjectiles(0.2);
        g.updateProjectiles(0.2);
        const e = g.zone().enemies[0];
        return {
          hp: e.hp,
          aggro: e.aggro,
          shots: g.s.projectiles.length,
          feedback: g.messages.some((message) => message.includes('deflects')),
        };
      });
      assert.equal(deflected.hp, earlierHit.hp, 'prior damage survives deflection');
      assert.equal(deflected.aggro, true, kind + ' remains engaged');
      assert.equal(deflected.shots, 0, 'no delayed Ranger arrows remain');
      assert(deflected.feedback, kind + ' displays deflection feedback');
      await page.evaluate(() => {
        Prototype.game.hero.cd[0] = 0;
      });
      await press(1);
      await page.waitForFunction(() => Prototype.chargePresentation()?.ready, null, {
        timeout: 3000,
      });
      await release(1);
      const valid = await page.evaluate(() => {
        const g = Prototype.game;
        g.updateProjectiles(0.2);
        const e = g.zone().enemies[0];
        return { hp: e.hp, maxHp: e.maxHp, aggro: e.aggro };
      });
      assert(valid.aggro && valid.hp < earlierHit.hp, kind + ' accepts in-combat charges');
    }
    // A charge never fires on its own. If the initial aim is lost, the
    // player release retargets to the selected eligible foe, then the nearest.
    // Preserve existing live boss locks instead of hitting their summons.
    for (const cls of ['paladin', 'mage', 'ranger'])
      for (const slot of [1, 2])
        for (const scenario of ['selected', 'nearest']) {
          await page.evaluate(({ cls }) => {
            const g = Prototype.game;
            Object.assign(g.hero, { class: cls, x: 600, y: 900, order: null });
            g.hero.skills = Array(8).fill(1);
            g.hero.cd = Array(8).fill(0);
            g.manualHeroTargetId = null;
            g.manualHeroTargetZone = null;
            g.manualHeroTargetLocked = false;
            const make = (name, x) =>
              g.makeEnemy(
                { species: 'goblin', name, level: 1, hp: 10000, damage: 0, xp: 0, gold: 0 },
                { x, y: 900 },
              );
            const original = make('Original', 680),
              nearer = make('Nearest', 650),
              chosen = make('Selected', 695);
            g.zone().enemies = [original, nearer, chosen];
            g.s.heroTarget = original.id;
            g.s.projectiles = [];
            window.__retargetFoes = { original: original.id, nearer: nearer.id, chosen: chosen.id };
            window.__cooldownCasts = [];
            Prototype.updateHUD();
          }, { cls });
          await press(slot);
          await page.waitForFunction(() => Prototype.chargePresentation()?.ready, null, {
            timeout: 3000,
          });
          assert.equal(
            await page.evaluate(() => __cooldownCasts.length),
            0,
            'charged ability does not auto-fire at 100%',
          );
          await page.evaluate((scenario) => {
            const g = Prototype.game;
            g.zone().enemies = g.zone().enemies.filter((e) => e.id !== __retargetFoes.original);
            if (scenario === 'selected') {
              g.manualHeroTargetId = __retargetFoes.chosen;
              g.manualHeroTargetZone = g.zoneId;
              g.manualHeroTargetLocked = false;
              g.s.heroTarget = __retargetFoes.chosen;
            } else {
              g.manualHeroTargetId = null;
              g.manualHeroTargetZone = null;
              g.manualHeroTargetLocked = false;
              g.s.heroTarget = null;
            }
          }, scenario);
          assert.equal(await page.evaluate(() => Prototype.chargePresentation()?.state), 'ready');
          await release(slot);
          const result = await page.evaluate(() => ({
            casts: __cooldownCasts,
            cooldown: Prototype.game.hero.cd[slot - 1],
            foes: __retargetFoes,
          }));
          assert.equal(result.casts.length, 1, JSON.stringify({ cls, slot, scenario, result }));
          assert.equal(result.casts[0].charged, true);
          assert.equal(
            result.casts[0].targetId,
            scenario === 'selected' ? result.foes.chosen : result.foes.nearer,
            'retarget on player release, not to the disappeared enemy',
          );
        }
    for (const scenario of ['no-target', 'locked-range', 'original-valid']) {
      await page.evaluate(() => {
        const g = Prototype.game;
        Object.assign(g.hero, { class: 'paladin', x: 600, y: 900, order: null });
        g.hero.skills = Array(8).fill(1);
        g.hero.cd = Array(8).fill(0);
        g.manualHeroTargetId = null;
        g.manualHeroTargetZone = null;
        g.manualHeroTargetLocked = false;
        const make = (name, x) =>
          g.makeEnemy(
            { species: 'goblin', name, level: 1, hp: 10000, damage: 0, xp: 0, gold: 0 },
            { x, y: 900 },
          );
        const original = make('Original', 680), near = make('Nearest', 650);
        g.zone().enemies = [original, near];
        g.s.heroTarget = original.id;
        g.s.projectiles = [];
        window.__retargetFoes = { original: original.id, nearer: near.id };
        window.__cooldownCasts = [];
        Prototype.updateHUD();
      });
      await press(1);
      await page.waitForFunction(() => Prototype.chargePresentation()?.ready, null, {
        timeout: 3000,
      });
      await page.evaluate((scenario) => {
        const g = Prototype.game;
        if (scenario === 'no-target') g.zone().enemies = [];
        if (scenario === 'locked-range') {
          const e = g.zone().enemies.find((enemy) => enemy.id === __retargetFoes.original);
          e.x = 850; // Out of charged Skill 1 range, still a live locked foe.
          g.manualHeroTargetId = e.id;
          g.manualHeroTargetZone = g.zoneId;
          g.manualHeroTargetLocked = true;
        }
      }, scenario);
      assert.equal(
        await page.evaluate(() => Prototype.chargePresentation()?.state),
        scenario === 'original-valid' ? 'ready' : 'no-target',
        scenario,
      );
      await release(1);
      const outcome = await page.evaluate(() => ({
        casts: __cooldownCasts,
        cooldown: Prototype.game.hero.cd[0],
        originalId: __retargetFoes.original,
      }));
      if (scenario === 'original-valid') {
        assert.equal(outcome.casts.length, 1);
        assert.equal(outcome.casts[0].targetId, outcome.originalId);
      } else {
        assert.equal(outcome.casts.length, 0, scenario + ' must not fire at an arbitrary foe');
        assert.equal(outcome.cooldown, 0, scenario + ' must not spend cooldown');
      }
    }
    // Releasing a queued hold before readiness never spends or resets the slot.
    await page.evaluate(() => {
      Prototype.game.hero.cd[0] = 5;
      window.__cooldownCasts = [];
    });
    await press(1);
    await release(1);
    assert.equal(await page.evaluate(() => __cooldownCasts.length), 0);
    assert(await page.evaluate(() => Prototype.game.hero.cd[0] > 4));
    console.log(
      'PASS ' +
        (webkit ? 'WebKit touch' : 'Chromium keyboard') +
        ' ' +
        count +
        ' zero-MP queued charges across all classes, ranks 0–5 and charged slots, plus cancellation',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});

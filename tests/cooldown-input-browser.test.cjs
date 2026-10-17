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
    await require('./helpers/language-browser.cjs').selectEnglish(page);
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
        const selectedAtCast = this.selectedHeroTarget()?.id ?? null;
        const manualAtCast = this.manualHeroTargetId ?? null;
        const result = cast.call(this, slot, target, charged, ...rest);
        if (result)
          __cooldownCasts.push({
            slot,
            targetId: target ?? null,
            selectedAtCast,
            manualAtCast,
            charged: !!charged,
            cd: this.hero.cd[slot - 1],
            mp: this.hero.mp,
          });
        return result;
      };
    });
    // Exercise the shipped desktop bindings: slots 6–8 use Space, Shift and B.
    const desktopKey = (slot) => [null, '1', '2', '3', '4', '5', 'Space', 'ShiftLeft', 'b'][slot];
    const press = async (slot) => {
      if (webkit)
        await page.locator('#skill-' + slot).evaluate((el) => {
          el.setPointerCapture = () => {};
          el.onpointerdown({ pointerType: 'touch', pointerId: 91, preventDefault() {} });
        });
      else await page.keyboard.down(desktopKey(slot));
    };
    const release = async (slot) => {
      if (webkit)
        await page
          .locator('#skill-' + slot)
          .evaluate((el) => el.onpointerup({ pointerType: 'touch', pointerId: 91 }));
      else await page.keyboard.up(desktopKey(slot));
    };
    let count = 0;
    for (const cls of ['paladin', 'mage', 'ranger'])
      for (let rank = 0; rank <= 5; rank++)
        for (const slot of [1, 2, 3, 4, 5, 6, 7, 8]) {
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
              h.shieldStance = 0;
              h.shieldRank = 0;
              delete h.silenceField;
              g.clearPartyCharges();
              g.s.party = cls === 'ranger' && slot === 4 ? [g.unit('soldier', 620, 900)] : [];
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
            waiting?.waiting && waiting.progress === 0,
            'queued charge does not preload its hold: ' +
              JSON.stringify({ cls, rank, slot, waiting }),
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
          const expected = [0, 3, 6, 20, 20, 18, 12, 25, 40][slot] * (1 - 0.04 * rank);
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
          await page.evaluate(
            ({ cls }) => {
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
              // Pin the initial aim before charging; ambient hero auto-combat
              // can otherwise select the closer enemy between test actions.
              if (g.cycleHeroTarget((e) => e.id === original.id)?.id !== original.id)
                throw new Error('initial charged target must be the original foe');
              g.s.projectiles = [];
              window.__retargetFoes = {
                original: original.id,
                nearer: nearer.id,
                chosen: chosen.id,
              };
              window.__cooldownCasts = [];
              Prototype.updateHUD();
            },
            { cls },
          );
          await press(slot);
          assert.equal(
            await page.evaluate(() => Prototype.chargePresentation()?.targetId),
            await page.evaluate(() => __retargetFoes.original),
            'charge must start with the original foe before fallback is tested',
          );
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
              // Use the public player targeting action rather than inserting
              // synthetic targeting state directly into the running game.
              const selected = g.cycleHeroTarget((e) => e.id === __retargetFoes.chosen);
              window.__selectedRetargetId = selected?.id ?? null;
            } else {
              g.manualHeroTargetId = null;
              g.manualHeroTargetZone = null;
              g.manualHeroTargetLocked = false;
              g.s.heroTarget = null;
            }
          }, scenario);
          if (scenario === 'selected') {
            const selectedId = await page.evaluate(
              () => Prototype.game.selectedHeroTarget()?.id ?? null,
            );
            assert.equal(
              selectedId,
              await page.evaluate(() => __retargetFoes.chosen),
              'selected fallback must be a valid player target before release',
            );
          }
          assert.equal(await page.evaluate(() => Prototype.chargePresentation()?.state), 'ready');
          await release(slot);
          const result = await page.evaluate(() => ({
            casts: __cooldownCasts,
            foes: __retargetFoes,
          }));
          assert.equal(result.casts.length, 1, JSON.stringify({ cls, slot, scenario, result }));
          assert.equal(result.casts[0].charged, true);
          assert.equal(
            result.casts[0].targetId,
            scenario === 'selected' ? result.foes.chosen : result.foes.nearer,
            JSON.stringify({ cls, slot, scenario, result }),
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
        const original = make('Original', 680),
          near = make('Nearest', 650);
        g.zone().enemies = [original, near];
        if (g.cycleHeroTarget((e) => e.id === original.id)?.id !== original.id)
          throw new Error('initial charged target must be the original foe');
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
          // Keep the nearer distractor off the actual approach lane: body
          // blocking remains a separate, intentional combat constraint.
          g.zone().enemies.find((enemy) => enemy.id === __retargetFoes.nearer).y = 950;
          g.manualHeroTargetId = e.id;
          g.manualHeroTargetZone = g.zoneId;
          g.manualHeroTargetLocked = true;
          window.__approachTick = g.tick;
          g.tick = () => {};
        }
      }, scenario);
      assert.equal(
        await page.evaluate(() => Prototype.chargePresentation()?.state),
        scenario === 'no-target' ? 'no-target' : 'ready',
        scenario,
      );
      await release(1);
      const outcome = await page.evaluate(() => ({
        casts: __cooldownCasts,
        cooldown: Prototype.game.hero.cd[0],
        originalId: __retargetFoes.original,
        order: Prototype.game.hero.order,
      }));
      if (scenario === 'locked-range') {
        assert.equal(outcome.order?.type, 'skill-approach', 'release approaches the selected foe');
        assert.equal(outcome.cooldown, 0, 'approach does not spend a skill cooldown');
        assert(outcome.casts.every((c) => c.targetId === outcome.originalId));
        await page.evaluate(() => {
          Prototype.game.tick = __approachTick;
          delete window.__approachTick;
        });
        await page
          .waitForFunction(() => __cooldownCasts.some((c) => c.cd > 0), null, {
            timeout: 8000,
          })
          .catch(async (error) => {
            throw Error(
              error.message +
                ' ' +
                JSON.stringify(
                  await page.evaluate(() => ({
                    hero: Prototype.game.hero,
                    foes: Prototype.game.zone().enemies,
                    casts: __cooldownCasts,
                    paused: Prototype.paused,
                    modal: !document.querySelector('#modal').hidden,
                  })),
                ),
            );
          });
        assert(
          await page.evaluate(() =>
            __cooldownCasts
              .filter((c) => c.cd > 0)
              .every((c) => c.targetId === __retargetFoes.original),
          ),
          'completed approach retains original locked foe',
        );
      } else if (scenario === 'original-valid') {
        assert.equal(outcome.casts.length, 1);
        assert.equal(outcome.casts[0].targetId, outcome.originalId);
      } else {
        assert.equal(outcome.casts.length, 0, scenario + ' must not fire at an arbitrary foe');
        assert.equal(outcome.cooldown, 0, scenario + ' must not spend cooldown');
      }
    }
    // Actual keyboard/touch input: small HP hits preserve the 0.65s charge;
    // cumulative post-mitigation loss breaks it without spending cooldown.
    for (const kind of ['weak', 'interrupt']) {
      await page.evaluate(() => {
        const g = Prototype.game;
        Object.assign(g.hero, {
          class: 'paladin',
          x: 600,
          y: 900,
          hp: 100,
          maxHp: 100,
          order: null,
          immune: 0,
        });
        g.hero.skills = Array(8).fill(1);
        g.hero.cd = Array(8).fill(0);
        g.s.mercyTime = 0;
        g.manualHeroTargetId = null;
        g.manualHeroTargetLocked = false;
        const enemy = g.makeEnemy(
          {
            species: 'goblin',
            name: 'Interrupt target',
            level: 1,
            hp: 10000,
            damage: 0,
            xp: 0,
            gold: 0,
          },
          { x: 680, y: 900 },
        );
        g.zone().enemies = [enemy];
        g.s.heroTarget = enemy.id;
        window.__cooldownCasts = [];
        Prototype.updateHUD();
      });
      await press(1);
      assert.equal(await page.evaluate(() => Prototype.chargePresentation()?.state), 'charging');
      await page.evaluate((kind) => {
        const g = Prototype.game;
        g.hitParty(g.hero, 3, 0, null, true);
        if (kind === 'interrupt') g.hitParty(g.hero, 4, 0, null, true);
      }, kind);
      if (kind === 'weak') {
        await page.waitForFunction(() => Prototype.chargePresentation()?.ready, null, {
          timeout: 3000,
        });
        await release(1);
        assert.equal(await page.evaluate(() => __cooldownCasts.length), 1);
        assert.equal(await page.evaluate(() => __cooldownCasts[0].charged), true);
      } else {
        await page.waitForTimeout(280);
        await release(1);
        assert.equal(
          await page.evaluate(() => __cooldownCasts.length),
          0,
          'interrupted charged input must not fire any skill',
        );
        assert.equal(
          await page.evaluate(() => Prototype.game.hero.cd[0]),
          0,
          'interrupted hold preserves full skill cooldown',
        );
      }
    }
    // Normal taps stay normal during the short charged-cast recovery.
    await press(1);
    await release(1);
    assert.equal(await page.evaluate(() => __cooldownCasts.at(-1)?.charged), false);
    // A real menu pause freezes companion preparation on the shared active clock.
    await page.evaluate(() => {
      const g = Prototype.game;
      g.clearPartyCharges();
      g.hero.skills[1] = 1;
      g.s.companionCombatTraining = 2;
      const u = g.unit('archer', 600, 900),
        target = g.zone().enemies[0];
      g.s.party = [u];
      g.line = () => true;
      if (!g.companionUseSecondSkill(u, target)) throw Error('Pause fixture did not begin');
      Prototype.openMenu('Preparation pause probe');
      window.__pausedCharge = g.partyChargeProgress(u);
    });
    await page.waitForTimeout(800);
    assert.equal(
      await page.evaluate(() => Prototype.game.partyChargeProgress(Prototype.game.s.party[0])),
      await page.evaluate(() => window.__pausedCharge),
      'menu time cannot finish preparation',
    );
    assert.equal(await page.evaluate(() => Prototype.game.s.party[0].skill2Cd), 0);
    await page.evaluate(() => Prototype.closeMenu());
    await page.waitForFunction(() => Prototype.game.s.party[0].skill2Cd > 0);
    await page.evaluate(() => {
      Prototype.game.s.party = [];
    });
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

'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
async function verifySnapshotEncounters(page, results, tag, capture = false) {
  const saved = await page.evaluate(() => {
    const c = Prototype.game;
    window.__snapshotEncounter = {
      tick: c.tick,
      random: c.random,
      draw: PrototypeVisuals.draw,
      ground: PrototypeCombatVisuals.ground,
      effects: c.effects,
      fillText: CanvasRenderingContext2D.prototype.fillText,
      seen: {},
      text: [],
    };
    c.tick = () => {};
    PrototypeCombatVisuals.ground = function (ctx, screen, game, ...args) {
      if (__snapshotEncounter.cast) __snapshotEncounter.groundSeen = true;
      return __snapshotEncounter.ground(ctx, screen, game, ...args);
    };
    PrototypeVisuals.draw = function (ctx, e, ...args) {
      __snapshotEncounter.seen[e.id] = {
        species: e.species,
        structure: e.structure,
        profile: e.captainProfile,
      };
      return __snapshotEncounter.draw(ctx, e, ...args);
    };
    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      __snapshotEncounter.text.push(String(text));
      return __snapshotEncounter.fillText.call(this, text, ...args);
    };
    return JSON.parse(JSON.stringify(c.s));
  });
  try {
    for (const zone of ['crypt', 'supply-highlands']) {
      const targets = await page.evaluate((zone) => {
        const c = Prototype.game;
        c.enter(zone);
        c.s.clock = 200;
        c.s.party = [];
        const z = c.zone();
        return zone === 'crypt'
          ? z.props
              .filter((p) => ['estate-rug', 'estate-hearth', 'estate-lounge'].includes(p.structure))
              .map((p) => p.id)
          : z.enemies.filter((e) => e.roomCaptain).map((e) => e.id);
      }, zone);
      assert.equal(targets.length, zone === 'crypt' ? 6 : 1);
      for (const id of targets) {
        await page.evaluate((id) => {
          const c = Prototype.game,
            z = c.zone(),
            e = [...z.props, ...z.enemies].find((e) => e.id === id);
          Object.assign(c.hero, c.safe(e.x + 50, e.y + 60), { order: null });
          __snapshotEncounter.seen = {};
          __snapshotEncounter.text = [];
          if (e.roomCaptain) {
            c.engage(e);
            c.startCaptainAttack(e, c.hero);
          }
          Prototype.updateHUD();
        }, id);
        await page.waitForFunction((id) => !!__snapshotEncounter.seen[id], id);
        if (zone === 'supply-highlands') {
          await page.waitForFunction(() => __snapshotEncounter.text.includes('Preparing…'));
          const state = await page.evaluate((id) => {
            const c = Prototype.game,
              e = c.zone().enemies.find((e) => e.id === id);
            return {
              species: e.species,
              anonymous: e.telegraph.anonymousCast,
              windup: c.effects.some((f) => f.type === 'enemyVfx' && f.stage === 'windup'),
              hiddenName: __snapshotEncounter.text.includes(e.telegraph.name),
              guards: c
                .zone()
                .enemies.filter((u) => u.roomGuard && !u.roomCaptain)
                .map((u) => u.species),
            };
          }, id);
          assert.equal(state.species, 'ridge');
          assert(state.anonymous && !state.windup && !state.hiddenName);
          assert(state.guards.every((s) => s === 'wolf'));
        }
        if (capture)
          await page.screenshot({
            path: path.join(results, 'snapshot-encounter-' + id + '-' + tag + '.png'),
          });
      }
    }
    await page.evaluate(() => {
      const c = Prototype.game;
      c.enter('crypt');
      c.s.party = [];
      c.effects = [];
      const old = c.zone().enemies.find((e) => e.type === 'boss');
      const e = c.bossEnemy(c.boss('crypt'), 'true', { x: old.x, y: old.y });
      c.zone().enemies = [e];
      Object.assign(c.hero, c.safe(e.x + 40, e.y + 50));
      __snapshotEncounter.text = [];
      Prototype.updateHUD();
    });
    await page.waitForFunction(() =>
      __snapshotEncounter.text.some((t) => t.startsWith('Lifebinder TRUE')),
    );
    assert(
      !(await page.evaluate(() =>
        __snapshotEncounter.text.some((t) => /^TRUE.*Lifebinder/.test(t)),
      )),
      'TRUE suffix is actually rendered',
    );
    if (capture)
      await page.screenshot({
        path: path.join(results, 'snapshot-lifebinder-true-' + tag + '.png'),
      });
    for (const scene of ['cold-wave', 'stone-defense', 'tracking', 'hot-zone']) {
      const summary = await page.evaluate((scene) => {
        const c = Prototype.game;
        c.enter(scene === 'cold-wave' || scene === 'stone-defense' ? 'crypt' : 'supply-vale');
        c.s.party = [];
        c.effects = [];
        c.s.clock = 200;
        const e = c.zone().enemies.find((e) => e.type === 'boss' || e.roomCaptain);
        c.zone().enemies = [e];
        const point = Array.from({ length: 32 }, (_, i) => ({
          x: e.x + 100 * Math.cos((i * Math.PI) / 16),
          y: e.y + 100 * Math.sin((i * Math.PI) / 16),
        })).find((p) => !c.blocked(p.x, p.y) && c.line(e, p));
        if (!point) throw Error('No real cast lane: ' + scene);
        Object.assign(c.hero, point, { hp: 10000, maxHp: 10000, immune: 0, slow: 0, order: null });
        c.engage(e);
        if (e.type === 'boss') c.startAttack(e, c.hero, scene === 'cold-wave' ? 4 : 5);
        else {
          const slot = scene === 'tracking' ? 3 : 4;
          for (let i = 0; i < 100; i++) {
            e.lastCaptainAttack = -1;
            c.random = () => (i + 0.5) / 100;
            c.startCaptainAttack(e, c.hero);
            if (e.telegraph.index === slot) break;
          }
          if (e.telegraph.index !== slot) throw Error('New captain slot unavailable');
        }
        if (scene === 'cold-wave') {
          c.resolveAttack(e);
          e.telegraph = null;
          c.updateProjectiles(0.3);
        }
        if (scene === 'stone-defense') {
          c.resolveAttack(e);
          e.telegraph = null;
        }
        __snapshotEncounter.cast = scene;
        __snapshotEncounter.groundSeen = false;
        __snapshotEncounter.text = [];
        Prototype.updateHUD();
        return {
          hp: c.hero.hp,
          slow: c.hero.slow,
          defense: e.anastylosis || 0,
          wave: c.s.hazards.some((h) => h.slowOnly),
          shots: e.sequence.length,
        };
      }, scene);
      await page.waitForFunction(() => __snapshotEncounter.groundSeen);
      if (scene === 'cold-wave')
        assert.deepEqual([summary.hp, summary.slow, summary.wave], [10000, 2, true]);
      if (scene === 'stone-defense') assert.deepEqual([summary.hp, summary.defense], [10000, 4]);
      if (scene === 'tracking') {
        assert.equal(summary.shots, 3);
        await page.waitForFunction(() => __snapshotEncounter.text.includes('1/4'));
      }
      if (capture)
        await page.screenshot({
          path: path.join(results, 'snapshot-cast-' + scene + '-' + tag + '.png'),
        });
    }
    for (const scene of ['keeper-normal', 'keeper-true', 'direjaw', 'recharge']) {
      const state = await page.evaluate((scene) => {
        const c = Prototype.game,
          family = scene === 'direjaw' ? 'supply-march' : scene === 'recharge' ? 'mire' : 'archive';
        c.enter(family === 'mire' ? 'march' : family);
        c.s.clock = 200;
        c.s.party = [];
        c.s.projectiles = [];
        c.s.hazards = [];
        c.s.mercyTime = 0;
        c.random = () => 0.9;
        const e =
          family === 'supply-march'
            ? c.zone().enemies.find((e) => e.roomCaptain)
            : c.bossEnemy(
                c.boss(family),
                scene === 'keeper-true' ? 'true' : 'normal',
                c.safe(850, 850),
              );
        c.zone().enemies = [e];
        Object.assign(c.hero, c.safe(e.x + 45, e.y), { hp: 10000, maxHp: 10000, order: null });
        c.engage(e);
        let expected, actual;
        if (scene === 'recharge') {
          e.hp = e.maxHp * 0.7;
          c.startAttack(e, c.hero, 2);
          c.resolveAttack(e);
          e.telegraph = null;
          Object.assign(e, { x: c.s.hazards[0].x, y: c.s.hazards[0].y });
          Object.assign(c.hero, c.safe(e.x + 45, e.y));
          const before = e.hp;
          c.updateProjectiles(0.25);
          actual = e.hp - before;
          expected = e.maxHp * 0.02 * 0.25;
        } else {
          e.hp = e.maxHp * 0.5 + 20;
          const before = e.hp;
          c.tacticalClearBurst(e);
          c.damage(e, 20);
          actual = before - e.hp;
          expected = 20;
        }
        c.zone().enemies = [e];
        __snapshotEncounter.cast = scene;
        __snapshotEncounter.text = [];
        __snapshotEncounter.groundSeen = false;
        Prototype.updateHUD();
        return {
          actual,
          expected,
          label:
            scene === 'recharge'
              ? null
              : scene === 'direjaw'
                ? '4%'
                : scene === 'keeper-true'
                  ? '40%'
                  : '30%',
        };
      }, scene);
      assert(Math.abs(state.actual - state.expected) < 1e-7, 'real Marches damage/healing path');
      await page.waitForFunction(() => __snapshotEncounter.groundSeen);
      if (state.label)
        await page.waitForFunction(
          (label) => __snapshotEncounter.text.includes(label),
          state.label,
        );
      if (capture)
        await page.screenshot({
          path: path.join(results, 'snapshot-passive-' + scene + '-' + tag + '.png'),
        });
    }
  } finally {
    await page.evaluate((state) => {
      const c = Prototype.game;
      c.s = state;
      c.tick = __snapshotEncounter.tick;
      c.random = __snapshotEncounter.random;
      c.effects = __snapshotEncounter.effects;
      PrototypeCombatVisuals.ground = __snapshotEncounter.ground;
      PrototypeVisuals.draw = __snapshotEncounter.draw;
      CanvasRenderingContext2D.prototype.fillText = __snapshotEncounter.fillText;
      delete window.__snapshotEncounter;
      Prototype.updateHUD();
    }, saved);
  }
  console.log(
    'PASS snapshot estate furnishings, horned captain and anonymous cast renderer ' + tag,
  );
}
module.exports = { verifySnapshotEncounters };

'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const FX = require('../src/prototype/combat-visuals.js');
const { createCanvas } = require('@napi-rs/canvas');
const near = (a, b, message) => assert(Math.abs(a - b) < 1e-7, message + ': ' + a + ' != ' + b);
function arena(family, cls, mode, form = 'normal') {
  const c = new C(mode, cls, () => 0.9);
  c.enter(family === 'mire' ? 'march' : family);
  const e =
    family === 'supply-march'
      ? c.zone().enemies.find((e) => e.roomCaptain)
      : c.bossEnemy(c.boss(family), form, c.safe(850, 850));
  c.zone().enemies = [e];
  Object.assign(c.hero, c.safe(e.x + 45, e.y));
  c.s.party = [c.unit('soldier', c.hero.x, c.hero.y)];
  c.hero.hp = c.hero.maxHp = 10000;
  c.s.mercyTime = 0;
  c.engage(e);
  return { c, e };
}
function hit(c, e, amount, source = 'hero') {
  c.tacticalClearBurst(e);
  const before = e.hp;
  assert(c.damage(e, amount, source));
  return before - e.hp;
}
function caption(c, e, text) {
  const canvas = createCanvas(375, 800),
    ctx = canvas.getContext('2d');
  const seen = [],
    fill = ctx.fillText.bind(ctx);
  ctx.fillText = (t, ...args) => {
    seen.push(String(t));
    fill(t, ...args);
  };
  FX.ground(ctx, () => ({ x: 180, y: 380 }), c, 'cue', c.s.time);
  assert.equal(seen.includes(text), true, 'actual timed percentage is painted');
  const pixels = ctx.getImageData(165, 397, 30, 12).data;
  let light = 0;
  for (let i = 0; i < pixels.length; i += 4)
    if (pixels[i] > 150 && pixels[i + 1] > 150 && pixels[i + 2] > 120 && pixels[i + 3] > 100)
      light++;
  assert(light >= 10, 'actual glyphs remain visible at phone scale');
  c.s.time = Math.max(e.strainHardeningUntil || 0, e.emergencyStabilizationUntil || 0);
  seen.length = 0;
  FX.ground(ctx, () => ({ x: 180, y: 380 }), c, 'cue', c.s.time);
  assert(!seen.includes(text), 'expired defense has no stale cue');
}
let cases = 0;
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const mode of ['normal', 'nightmare']) {
    for (const form of ['normal', 'true']) {
      {
        const { c, e } = arena('mire', cls, mode, form);
        const rate = form === 'true' ? 0.05 : 0.02;
        e.hp = e.maxHp * 0.7;
        c.startAttack(e, c.hero, 2);
        c.resolveAttack(e);
        e.telegraph = null;
        const beds = c.s.hazards;
        assert.equal(beds.length, 3);
        // A real Inundation resolution supplies the stable family/slot/owner.
        Object.assign(e, { x: beds[0].x, y: beds[0].y });
        Object.assign(c.hero, c.safe(e.x + 250, e.y));
        const before = e.hp;
        c.updateProjectiles(0.25);
        near(e.hp - before, e.maxHp * rate * 0.25, 'owned live mud heals');
        c.s.hazards = [
          beds[0],
          { ...beds[0], life: 0.1 },
          { ...beds[0], sourceId: 'other', life: 8 },
        ];
        const hp = e.hp;
        c.s.hazards[0].life = 0.1;
        c.updateProjectiles(0.5);
        near(e.hp - hp, e.maxHp * rate * 0.1, 'union does not stack; final interval is clipped');
        const dry = e.hp;
        c.updateProjectiles(0.5);
        near(e.hp, dry, 'foreign mud cannot heal');
        c.s.hazards = [{ ...beds[0], life: 4, sourceId: e.id }];
        e.hp = e.maxHp - 1;
        c.rechargeOwnMud(1);
        near(e.hp, e.maxHp, 'healing clamps only to actual missing health');
        e.returning = 1;
        e.hp -= 50;
        const returningHp = e.hp;
        c.rechargeOwnMud(1);
        near(e.hp, returningHp, 'returning encounter has no recharge');
        e.returning = 0;
        e.aggro = false;
        c.rechargeOwnMud(1);
        near(e.hp, returningHp, 'idle encounter has no recharge');
        cases++;
      }
      {
        const { c, e } = arena('mire', cls, mode, form);
        e.hp = e.maxHp * 0.5 + 1;
        hit(c, e, 10);
        assert(e.mireLowestHpRatio < 0.5, 'post-hit scale loss is recorded immediately');
        const lowest = e.mireLowestHpRatio;
        c.s.hazards = [
          {
            family: 'mire',
            index: 2,
            kind: 'circle',
            sourceId: e.id,
            x: e.x,
            y: e.y,
            radius: 100,
            life: 4,
            tick: 100,
          },
        ];
        c.rechargeOwnMud(4);
        assert(e.hp > e.maxHp * 0.5);
        near(hit(c, e, 10), 10, 'recharge never restores shed scale protection');
        near(e.mireLowestHpRatio, lowest, 'lowest health is monotone');
        c.disengage(e, 0.1);
        assert(!e.mireLowestHpRatio);
        assert.equal(c.s.hazards.length, 0);
        cases++;
      }
      {
        const { c, e } = arena('archive', cls, mode, form);
        const reduction = form === 'true' ? 0.4 : 0.3,
          duration = form === 'true' ? 8 : 6;
        e.hp = e.maxHp * 0.5 + 20;
        near(hit(c, e, 20), 20, 'threshold-triggering hit is unmitigated');
        assert(e.emergencyStabilizationUsed);
        near(e.emergencyStabilizationUntil - c.s.time, duration, 'exact form duration');
        near(
          hit(c, e, 20, c.s.party[0].id),
          20 * (1 - reduction),
          'companion uses shared mitigation',
        );
        c.s.time = e.emergencyStabilizationUntil - 0.001;
        near(hit(c, e, 20), 20 * (1 - reduction), 'defense lasts through final interval');
        caption(c, e, Math.round(reduction * 100) + '%');
        const expiry = e.emergencyStabilizationUntil;
        near(hit(c, e, 20), 20, 'exact expiry has no reduction');
        e.hp = e.maxHp * 0.5 + 10;
        hit(c, e, 20);
        assert.equal(
          e.emergencyStabilizationUntil,
          expiry,
          'later threshold cannot refresh or repeat',
        );
        c.cancelEncounter(e);
        assert(!e.emergencyStabilizationUsed && !e.emergencyStabilizationUntil);
        e.hp = 1;
        hit(c, e, 2);
        assert.equal(e.hp, 0);
        assert(
          !e.emergencyStabilizationUsed && !e.emergencyStabilizationUntil,
          'lethal threshold does not create a defense',
        );
        cases++;
      }
    }
    {
      const { c, e } = arena('supply-march', cls, mode);
      near(hit(c, e, 10), 10, 'first hit is not reduced');
      for (const [expected, stacks] of [
        [9.6, 2],
        [9.2, 3],
        [8.8, 3],
      ]) {
        near(hit(c, e, 10, c.s.party[0].id), expected, 'post-hit stacks apply only to later hits');
        assert.equal(e.strainHardeningStacks, stacks);
      }
      const expiry = e.strainHardeningUntil;
      assert.equal(c.damage(e, 0), false);
      assert.equal(e.strainHardeningUntil, expiry, 'non-damage cannot refresh');
      const position = { x: c.hero.x, y: c.hero.y };
      c.hero.x += 2000;
      assert.equal(c.damage(e, 10), false);
      assert.equal(e.strainHardeningUntil, expiry, 'out-of-range attempt cannot refresh');
      Object.assign(c.hero, position);
      caption(c, e, '12%');
      near(hit(c, e, 10), 10, 'expired window restarts at one stack');
      assert.equal(e.strainHardeningStacks, 1);
      c.s.time += 4.9;
      near(hit(c, e, 10), 9.6, 'live hit refreshes five-second window');
      near(
        e.strainHardeningUntil - c.s.time,
        5,
        'refresh does not shorten/extend configured duration',
      );
      const saved = c.snapshot(),
        stored = saved.zones['supply-march'].enemies.find((x) => x.id === e.id);
      assert(!stored.strainHardeningStacks && !stored.strainHardeningUntil);
      assert(e.strainHardeningStacks, 'snapshot leaves live defense untouched');
      const raw = JSON.parse(JSON.stringify(c.s));
      const restored = C.restore(raw, () => 0.9)
        .zone()
        .enemies.find((x) => x.id === e.id);
      assert(
        !restored.strainHardeningStacks && !restored.strainHardeningUntil,
        'raw restore clears old encounter defense',
      );
      c.enter('march');
      assert(!e.strainHardeningStacks && !e.strainHardeningUntil, 'travel clears defense');
      cases++;
    }
  }
for (const family of ['mire', 'archive', 'supply-march']) {
  const { c, e } = arena(family, 'paladin', 'normal');
  // Family names alone must never grant the boss/captain trait to ordinary troops.
  e.type = 'mob';
  e.roomCaptain = false;
  c.clearEncounterState(e);
  c.zone(); // Apply existing ordinary-troop stat normalization before the probe.
  e.hp = e.maxHp * 0.4;
  hit(c, e, 5);
  assert(!e.strainHardeningStacks && !e.emergencyStabilizationUsed && !e.mireLowestHpRatio);
  const hp = e.hp;
  c.s.hazards = [
    {
      family: 'mire',
      index: 2,
      kind: 'circle',
      sourceId: e.id,
      x: e.x,
      y: e.y,
      radius: 100,
      life: 4,
    },
  ];
  c.rechargeOwnMud(1);
  near(e.hp, hp, 'ordinary troops cannot recharge');
}
console.log(
  'PASS Marches passives: ' +
    cases +
    ' class/mode/form outcomes, actual mud union/expiry, post-hit/one-shot defense and phone glyphs',
);

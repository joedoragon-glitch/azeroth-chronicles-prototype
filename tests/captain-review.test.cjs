'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const profiles = Campaign.rules.roomCaptains;
const cases = [
  ['supply-vale', 390, 'Scornfang'],
  ['supply-march', 680, 'Direjaw'],
  ['supply-highlands', 1650, 'Crag Tyrant'],
  ['supply-crown', 5000, 'Dreadmaw'],
  ['frontier', 3000, 'Cinder Warlord'],
];
for (const [zone, hp, name] of cases) {
  const c = new Campaign('normal', 'paladin', () => 0.7);
  c.enter(zone);
  const e = c.zone().enemies.find((x) => x.name === name);
  assert(e, name + ' must exist');
  assert.equal(e.baseHp, hp, name + ' authored HP');
  assert.equal(e.captainEnduranceVersion, zone === 'supply-vale' ? 3 : 2, name + ' migration marker');
  e.hp = e.maxHp * 0.37;
  const restored = Campaign.restore(c.snapshot(), () => 0.7);
  const again = restored.zone().enemies.find((x) => x.id === e.id);
  assert(again, name + ' saved encounter');
  assert.equal(again.baseHp, hp, name + ' reload must not double-scale');
  assert.equal(again.hp, again.maxHp, name + ' existing save contract restores enemies at full HP');
  // Verify old-save migration retains combat progress before serialization.
  const old = { ...e, captainEnduranceVersion: 0, baseHp: hp / 2, maxHp: hp / 2, hp: hp * 0.185 };
  old.captainPhase = true;
  old.captainGuard = 6;
  old.captainPhaseMove = 1.22;
  c.upgradeCaptainEndurance(old, profiles[e.captainProfile]);
  assert.equal(old.captainPhase, false, name + ' stale phase flag reset on migration');
  assert.equal(old.captainGuard, 0, name + ' stale protection removed on migration');
  assert.equal(old.captainPhaseMove, 1, name + ' old movement boost removed');
  assert.equal(old.baseHp, hp, name + ' legacy HP migration budget');
  assert(Math.abs(old.hp / old.maxHp - 0.37) < 1e-8, name + ' migration retains HP fraction');
}
assert.equal(profiles['supply-vale'].phase.threshold, 0.55);
assert.equal(profiles['supply-vale'].attacks[1].radius, 120);
assert.equal(profiles['supply-march'].attacks[0].warning, 0);
assert.equal(profiles['supply-march'].attacks[1].angleDegrees, 196);
assert.equal(profiles['supply-march'].attacks[2].count, 4);
assert.equal(profiles['supply-highlands'].attacks[1].count, 5);
assert.equal(profiles['supply-highlands'].attacks[2].angleDegrees, 360);
assert.equal(profiles['supply-crown'].summon.cap, 4);
assert.equal(profiles['supply-crown'].summon.guardPerSummon, 0.25);
assert.equal(profiles['frontier-overseer'].phase.threshold, 0.6);
const c = new Campaign('normal', 'paladin', () => 0.7);
const r = 86 * Campaign.rules.bossCadence.areaRangeMultiplier;
for (const count of [4, 5]) {
  const patches = c.attackPatches({ captainSpread: true, count, x: 1200, y: 1200, radius: r });
  assert.equal(patches.length, count);
  for (let i = 0; i < patches.length; i++)
    for (let j = i + 1; j < patches.length; j++)
      assert(
        Math.hypot(patches[i].x - patches[j].x, patches[i].y - patches[j].y) > 2 * r,
        'captain area patches must not overlap',
      );
}
console.log('PASS captain endurance, save round trips, and authored mechanics');

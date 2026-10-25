'use strict';
// Focused NATIVE Stage 2 Skill 1 vertical slice. Feature remains absent from
// production scripts: tests attach the opt-in session to actual Campaign actors.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const Native = require('../src/prototype/critical-party-native.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
const near = (a, b) => assert(Math.abs(a - b) < 1e-6, String(a) + ' != ' + b);

function arena(cls, count = 1) {
  const g = new Campaign('normal', cls, () => 0.9);
  completeFieldOpening(g);
  g.zone().props = [];
  g.zone().buildings = [];
  g.zone().npcs = [];
  Object.assign(g.hero, { x: 500, y: 500, order: null, hp: 1000, maxHp: 1000 });
  g.hero.skills.fill(8);
  g.s.party = [];
  g.s.mercyTime = 0;
  const enemies = Array.from({ length: count }, (_, i) =>
    g.makeEnemy(
      { species: 'goblin', name: 'Critical native', level: 1, hp: 100000, damage: 0, gold: 0, xp: 0 },
      { x: 580 + i * 8, y: 500 },
    ),
  );
  g.zone().enemies = enemies;
  for (const e of enemies) assert(g.damage(e, 1, 'hero'));
  return { g, e: enemies[0], enemies };
}
function attach(g, roll = 0, tuning = Levels.createTuning()) {
  let rolls = 0;
  const session = Native.createSession(Critical, Levels, {
    enabled: true,
    tuning,
    stream: { next() { rolls++; return roll; } },
  });
  g._criticalPartyNative = session; // explicit in-test only, no prototype patch
  return { session, count: () => rolls };
}
{
  const off = Native.createSession(Critical, Levels, { enabled: false });
  assert.equal(off.release(), null);
  assert.equal(off.enhance(null, 30, 'damage'), 30);
  assert.equal(Campaign.prototype._criticalPartyNative, undefined);
}
for (const cls of ['paladin', 'mage', 'ranger']) {
  const a = arena(cls), b = arena(cls);
  const tally = attach(b.g);
  assert(a.g.cast(1, a.e.id, false));
  assert(b.g.cast(1, b.e.id, false));
  assert.equal(tally.count(), 1, cls + ' one tap rolls once');
  const original = a.g.s.projectiles;
  const improved = b.g.s.projectiles;
  assert.equal(improved.length, original.length);
  assert.equal(improved.length, cls === 'ranger' ? 3 : 1);
  const receipt = improved[0].criticalExecution;
  assert(Object.isFrozen(receipt));
  assert.equal(receipt.key, 'hero/' + cls + '/1-tap');
  for (let i = 0; i < improved.length; i++) {
    assert.strictEqual(improved[i].criticalExecution, receipt);
    near(improved[i].damage, original[i].damage * Levels.LEVERS.damage.values[0]);
  }
  assert.equal(tally.count(), 1, 'staggered Ranger arrows never reroll');
}
for (const cls of ['paladin', 'mage', 'ranger']) {
  const a = arena(cls, cls === 'ranger' ? 1 : 12), b = arena(cls, cls === 'ranger' ? 1 : 12);
  const tally = attach(b.g);
  assert(a.g.cast(1, a.e.id, true));
  assert(b.g.cast(1, b.e.id, true));
  assert.equal(tally.count(), 1, cls + ' charged release only');
  if (cls === 'paladin') {
    const f = b.g._heroSkillEffects[0];
    assert.equal(f.kind, 'cross');
    assert.equal(f.criticalExecution.key, 'hero/paladin/1-charged');
    near(f.damage, a.g._heroSkillEffects[0].damage * 1.08);
    const receipt = f.criticalExecution;
    const first = a.enemies[0].hp - b.enemies[0].hp;
    const tuning = b.g._criticalPartyNative;
    tuning.setCriticalLevel('hero', 3);
    b.g.s.time += 0.36;
    a.g.s.time += 0.36;
    b.g.advanceHeroSkillEffects(0.36);
    a.g.advanceHeroSkillEffects(0.36);
    assert.strictEqual(receipt, f.criticalExecution);
    assert.equal(receipt.intensity, 1, 'delayed pulse retains release level');
    assert.equal(tally.count(), 1, 'second Cross pulse never rerolls');
    assert(first >= 0);
  } else if (cls === 'mage') {
    assert(a.enemies.every((e, i) => b.enemies[i].hp < e.hp),
      'one wide beam critical enhances admitted native targets');
    assert.equal(tally.count(), 1, 'beam never rerolls per victim');
  } else {
    const f = b.g._heroSkillEffects[0];
    assert.equal(f.kind, 'hawk');
    assert.equal(f.criticalExecution.key, 'hero/ranger/1-charged');
    near(f.damage, a.g._heroSkillEffects[0].damage * 1.08);
    for (let i = 0; i < 100 && b.g._heroSkillEffects.length; i++) {
      b.g.s.time += 1 / 60;
      b.g.advanceHeroSkillEffects(1 / 60);
    }
    assert.equal(tally.count(), 1, 'Hawk flight/contact never rerolls');
    assert(b.g.effects.some(x => x.type === 'heroHawk' && x.phase === 'impact'));
  }
}
for (const cls of ['paladin', 'mage', 'ranger']) {
  const { g, e } = arena(cls);
  const tally = attach(g);
  for (let beat = 0; beat < 3; beat++) {
    g.hero.basicCd = 0;
    assert(g.castMovementBasic(), cls + ' legal automatic beat');
  }
  assert.equal(tally.count(), 3, 'each actual auto beat rolls once; finisher is inherited');
  if (cls !== 'paladin') {
    const shots = g.s.projectiles.filter(p => p.automaticBasic);
    assert.equal(shots.length, 3);
    assert(shots.every(p => p.criticalExecution?.key === 'hero/' + cls + '/auto'));
  }
  g.hero.basicCd = 10;
  assert(!g.castMovementBasic());
  assert.equal(tally.count(), 3, 'unreleased action does not roll');
  assert(e.hp > 0);
}
{
  const { g } = arena('paladin');
  const tally = attach(g);
  g.hero.skills[0] = 0;
  assert(!g.cast(1, null));
  assert.equal(tally.count(), 0, 'unlearned skill does not roll');
}
console.log('Stage 2 critical native Skill 1: 3 classes × Tap/Charged/auto, child receipts, cancel and levels passed.');

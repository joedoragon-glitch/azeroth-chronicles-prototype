'use strict';
// Physical Ranger volleys inherit ONE opt-in critical receipt. No early hit.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const Native = require('../src/prototype/critical-party-native.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
function arena() {
  const g = new Campaign('normal', 'ranger', () => .9);
  completeFieldOpening(g);
  for (const k of ['props', 'buildings', 'npcs', 'enemies']) g.zone()[k] = [];
  g.s.party = [];
  Object.assign(g.hero, {
    x: 500, y: 500, hp: 1000, maxHp: 1000, mp: 10000,
    skills: Array(8).fill(8), cd: Array(8).fill(0),
    chargedCd: Array(8).fill(0), order: null,
  });
  g.s.mercyTime = 0;
  const enemy = g.makeEnemy(
    { species: 'goblin', name: 'Ranger physical target', level: 1,
      hp: 1000000, damage: 0, xp: 0, gold: 0 },
    { x: 780, y: 500 },
  );
  enemy.hp = enemy.maxHp = 1000000;
  g.zone().enemies = [enemy];
  g.engage(enemy);
  return { g, enemy };
}
function attach(g) {
  let samples = 0;
  const session = Native.createSession(Critical, Levels, {
    enabled: true, stream: { next() { samples++; return 0; } },
  });
  g._criticalPartyNative = session;
  return () => samples;
}
for (const [slot, charged, lever] of [[2, true, 'slowDuration'], [5, false, 'damage']]) {
  const base = arena(), enhanced = arena(), count = attach(enhanced.g);
  const hp = enhanced.enemy.hp;
  assert(base.g.cast(slot, base.enemy.id, charged));
  assert(enhanced.g.cast(slot, enhanced.enemy.id, charged));
  assert.equal(count(), 1, 'one Ranger action release, not one roll per arrow');
  assert.equal(base.enemy.hp, hp, 'no baseline damage before flight');
  assert.equal(enhanced.enemy.hp, hp, 'no critical damage before flight');
  const shots = enhanced.g.s.projectiles.filter(p => p.slot === slot && p.style === 'arrow');
  const ordinary = base.g.s.projectiles.filter(p => p.slot === slot && p.style === 'arrow');
  assert(shots.length > 0, 'real Ranger projectiles were admitted');
  assert.equal(shots.length, ordinary.length, 'critical adds no shafts');
  const receipt = shots[0].criticalExecution;
  assert.equal(receipt.key, 'hero/ranger/' + slot + (charged ? '-charged' : '-tap'));
  assert(Object.isFrozen(receipt));
  shots.forEach((p, i) => {
    assert.strictEqual(p.criticalExecution, receipt, 'original arrows share frozen receipt');
    assert.equal(p.dx, ordinary[i].dx, 'flight direction unchanged');
    assert.equal(p.dy, ordinary[i].dy, 'flight direction unchanged');
    if (lever === 'damage') assert(p.damage > ordinary[i].damage);
    else {
      assert.equal(p.damage, ordinary[i].damage, 'Slow critical adds no damage');
      assert(p.rangerVolleySlow > ordinary[i].rangerVolleySlow);
      assert.equal(p.slow, ordinary[i].slow, 'original secondary Slow unchanged');
    }
  });
  assert(enhanced.g.effects.some(e => e.projectileVolley && e.source === 'hero'));
  for (let i = 0; i < 20 &&
    (base.g.s.projectiles.length || enhanced.g.s.projectiles.length); i++) {
    base.g.updateProjectiles(.1);
    enhanced.g.updateProjectiles(.1);
  }
  assert.equal(count(), 1, 'individual impacts do not reroll');
  if (lever === 'damage') assert(enhanced.enemy.hp < base.enemy.hp);
  else {
    assert.equal(enhanced.enemy.hp, base.enemy.hp, 'Slow crit leaves damage unchanged');
    assert(enhanced.enemy.slow > base.enemy.slow, 'Slow increases at contact');
  }
}
console.log('PASS Ranger physical critical volleys: no early hits, one receipt, normal collision');

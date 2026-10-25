'use strict';
// Stage 2: all eleven real pet families, with native basic/first/charged-second owners.
// No game bootstrap, auto-installation, global RNG, save schema or production activation.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const Native = require('../src/prototype/critical-party-native.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

const families = [
  'thorn', 'crypt', 'mire', 'archive', 'ridge', 'mine',
  'warlord', 'abyss', 'citadel', 'cindermaw', 'darklord',
];
function arena(family) {
  const g = new Campaign('normal', 'paladin', () => 0.9);
  completeFieldOpening(g);
  g.s.mercyTime = 0;
  for (const key of ['props', 'buildings', 'npcs', 'enemies']) g.zone()[key] = [];
  Object.assign(g.hero, { x: 500, y: 500, hp: 500, maxHp: 1000, order: null });
  g.hero.skills[1] = 1;
  g.s.companionCombatTraining = 2;
  const unit = g.unit('pet', 520, 500, family);
  unit.hp = unit.maxHp * 0.5;
  g.s.party = [unit];
  const ranged = g.petDefinition(unit).role === 'ranged';
  const target = g.makeEnemy(
    { species: 'goblin', name: 'Pet critical target', level: 1,
      hp: 100000, damage: 0, xp: 0, gold: 0 },
    { x: ranged ? 680 : 570, y: 500 },
  );
  const extra = g.makeEnemy(
    { species: 'goblin', name: 'Pet area witness', level: 1,
      hp: 100000, damage: 0, xp: 0, gold: 0 },
    { x: target.x + 10, y: target.y + 8 },
  );
  g.zone().enemies = [target, extra];
  g.engage(target);
  return { g, unit, target, extra };
}
function attach(g, level = 1, roll = 0) {
  let samples = 0;
  const session = Native.createSession(Critical, Levels, {
    enabled: true,
    stream: { next() { samples++; return roll; } },
  });
  session.setCriticalLevel('companion', level);
  g._criticalPartyNative = session;
  return { count: () => samples, session };
}
function close(a, b, context) {
  assert(Math.abs(a - b) < 1e-6, context + ' expected ' + b + ', got ' + a);
}
function settle(g) {
  for (let i = 0; i < 18 && g.s.projectiles.length; i++) g.updateProjectiles(0.1);
}
function inspect(a, b, lever, level, context) {
  const amount = Levels.LEVERS[lever].values[level - 1];
  if (lever === 'damage') {
    assert(b.target.hp < a.target.hp, context + ' increases genuine hit damage');
  } else if (lever === 'slowDuration') {
    close(b.target.slow, a.target.slow + amount, context + ' improves existing Slow');
    close(b.target.hp, a.target.hp, context + ' does not add damage');
  } else if (lever === 'wardDuration') {
    close(b.unit.wardUntil, a.unit.wardUntil + amount, context + ' extends actual ward');
    close(b.unit.wardReduction, a.unit.wardReduction, context + ' keeps ward strength');
  } else if (lever === 'healAmount') {
    assert(b.unit.hp > a.unit.hp, context + ' improves contact self-heal');
    assert(b.g.hero.hp > a.g.hero.hp, context + ' improves the same contact ally-heal');
  } else throw Error('Unimplemented lever ' + lever);
  assert.equal(a.unit.cd, b.unit.cd, context + ' unchanged basic recovery');
  assert.equal(a.unit.skill1Cd, b.unit.skill1Cd, context + ' unchanged first cooldown');
  assert.equal(a.unit.skill2Cd, b.unit.skill2Cd, context + ' unchanged second cooldown');
  assert.equal(a.unit.skillGlobalCd, b.unit.skillGlobalCd, context + ' unchanged global cooldown');
  assert(!('criticalExecution' in b.unit), context + ' no saved pet receipt field');
}
let validated = 0;
for (const family of families) {
  for (const slot of ['basic', '1', '2']) {
    const key = 'pet/' + family + '/' + slot;
    const lever = Levels.ACTIONS[key]?.lever;
    assert(lever, key + ' has a specifically authored consequence');
    for (const level of [1, 2, 3]) {
      const a = arena(family), b = arena(family);
      const counter = attach(b.g, level);
      if (slot === 'basic') {
        assert(a.g.petDefensiveCounter(a.unit, a.target), key + ' baseline Recall defense');
        assert(b.g.petDefensiveCounter(b.unit, b.target), key + ' critical Recall defense');
      } else if (slot === '1') {
        assert(a.g.usePetSkill(a.unit, a.target, 1), key + ' baseline first');
        assert(b.g.usePetSkill(b.unit, b.target, 1), key + ' critical first');
      } else {
        assert(a.g.companionUseSecondSkill(a.unit, a.target), key + ' baseline hold');
        assert(b.g.companionUseSecondSkill(b.unit, b.target), key + ' critical hold');
        assert.equal(counter.count(), 0, key + ' no RNG at charge start');
        assert.equal(b.unit.skill2Cd || 0, 0, key + ' no early cooldown');
        a.g.advancePartyChargeClock(0.65);
        b.g.advancePartyChargeClock(0.65);
        a.g.resolveCompanionCharges();
        b.g.resolveCompanionCharges();
      }
      assert.equal(counter.count(), 1, key + ' exactly one released action at Level ' + level);
      assert.equal(a.g.s.projectiles.length, b.g.s.projectiles.length,
        key + ' does not add projectiles');
      if (b.g.s.projectiles.length) {
        const shot = b.g.s.projectiles[0], base = a.g.s.projectiles[0];
        assert.equal(shot.criticalExecution?.key, key, key + ' source-tagged projectile');
        assert.equal(shot.criticalExecution?.intensity, level);
        assert(Object.isFrozen(shot.criticalExecution), key + ' immutable release decision');
        close(shot.damage, base.damage * (lever === 'damage' ?
          Levels.LEVERS.damage.values[level - 1] : 1), key + ' projectile potency');
      }
      settle(a.g);
      settle(b.g);
      assert.equal(counter.count(), 1, key + ' projectile contact does not re-roll');
      inspect(a, b, lever, level, key);
      if (slot !== 'basic') {
        const def = b.g.petSkillDefinition(b.unit, Number(slot));
        if (def.shape !== 'target') {
          if (lever === 'damage')
            assert(b.extra.hp < a.extra.hp, key + ' preserves multi-target shared critical');
          if (lever === 'slowDuration')
            assert(b.extra.slow > a.extra.slow, key + ' preserves group Slow sharing');
        }
      }
      validated++;
    }
  }
}
// No release on invalid/blocked first skill or canceled charged second.
{
  const {g, unit, target} = arena('thorn'), tally = attach(g);
  unit.skill1Cd = 1;
  assert.equal(g.usePetSkill(unit, target, 1), false);
  assert.equal(tally.count(), 0);
  unit.skill1Cd = 0;
  assert(g.companionUseSecondSkill(unit, target));
  assert.equal(tally.count(), 0);
  target.hp = 0;
  g.advancePartyChargeClock(0.65);
  g.resolveCompanionCharges();
  assert.equal(tally.count(), 0, 'lost target during 0.65s hold is not an execution');
  assert.equal(unit.skill2Cd || 0, 0);
}
{
  const a = arena('crypt'), b = arena('crypt'), tally = attach(b.g, 2, 0.99);
  assert(a.g.usePetSkill(a.unit, a.target, 1));
  assert(b.g.usePetSkill(b.unit, b.target, 1));
  assert.equal(tally.count(), 1);
  assert.equal(b.g.s.projectiles[0].criticalExecution.critical, false);
  settle(a.g);
  settle(b.g);
  close(b.unit.hp, a.unit.hp, 'non-critical pet heal uses original amount');
  close(b.g.hero.hp, a.g.hero.hp, 'non-critical ally heal uses original amount');
}
{
  const a = arena('crypt'), b = arena('crypt'), tally = attach(b.g, 1);
  assert(a.g.usePetSkill(a.unit, a.target, 1));
  assert(b.g.usePetSkill(b.unit, b.target, 1));
  // A developer dial adjustment after the shot cannot alter its frozen receipt.
  tally.session.setCriticalLevel('companion', 3);
  settle(a.g);
  settle(b.g);
  close(b.unit.hp - a.unit.hp, b.unit.maxHp * 0.1 * 0.10,
    'delayed contact retains Level 1 heal boost');
  assert.equal(tally.count(), 1);
}
// Both the ordinary combat owner and Recall defense owner must sample at release.
// Ordinary pet attack must not secretly fall back to a Soldier action.
for (const family of families) {
  const a = arena(family), b = arena(family), counter = attach(b.g);
  for (const u of [a.unit, b.unit]) {
    u.cd = 0;
    u.skill1Cd = 20;
    u.skill2Cd = 20;
    u.skillGlobalCd = 20;
  }
  a.g.updatePetCombat(a.unit, a.target, [a.unit], 0.016);
  b.g.updatePetCombat(b.unit, b.target, [b.unit], 0.016);
  assert.equal(counter.count(), 1, family + ' ordinary basic rolls at its own owner');
  settle(a.g);
  settle(b.g);
  assert(b.target.hp < a.target.hp, family + ' ordinary basic gains native potency');
  assert.equal(a.unit.cd, b.unit.cd, family + ' ordinary basic cooldown unchanged');
}
assert.equal(validated, 99);
assert.equal(Campaign.prototype._criticalPartyNative, undefined,
  'critical session stays opt-in and is not installed by published Campaign');
console.log('PASS 33 native pet actions x 3 levels: Recall basics, first skills, charged releases, delayed contact, healing, Slow, wards and no-roll guards');

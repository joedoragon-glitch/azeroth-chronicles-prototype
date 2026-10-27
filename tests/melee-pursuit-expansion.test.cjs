'use strict';
// Focused all-region melee Pursuit Burst eligibility and summons-provenance audit.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const cfg = Campaign.rules.balance.pursuit;
assert.equal(cfg.burstSeconds, 1.2);
assert.equal(cfg.burstMultiplier, 1.5);
assert.equal(cfg.meleeRecoverySeconds, 2);

function scene(region, species) {
  const c = new Campaign('normal', 'ranger', () => 0.9);
  c.enter(region);
  c.s.time = 30;
  c.s.mercyTime = 0;
  c.s.valeFieldAwakened = true;
  c.s.thornHeroInitiated = true;
  const e = c.makeEnemy({
    species, name: 'pursuit candidate', form: 'normal',
    level: 3, hp: 5000, damage: 5, gold: 0, xp: 0,
  }, { x: 1400, y: 1600 });
  e.ranged = false;
  e.hybrid = false;
  c.zone().enemies = [e];
  c.s.party = [];
  e.aggro = true;
  return { c, e };
}
for (const [region, species] of [
  ['vale', 'goblin'], ['march', 'mireling'], ['highlands', 'ogre'],
  ['frontier', 'orc'], ['crown', 'ashbeast'],
  ['crypt', 'skeleton'], ['supply-vale', 'goblin'],
]) {
  const { c, e } = scene(region, species);
  assert(c.meleePursuitBurstEligible(e), region + ' ordinary melee');
  e.guard = true;
  assert(c.meleePursuitBurstEligible(e), region + ' melee guardian');
  e.form = 'ringleader';
  assert(c.meleePursuitBurstEligible(e), region + ' melee Ringleader');
  e.ranged = true;
  e.hybrid = true;
  assert(c.meleePursuitBurstEligible(e), region + ' melee-capable hybrid');
  e.hybrid = false;
  assert(!c.meleePursuitBurstEligible(e), region + ' pure ranged excluded');
}
{
  const { c, e } = scene('frontier', 'orc');
  e.nightOnly = true;
  assert(c.meleePursuitBurstEligible(e), 'eligible night melee');
  for (const change of [
    { type: 'boss' }, { captain: true }, { roomCaptain: true },
    { fieldCaptain: true }, { developerSummon: true },
  ]) {
    const old = { ...e };
    Object.assign(e, change);
    assert(!c.meleePursuitBurstEligible(e), JSON.stringify(change));
    Object.keys(change).forEach(k => { if (!(k in old)) delete e[k]; });
    Object.assign(e, old);
  }
}
{
  const { c, e } = scene('vale', 'goblin');
  const owner = c.makeEnemy({
    species: 'goblin', name: 'Ringleader owner', form: 'ringleader',
    level: 3, hp: 5000, damage: 5, gold: 0, xp: 0,
  }, { x: 1300, y: 1600 });
  owner.form = 'ringleader';
  c.zone().enemies.push(owner);
  Object.assign(e, { summon: true, owner: owner.id, guard: true,
    rogueEmergencyReinforcement: true, ranged: false });
  assert(c.meleePursuitBurstEligible(e),
    'real Ringleader-owned melee reinforcements qualify');
  e.ranged = true;
  assert(!c.meleePursuitBurstEligible(e), 'ranged reinforcement excluded');
  e.ranged = false;
  for (const change of [
    { type: 'boss' }, { captain: true }, { roomCaptain: true },
    { fieldCaptain: true },
  ]) {
    const old = { ...owner };
    Object.assign(owner, change);
    assert(!c.meleePursuitBurstEligible(e), 'owner ' + JSON.stringify(change));
    Object.keys(change).forEach(k => { if (!(k in old)) delete owner[k]; });
    Object.assign(owner, old);
  }
  owner.hp = 0;
  assert(c.meleePursuitBurstEligible(e), 'dead Ringleader owner retains origin');
  owner.hp = 5000;
  e.owner = 'unknown-owner';
  assert(!c.meleePursuitBurstEligible(e), 'missing owner fails closed');
  e.owner = e.id;
  assert(!c.meleePursuitBurstEligible(e), 'owner cycle fails closed');
  e.owner = owner.id;
  const ancestor = c.makeEnemy({
    species: 'orc', name: 'ancestor', level: 3, hp: 5000,
    damage: 5, gold: 0, xp: 0,
  }, { x: 1250, y: 1600 });
  ancestor.type = 'boss';
  owner.summon = true;
  owner.owner = ancestor.id;
  c.zone().enemies.push(ancestor);
  assert(!c.meleePursuitBurstEligible(e), 'indirect boss-owned summon excluded');
  ancestor.type = 'mob';
  ancestor.captain = true;
  assert(!c.meleePursuitBurstEligible(e), 'indirect captain-owned summon excluded');
  ancestor.captain = false;
  assert(c.meleePursuitBurstEligible(e), 'verified non-captain ancestry eligible');
}
{
  const { c, e } = scene('vale', 'skeleton');
  e.summon = true;
  assert(!c.meleePursuitBurstEligible(e), 'ownerless summon excluded');
  e.summon = false;
  e.rogueEmergencyReinforcement = true;
  assert(!c.meleePursuitBurstEligible(e), 'orphan emergency guard excluded');
  c.s.phase = 'peace';
  assert(!c.meleePursuitBurstEligible(e), 'peace disables added pressure');
}
console.log('PASS shared melee pursuit: five regions, interiors, Ringleaders, hybrids, boss/captain summon ancestry and orphan safety');

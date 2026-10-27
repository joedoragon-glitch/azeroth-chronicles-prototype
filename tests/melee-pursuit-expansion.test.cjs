'use strict';
// Strict staged melee pursuit: only ordinary unsummoned melee and melee Ringleaders.
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
  assert(!c.meleePursuitBurstEligible(e), region + ' hybrid ranged actor excluded');
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
    species: 'goblin', name: 'Ringleader summoner', form: 'ringleader',
    level: 3, hp: 5000, damage: 5, gold: 0, xp: 0,
  }, { x: 1300, y: 1600 });
  c.zone().enemies.push(owner);
  for (const changes of [
    { summon: true, owner: owner.id },
    { summon: true, owner: owner.id, rogueEmergencyReinforcement: true },
    { summon: true, owner: 'missing-owner' },
    { summon: true, owner: e.id },
    { rogueEmergencyReinforcement: true },
  ]) {
    const old = { ...e };
    Object.assign(e, changes);
    assert(!c.meleePursuitBurstEligible(e),
      'no summons or called reinforcements: ' + JSON.stringify(changes));
    Object.keys(changes).forEach(k => { if (!(k in old)) delete e[k]; });
    Object.assign(e, old);
  }
}
{
  const { c, e } = scene('frontier', 'orc');
  e.quotaOvertime = 9;
  e.pursuitBurst = 4;
  assert(!c.meleePursuitBurstEligible(e),
    'captain Overtime worker is excluded from short native recovery');
  assert.equal(e.pursuitBurst, 4, 'existing four-second Overtime burst untouched');
  e.quotaOvertime = 0;
  assert(c.meleePursuitBurstEligible(e),
    'ordinary unsummoned melee may qualify again after Overtime');
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
console.log('PASS strictly ordinary melee and melee Ringleader pursuit: regions, all summon and Overtime exclusions, ranged roles');

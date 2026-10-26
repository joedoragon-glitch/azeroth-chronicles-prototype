'use strict';
// Dedicated basic-attack reach regression. The balanced Soldier and pet
// values may differ; Archer, ranged pets and skill ranges stay unchanged.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

const companion = Campaign.rules.balance.companions;
const tuning = Campaign.rules.meleeReach;
const soldierRange = companion.soldierMeleeBasicRange;
const petRange = companion.petMeleeBasicRange;
assert.equal(soldierRange, tuning.soldier, 'Soldier range derives from central tuning');
assert.equal(petRange, tuning.pet, 'melee pet range derives from central tuning');
assert.equal(Campaign.rules.balance.meleeBasicRange, tuning.enemy, 'hostile basic derives from central tuning');
assert.equal(companion.petBasicRange, 280, 'ranged pet basic reach remains unchanged');

function scene(type, distance, family) {
  const g = new Campaign('normal', 'paladin', () => 0.9);
  // Native Vale opening forbids companion damage until the first hero kill.
  // Complete it rather than disabling the gameplay safeguard in the test.
  completeFieldOpening(g);
  const zone = g.zone();
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) zone[key] = [];
  Object.assign(g.hero, { x: 500, y: 500 });
  g.s.mercyTime = 0;
  g.s.expeditionRank = 6;
  const u = g.unit(type, 520, 500, family);
  u.cd = 0;
  u.skill1Cd = u.skill2Cd = 100; // Test basic only, not a pet/soldier skill.
  g.s.party = [u];
  const enemy = g.makeEnemy(
    { species: 'goblin', name: 'Reach test target', level: 1,
      hp: 10000, damage: 0, gold: 0, xp: 0 },
    { x: u.x + distance, y: u.y },
  );
  zone.enemies = [enemy];
  g.engage(enemy);
  assert(g.line(u, enemy), 'clear native attack line');
  return { g, u, enemy };
}

// Both real Soldier basic paths use the chosen range and keep a hard limit.
for (const distance of [soldierRange - 5, soldierRange + 5]) {
  const { g, u, enemy } = scene('soldier', distance);
  assert.equal(g.companionCombatReach(u), soldierRange, 'Soldier reach');
  const hp = enemy.hp;
  const attacked = g.companionCoverAttack(u, enemy, true);
  assert.equal(attacked, distance <= soldierRange, 'Soldier defensive basic at ' + distance);
  assert.equal(enemy.hp < hp, distance <= soldierRange, 'Soldier contact damage at ' + distance);
  const normal = scene('soldier', distance);
  const before = normal.enemy.hp;
  // Directly exercise the normal owner with the transient tactical map that
  // updateParty initializes before invoking companionFight in production.
  normal.g._tacticalPartyTargets = new Map();
  normal.g.companionFight(normal.u, normal.enemy, [normal.u], 0);
  assert.equal(normal.enemy.hp < before, distance <= soldierRange,
    'Soldier ordinary sword basic at ' + distance);
}

// All melee pet families share their configurable actual defensive and ordinary basic reach.
const meleeFamilies = Object.keys(Campaign.rules.petCompanions)
  .filter(family => Campaign.rules.petCompanions[family].role === 'melee');
const rangedFamilies = Object.keys(Campaign.rules.petCompanions)
  .filter(family => Campaign.rules.petCompanions[family].role === 'ranged');
assert(meleeFamilies.length > 0 && rangedFamilies.length > 0);
for (const family of meleeFamilies) {
  for (const distance of [petRange - 5, petRange + 5]) {
    const { g, u, enemy } = scene('pet', distance, family);
    assert.equal(g.companionCombatReach(u), petRange, family + ' basic reach');
    const hp = enemy.hp;
    const attacked = g.petDefensiveCounter(u, enemy);
    assert.equal(attacked, distance <= petRange, family + ' defensive basic at ' + distance);
    assert.equal(enemy.hp < hp, distance <= petRange, family + ' contact damage at ' + distance);
    const normal = scene('pet', distance, family);
    const before = normal.enemy.hp;
    normal.g.updatePetCombat(normal.u, normal.enemy, [normal.u], 0);
    assert.equal(normal.enemy.hp < before, distance <= petRange,
      family + ' ordinary basic at ' + distance);
  }
}

// Ranged roles retain their original reach; no extra projectile launch at 285.
{
  const { g, u } = scene('archer', 185);
  assert.equal(g.companionCombatReach(u), 185, 'Archer basic unchanged');
}
for (const family of rangedFamilies) {
  for (const distance of [270, 285]) {
    const { g, u, enemy } = scene('pet', distance, family);
    assert.equal(g.companionCombatReach(u), 280, family + ' ranged basic unchanged');
    const shots = g.s.projectiles.length;
    assert.equal(g.petDefensiveCounter(u, enemy), distance <= 280,
      family + ' ranged attack at ' + distance);
    assert.equal(g.s.projectiles.length - shots, distance <= 280 ? 1 : 0,
      family + ' projectile count unchanged at ' + distance);
  }
}
console.log('PASS Soldier and ' + meleeFamilies.length +
  ' melee pet families at configured boundaries, ranged pet basics at 270/285, Archer unchanged');

'use strict';
// Dedicated basic-attack reach regression: Soldier and melee pets match
// the enemy 90-unit floor without expanding Archer, ranged-pet or skill ranges.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

const companion = Campaign.rules.balance.companions;
const enemyMelee = Campaign.rules.balance.meleeBasicRange;
assert.equal(companion.meleeBasicRange, 90, 'friendly melee basic reach is independently authored');
assert.equal(enemyMelee, 90, 'existing enemy melee baseline remains unchanged');
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

// Both real Soldier basic paths use the increased reach and keep a hard limit.
for (const distance of [85, 95]) {
  const { g, u, enemy } = scene('soldier', distance);
  assert.equal(g.companionCombatReach(u), 90, 'Soldier reach');
  const hp = enemy.hp;
  const attacked = g.companionCoverAttack(u, enemy, true);
  assert.equal(attacked, distance <= 90, 'Soldier defensive basic at ' + distance);
  assert.equal(enemy.hp < hp, distance <= 90, 'Soldier contact damage at ' + distance);
  const normal = scene('soldier', distance);
  const before = normal.enemy.hp;
  normal.g.companionFight(normal.u, normal.enemy, [normal.u], 0);
  assert.equal(normal.enemy.hp < before, distance <= 90,
    'Soldier ordinary sword basic at ' + distance);
}

// All melee pet families share 90-unit actual defensive and ordinary basic reach.
const meleeFamilies = Object.keys(Campaign.rules.petCompanions)
  .filter(family => Campaign.rules.petCompanions[family].role === 'melee');
const rangedFamilies = Object.keys(Campaign.rules.petCompanions)
  .filter(family => Campaign.rules.petCompanions[family].role === 'ranged');
assert(meleeFamilies.length > 0 && rangedFamilies.length > 0);
for (const family of meleeFamilies) {
  for (const distance of [85, 95]) {
    const { g, u, enemy } = scene('pet', distance, family);
    assert.equal(g.companionCombatReach(u), 90, family + ' basic reach');
    const hp = enemy.hp;
    const attacked = g.petDefensiveCounter(u, enemy);
    assert.equal(attacked, distance <= 90, family + ' defensive basic at ' + distance);
    assert.equal(enemy.hp < hp, distance <= 90, family + ' contact damage at ' + distance);
    const normal = scene('pet', distance, family);
    const before = normal.enemy.hp;
    normal.g.updatePetCombat(normal.u, normal.enemy, [normal.u], 0);
    assert.equal(normal.enemy.hp < before, distance <= 90,
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
  ' melee pet basic ranges at 85/95, all ranged pet basics at 270/285, Archer unchanged');

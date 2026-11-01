'use strict';
// #684: While the hero covers a retreat, Recall controls the squad only.
// Automatic basics and manually cast skills must neither end nor restart it.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
Campaign.enableRoguePlaytest();
for (const heroClass of ['paladin', 'mage', 'ranger', 'rogue']) {
  const g = new Campaign('normal', heroClass, () => 0.9);
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  g.s.thornHeroInitiated = true;
  g.zone().props = [];
  g.zone().buildings = [];
  g.zone().enemies = [];
  Object.assign(g.hero, { x: 500, y: 500, order: null, basicCd: 0 });
  const soldier = g.unit('soldier', 830, 500);
  g.s.party = [soldier];
  const enemy = g.makeEnemy(
    { species: 'goblin', name: 'Retreat covering-fire witness',
      level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 },
    { x: 590, y: 500 },
  );
  enemy.aggro = true;
  g.zone().enemies = [enemy];
  g.line = () => true;
  assert(g.recallParty(), heroClass + ' Recall can activate');
  const expiry = g.s.recallExpiresAt;
  assert.equal(expiry, g.s.time + 5, '5-second game time budget');
  const before = soldier.x;
  g.updateParty(0.05);
  assert(soldier.x < before, heroClass + ' companion is actually returning');
  assert.equal(soldier.order, null, 'Recall does not become combat pursuit');
  assert(g.castMovementBasic(), heroClass + ' can cover retreat with auto basic');
  assert(g.hero.basicCd > 0, 'automatic attack has real independent recovery');
  assert.equal(g.s.recallActive, true,
    heroClass + ' automatic basic never cancels Recall');
  assert.equal(g.s.recallExpiresAt, expiry,
    heroClass + ' automatic basic does not refresh five-second expiry');
  assert(g.cast(1, enemy.id), heroClass + ' can manually activate Skill 1 while withdrawing');
  assert.equal(g.s.recallActive, true,
    heroClass + ' manually activated Skill 1 does not cancel Recall');
  assert.equal(g.s.recallExpiresAt, expiry,
    heroClass + ' Skill 1 must not restart five-second expiry');
  if (heroClass === 'rogue') {
    assert(g.effects.some((effect) => effect.type === 'rogueBellBasic'),
      'Rogue auto basic executes independently of Recall');
    assert(g.effects.some((effect) => effect.type === 'rogueBellSkill1'),
      'Rogue manual Skill 1 also executes independently');
    g.hero.skills[1] = 1;
    assert(g.cast(2, enemy.id), 'Rogue manual Skill 2 performance executes during Recall');
    assert.equal(g.s.recallActive, true,
      'Rogue performances never end the withdrawal order');
    assert.equal(g.s.recallExpiresAt, expiry,
      'Rogue performances never refresh withdrawal duration');
  }
  g.updateParty(0.05);
  assert.equal(g.s.recallActive, true, 'companion still follows Recall after hero offense');
  assert.equal(soldier.order, null, 'combat did not replace companion Recall');
  for (let i = 0; i < 51; i++) g.tick(0.1, { x: 0, y: 0 });
  assert.equal(g.s.recallActive, false, 'only game-time expiry ends the untouched Recall');
  assert.equal(g.s.recallExpiresAt, undefined, 'timer cleaned up after expiry');
}
console.log('PASS four-class covering fire and Skill 1 during squad Recall, Rogue manual song, timer independence and normal expiry');

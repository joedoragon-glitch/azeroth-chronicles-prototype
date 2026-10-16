'use strict';
// PT-018 and PT-003/PT-012 acceptance scaffolds. DO NOT RUN before
// the director explicitly authorizes the final integrated validation cycle.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Audio = require('../src/prototype/audio.js');

{
  const dev = new Campaign('developer', 'paladin', () => 0.9);
  dev.s.tickets = {};
  dev.s.recovery = {};
  dev.hero.gold = 0;
  assert.equal(dev.travelFare(0, 1), 0);
  assert(dev.travel(1), 'Developer can travel to Marches with no crowns');
  assert.equal(dev.zoneId, 'march');
  assert.equal(dev.hero.gold, 0);
  assert.deepEqual(dev.s.tickets, {}, 'Developer travel does not purchase paid tickets');
  assert(dev.travel(-1), 'Developer may return without purchased ticket');
  assert.equal(dev.zoneId, 'vale');
  assert.equal(dev.hero.gold, 0);
  for (let i = 0; i < Campaign.data.regions.length - 1; i++) {
    assert(dev.travel(1), 'free outbound across boundary ' + i);
    assert.equal(dev.hero.gold, 0);
  }
  assert.equal(dev.zoneId, 'crown');
  assert.equal(dev.hubDestinations().length, Campaign.data.regions.length - 1);
  assert(dev.travelHub('vale'), 'Developer Crown hub reaches unvisited regions');
  assert.equal(dev.hero.gold, 0);
}
for (const mode of ['normal', 'nightmare']) {
  const c = new Campaign(mode, 'paladin', () => 0.9);
  const fare = c.travelFare(0, 1);
  assert(fare > 0, mode + ' retains paid outbound travel');
  c.hero.gold = 0;
  assert(!c.travel(1), mode + ' rejects unpaid travel');
  c.enter('march');
  c.s.tickets = {};
  assert(!c.travel(-1), mode + ' retains return ticket restriction');
}
{
  const a = new Audio();
  assert.equal(a.soundKind({ type: 'melee', actor: 'enemy', species: 'goblin' }), 'enemyWeaponImpact');
  assert.equal(a.soundKind({ type: 'melee', actor: 'enemy', species: 'goblin', weapon: 'club' }), 'creatureImpact');
  assert.equal(a.soundKind({ type: 'melee', actor: 'enemy', species: 'skeleton' }), 'enemyWeaponImpact');
  assert.equal(a.soundKind({ type: 'melee', actor: 'enemy', species: 'wolf' }), 'creatureImpact');
  assert.equal(a.soundKind({ type: 'projectileLaunch', actor: 'enemy', style: 'cargo' }), 'rollingCargoLaunch');
  assert.equal(a.soundKind({ type: 'projectileImpact', actor: 'enemy', style: 'cargo', terrain: true }), 'rollingCargoImpact');
}
// Remaining acceptance: real transport/saves/display on phone and desktop;
// native equipment/weapon fidelity, cargo hit/cover/miss and crowded mix.
console.log('PASS PT-018 and PT-003/PT-012 source acceptance scaffolds');

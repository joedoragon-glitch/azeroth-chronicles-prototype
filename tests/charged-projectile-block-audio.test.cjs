'use strict';
// Source-authoritative charged projectile event stage after physical Skill Block.
// Do not re-run the historical broad dodge matrix, which includes non-projectile
// timed skills and delayed Ranger releases owned by their own focused suites.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

function arena(cls) {
  const g = new Campaign('normal', cls, () => 0.9);
  Object.assign(g.hero, { x: 1400, y: 1700, order: null });
  g.hero.skills.fill(1);
  g.hero.cd.fill(0);
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.time = 30;
  const zone = g.zone();
  zone.props = [];
  zone.buildings = [];
  zone.npcs = [];
  const enemy = g.makeEnemy(
    { species: 'goblin', name: 'Charge contact', level: 5,
      hp: 100000, damage: 0, gold: 0, xp: 0 },
    { x: 1650, y: 1700 },
  );
  zone.enemies = [enemy];
  g.engage(enemy);
  return { g, enemy };
}
function fly(g) {
  for (let t = 0; t < 3.5; t += 0.05) {
    g.s.time += 0.05;
    g.updateProjectiles(0.05);
  }
}
{
  const { g, enemy } = arena('ranger');
  assert(g.cast(6, enemy.id, true), 'charged Ranger volley admitted');
  assert(g.s.projectiles.some(p => p.source === 'hero' && p.charged),
    'the charge really created physical projectiles');
  const hp = enemy.hp;
  let blockChecks = 0;
  g.skillBlocks = () => { blockChecks++; return true; };
  fly(g);
  assert(blockChecks > 0, 'physical charge contacted the native Skill Block gate');
  assert.equal(enemy.hp, hp, 'blocked charged contact cannot deal HP damage');
  const contacts = g.effects.filter(e => e.type === 'projectileImpact' && e.actor === 'hero');
  assert(contacts.length > 0 && contacts.every(e => e.landed === false),
    'blocked physical contact is still reported truthfully');
  assert(!g.effects.some(e => e.type === 'chargedImpact'),
    'no successful charged burst is announced after a blocked contact');
}
{
  const { g, enemy } = arena('mage');
  const hp = enemy.hp;
  assert(g.cast(6, enemy.id, true), 'charged Mage Skill 6 focused beam admitted');
  assert(g.s.projectiles.some(p => p.source === 'hero' && p.charged),
    'the actual Mage charged beam created a physical projectile');
  fly(g);
  assert(enemy.hp < hp, 'unblocked charged Mage projectile dealt damage');
  assert(g.effects.some(e => e.type === 'projectileImpact' && e.landed === true),
    'successful charged beam retains its physical contact');
  assert(g.effects.some(e => e.type === 'chargedImpact'),
    'successful charged beam retains the additional audio/VFX burst');
}
console.log('PASS charged physical hero contact: blocked Ranger quiet burst, landed Mage burst');

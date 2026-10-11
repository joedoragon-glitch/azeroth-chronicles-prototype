'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
function setup(heroClass, tier) {
  const c = new Campaign('normal', heroClass, () => .9);
  Object.assign(c.hero, { x: 600, y: 900, order: null });
  c.hero.skills[0] = c.hero.skills[1] = 1;
  c.hero.cd = Array(8).fill(0);
  c.s.party = [];
  c.s.mercyTime = 0;
  const e = tier === 'boss' || tier === 'true'
    ? c.bossEnemy(c.boss('thorn'), tier === 'true' ? 'true' : 'normal', { x: 680, y: 900 })
    : c.makeEnemy(
      { species: 'goblin', name: 'Opener', level: 1, hp: 10000, damage: 0, xp: 0, gold: 0 },
      { x: 680, y: 900 },
    );
  if (tier === 'captain') e.captain = true;
  if (tier === 'roomCaptain') e.roomCaptain = true;
  c.zone().enemies = [e];
  c.s.projectiles = [];
  assert(c.line(c.hero, e), 'fixture requires clear line of sight');
  return { c, e };
}
function charged(c, e, slot, receipt) {
  assert(c.cast(slot, e.id, true, receipt), 'charged cast succeeds');
  for (let i = 0; i < 3; i++) c.updateProjectiles(.2);
}
let cases = 0;
for (const tier of ['boss', 'true', 'captain', 'roomCaptain'])
  for (const heroClass of ['paladin', 'mage', 'ranger'])
    for (const slot of [1, 2]) {
      const { c, e } = setup(heroClass, tier);
      const before = c.chargedEncounterSnapshot();
      c.engage(e); // Subsequent aggro must not validate an earlier hold.
      charged(c, e, slot, before);
      assert.equal(e.hp, e.maxHp, 'precharged damage rolled back');
      assert.equal(e.aggro, false, 'protected enemy resets');
      assert.deepEqual({ x: e.x, y: e.y }, e.home, 'enemy returned home');
      assert.equal(c.s.projectiles.length, 0, 'no delayed Ranger hit');
      cases++;
      const valid = setup(heroClass, tier);
      valid.c.engage(valid.e);
      const duringCombat = valid.c.chargedEncounterSnapshot();
      assert.equal(valid.e.hp, valid.e.maxHp, 'already aggro at full HP');
      charged(valid.c, valid.e, slot, duringCombat);
      assert(valid.e.hp < valid.e.maxHp && valid.e.aggro, 'legitimate charge lands');
      cases++;
    }
for (const heroClass of ['paladin', 'mage', 'ranger']) {
  const { c, e } = setup(heroClass, 'ordinary');
  charged(c, e, 1, c.chargedEncounterSnapshot());
  assert(e.hp < e.maxHp && e.aggro, 'ordinary foe not protected');
  cases++;
}
{
  const { c, e } = setup('paladin', 'boss');
  assert(c.cast(1, e.id, false));
  assert(e.hp < e.maxHp && e.aggro, 'normal opening attack unchanged');
  cases++;
}
{
  const { c, e } = setup('paladin', 'boss');
  const stale = c.chargedEncounterSnapshot();
  c.engage(e);
  c.disengage(e, 1);
  c.s.time += 1;
  c.engage(e);
  charged(c, e, 1, stale);
  assert.equal(e.aggro, false, 'new encounter cannot use stale charge receipt');
  cases++;
}
console.log('PASS ' + cases + ' charged opener/encounter scenarios');

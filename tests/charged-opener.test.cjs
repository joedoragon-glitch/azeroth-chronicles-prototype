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
      e.x += 4;
      e.y += 2;
      e.open = 2;
      e.slow = 1;
      const encounter = {
        hp: e.hp,
        maxHp: e.maxHp,
        x: e.x,
        y: e.y,
        open: e.open,
        slow: e.slow,
        fightStart: e.fightStart,
      };
      charged(c, e, slot, before);
      assert.deepEqual(
        {
          hp: e.hp,
          maxHp: e.maxHp,
          x: e.x,
          y: e.y,
          open: e.open,
          slow: e.slow,
          fightStart: e.fightStart,
        },
        encounter,
        'deflected precharge leaves the encounter state unchanged',
      );
      assert.equal(e.aggro, true, 'protected enemy stays engaged');
      assert.equal(c.s.projectiles.length, 0, 'no delayed Ranger hit');
      assert(c.messages.some((message) => message.includes('deflects')), 'deflection feedback');
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
  const hp = e.hp;
  charged(c, e, 1, stale);
  assert.equal(e.hp, hp, 'stale receipt cannot damage new encounter');
  assert.equal(e.aggro, true, 'stale charge does not reset new encounter');
  cases++;
}
{
  const { c, e } = setup('ranger', 'boss');
  const before = c.chargedEncounterSnapshot();
  c.engage(e);
  c.s.party = [{ id: 'ally-test', type: 'soldier', x: c.hero.x, y: c.hero.y, hp: 120, maxHp: 120 }];
  assert(c.damage(e, 37, 'ally-test'), 'companion hit lands before charged release');
  const woundedHp = e.hp;
  assert(woundedHp < e.maxHp, 'companion wounded the boss');
  charged(c, e, 1, before);
  assert.equal(e.hp, woundedHp, 'deflection preserves earlier companion damage');
  assert.equal(e.aggro, true, 'companion encounter continues after deflection');
  assert.equal(c.s.projectiles.length, 0, 'whole invalid burst is cancelled');
  cases++;
}
console.log('PASS ' + cases + ' charged opener/encounter scenarios');

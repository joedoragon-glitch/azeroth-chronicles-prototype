'use strict';
// This suite checks authored hits independently of skill evasion. Dedicated
// skill-evasion suites verify the new probability and missed-contact rules.
require('./helpers/legacy-skill-evasion.cjs')();
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
function setup(heroClass, tier) {
  const c = new Campaign('normal', heroClass, () => 0.9);
  c.zone().props = [];
  c.zone().buildings = [];
  Object.assign(c.hero, { x: 500, y: 500, order: null });
  c.hero.skills[0] = c.hero.skills[1] = 1;
  c.hero.cd = Array(8).fill(0);
  c.s.party = [];
  c.s.mercyTime = 0;
  const e =
    tier === 'boss' || tier === 'true'
      ? c.bossEnemy(c.boss('thorn'), tier === 'true' ? 'true' : 'normal', { x: 580, y: 500 })
      : c.makeEnemy(
          { species: 'goblin', name: 'Opener', level: 1, hp: 10000, damage: 0, xp: 0, gold: 0 },
          { x: 580, y: 500 },
        );
  if (tier === 'captain') e.captain = true;
  if (tier === 'roomCaptain') e.roomCaptain = true;
  c.zone().enemies = [e];
  c.s.projectiles = [];
  assert(c.line(c.hero, e), 'fixture requires clear line of sight');
  return { c, e };
}
function engage(c, e) {
  assert(c.damage(e, 1, 'hero'), 'native hero contact starts fixture encounter');
  e.hp = e.maxHp;
}
function charged(c, e, slot, receipt) {
  assert(c.cast(slot, e.id, true, receipt), 'charged cast succeeds');
  for (let i = 0; i < 30; i++) {
    c.s.time += 0.02;
    c.advanceHeroSkillEffects(0.02);
    c.updateProjectiles(0.02);
  }
}
let cases = 0;
for (const tier of ['boss', 'true', 'captain', 'roomCaptain'])
  for (const heroClass of ['paladin', 'mage', 'ranger'])
    for (const slot of [1, 2]) {
      const { c, e } = setup(heroClass, tier);
      const before = c.chargedEncounterSnapshot();
      engage(c, e); // Subsequent aggro must not validate an earlier hold.
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
      assert(
        c.messages.some((message) => message.includes('deflects')),
        `${heroClass} ${tier} slot ${slot}: deflection feedback`,
      );
      cases++;
      const valid = setup(heroClass, tier);
      engage(valid.c, valid.e);
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
  for (let i = 0; i < 30; i++) c.updateProjectiles(0.02);
  assert(e.hp < e.maxHp && e.aggro, 'normal opening attack unchanged');
  cases++;
}
{
  const { c, e } = setup('paladin', 'boss');
  const stale = c.chargedEncounterSnapshot();
  engage(c, e);
  c.disengage(e, 1);
  // Thornfang now waits for the same Mira and returns physically; a new
  // encounter starts only when that authorized lifecycle completes.
  for (let i = 0; i < 1000 && e.returning; i++) {
    c.s.time += 0.1;
    c.disengage(e, 0.1);
    c.updateThornCaptive(0.1);
  }
  assert(!e.returning && !e.thornReturn, 'joint return completed before new encounter');
  Object.assign(c.hero, c.safe(e.x - 80, e.y));
  c.s.time += 1;
  engage(c, e);
  const hp = e.hp;
  charged(c, e, 1, stale);
  assert.equal(e.hp, hp, 'stale receipt cannot damage new encounter');
  assert.equal(e.aggro, true, 'stale charge does not reset new encounter');
  cases++;
}
{
  const { c, e } = setup('ranger', 'boss');
  const before = c.chargedEncounterSnapshot();
  engage(c, e);
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

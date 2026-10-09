'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');

const createEncounter = (cls, rank = 2) => {
  const c = new C('normal', cls, () => 0.87);
  const z = c.zone();
  c.s.expeditionRank = rank;
  c.s.mercyTime = 0;
  c.s.party = [c.unit('soldier', 1060, 1070), c.unit('archer', 1110, 1050)];
  Object.assign(c.hero, { x: 1030, y: 1030 });
  const boss = c.makeEnemy(
    { family: 'thorn', species: 'wolf', name: 'Target boss', form: 'normal',
      type: 'boss', level: 2, hp: 1200, damage: 8, gold: 0, xp: 0 },
    { x: 1210, y: 1030 },
  );
  const add = c.makeEnemy(
    { species: 'wolf', name: 'Threatening add', type: 'mob',
      level: 2, hp: 180, damage: 5, gold: 0, xp: 0 },
    { x: 1170, y: 1070 },
  );
  boss.aggro = true;
  z.enemies = [boss, add];
  return { c, boss, add };
};
const targetIds = (c) => [...(c._tacticalPartyTargets?.values() || [])];
const update = (c) => { c.updateParty(0.05); return targetIds(c); };
for (const cls of ['mage', 'ranger']) {
  const { c, boss, add } = createEncounter(cls);
  assert.equal(c.squadDefaultDoctrine(), 'guard');
  assert.deepEqual(update(c), [boss.id, boss.id], cls + ': ADDS idle-free boss fallback');
  add.aggro = true;
  assert.deepEqual(update(c), [add.id, add.id], cls + ': newly active add preempts boss');
  add.hp = 0;
  assert.deepEqual(update(c), [boss.id, boss.id], cls + ': cleared add returns to boss');
  add.hp = 180;
  add.aggro = true;
  assert.deepEqual(update(c), [add.id, add.id], cls + ': next wave reactivates screening');
  const manual = createEncounter(cls, 3);
  assert(manual.c.toggleSquadDoctrine(), cls + ': player can issue boss-focus instruction');
  assert.equal(manual.c._squadDoctrineManual, true);
  manual.add.aggro = true;
  assert.deepEqual(update(manual.c), [manual.boss.id, manual.boss.id],
    cls + ': manual BOSS command defeats automatic add screening');
  assert.equal(manual.c.squadDoctrineLabel().label, 'BOSS');
}
{
  const { c, boss, add } = createEncounter('paladin');
  assert.equal(c.squadDefaultDoctrine(), 'focus');
  assert.deepEqual(update(c), [boss.id, boss.id], 'paladin prioritizes boss without threats');
  add.aggro = true;
  // An add pressing the back line triggers temporary protection in the default.
  assert.deepEqual(update(c), [add.id, add.id], 'default paladin screens nearby threats');
  add.hp = 0;
  assert.deepEqual(update(c), [boss.id, boss.id], 'default paladin returns to boss');
}
{
  const { c, boss, add } = createEncounter('paladin', 3);
  assert(c.toggleSquadDoctrine(), 'paladin can manually select ADDS');
  add.aggro = true;
  assert.deepEqual(update(c), [add.id, add.id], 'manual ADDS clears the immediate threat');
  add.hp = 0;
  assert.deepEqual(update(c), [boss.id, boss.id], 'manual ADDS still attacks boss between waves');
  assert(c.toggleSquadDoctrine(), 'paladin can manually return to BOSS');
  add.hp = 180;
  add.aggro = true;
  assert.deepEqual(update(c), [boss.id, boss.id], 'explicit BOSS order is never overridden');
  add.aggro = false;
  boss.aggro = false;
  c.squadDoctrineLabel();
  assert.equal(c.s.squadDoctrine, 'focus', 'manual order resets after encounter');
  assert.equal(c._squadDoctrineManual, false, 'manual intent resets after encounter');
}
{
  const { c, boss, add } = createEncounter('ranger');
  assert.deepEqual(update(c), [boss.id, boss.id]);
  add.aggro = true; // Unrelated ordinary monster targets the hero.
  add.summon = false;
  assert.deepEqual(update(c), [add.id, add.id], 'hero-directed non-summon threat also gets screened');
}
{
  const { c, boss, add } = createEncounter('mage', 1);
  assert.equal(c.squadDoctrineLabel().label, 'ADDS');
  assert(c.toggleSquadDoctrine(), 'boss-mode toggle is available during the first boss at rank 1');
  add.aggro = true;
  assert.deepEqual(update(c), [boss.id, boss.id], 'first-boss manual BOSS order remains strict');
  add.aggro = false;
  boss.aggro = false;
  c.squadDoctrineLabel();
  assert.equal(c._squadDoctrineManual, false, 'combat ending clears explicit order');
  add.aggro = true; // Field-only encounter; rank 1 field doctrine remains locked.
  assert.equal(c.toggleSquadDoctrine(), false, 'rank 1 still cannot toggle ordinary-field doctrine');
}
console.log('PASS dynamic add/boss fallback, paladin protection and explicit player override');

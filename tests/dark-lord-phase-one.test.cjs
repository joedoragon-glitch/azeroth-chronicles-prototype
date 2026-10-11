'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');

const boss = C.data.bosses.find((b) => b.id === 'darklord');
const expected = [
  "Veteran's Repertoire",
  "Pathfinder's Gambit",
  'Royal Muster',
  'Freedom Has a Price',
  'No More Heroes',
];
assert.deepEqual(boss.attacks.map((line) => line.split(':')[0]), expected);
assert.equal(C.rules.attacks.darklord.length, 5);
assert.equal(C.rules.rogueMoves.bosses.darklord.name, 'Writ of Restraint');

for (const mode of ['normal', 'nightmare']) {
  for (const heroClass of Object.keys(C.classes)) {
    const c = new C(mode, heroClass, () => 0.9);
    c.enter('crown');
    const e = c.bossEnemy(boss, 'normal', { x: 1100, y: 1100 });
    Object.assign(c.hero, { x: 1170, y: 1100 });
    assert.equal(c.bossAttackWeights(e)[3], 0);
    assert.equal(c.bossAttackWeights(e)[4], 0);
    const sword = c.buildBossAttack(e, 0, c.hero);
    assert.equal(sword.sequence.length, 2);
    assert.equal(sword.sequence[1].coefficient, 1.3);
    const route = c.buildBossAttack(e, 1, c.hero);
    assert.equal(route.first.landing, true);
    assert.equal(route.sequence.length, 2);
    e.hp = e.maxHp * 0.25;
    assert(c.bossAttackWeights(e)[4] > 0);
    const duel = c.buildBossAttack(e, 4, c.hero);
    assert.equal(duel.first.kind, 'line');
    assert.equal(duel.first.coefficient, 1.5);
    assert.equal(C.restore(c.snapshot()).s.version, 4);
  }
}
console.log('PASS Dark Lord phase-one attack contracts, health gates and save schema');

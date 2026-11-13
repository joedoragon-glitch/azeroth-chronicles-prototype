'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
C.enableRoguePlaytest();

function fixture(cls, eliteKind) {
  const g = new C('normal', cls, () => 0.99);
  g.s.valeFieldAwakened = true;
  g.s.thornHeroInitiated = true;
  g.s.mercyTime = 0;
  const z = g.zone();
  z.props = [];
  Object.assign(g.hero, { x: 500, y: 500, basicCd: 0 });
  const elite = g.makeEnemy({
    species: 'goblin', name: 'Unengaged leader', level: 1,
    hp: 100000, damage: 0, gold: 0, xp: 0,
  }, { x: 565, y: 500 });
  elite.type = eliteKind === 'boss' ? 'boss' : 'mob';
  elite.captain = eliteKind === 'captain';
  elite.roomCaptain = eliteKind === 'roomCaptain';
  elite.fieldCaptain = eliteKind === 'fieldCaptain';
  elite.family = 'thorn';
  elite.aggro = false;
  z.enemies = [elite];
  return { g, elite };
}

for (const cls of ['paladin', 'mage', 'ranger', 'rogue'])
  for (const kind of ['boss', 'captain', 'roomCaptain', 'fieldCaptain']) {
    const { g, elite } = fixture(cls, kind);
    const initialHp = elite.hp;
    assert.equal(g.castMovementBasic(), false, cls + '/' + kind + ' passive cannot open encounter');
    assert.equal(elite.hp, initialHp);
    assert.equal(elite.aggro, false);
    assert.equal(g.hero.basicCd || 0, 0, 'no passive cooldown for excluded elite');
    // Deliberate manual skill must still be available at the established
    // targeting range, and once combat is initiated, passive attacks resume.
    assert(g.cast(1, elite.id, false), cls + '/' + kind + ' manual skill starts encounter');
    assert(elite.aggro, cls + '/' + kind + ' now engaged');
    g.hero.basicCd = 0;
    assert(g.castMovementBasic(), cls + '/' + kind + ' passive works in active fight');
  }

for (const cls of ['paladin', 'rogue']) {
  const { g, elite } = fixture(cls, 'boss');
  const ordinary = g.makeEnemy({
    species: 'goblin', name: 'Ordinary opponent', level: 1,
    hp: 100000, damage: 0, gold: 0, xp: 0,
  }, { x: 570, y: 520 });
  g.zone().enemies.push(ordinary);
  g.s.heroTarget = ordinary.id;
  assert(g.castMovementBasic(), cls + ' retains ordinary passive attacks beside boss');
  assert(!elite.aggro, cls + ' passive splash does not awaken unengaged boss');
  assert.equal(elite.hp, elite.maxHp, cls + ' passive splash cannot damage unengaged boss');
}
console.log('PASS all four classes: deliberate elite initiation; passive defense; ordinary/splash isolation');

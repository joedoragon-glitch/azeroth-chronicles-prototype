'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');

// Both endpoints are valid playable space; the authored repair bulkhead lies
// between them. Navigation's axis fallback may report true without displacement.
for (const mode of ['normal', 'nightmare'])
  for (const form of ['normal', 'true']) {
    const c = new C(mode, 'paladin', () => 0.9);
    c.enter('mine');
    c.s.party = [];
    const start = { x: 600, y: 1100 },
      target = { x: 600, y: 950 };
    assert(!c.blocked(start.x, start.y));
    assert(!c.blocked(target.x, target.y));
    assert(!c.clearSegment(start, target), 'the real bulkhead obstructs the charge');
    const boss = c.bossEnemy(c.boss('mine'), form, start);
    c.zone().enemies = [boss];
    Object.assign(c.hero, target);
    c.startAttack(boss, c.hero, 3);
    boss.sequence = [];
    c.resolveAttack(boss);
    for (let n = 0; n < 50 && boss.motion; n++) c.advanceMotion(boss, 0.02);
    assert.equal(
      boss.motion,
      null,
      'a charge that cannot move ends on collision instead of timing out at 5s',
    );
    assert(boss.y > 1040, 'boss does not cross the bulkhead');
    assert.equal(c.hero.hp, c.hero.maxHp, 'no damage through the wall');
    assert.equal(boss.open, 3, 'the existing opening contract is preserved pending #214');
    assert.equal(boss.cd, 0.75, 'the existing recovery multiplier is preserved');

    // A genuinely moving charge is not cancelled by the collision correction.
    Object.assign(boss, { x: 650, y: 1150 });
    Object.assign(c.hero, { x: 950, y: 1150, immune: 4 });
    c.startAttack(boss, c.hero, 3);
    boss.sequence = [];
    c.resolveAttack(boss);
    c.advanceMotion(boss, 0.02);
    assert(boss.motion);
    assert(boss.x > 650);
    for (let n = 0; n < 100 && boss.motion; n++) c.advanceMotion(boss, 0.02);
    assert.equal(boss.motion, null);
    assert(Math.abs(boss.x - 950) < 1);
    assert.equal(c.hero.hp, c.hero.maxHp, 'immunity still prevents contact damage');
    console.log(
      'PASS ' +
        mode +
        '/' +
        form +
        ' real wall charge ends promptly; free charge and immunity preserved',
    );
  }

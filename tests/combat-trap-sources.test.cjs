'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;
const kinds = ['spikes', 'jet', 'seal'];
const regions = ['vale', 'march', 'highlands', 'frontier', 'crown'];

// Every authored trap placement is accounted for, including optional interiors
// and outdoor mini encounters. Names alone never imply secondary conditions.
for (const [family, posts] of Object.entries(R.dungeonTraps)) {
  assert(R.dungeonTrapTuning[family], family + ' owns a trap timing/damage profile');
  for (const [, , kind] of posts)
    assert(kinds.includes(kind), family + ' contains only audited trap effects');
}
for (const site of R.sideDungeons) {
  assert(site.traps.length, site.id + ' has actual authored hazards');
  for (const [, , kind] of site.traps)
    assert(kinds.includes(kind), site.id + ' contains only audited trap effects');
}
for (const region of regions) {
  assert(R.outdoorMiniTrapTuning[region], region + ' has an outdoor trap profile');
  for (const kind of R.outdoorMiniTrapKinds[region])
    assert(kinds.includes(kind), region + ' contains only audited outdoor trap effects');
}

for (const mode of ['normal', 'nightmare'])
  for (const kind of kinds) {
    const game = new Campaign(mode, 'paladin', () => 0.9);
    const hero = game.hero;
    const companion = game.unit('soldier', hero.x, hero.y);
    game.s.party = [companion];
    hero.hp = hero.maxHp = 1000;
    hero.slow = hero.immune = 0;
    companion.hp = companion.maxHp = 1000;
    companion.slow = companion.immune = 0;
    const trap = {
      kind,
      x: hero.x,
      y: hero.y,
      radius: 80,
      length: 140,
      halfWidth: 30,
      index: 93,
      cycle: 1,
      phase: 0.5,
      warningTime: 1,
      activeTime: 1,
      damageFraction: 0.1,
      slowSeconds: 2.75,
    };
    game.traps = () => [trap];
    game.updateTraps(0.1);
    assert.equal(hero.hp, 1000, kind + ' warning does not damage the hero');
    assert.equal(companion.hp, 1000, kind + ' warning does not damage companions');
    trap.phase = 1.3;
    game.updateTraps(0.1);
    assert(hero.hp < 1000, kind + ' hits a vulnerable hero in ' + mode);
    assert(companion.hp < 1000, kind + ' hits a living companion in ' + mode);
    assert.equal(hero.slow, kind === 'seal' ? trap.slowSeconds : 0,
      kind + ' applies only its authored condition');
    assert.equal(companion.slow, kind === 'seal' ? trap.slowSeconds : 0,
      kind + ' applies the same condition to companions');

    const previous = [hero.hp, companion.hp];
    game.updateTraps(0.1);
    assert.deepEqual([hero.hp, companion.hp], previous,
      kind + ' hits each individual at most once per cycle');

    trap.cycle = 2;
    hero.immune = companion.immune = 3;
    hero.slow = companion.slow = 0;
    const immuneHp = [hero.hp, companion.hp];
    game.updateTraps(0.1);
    assert.deepEqual([hero.hp, companion.hp], immuneHp, kind + ' respects damage immunity');
    assert.equal(hero.slow, 0, kind + ' cannot debuff an immune hero');
    assert.equal(companion.slow, 0, kind + ' cannot debuff an immune companion');

    hero.immune = companion.immune = 0;
    game.updateTraps(0.1);
    assert.deepEqual([hero.hp, companion.hp], immuneHp,
      kind + ' an immune attempt still consumes this activation cycle');
    trap.cycle = 3;
    hero.slow = companion.slow = 5;
    game.updateTraps(0.1);
    assert.equal(hero.slow, 5, kind + ' does not erase a longer hero Slow');
    assert.equal(companion.slow, 5, kind + ' does not erase a longer companion Slow');

    trap.cycle = 4;
    const last = hero.hp;
    hero.x += 250;
    companion.x += 250;
    game.updateTraps(0.1);
    assert.equal(hero.hp, last, kind + ' respects collision geometry');

    if (kind === 'seal') {
      companion.x = trap.x;
      companion.y = trap.y;
      companion.hp = 1;
      companion.slow = 0;
      trap.cycle = 5;
      game.updateTraps(0.1);
      assert.equal(companion.hp, 0, 'lethal seal damage still resolves');
      assert.equal(companion.slow, 0, 'lethal seal cannot Slow a fallen companion');
    }
  }

// Authored trap types are mutually exclusive with the ongoing periodic
// boss-hazard mechanism: a spike or jet cannot quietly become a slow field.
const game = new Campaign();
assert.deepEqual(game.traps().map((t) => t.kind).filter((kind) => !kinds.includes(kind)), []);
game.s.phase = 'peace';
assert.deepEqual(game.traps(), [], 'peace disables hostile environmental traps');

console.log('PASS authored dungeon/side/outdoor trap inventory and source-driven condition matrix');

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


// Timed rearming uses the zone clock, not frames spent touching a hazard.
// Check the exact production trap geometry/cadence, including late entry,
// leaving/reentering during one activation, and the next activation.
for (const mode of ['normal', 'nightmare']) {
  for (const family of Campaign.dungeonIds) {
    const c = new Campaign(mode, 'paladin', () => 0.9);
    c.enter(family);
    c.s.party = [];
    const z = c.zone();
    const tune = R.dungeonTrapTuning[family];
    const authoredTraps = c.traps.bind(c);
    const trap = authoredTraps()[0];
    // Isolate this real authored trap so a nearby installation cannot mask
    // independent victim timing and rearm assertions.
    c.traps = () => authoredTraps().slice(0, 1);
    const h = c.hero;
    Object.assign(h, { x: trap.x, y: trap.y, slow: 0, immune: 0, hp: h.maxHp });
    const companion = c.unit('soldier', trap.x + 240, trap.y + 240);
    c.s.party = [companion];
    const hitPhase = tune.warning + tune.active * 0.2;
    // Keep elapsed positive; a full-cycle increment must preserve the phase.
    const baseCycle = Math.ceil((trap.index * tune.offset) / tune.cycle) + 3;
    const setPhase = (phase, cycle = baseCycle) => {
      z.clock = cycle * tune.cycle - trap.index * tune.offset + phase;
      assert(Math.abs(c.traps()[0].phase - phase) < 1e-7, family + ' trap phase');
    };
    setPhase(tune.warning / 2);
    c.updateTraps(0.1);
    assert.equal(h.hp, h.maxHp, family + ' warns without damage');
    setPhase(hitPhase);
    c.updateTraps(0.1);
    const afterFirst = h.hp;
    assert(afterFirst < h.maxHp, family + ' first entry damages');
    c.updateTraps(0.1);
    assert.equal(h.hp, afterFirst, family + ' standing inside does not re-hit');

    companion.x = trap.x;
    companion.y = trap.y;
    c.updateTraps(0.1);
    assert(companion.hp < companion.maxHp, family + ' late ally entry is separately eligible');
    assert.equal(h.hp, afterFirst, family + ' ally hit does not reset hero');

    h.x += 240;
    h.y += 240;
    setPhase(tune.warning + tune.active * 0.6);
    c.updateTraps(0.1);
    h.x = trap.x;
    h.y = trap.y;
    c.updateTraps(0.1);
    assert.equal(h.hp, afterFirst, family + ' reentry in same activation cannot re-hit');

    setPhase(hitPhase, baseCycle + 1);
    c.updateTraps(0.1);
    assert(h.hp < afterFirst, family + ' next activation re-arms damage');
    const afterSecond = h.hp;
    setPhase(tune.warning + tune.active + 0.05, baseCycle + 1);
    c.updateTraps(0.1);
    assert.equal(h.hp, afterSecond, family + ' inactive interval cannot damage');

    setPhase(hitPhase, baseCycle + 2);
    h.immune = 1;
    const beforeImmune = h.hp;
    c.updateTraps(0.1);
    assert.equal(h.hp, beforeImmune, family + ' immunity blocks this activation');
    h.immune = 0;
    setPhase(tune.warning + tune.active * 0.6, baseCycle + 2);
    c.updateTraps(0.1);
    assert.equal(h.hp, beforeImmune, family + ' blocked attempt stays consumed');
  }
}

console.log('PASS authored dungeon/side/outdoor trap inventory and source-driven condition matrix');

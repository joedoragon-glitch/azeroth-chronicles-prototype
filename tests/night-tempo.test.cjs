'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
const near = (a, b, text) => assert(Math.abs(a - b) < 1e-8, text + ': ' + a + ' vs ' + b);
function scene(clock, points = 0, ranged = false, distance = 50) {
  const g = new C('normal', 'paladin', () => 0.9);
  completeFieldOpening(g);
  g.s.clock = clock;
  for (const b of C.data.bosses.filter((b) => b.id !== 'darklord')) {
    if (points-- > 0) g.victory(b.id, 'normal');
    if (points-- > 0) g.victory(b.id, 'true');
  }
  const dryX = C.rules.barriers[0].bounds[1] + 400;
  const e = g.makeEnemy(
    {
      species: ranged ? 'archer' : 'goblin',
      name: 'Tempo fixture',
      level: 5,
      hp: 10000,
      damage: 0,
      gold: 0,
      xp: 0,
    },
    { x: dryX, y: 1700 },
  );
  Object.assign(e, { aggro: true, fightStart: 0, ranged, cd: 0 });
  g.zone().enemies = [e];
  g.zone().props = [];
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.time = 30;
  Object.assign(g.hero, { x: e.x + distance, y: e.y, level: 5 });
  assert(!g.blocked(e.x,e.y,'vale',15,true) && !g.blocked(g.hero.x,g.hero.y,'vale',15,true), 'tempo fixture is on dry same-bank ground');
  assert(g.clearSegment(e,g.hero,15,true), 'tempo fixture does not straddle the relocated river');
  return { g, e };
}
for (const [points, expected] of [
  [0, 1.1],
  [10, 1.175],
  [20, 1.25],
]) {
  const { g } = scene(500, points);
  near(g.nightTempo(), expected, 'Night tempo follows unique normal/TRUE points');
  g.s.clock = 100;
  assert.equal(g.nightTempo(), 1, 'Daylight ends tempo even during an encounter');
  g.s.mode = 'nightmare';
  near(g.nightTempo(), expected, 'Nightmare retains nighttime tempo');
  g.s.phase = 'peace';
  assert.equal(g.nightTempo(), 1, 'Peace removes tempo');
}
for (const ranged of [false, true]) {
  const results = [];
  for (const clock of [100, 500]) {
    const { g, e } = scene(clock, 20, ranged, ranged ? 210 : 50);
    g.line = () => true;
    g.updateEnemies(0.001);
    if (ranged) {
      assert(e.rangedAim);
      near(
        e.rangedAim.timer,
        C.rules.rangedEnemyCombat.aimTime,
        'Aim warning retains its authored duration',
      );
      for (let i = 0; i < 20 && e.rangedAim; i++) {
        g.s.time += 0.1;
        g.updateEnemies(0.1);
      }
      assert(!e.rangedAim);
    }
    results.push(e.cd);
  }
  near(
    (results[0] + (ranged ? C.rules.rangedEnemyCombat.aimTime : 0)) /
      (results[1] + (ranged ? C.rules.rangedEnemyCombat.aimTime : 0)),
    1.25,
    (ranged ? 'Ranged' : 'Melee') + ' complete basic attack cycle is 25% faster at maximum counter',
  );
}
const travel = [];
for (const clock of [100, 500]) {
  const { g, e } = scene(clock, 20, false, 350);
  e.cd = 100;
  e.pursuitBurstReadyAt = 1000;
  const before = { x: e.x, y: e.y };
  g.updateEnemies(0.1);
  travel.push(Math.hypot(e.x - before.x, e.y - before.y));
}
assert(travel[0] > 0);
near(travel[1] / travel[0], 1.25, 'Real collision-aware enemy pursuit moves 25% faster');
assert.equal(C.rules.enemySupportHealing.cooldown, 10);
assert.equal(C.rules.tacticalFoundation.moveCooldownSeconds, 2);
console.log(
  'PASS night tempo 10–25%, counter/day/peace/Nightmare, real melee/ranged cadence, unchanged aim and pursuit movement',
);

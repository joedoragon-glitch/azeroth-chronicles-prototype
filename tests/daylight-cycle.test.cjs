'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
const near = (a, b) => assert(Math.abs(a - b) < 1e-7, `${a} vs ${b}`);
const g = new C('normal', 'paladin', () => 0.73);
for (const [clock, phase, night, dark] of [
  [0, 'day', false, 0],
  [329.999, 'day', false, 0],
  [330, 'sunset', false, 0],
  [345, 'sunset', false, 0.5],
  [359.999, 'sunset', false, 1],
  [360, 'night', true, 1],
  [569.999, 'night', true, 1],
  [570, 'sunrise', true, 1],
  [585, 'sunrise', true, 0.5],
  [599.999, 'sunrise', true, 0],
]) {
  g.s.clock = clock;
  assert.equal(g.night(), night);
  assert.equal(g.daylightPhase().phase, phase);
  assert(Math.abs(g.daylightPhase().darkness - dark) < 1e-7);
}
g.s.clock = 599.95;
g.advanceDaylight(0.1);
assert.equal(g.daylightPhase().phase, 'day');
assert(!g.night());
const nm = new C('nightmare', 'paladin', () => 0.73);
assert.equal(nm.s.nightmareIntroRemaining, 30);
assert(!nm.night());
assert.equal(nm.daylightPhase().phase, 'sunset');
assert.equal(nm.multipliers().hp, 1);
assert.equal(nm.nightTempo(), 1);
nm.s.nightmareIntroRemaining = 0.15;
nm.s.party = [];
nm.s.mercyTime = 0;
nm.hero.maxHp = nm.hero.hp = 100000;
const e = nm.makeEnemy(
  { species: 'goblin', name: 'Opening audit', level: 1, hp: 1000, damage: 2, gold: 0, xp: 0 },
  { x: nm.hero.x + 80, y: nm.hero.y },
);
nm.zone().enemies = [e];
// The Vale opening deliberately blocks combat until the hero initiates it.
// Make this a genuine engaged Nightmare fight before testing sunset scaling.
assert(nm.awaitsHeroAttack(e), 'Fresh Vale enemies wait for hero initiation');
nm.admitOpeningHeroAttack(e);
nm.engage(e);
assert(e.aggro, 'Nightmare fixture must actually enter combat');
e.hp = e.maxHp * 0.4;
e.telegraph = { timer: 5, style: 'fixture' };
e.cd = 6;
nm.tick(0.1);
assert(!nm.night());
near(nm.s.nightmareIntroRemaining, 0.05);
near(e.hp / e.maxHp, 0.4);
e.telegraph = { timer: 5, style: 'fixture' };
const warning = e.telegraph,
  cd = e.cd;
nm.advanceDaylight(0.05);
assert(nm.night());
near(e.maxHp / e.baseHp, 1.1);
near(e.damage / e.baseDamage, 1.15);
near(e.hp / e.maxHp, 0.4);
assert(e.aggro);
assert.strictEqual(e.telegraph, warning, 'warning survives the one-time boundary');
assert(e.cd <= cd, 'cooldown not reset');
assert.equal(nm.s.nightmareIntroRemaining, 0);
nm.tick(0.1);
near(e.maxHp / e.baseHp, 1.1);
assert.equal(nm.daylightPhase().phase, 'night');
// Reload, travel and ordinary death preserve the remaining one-time grace.
const partial = new C('nightmare', 'paladin', () => 0.73);
partial.s.nightmareIntroRemaining = 12;
let restored = C.restore(partial.snapshot(), () => 0.73);
assert.equal(restored.s.nightmareIntroRemaining, 12);
assert(!restored.night());
restored.enter('march');
assert.equal(restored.s.nightmareIntroRemaining, 12);
restored.die();
assert.equal(restored.s.nightmareIntroRemaining, 12);
const succession = new C('nightmare', 'paladin', () => 0.73, { succession: true });
succession.s.nightmareIntroRemaining = 17;
succession.die();
assert(succession.s.challenge.pending);
succession.tick(0.1);
assert.equal(succession.s.nightmareIntroRemaining, 17);
assert(succession.successor('mage'));
assert.equal(succession.s.nightmareIntroRemaining, 17);
const old = partial.snapshot();
delete old.nightmareIntroRemaining;
delete old.victoryDawnRemaining;
restored = C.restore(old, () => 0.73);
assert(restored.night());
assert.equal(restored.s.nightmareIntroRemaining, 0);
for (const invalid of [-1, 31, NaN, '12']) {
  const s = partial.snapshot();
  s.nightmareIntroRemaining = invalid;
  assert.throws(() => C.validate(s));
}
const normalBad = g.snapshot();
normalBad.nightmareIntroRemaining = 1;
assert.throws(() => C.validate(normalBad));
// Earlier victories do not start the ending sunrise.
const victory = new C('nightmare', 'paladin', () => 0.73);
// The ending is post-progression, not the protected level-one Vale opening.
// Reconcile the hidden Thornfang arrival before constructing peaceful habitat.
victory.hero.level = 2;
victory.zone();
assert.equal(victory.zone().thornArrival, undefined,
  'Endgame fixture cannot retain a protected opening boss');
victory.s.nightmareIntroRemaining = 0;
victory.s.normal.darklord = true;
victory.s.true.darklord = true;
victory.checkEnding();
assert(!victory.peace);
assert.equal(victory.s.victoryDawnRemaining, 0);
victory.s.throneClaimed = true;
for (const id of C.dungeonIds) {
  victory.s.normal[id] = true;
  victory.s.true[id] = true;
}
victory.checkEnding();
assert(victory.peace);
assert.equal(victory.s.victoryDawnRemaining, 30);
assert.equal(victory.daylightPhase().phase, 'victory-sunrise');
near(victory.daylightPhase().darkness, 1);
assert.equal(victory.multipliers().hp, 1);
assert.equal(victory.nightTempo(), 1);
assert(victory.zone().enemies.every((e) => e.neutral || e.hp <= 0));
victory.advanceDaylight(10);
near(victory.s.victoryDawnRemaining, 20);
const v = C.restore(victory.snapshot(), () => 0.73);
near(v.s.victoryDawnRemaining, 20);
v.checkEnding();
near(v.s.victoryDawnRemaining, 20);
v.advanceDaylight(20);
assert.equal(v.s.victoryDawnRemaining, 0);
assert.equal(v.s.clock, 0);
assert.equal(v.daylightPhase().phase, 'day');
v.s.clock = 585;
assert.equal(v.daylightPhase().phase, 'sunrise', 'later peaceful dawn is ordinary');
const legacyPeace = v.snapshot();
delete legacyPeace.victoryDawnRemaining;
delete legacyPeace.nightmareIntroRemaining;
const legacy = C.restore(legacyPeace, () => 0.73);
assert.equal(legacy.s.victoryDawnRemaining, 0);
// Existing Normal active-encounter scaling remains locked at the transition.
const n = new C('normal', 'paladin', () => 0.73);
n.s.clock = 359.95;
n.s.party = [];
const ne = n.makeEnemy(
  { species: 'goblin', name: 'Normal lock', level: 1, hp: 1000, damage: 0, gold: 0, xp: 0 },
  { x: n.hero.x + 80, y: n.hero.y },
);
n.zone().enemies = [ne];
// Test Normal active-combat locking with an actually engaged enemy, too.
assert(n.awaitsHeroAttack(ne), 'Normal Vale opening also requires hero initiation');
n.admitOpeningHeroAttack(ne);
n.engage(ne);
assert(ne.aggro, 'Normal fixture must actually enter combat');
n.tick(0.1);
assert(n.night());
near(ne.maxHp / ne.baseHp, 1);
// Night-only population obeys the same boundary without spawning during sunset.
const spawn = new C('nightmare', 'paladin', () => 0.73);
spawn.enter('march');
spawn.updateNight();
assert(!spawn.zone().enemies.some((e) => e.nightOnly));
spawn.advanceDaylight(30);
spawn.updateNight();
assert.equal(spawn.zone().enemies.filter((e) => e.nightOnly).length, 4);
console.log(
  'PASS Normal boundaries, Nightmare one-time grace/engaged scaling/spawns, old/new saves, travel/death/Succession, victory gate/resume and unchanged Normal combat lock',
);

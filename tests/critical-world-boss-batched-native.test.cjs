'use strict';
// Batched native World boss coverage: original physical cargo, landings, charges,
// and admitted summons. This is focused owner testing, not final boss certification.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const World = require('../src/prototype/critical-world-native.js');
const context = require('./helpers/specialist-night-context.cjs');
function scene(family, index, form = 'normal') {
  const g = context.campaign('normal', 'paladin', () => .99);
  const region = family === 'ridge' ? 'highlands' : 'vale';
  g.enter(region);
  g.s.time = 30;
  g.s.mercyTime = 0;
  g.s.party = [];
  const e = g.bossEnemy(g.boss(family), form, family === 'ridge'
    ? { x: g.hero.x - 70, y: g.hero.y }
    : { x: 1400, y: 1700 });
  g.zone().enemies = [e];
  e.aggro = true;
  Object.assign(g.hero, family === 'ridge'
    ? { hp: 1000000, maxHp: 1000000, immune: 0, level: 8 }
    : { x: 1470, y: 1700, hp: 1000000, maxHp: 1000000, immune: 0, level: 3 });
  g.line = () => true;
  assert(g.startAttack(e, g.hero, index), family + ' original attack ' + index);
  return { g, e };
}
function attach(g, level = 1, value = 0) {
  let samples = 0;
  const session = World.createSession(Critical, Levels, {
    enabled: true, stream: { next() { samples++; return value; } },
  });
  session.setCriticalLevel('world', level);
  g._criticalWorldNative = session;
  return { samples: () => samples, session };
}
const close = (x, y) => assert(Math.abs(x - y) < 1e-5, x + ' versus ' + y);
assert.equal(Campaign.prototype._criticalWorldNative, undefined);
for (const form of ['normal','true']) for (const level of [1,2,3]) {
  // Real cargo is one physical missile; the crit only changes lawful impact
  // strength, not flight path, no-contact behavior, or number of missiles.
  const base = scene('ridge', 1, form), critical = scene('ridge', 1, form);
  const track = attach(critical.g, level);
  assert.equal(track.samples(), 0);
  base.g.resolveAttack(base.e);
  critical.g.resolveAttack(critical.e);
  assert.equal(track.samples(), 1);
  assert.equal(critical.g.s.projectiles.length, base.g.s.projectiles.length);
  assert.equal(critical.g.s.projectiles.length, 1);
  const original = base.g.s.projectiles[0], altered = critical.g.s.projectiles[0];
  assert(altered.damage > original.damage);
  assert.deepEqual(
    { x:altered.x,y:altered.y,dx:altered.dx,dy:altered.dy,speed:altered.speed,life:altered.life },
    { x:original.x,y:original.y,dx:original.dx,dy:original.dy,speed:original.speed,life:original.life },
  );
  assert(Object.isFrozen(altered.criticalExecution));
  assert.equal(altered.criticalExecution.key, 'world/boss/ridge/1');
  track.session.setCriticalLevel('world', level === 1 ? 3 : 1);
  assert.equal(altered.criticalExecution.intensity, level);
  const landing = scene('thorn', 1, form), tLanding = attach(landing.g, level);
  landing.g.resolveAttack(landing.e);
  assert.equal(tLanding.samples(), 1);
  assert.equal(landing.e.motion.criticalExecution.key, 'world/boss/thorn/1');
  assert.equal(landing.e.motion.landing, true);
  // Charges sample once at lawful original flight launch; not per contact.
  const charge = scene('ridge', 2, form), tCharge = attach(charge.g, level);
  charge.g.resolveAttack(charge.e);
  assert.equal(tCharge.samples(), 1);
  assert.equal(charge.e.motion.criticalExecution.key, 'world/boss/ridge/2');
  assert.equal(charge.e.motion.charge, true);
}
for (const form of ['normal','true']) for (const level of [1,2,3]) {
  const base = scene('thorn', 3, form), critical = scene('thorn', 3, form);
  const track = attach(critical.g, level);
  assert.equal(track.samples(), 0);
  base.g.resolveAttack(base.e);
  critical.g.resolveAttack(critical.e);
  const born = critical.g.bossOwnedSummons(critical.e);
  const unmodified = base.g.bossOwnedSummons(base.e);
  assert(born.length > 0, 'original Thorn summon must admit units');
  assert.equal(track.samples(), 1, 'all original summoned units share one release');
  assert.equal(born.length, unmodified.length, 'critical must not add a unit');
  assert(born.every((u,i) => u.maxHp > unmodified[i].maxHp));
  assert(born.every((u,i) => u.damage === unmodified[i].damage));
  assert.equal(critical.e.summonCd, base.e.summonCd);
  const stalled = scene('thorn', 3, form), silent = attach(stalled.g, level);
  stalled.g.summonBossAdds = () => 0;
  stalled.g.resolveAttack(stalled.e);
  assert.equal(silent.samples(), 0, 'failed or full-cap spawn never rolls');
}
{
  const scene0 = scene('ridge', 1), track = attach(scene0.g);
  scene0.e.telegraph = null;
  scene0.g.resolveAttack(scene0.e);
  assert.equal(track.samples(), 0, 'cancelled attack is not a critical release');
}
console.log('PASS boss batch native physical cargo, warned landing, charge, admitted summons, three strengths and Normal/TRUE');

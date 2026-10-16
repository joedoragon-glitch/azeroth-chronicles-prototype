'use strict';
// Authored acceptance only; execution requires the director's validation order.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function room(id = 'supply-march', mode = 'normal') {
  const g = new C(mode, 'paladin', () => 0.73);
  g.enter(id);
  g.s.party = [];
  g.s.mercyTime = 0;
  return g;
}
function add(g, point, species = 'goblin') {
  const e = g.makeEnemy({ species, name: 'Crowd fixture', level: 2,
    hp: 100000, damage: 0, gold: 0, xp: 0 }, point);
  g.zone().enemies.push(e);
  return e;
}
// PT-002: exact overlaps, body blocking, timed friendly congestion and terrain integrity.
{
  const g = room(), captain = g.zone().enemies.find((e) => e.roomCaptain),
    p = g.safe(captain.x, captain.y);
  g.zone().enemies = [];
  Object.assign(g.hero, g.safe(200, 220));
  const units = Array.from({ length: 3 }, () => add(g, p));
  for (let i = 0; i < 80; i++) {
    g.s.time += 0.05;
    g.separateActors(0.05);
  }
  for (const [i, e] of units.entries()) {
    assert(!g.blocked(e.x, e.y), 'de-stacking never enters a wall');
    for (const other of units.slice(i + 1))
      assert(distance(e, other) >= 26, 'three coincident actors separate');
  }
  const e = units[0], start = { ...g.hero };
  Object.assign(g.hero, g.safe(e.x - 65, e.y));
  g.s.time += 0.05;
  g.move(g.hero, { x: e.x + 65, y: e.y }, 1000, 0.1);
  assert(distance(g.hero, e) >= g.actorRadius(g.hero) + g.actorRadius(e) - 0.1,
    'hero cannot tunnel through an opposing body');
  Object.assign(g.hero, start);
  const before = { x: e.x, y: e.y };
  g.move(e, { x: -500, y: -500 }, 10000, 0.5);
  assert(!g.blocked(e.x, e.y), 'long scripted steps still obey terrain');
  assert(Number.isFinite(distance(e, before)));
}
// PT-007: full-radius marks stay on connected floor and remain frozen after warning.
for (const id of Object.keys(C.rules.treasuryArchitecture)) {
  const g = room(id), e = g.zone().enemies.find((u) => u.roomCaptain);
  if (!e) continue;
  for (const area of C.rules.treasuryArchitecture[id].walkable) {
    const [x1, x2, y1, y2] = area.bounds;
    for (const point of [{ x: x1 + 25, y: y1 + 25 }, { x: x2 - 25, y: y2 - 25 }]) {
      if (g.blocked(point.x, point.y)) continue;
      Object.assign(e, point);
      const a = { kind: 'circle', captainSpread: true, count: 4,
        radius: 85, x: point.x, y: point.y, timer: 1.2, total: 1.2 }, sequence = [];
      assert(g.prepareAttackSequence(e, a, sequence));
      const beats = [a, ...sequence], patches = beats.flatMap((beat) => g.attackPatches(beat));
      assert.equal(patches.length, 4, 'all four strikes retained, with sequential fallback if needed');
      for (const p of patches) {
        assert(!g.blocked(p.x, p.y, id, p.radius + C.rules.arenaPlacement.margin));
        assert(g.route(e, p).length || distance(e, p) < 1, 'actual connected room');
      }
      const marks = JSON.stringify(g.attackPatches(a));
      Object.assign(g.hero, g.safe(e.x + 100, e.y));
      assert.equal(JSON.stringify(g.attackPatches(a)), marks, 'moving target cannot move warnings');
    }
  }
}
// Dual-line patterns use the same frozen corridor geometry in warnings and damage.
{
  const g = room('supply-highlands'), e = g.zone().enemies.find((u) => u.roomCaptain),
    a = { kind: 'line', count: 2, angle: 0, fromX: e.x, fromY: e.y,
      x: e.x + 300, y: e.y, timer: 1.5, total: 1.5 }, sequence = [];
  assert(g.prepareAttackSequence(e, a, sequence));
  const lines = [a, ...sequence].flatMap((beat) => beat.arenaLines);
  assert.equal(lines.length, 2, 'both authored corridors survive confined-room placement');
  for (const line of lines)
    assert(g.clearSegment({ x: line.fromX, y: line.fromY }, line, line.halfWidth + 3));
}
// PT-001: existing four-skill kit, owned-pup accounting and genuine refill resolution.
for (const form of ['normal', 'true']) {
  const g = room('supply-vale', 'developer');
  const e = g.bossEnemy(g.boss('thorn'), form, g.safe(600, 550));
  g.zone().enemies = [e];
  Object.assign(g.hero, g.safe(e.x + 90, e.y));
  g.engage(e, true, false);
  e.summonCd = 0;
  e.lastAttackIndex = 0;
  assert.equal(C.rules.attacks.thorn.length, 4, 'no invented extra core skill');
  assert(g.bossAttackWeights(e, g.hero)[3] > 0, 'empty owned pack eligible');
  const cast = g.buildBossAttack(e, 3, g.hero);
  e.telegraph = cast.first;
  g.resolveAttack(e);
  assert.equal(g.bossOwnedSummons(e).length, g.bossSummonCap(e));
  for (const pup of g.bossOwnedSummons(e)) pup.hp = 0;
  assert.equal(g.bossOwnedSummons(e).length, 0);
  assert.equal(g.bossAttackWeights(e, g.hero)[3], 0, 'authored cooldown respected');
  e.summonCd = 0;
  assert(g.bossAttackWeights(e, g.hero, true)[3] > 0, 'refill remains eligible after cooldown');
  e.telegraph = g.buildBossAttack(e, 3, g.hero).first;
  g.resolveAttack(e);
  assert.equal(g.bossOwnedSummons(e).length, g.bossSummonCap(e));
}
// PT-012: a committed cargo shot releases at the snapshot even after range evasion.
for (const form of ['normal', 'true']) {
  const g = room('supply-highlands'), e = g.bossEnemy(g.boss('ridge'), form, g.safe(600, 550));
  g.zone().enemies = [e];
  Object.assign(g.hero, g.safe(e.x + 100, e.y));
  g.engage(e, true, false);
  const built = g.buildBossAttack(e, 1, g.hero), mark = { x: built.first.x, y: built.first.y };
  e.telegraph = built.first;
  e.sequence = [];
  e.telegraph.timer = 0.04;
  Object.assign(g.hero, g.safe(e.x - 250, e.y));
  g.updateEnemies(0.05);
  const cargo = g.s.projectiles.find((p) => p.style === 'cargo');
  assert(cargo, 'range change does not cancel committed cargo');
  assert(Math.abs(cargo.dx - (mark.x - e.x) / distance(mark, e)) < 1e-7,
    'cargo uses warned direction rather than guaranteed homing');
}
console.log('PASS PT312 combat acceptance');

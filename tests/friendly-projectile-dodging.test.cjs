'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
function arena(cls = 'ranger', distance = 250) {
  const g = new C('normal', cls, () => 0.9);
  Object.assign(g.hero, { x: 1400, y: 1700, order: null });
  g.hero.skills.fill(1);
  g.hero.cd.fill(0);
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.time = 30;
  const z = g.zone();
  z.props = [];
  z.buildings = [];
  z.npcs = [];
  const e = g.makeEnemy(
    { species: 'goblin', name: 'Dodger', level: 5, hp: 100000, damage: 0, gold: 0, xp: 0 },
    { x: 1400 + distance, y: 1700 },
  );
  z.enemies = [e];
  g.engage(e);
  return { g, e };
}
function fly(g, seconds = 3.5) {
  for (let t = 0; t < seconds; t += 0.05) {
    g.s.time += 0.05;
    g.updateProjectiles(0.05);
  }
}
// Real cast paths: basics, pin/frost, focused shots, pierce and charged bolts/beams.
for (const cls of ['mage', 'ranger'])
  for (const [slot, charged] of [
    [1, false],
    [2, false],
    [6, false],
    [1, true],
    [6, true],
    ...(cls === 'ranger'
      ? [
          [7, false],
          [8, false],
        ]
      : []),
  ])
    for (const dodge of [false, true]) {
      const { g, e } = arena(cls);
      assert(g.cast(slot, e.id, charged), cls + ' ' + slot + ' admission');
      assert(g.s.projectiles.length, 'cast produces actual flight');
      const cooldown = g.hero.cd[slot - 1],
        hp = e.hp;
      const directions = g.s.projectiles.map((p) => [p.dx, p.dy]);
      if (dodge) e.y += 180;
      g.updateProjectiles(0.05);
      const actualDirections = g.s.projectiles.map((p) => [p.dx, p.dy]);
      if (cls === 'mage' && slot === 1 && !charged && dodge) {
        // Native Mage Skill 1 is the sole bounded-homing exception, not an
        // unrestricted retargeting license for ordinary projectile flight.
        assert.equal(actualDirections.length, 1);
        const start = Math.atan2(directions[0][1], directions[0][0]),
          now = Math.atan2(actualDirections[0][1], actualDirections[0][0]),
          turn = Math.abs(Math.atan2(Math.sin(now - start), Math.cos(now - start)));
        assert(turn > 0 && turn <= 1.6 * 0.05 + 1e-9,
          'Mage Skill 1 may steer only within its native per-update bound');
      } else {
        assert.deepEqual(actualDirections, directions,
          'all other launched projectiles retain their original direction');
      }
      fly(g);
      assert.equal(
        e.hp < hp,
        !dodge,
        cls + ' ' + slot + ' ' + charged + ' damage requires contact',
      );
      if (dodge) {
        assert(!e.slow);
        assert(!g.effects.some((f) => f.type === 'chargedImpact'));
      }
      assert.equal(g.hero.cd[slot - 1], cooldown, 'miss keeps cast cooldown');
      assert.equal(g.s.projectiles.length, 0, 'hits and misses terminate');
    }
// A charged shot can physically meet a defender but be stopped by Skill Block.
// It retains a landed:false projectile receipt, not a triumphant extra burst.
{
  const { g, e } = arena('ranger');
  assert(g.cast(6, e.id, true), 'charged Ranger volley is legally released');
  assert(g.s.projectiles.some((p) => p.source === 'hero' && p.charged),
    'real charged projectiles are in flight');
  const hp = e.hp;
  let stopped = 0;
  g.skillBlocks = () => { stopped++; return true; };
  fly(g);
  assert(stopped > 0, 'the real projectile contacted the Skill Block resolver');
  assert.equal(e.hp, hp, 'blocked charged arrows deal no HP damage');
  const impacts = g.effects.filter((effect) =>
    effect.type === 'projectileImpact' && effect.actor === 'hero');
  assert(impacts.length > 0 && impacts.every((effect) => effect.landed === false),
    'blocked physical contact still communicates unsuccessful projectile impact');
  assert(!g.effects.some((effect) => effect.type === 'chargedImpact'),
    'blocked charged attacks must not announce a successful charged burst');
}
{
  const { g, e } = arena('mage');
  const hp = e.hp;
  assert(g.cast(1, e.id, true), 'charged Mage beam is legally released');
  fly(g);
  assert(e.hp < hp, 'unchallenged charged projectile reaches its target');
  assert(g.effects.some((effect) => effect.type === 'chargedImpact'),
    'a genuinely landed charged shot preserves its existing burst');
}
// Actual companion Triple Shot and normal/Recall covering arrows use the same flight.
for (const mode of ['triple', 'basic', 'recall'])
  for (const dodge of [false, true]) {
    const { g, e } = arena();
    const u = g.unit('archer', 1400, 1700);
    g.s.party = [u];
    if (mode === 'triple') assert(g.companionUseFirstSkill(u, e));
    else {
      u.skill1Cd = u.skill2Cd = 99;
      g.engage(e);
      g.s.heroTarget = e.id;
      if (mode === 'recall') {
        e.x = 1550;
        g.s.recallActive = true;
      }
      g.updateParty(0.01);
    }
    assert(g.s.projectiles.length, mode + ' really launches');
    const hp = e.hp;
    if (dodge) e.y += 180;
    fly(g);
    assert.equal(e.hp < hp, !dodge, mode + ' can miss');
  }
// Newly physical single-target skills spend on release and apply effects only on contact.
for (const [cls, slot] of [
  ['mage', 3],
  ['mage', 4],
  ['paladin', 4],
])
  for (const dodge of [false, true]) {
    const { g, e } = arena(cls);
    e.rangedAim = { timer: 2, total: 2 };
    const aim = e.rangedAim,
      hp = e.hp;
    assert(g.cast(slot, e.id));
    assert.equal(e.hp, hp, 'no instant target damage');
    assert.equal(e.rangedAim, aim, 'no instant interrupt');
    assert(!e.fractureUntil && !e.tauntUntil, 'no instant condition');
    if (dodge) e.y += 180;
    fly(g);
    if (slot === 3) {
      assert.equal(e.rangedAim === null, !dodge);
      assert.equal(e.hp, hp, 'interrupt has no damage');
    } else {
      assert.equal(e.hp < hp, !dodge);
      assert.equal(!!(cls === 'mage' ? e.fractureUntil : e.tauntUntil), !dodge);
    }
  }
{
  const { g, e } = arena('mage');
  e.rangedAim = { timer: 1 };
  assert(g.cast(3, e.id));
  const next = { timer: 2 };
  e.rangedAim = next;
  fly(g);
  assert.equal(e.rangedAim, next, 'late interrupt cannot cancel a later unrelated action');
}
{
  const { g, e } = arena('mage', 100);
  assert(g.cast(1, e.id, true));
  const hp = e.hp;
  g.updateProjectiles(0.4);
  assert(e.hp < hp, 'swept collision catches fast beam across a large frame');
}
{
  const { g, e } = arena();
  assert(g.cast(2, e.id));
  const hp = e.hp;
  g.clearSegment = () => false;
  fly(g);
  assert.equal(e.hp, hp);
  assert(!e.slow);
  assert.equal(g.s.projectiles.length, 0, 'terrain blocks friendly shots');
}
{
  const { g, e } = arena();
  assert(g.cast(1, e.id));
  e.hp = 0;
  fly(g);
  assert.equal(g.s.projectiles.length, 0, 'dead-target shots clean up');
}
{
  const { g, e } = arena('mage');
  assert(g.cast(4, e.id, true));
  assert(e.hp < e.maxHp && e.fractureUntil, 'charged area skill retains immediate area geometry');
}
console.log(
  'PASS fixed friendly flight, real hero/companion casts, dodge/hit/expiry, effects on contact, fast beams, terrain, cleanup and area preservation',
);

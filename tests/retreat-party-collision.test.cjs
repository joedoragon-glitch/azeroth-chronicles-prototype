'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function scene(type = 'soldier', mode = 'automatic', cls = 'mage') {
  const g = new C('developer', cls, () => 0.9),
    z = g.zone();
  z.enemies = [];
  z.props = [];
  z.nodes = [];
  z.npcs = [];
  z.buildings = [];
  g.s.mercyTime = 0;
  Object.assign(g.hero, { x: 500, y: 1500, cd: g.hero.cd.map(() => 60) });
  const u = type.startsWith('pet:')
    ? g.unit('pet', 500, 1700, type.slice(4))
    : g.unit(type, 500, 1700);
  Object.assign(u, {
    cd: 100,
    skill1Cd: 100,
    skill2Cd: 100,
    skillGlobalCd: 100,
    survivalCd: 100,
    healCd: 100,
  });
  g.s.party = [u];
  const e = g.makeEnemy(
    {
      species: 'goblin',
      name: 'Retreat collision foe',
      level: 1,
      hp: 10000,
      damage: 0,
      xp: 0,
      gold: 0,
    },
    { x: 500, y: 1750 },
  );
  e.aggro = true;
  z.enemies = [e];
  g.zone();
  u.hp = u.maxHp * 0.1;
  const [side, forward] = g.partyFormationOffset(u, [u]),
    length = Math.hypot(side, forward);
  g.formationHeading = { x: -side / length, y: -forward / length };
  g._tacticalPartyTargets = new Map();
  if (mode === 'recall') g.recallParty();
  else g.companionCautiousCombat(u, e, [u], 0);
  assert(g.companionRetreatMode(u), type + ' enters ' + mode);
  return { g, z, u, e };
}
let cases = 0;
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const type of [
    'soldier',
    'archer',
    ...Object.keys(C.rules.petCompanions).map((x) => 'pet:' + x),
  ])
    for (const mode of ['automatic', 'recall']) {
      const { g, u } = scene(type, mode, cls),
        friend = g.unit('soldier', 500, 1625);
      g.s.party.push(friend);
      assert(g.actorStepAllowed(u, { x: 500, y: 1400 }), type + ' retreats through hero and ally');
      g.s.party = [u];
      g.s.time += 0.05;
      assert(
        g.actorStepAllowed(g.hero, { x: 500, y: 1710 }),
        'hero does not catch on a withdrawing companion',
      );
      const another = g.unit('archer', 450, 1700);
      g.s.party.push(another);
      g.s.time += 0.05;
      assert(
        g.actorStepAllowed(another, { x: 550, y: 1700 }),
        'friendly overlap permission is symmetric',
      );
      if (mode === 'recall') g.s.recallActive = false;
      else g.clearCompanionJudgment(u);
      assert(!g.companionRetreatMode(u));
      assert(
        !g.actorStepAllowed(another, { x: 550, y: 1700 }),
        'ordinary combat collision resumes',
      );
      cases++;
    }
console.log(
  'PASS ' +
    cases +
    ' class/role/retreat combinations: friendly passage, symmetric collision and normal combat restoration',
);
// Real movement must cross a crowded ally, not merely report a permissive predicate.
for (const mode of ['automatic', 'recall']) {
  const { g, u } = scene('archer', mode, 'paladin'),
    friend = g.unit('soldier', 500, 1650);
  g.s.party.push(friend);
  let overlapping = false;
  for (let i = 0; i < 12; i++) {
    g.s.time += 0.05;
    g.move(u, { x: 500, y: 1610 }, 200, 0.05);
    overlapping ||= distance(u, friend) < g.actorRadius(u) + g.actorRadius(friend);
    g.separateActors(0.05);
  }
  assert(overlapping);
  assert(u.y <= 1610.01, 'companion physically crosses friendly body');
  assert.equal(friend.y, 1650, 'yielding does not shove the ally');
  cases++;
}
// Actual automatic withdrawal crosses the player while still in regroup mode.
{
  const { g, u } = scene('archer', 'automatic', 'paladin');
  let crossed = false;
  for (let i = 0; i < 35; i++) {
    g.s.time += 0.05;
    g.move(u, { x: 500, y: 1400 }, 200, 0.05);
    g.separateActors(0.05);
    if (u.y < g.hero.y - 35) crossed = true;
  }
  assert(crossed, 'withdrawal crosses the hero rather than snagging on the player');
  cases++;
}
// Friendly passive separation must not push an injured unit out of its retreat path.
{
  const { g, u, e } = scene('archer', 'automatic', 'paladin');
  Object.assign(u, { x: 500, y: 1580 });
  const friend = g.unit('soldier', 502, 1580);
  g.s.party.push(friend);
  g.s.time += 0.05;
  g.separateActors(0.05);
  assert.equal(u.x, 500);
  assert.equal(u.y, 1580);
  assert.equal(friend.x, 502);
  assert.equal(friend.y, 1580);
  Object.assign(e, { x: 505, y: 1580 });
  g.s.time += 0.05;
  const gap = distance(u, e),
    frame = g.actorCrowd();
  frame.congestion.set(u, { until: g.s.time + 10 });
  frame.congestion.set(e, { until: g.s.time + 10 });
  g.separateActors(0.05);
  assert(distance(u, e) > gap, 'hostile overlap separation remains active during retreat');
  cases++;
}
// Enemy bodies, including bosses/mounts, block both directions even if either side
// had a crowd-escape allowance before the retreat started.
for (const mode of ['automatic', 'recall'])
  for (const kind of ['normal', 'boss', 'mounted'])
    for (const allowances of ['none', 'companion', 'enemy', 'both']) {
      const { g, u, e } = scene('soldier', mode);
      if (kind === 'boss') e.type = 'boss';
      if (kind === 'mounted') e.mountedCrownRider = true;
      Object.assign(e, { x: 500, y: 1600 });
      g.s.time += 0.05;
      const frame = g.actorCrowd();
      if (allowances === 'companion' || allowances === 'both')
        frame.congestion.set(u, { until: g.s.time + 20 });
      if (allowances === 'enemy' || allowances === 'both')
        frame.congestion.set(e, { until: g.s.time + 20 });
      assert(
        !g.actorStepAllowed(u, { x: 500, y: 1550 }, false, frame),
        'retreat cannot cross ' + kind + ' ' + allowances,
      );
      assert(
        !g.actorStepAllowed(e, { x: 500, y: 1750 }, false, frame),
        'enemy cannot cross retreating party ' + kind + ' ' + allowances,
      );
      cases++;
    }
// A sustained low-FPS jam behind an enemy remains a hostile blockage.
{
  const { g, z, u, e } = scene('soldier', 'recall');
  Object.assign(u, { x: 300, y: 1500 });
  Object.assign(g.hero, { x: 700, y: 1500 });
  Object.assign(e, { x: 350, y: 1500 });
  for (let x = 100; x <= 900; x += 25)
    for (const y of [1450, 1550]) z.props.push({ id: 'lane-' + x + '-' + y, x, y, r: 30 });
  for (let i = 0; i < 60; i++) {
    g.observeCrowdFrame(100);
    g.s.time += 0.1;
    g.move(u, { x: 650, y: 1500 }, 100, 0.1);
  }
  assert(u.x < e.x, 'retreat never crosses enemy after repeated congestion');
  assert(!g.crowdEscaping(u), 'retreat cannot arm mixed-crowd phasing');
  assert(!g.clearSegment(u, { x: u.x, y: 1400 }), 'terrain remains impassable');
  cases++;
}
// Arrival does not extend movement-only damage protection; existing defense is unchanged.
{
  const { g, u } = scene('archer', 'automatic', 'paladin');
  const point = g.partyFollowPoint(u, [u]);
  Object.assign(u, point);
  g.s.time += 0.05;
  assert(g.companionRetreatMode(u));
  assert(!g.companionRetreating(u), 'arrived companion has no extra retreat damage protection');
  u.hp = u.maxHp;
  g.zone().enemies.forEach((e) => (e.hp = 0));
  g.s.time += 2;
  g.updateParty(0.05);
  assert(!g.companionRetreatMode(u), 'cleared encounter ends passage');
  const restored = C.restore(g.snapshot(), () => 0.9);
  assert(!restored.companionRetreatMode(restored.s.party[0]), 'no saved passage state');
  cases++;
}
console.log(
  'PASS ' +
    cases +
    ' focused retreat passage cases; actual movement, separation, strict enemy/boss/mount blocking, low-FPS jam, terrain and lifecycle',
);

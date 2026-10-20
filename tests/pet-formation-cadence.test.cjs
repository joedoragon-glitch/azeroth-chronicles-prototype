'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
const cfg = C.rules.balance.companions,
  families = Object.keys(C.rules.petCompanions);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function scene(cls, family) {
  const g = new C('normal', cls, () => 0.9),
    z = g.zone();
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) z[key] = [];
  Object.assign(g.hero, { x: 1000, y: 1000 });
  g.s.mercyTime = 0;
  g.s.expeditionRank = 6;
  const u = g.unit('pet', 600, 1000, family);
  g.s.party = [u];
  return { g, u };
}
let layouts = 0;
for (const cls of ['paladin', 'mage', 'ranger']) {
  const { g } = scene(cls, 'thorn'),
    rangedHero = cls !== 'paladin';
  for (let mask = 0; mask < 64; mask++) {
    const melee = families.filter((f) => C.rules.petCompanions[f].role === 'melee');
    const ranged = families.filter((f) => C.rules.petCompanions[f].role === 'ranged');
    const roster = Array.from({ length: 6 }, (_, i) => (mask & (1 << i) ? ranged : melee).shift());
    if (roster.includes(undefined)) continue;
    g.s.party = roster.map((f) => g.unit('pet', 1000, 1000, f));
    const points = g.s.party.map((u) => {
      const offset = g.partyFormationOffset(u),
        role = g.petDefinition(u).role;
      assert.equal(offset[1] > 0, rangedHero && role === 'melee');
      g.formationHeading = { x: 1, y: 0 };
      const east = g.partyFollowPoint(u);
      assert(Math.abs(east.x - (g.hero.x + offset[1])) < 1e-7);
      assert(Math.abs(east.y - (g.hero.y + offset[0])) < 1e-7);
      assert(distance(east, g.hero) < C.rules.companionJudgment.maxAdvanceFromHero);
      return east;
    });
    for (let i = 0; i < points.length; i++)
      for (let j = 0; j < i; j++)
        assert(distance(points[i], points[j]) >= 30, 'distinct legal pet lanes');
    layouts++;
  }
  // A legal mixed squad retains the original troop lanes and separates pets.
  const troops = [g.unit('soldier', 1000, 1000), g.unit('archer', 1000, 1000)];
  g.s.party = [...troops];
  const old = troops.map((u) => g.partyFormationOffset(u));
  g.s.party.push(...['thorn', 'crypt', 'mine', 'citadel'].map((f) => g.unit('pet', 1000, 1000, f)));
  assert.deepEqual(
    troops.map((u) => g.partyFormationOffset(u)),
    old,
  );
  const points = g.s.party.map((u) => g.partyFollowPoint(u));
  for (let i = 0; i < points.length; i++)
    for (let j = 0; j < i; j++)
      assert(distance(points[i], points[j]) >= 30, 'mixed troop/pet lanes');
}
for (const family of families)
  for (const cls of ['paladin', 'mage', 'ranger']) {
    const { g, u } = scene(cls, family),
      anchor = g.partyFollowPoint(u);
    for (let i = 0; i < 160; i++) {
      g.s.time += 0.05;
      g.updateParty(0.05);
    }
    assert(distance(u, anchor) <= 45.1, family + ' actually follows its class-aware destination');
    const originalBlocked = g.blocked;
    g.blocked = (x, y, ...args) =>
      distance({ x, y }, anchor) < 20 || originalBlocked.call(g, x, y, ...args);
    assert.deepEqual(
      g.partyFollowPoint(u),
      g.safe(g.hero.x, g.hero.y),
      'blocked formation falls back to a legal point by the hero',
    );
    g.blocked = originalBlocked;
  }
for (const family of families)
  for (const mode of ['normal', 'recall']) {
    const { g, u } = scene('paladin', family),
      ranged = g.petDefinition(u).role === 'ranged';
    u.skill1Cd = u.skill2Cd = 100;
    const e = g.makeEnemy(
      { species: 'goblin', level: 1, hp: 10000, damage: 0, xp: 0, gold: 0 },
      { x: u.x + (ranged ? 230 : 55), y: u.y },
    );
    g.zone().enemies = [e];
    g.engage(e);
    g.hero.x = u.x + 30;
    g.hero.y = u.y + 70;
    if (mode === 'recall') assert(g.petDefensiveCounter(u, e));
    else g.updatePetCombat(u, e, [u], 0);
    assert.equal(u.cd, 0.85, 'basic cadence matches troops in ' + mode);
    const hp = e.hp,
      shots = g.s.projectiles.length;
    assert.equal(
      g.petDefensiveCounter(u, e),
      false,
      'cadence cannot be bypassed by a defensive counter',
    );
    assert.equal(e.hp, hp);
    assert.equal(g.s.projectiles.length, shots);
    u.cd = 0;
    u.rangerRallyZone = g.zoneId;
    u.rangerRallyUntil = g.s.time + 10;
    u.rangerRallyAttack = 0.2;
    assert(g.petDefensiveCounter(u, e));
    assert.equal(u.cd, 0.85 / 1.2, 'existing rally still scales cadence');
  }
console.log(
  'PASS ' +
    layouts +
    ' mixed six-pet layouts, 33 real formation arrivals, mixed troop lanes and 22 normal/defensive cadence cases',
);

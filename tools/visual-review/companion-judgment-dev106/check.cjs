'use strict';
const assert = require('node:assert/strict'),
  C = require('../../../src/prototype/engine'),
  R = require('../../../src/prototype/rules');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function fixture(types = ['soldier', 'archer']) {
  const g = new C('developer', 'mage', () => 0.9);
  const z = g.zone();
  z.props = [];
  z.npcs = [];
  z.nodes = [];
  z.buildings = [];
  g.blocked = (x, y, zone, r = 15) => x < 40 + r || y < 40 + r || x > 2500 - r || y > 2500 - r;
  Object.assign(g.hero, { x: 500, y: 1500 });
  g.s.mercyTime = 0;
  g.s.expeditionRank = 3;
  g.s.party = types.map((type, i) => {
    const u = type.startsWith('pet:')
      ? g.unit('pet', 780, 1500 + i * 45, type.slice(4))
      : g.unit(type, 780, 1500 + i * 45);
    Object.assign(u, {
      skill1Cd: 100,
      skill2Cd: 100,
      skillGlobalCd: 100,
      cd: 100,
      survivalCd: 100,
    });
    return u;
  });
  z.enemies = Array.from({ length: 8 }, (_, i) => {
    const e = g.makeEnemy(
      { species: 'orc', name: 'crowd-' + i, level: 5, hp: 99999, damage: 20, gold: 0, xp: 0 },
      { x: 970 + (i % 3) * 40, y: 1450 + Math.floor(i / 3) * 50 },
    );
    e.aggro = true;
    return e;
  });
  return { g, z, units: g.s.party, target: z.enemies[0] };
}
const step = (g, count = 1) => {
  for (let i = 0; i < count; i++) {
    g.s.time += 0.05;
    g.updateParty(0.05);
  }
};
// Two isolated companions must regroup instead of advancing into the crowd.
for (const types of [
  ['soldier', 'archer'],
  ['pet:thorn', 'pet:mire'],
]) {
  const { g, z, units } = fixture(types);
  const start = units.map((u) => distance(u, g.hero)),
    health = z.enemies.map((e) => e.hp);
  g.zone();
  step(g, 20);
  units.forEach((u, i) =>
    assert(distance(u, g.hero) < start[i], types[i] + ' withdraws toward support'),
  );
  assert(
    units.every((u) => !g._tacticalPartyTargets.has(u.id)),
    'no offensive intent while out of counter range',
  );
  assert(
    units.every((u) => u.skill1Cd > 98),
    'no new/offensive retreat skill used',
  );
}
// Player committing in person keeps the group fighting a hard encounter.
{
  const { g, units } = fixture();
  Object.assign(g.hero, { x: 900, y: 1500 });
  units.forEach((u, i) => Object.assign(u, { x: 880, y: 1490 + i * 45 }));
  step(g);
  assert(
    units.every((u) => g._tacticalPartyTargets.has(u.id)),
    'supported companions assist the committed hero',
  );
}
// Local ally positions and wounds matter; workers and distant units are not support.
{
  const { g, z, units, target } = fixture(['soldier', 'soldier']);
  Object.assign(g.hero, { x: 500, y: 1500 });
  units.forEach((u, i) => Object.assign(u, { x: 950, y: 1480 + i * 45 }));
  assert(g.companionSafetyAssessment(units[0], target, units).unsafe);
  const support = Array.from({ length: 5 }, (_, i) => g.unit('soldier', 900, 1400 + i * 35));
  g.s.party.push(...support);
  assert(
    !g.companionSafetyAssessment(units[0], target, g.activeLivingParty()).unsafe,
    'nearby allies make the engagement viable',
  );
  const blocked = g.blocked;
  g.blocked = (x, y, zone, r = 15) => blocked(x, y, zone, r) || (x > 930 - r && x < 935 + r);
  assert(
    g.companionSafetyAssessment(units[0], target, g.activeLivingParty()).unsafe,
    'allies behind a wall do not inflate confidence',
  );
  g.blocked = blocked;
  support.forEach((u) => (u.order = { type: 'gather', id: 'resource' }));
  assert(
    g.companionSafetyAssessment(units[0], target, g.activeLivingParty()).unsafe,
    'labor is not imaginary combat support',
  );
  support.forEach((u) => {
    u.order = null;
    u.x = 2000;
  });
  assert(
    g.companionSafetyAssessment(units[0], target, g.activeLivingParty()).unsafe,
    'distant allies do not inflate confidence',
  );
  units[0].hp = units[0].maxHp * 0.2;
  Object.assign(g.hero, { x: 920, y: 1500 });
  assert(
    g.companionSafetyAssessment(units[0], target, g.activeLivingParty()).unsafe,
    'wounds permit retreat even beside committed hero',
  );
}
// A boss is not treated like a single weak ordinary monster.
{
  const { g, z, units, target } = fixture(['soldier', 'soldier']);
  units.forEach((u, i) => Object.assign(u, { x: 950, y: 1480 + i * 45 }));
  target.type = 'boss';
  target.family = 'thorn';
  z.enemies = [target];
  assert(
    g.companionSafetyAssessment(units[0], target, units).unsafe,
    'an isolated pair regroups rather than dueling a boss without support',
  );
}
// Safety must remain favorable briefly before rejoining; no attack/retreat flutter.
{
  const { g, z, units } = fixture();
  step(g);
  Object.assign(g.hero, { x: 900, y: 1500 });
  units.forEach((u, i) => Object.assign(u, { x: 880, y: 1480 + i * 45 }));
  step(g);
  assert(units.every((u) => !g._tacticalPartyTargets.has(u.id)));
  step(g, 55);
  assert(
    units.every((u) => g._tacticalPartyTargets.has(u.id)),
    'rejoin supported fight after hysteresis',
  );
  g.recallParty();
  assert(g.s.recallActive);
  step(g);
  assert(units.every((u) => u.order === null));
  g.blocked = C.prototype.blocked;
  g.enter('frontier');
  assert(units.every((u) => u.order === null));
}
// Wounded (not critical) cover basics do not turn into chase or a new active skill.
{
  const { g, z, units, target } = fixture(['archer']);
  const u = units[0];
  Object.assign(u, { x: 920, y: 1500, cd: 0, hp: u.maxHp * 0.3 });
  Object.assign(g.hero, { x: 650, y: 1500 });
  const before = distance(u, g.hero);
  step(g, 2);
  assert(g.s.projectiles.some((p) => p.source === u.id));
  assert(distance(u, g.hero) < before);
  assert(u.skill1Cd > 99);
}
// Rest/redeployment and recovery do not carry a stale regroup hold forward.
{
  const { g, z, units, target } = fixture();
  const u = units[0];
  step(g);
  z.enemies.forEach((e) => (e.hp = 0));
  assert(g.restCompanion(u.id));
  z.buildings.push({ id: 'test-barracks', progress: 4, full: true, x: 500, y: 1500 });
  assert(g.activateCompanion(u.id, 'test-barracks'));
  Object.assign(target, { hp: 99999, x: 600, y: 1500 });
  step(g);
  assert(g._tacticalPartyTargets.has(u.id), 'redeployed unit immediately obeys a safe engagement');
  z.enemies.forEach((e, i) =>
    Object.assign(e, { hp: 99999, x: 970 + (i % 3) * 40, y: 1450 + Math.floor(i / 3) * 50 }),
  );
  units.forEach((a, i) => Object.assign(a, { x: 780, y: 1500 + i * 45 }));
  g.s.time += 1;
  step(g);
  u.hp = 0;
  g.hero.gold = 100000;
  assert(g.recover());
  z.enemies.forEach((e) => (e.hp = 0));
  Object.assign(target, { hp: 99999, x: 600, y: 1500 });
  step(g);
  assert(g._tacticalPartyTargets.has(u.id), 'recovered unit has no inherited panic');
}
// Judgments are runtime-only, with no permanent panic/new learned ability.
{
  const { g, units } = fixture();
  step(g);
  const saved = g.snapshot();
  for (const u of saved.party) {
    assert(!('regrouping' in u));
    assert(!('companionJudgment' in u));
  }
  const restored = C.restore(saved, () => 0.9);
  assert.equal(restored.s.party.length, units.length);
}
console.log(
  'PASS companion judgment: isolated troops/pets regroup, supported hero engagement, local allies versus distant/workers, wounds, hysteresis/rejoin, cover basics, Recall, travel and save lifecycle',
);

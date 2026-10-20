'use strict';
// Read-only characterization of the published dev.109 runtime. Findings are
// recorded, rather than asserted as desirable behavior or adopted as baselines.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const C = require('../../../src/prototype/engine');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function fixture(type = 'soldier', cls = 'mage') {
  const g = new C('developer', cls, () => 0.9),
    z = g.zone();
  z.enemies.forEach((e) => (e.hp = 0));
  z.props = [];
  z.nodes = [];
  z.npcs = [];
  z.buildings = [];
  g.s.mercyTime = 0;
  Object.assign(g.hero, { x: 500, y: 1500 });
  const u = type.startsWith('pet:')
    ? g.unit('pet', 850, 1500, type.slice(4))
    : g.unit(type, 850, 1500);
  g.s.party = [u];
  Object.assign(u, { cd: 0, skill1Cd: 100, skill2Cd: 100, skillGlobalCd: 100, survivalCd: 100 });
  const e = g.makeEnemy(
    { species: 'goblin', name: 'Audit target', level: 10, hp: 10000, damage: 25, xp: 0, gold: 0 },
    { x: 900, y: 1500 },
  );
  Object.assign(e, {
    aggro: true,
    frozen: true,
    ranged: false,
    cd: 1,
    rogueCd: 100,
    specialCd: 100,
  });
  z.enemies.push(e);
  g.zone();
  return { g, z, u, e };
}
const result = {
  version: '0.9.1+snapshot.dev.109',
  sourceCommit: '896d543cdad718c9ec5b3f2dffb4c3124d17a90a',
  scope:
    'Focused headless behavior audit; no runtime changes, full-campaign simulation or device/survival-rate claim',
  passed: [],
  findings: [],
};
// Idle mobs are never an autonomous hunting target, across hero/troop roles.
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const type of ['soldier', 'archer', 'pet:thorn', 'pet:mire']) {
    const { g, u, e } = fixture(type, cls);
    e.aggro = false;
    Object.assign(u, { x: 550, y: 1500 });
    Object.assign(e, { x: 700, y: 1500, home: { x: 700, y: 1500 } });
    const hp = e.hp;
    for (let i = 0; i < 20; i++) {
      g.s.time += 0.05;
      g.updateParty(0.05);
    }
    assert(!g._tacticalPartyTargets.has(u.id));
    assert.equal(e.hp, hp);
    assert.equal(g.s.projectiles.filter((p) => p.source === u.id).length, 0);
  }
result.passed.push({ behavior: 'No autonomous hunting of idle mobs', cases: 12 });
// Critical health + single ordinary foe falls between the two threat cutoffs.
const wounds = [];
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const type of ['soldier', 'pet:thorn']) {
    const { g, u, e } = fixture(type, cls);
    u.hp = u.maxHp * 0.1;
    const before = distance(u, g.hero),
      assessment = g.companionSafetyAssessment(u, e, g.activeLivingParty());
    const hp = e.hp;
    g.updateParty(0.05);
    const attacked = e.hp < hp;
    let deathAt = null,
      maxReturn = 0;
    for (let j = 0; j < 60; j++) {
      g.tick(0.05);
      maxReturn = Math.max(maxReturn, before - distance(u, g.hero));
      if (u.hp <= 0) {
        deathAt = (j + 1) * 0.05;
        break;
      }
    }
    wounds.push({
      heroClass: cls,
      companion: type,
      healthFraction: 0.1,
      assessmentUnsafe: assessment.unsafe,
      danger: assessment.danger,
      support: assessment.support,
      attackedBeforeEnemyRecovery: attacked,
      maximumProgressTowardHero: maxReturn,
      deathAtSeconds: deathAt,
    });
  }
result.findings.push({
  id: 'critical-single-foe',
  severity: 'high',
  observed: wounds.some((x) => !x.assessmentUnsafe && x.attackedBeforeEnemyRecovery),
  cases: wounds,
  cause:
    'woundedThreatForce is 1.5 while a regular enemy weighs 1; minimumEnemyForce is 2. A target already within basic reach also bypasses unsupported pursuit.',
});
// A close target can require a much longer physical route around a wall.
const detours = [];
for (const type of ['soldier', 'pet:thorn']) {
  const { g, z, u, e } = fixture(type);
  Object.assign(g.hero, { x: 500, y: 1600 });
  Object.assign(u, { x: 500, y: 1600, hp: u.maxHp, cd: 100 });
  Object.assign(e, { x: 800, y: 1600, home: { x: 800, y: 1600 } });
  for (let y = 1050; y <= 2100; y += 30) z.props.push({ id: 'audit-wall-' + y, x: 650, y, r: 22 });
  const route = g.companionRoute(u, e);
  assert(route.length > 1);
  const targetDistance = distance(e, g.hero);
  let maxDistance = 0,
    offensiveStepsOutsideLimit = 0;
  for (let i = 0; i < 120; i++) {
    g.s.time += 0.05;
    g.updateParty(0.05);
    const d = distance(u, g.hero);
    maxDistance = Math.max(maxDistance, d);
    if (d > C.rules.companionJudgment.maxAdvanceFromHero && g._tacticalPartyTargets.has(u.id))
      offensiveStepsOutsideLimit++;
  }
  detours.push({
    companion: type,
    targetDistanceFromHero: targetDistance,
    authoredAdvanceSetting: C.rules.companionJudgment.maxAdvanceFromHero,
    maximumCompanionDistance: maxDistance,
    offensiveStepsOutsideLimit,
    route,
  });
}
result.findings.push({
  id: 'long-detour-support',
  severity: 'high',
  observed: detours.some(
    (x) => x.maximumCompanionDistance > 500 && x.offensiveStepsOutsideLimit > 0,
  ),
  cases: detours,
  cause:
    'Unsupported checks target-to-hero distance (minus attack reach), not the companion’s own distance or physical pursuit route. Ordinary attack routes do not use the hostile-avoidance option used by gathering/regrouping.',
});
// The new fort range is not represented by the old resource-route margin.
{
  const g = new C('developer', 'mage', () => 0.9);
  g.s.zone = 'frontier';
  const z = g.zone(),
    e = z.enemies.find((e) => e.species === 'archer' && Math.hypot(e.x - 3050, e.y - 950) < 150);
  assert(e);
  z.enemies.forEach((o) => {
    if (o !== e) o.hp = 0;
  });
  g.s.mercyTime = 0;
  Object.assign(e, { aggro: false, idleWanderWait: 100, cd: 0 });
  g.s.time++;
  const threats = g.gatheringThreats(),
    a = { x: 3305, y: 920 },
    b = { x: 3305, y: 940 },
    mid = { x: 3305, y: 930 },
    radius = threats.find((t) => t.x === e.x && t.y === e.y).r;
  const safeByPlanner = g.companionTravelClear(a, b, threats),
    inFiringLine = g.enemyRangedLine(e, mid),
    range = g.enemyRangedRange(e);
  const u = g.unit('soldier', mid.x, mid.y);
  u.order = { type: 'gather', id: 'audit-node' };
  g.s.party = [u];
  Object.assign(g.hero, { x: 200, y: 720 });
  g.updateEnemies(0.01);
  result.findings.push({
    id: 'fort-range-routing',
    severity: 'high',
    observed: safeByPlanner && inFiringLine && e.aggro && !!e.rangedAim,
    case: {
      enemyPosition: { x: e.x, y: e.y },
      route: [a, b],
      routeClearByPlanner: safeByPlanner,
      routeDistanceFromEnemy: distance(e, mid),
      routeAvoidanceRadius: radius,
      enemyActualRange: range,
      enemyBecameAggressive: e.aggro,
      enemyAimedAtGatherer: !!e.rangedAim,
    },
    cause:
      'Resource/regroup route threat radius retains ordinary acquisition plus 35 (321), while garrison acquisition/shot range is now 400.4. A route 350 units away is accepted and the real enemy AI acquires and aims at its gathering troop.',
  });
}
// Present support is counted near the starting unit, not the defended target.
{
  const { g, z, u, e } = fixture('soldier');
  Object.assign(u, { x: 500, y: 1500 });
  Object.assign(e, { x: 800, y: 1500 });
  const u2 = g.unit('soldier', 520, 1500);
  g.s.party.push(u2);
  const a = g.companionSafetyAssessment(u, e, g.activeLivingParty());
  result.observation = {
    currentSupport: a.support,
    currentDanger: a.danger,
    unsafe: a.unsafe,
    note: 'Existing numeric support is local to the companion; no prediction of support at the destination. This is a tuning limitation, not counted as a third independently reproduced failure.',
  };
}
fs.writeFileSync(path.join(__dirname, 'findings.json'), JSON.stringify(result, null, 2) + '\n');
console.log(
  JSON.stringify({
    passed: result.passed,
    findings: result.findings.map((f) => ({ id: f.id, observed: f.observed, cases: f.cases })),
    scope: result.scope,
  }),
);

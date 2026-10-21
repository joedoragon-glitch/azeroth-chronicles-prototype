'use strict';
// Characterize current dev.139. Findings are observations, not desired baselines.
const fs = require('node:fs'),
  path = require('node:path'),
  C = require('../../../src/prototype/engine');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function fixture(cls = 'mage', type = 'soldier', near = false) {
  const g = new C('developer', cls, () => 0.9),
    z = g.zone();
  z.enemies.forEach((e) => {
    e.hp = 0;
    e.respawn = 1e9;
  });
  z.props = [];
  z.nodes = [];
  z.npcs = [];
  z.buildings = [];
  g.s.mercyTime = 0;
  Object.assign(g.hero, { x: 500, y: 1500, cd: Array(8).fill(100) });
  const x = near ? 560 : 850;
  const u = type.startsWith('pet:') ? g.unit('pet', x, 1500, type.slice(4)) : g.unit(type, x, 1500);
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
      name: 'Critical audit foe',
      level: 10,
      hp: 10000,
      damage: 25,
      xp: 0,
      gold: 0,
    },
    { x: x + 50, y: 1500 },
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
  version: require('../../../package.json').version,
  publishedCommit: 'ef7b0b849859f8bc355e3c40710d1cd3fa128a38',
  scope:
    'Focused current-source read-only characterization. Native terrain, navigation and actual enemy ticks unless specifically marked direct update; no runtime edits, full-game CI or statistical survival claim.',
  rules: C.rules.companionJudgment,
  retreatCases: [],
  chargePriority: [],
  workPriority: [],
  assessmentDelay: [],
  nearbyAnchorControls: [],
};
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const type of ['soldier', 'archer', 'pet:thorn', 'pet:archive'])
    for (const near of [false, true]) {
      const { g, u, e } = fixture(cls, type, near);
      u.hp = u.maxHp * 0.1;
      const assessment = g.companionSafetyAssessment(u, e, g.activeLivingParty()),
        anchor = g.companionRegroupPoint(u, g.activeLivingParty(), assessment.enemies),
        start = { x: u.x, y: u.y },
        anchorEnemyDistanceAtStart = distance(anchor, e);
      g.updateParty(0.05);
      let deathAt = null,
        maxMoved = distance(start, u),
        firstRetreat = g.companionRetreating(u),
        maxEnemyDistance = distance(u, e);
      for (let i = 0; i < 60; i++) {
        g.tick(0.05);
        maxMoved = Math.max(maxMoved, distance(start, u));
        maxEnemyDistance = Math.max(maxEnemyDistance, distance(u, e));
        if (u.hp <= 0) {
          deathAt = (i + 1) * 0.05;
          break;
        }
      }
      result.retreatCases.push({
        cls,
        type,
        heroNearby: near,
        criticalDetected: assessment.unsafe,
        anchorDistanceFromStart: distance(start, anchor),
        anchorEnemyDistanceAtStart,
        firstRetreat,
        maxMoved,
        maxEnemyDistance,
        deathAt,
        finalHp: u.hp,
      });
    }
for (const [cls, type] of [
  ['paladin', 'soldier'],
  ['mage', 'archer'],
  ['ranger', 'archer'],
]) {
  const { g, u, e } = fixture(cls, type, true);
  u.hp = u.maxHp * 0.1;
  const start = { x: u.x, y: u.y };
  const sideEscape = { x: u.x, y: u.y - 200 };
  for (let i = 0; i < 40; i++) {
    g.s.time += 0.05;
    g.updateParty(0.05);
  }
  result.nearbyAnchorControls.push({
    cls,
    type,
    moved: distance(start, u),
    enemyDistance: distance(e, u),
    retreating: g.companionRetreating(u),
    physicallyClearSideEscape: g.clearSegment(start, sideEscape, g.actorRadius(u)),
    sideEscapeEnemyDistance: distance(sideEscape, e),
  });
}
for (const type of ['soldier', 'pet:thorn']) {
  const { g, u, e } = fixture('mage', type);
  g.hero.skills[1] = 1;
  g.s.companionCombatTraining = 2;
  u.skill2Cd = 0;
  u.skillGlobalCd = 0;
  u.hp = u.maxHp * 0.21;
  const begun = g.companionUseSecondSkill(u, e);
  if (!begun) throw Error(type + ' charge fixture did not start');
  g.hitParty(u, u.maxHp * 0.02, 0, null, true);
  const start = { x: u.x, y: u.y };
  g.updateParty(0.05);
  result.chargePriority.push({
    type,
    hpFraction: u.hp / u.maxHp,
    criticalDetected: g.companionSafetyAssessment(u, e, g.activeLivingParty()).unsafe,
    pending: !!g._companionCharges?.has(u.id),
    interrupted: !!g.partyChargeState(u)?.interrupted,
    moved: distance(start, u),
    retreating: g.companionRetreating(u),
  });
}
for (const order of ['build', 'upgrade', 'gather']) {
  const { g, z, u, e } = fixture('mage', 'soldier');
  u.hp = u.maxHp * 0.1;
  const b = {
    id: 'audit-barracks',
    kind: 'barracks',
    x: u.x,
    y: u.y,
    progress: order === 'upgrade' ? 4 : 1,
    full: false,
    upgradePaid: true,
    upgradeProgress: 0,
  };
  if (order === 'gather') {
    z.nodes.push({
      id: 'audit-tribute',
      x: u.x,
      y: u.y,
      amount: 1000,
      tribute: true,
      resourceGroup: 'audit',
    });
    u.order = { type: 'gather', id: 'audit-tribute', group: 'audit' };
  } else {
    z.buildings.push(b);
    u.order = { type: order, id: b.id };
  }
  const start = { x: u.x, y: u.y };
  g.updateParty(0.05);
  result.workPriority.push({
    order,
    criticalDetected: g.companionSafetyAssessment(u, e, g.activeLivingParty()).unsafe,
    moved: distance(start, u),
    retreating: g.companionRetreating(u),
    constructionProgress: b.progress,
    upgradeProgress: b.upgradeProgress,
    orderAfter: u.order,
  });
}
{
  const { g, u, e } = fixture('paladin', 'soldier', true);
  Object.assign(u, { x: 650, y: 1500 });
  Object.assign(e, { x: 700, y: 1500, home: { x: 700, y: 1500 } });
  g.updateParty(0.05);
  const start = { x: u.x, y: u.y };
  g.hitParty(u, u.maxHp * 0.9, 0, null, true);
  for (let i = 1; i <= 10; i++) {
    g.s.time += 0.05;
    g.updateParty(0.05);
    result.assessmentDelay.push({
      elapsed: i * 0.05,
      hpFraction: u.hp / u.maxHp,
      retreating: g.companionRetreating(u),
      distance: distance(start, u),
    });
  }
}
fs.writeFileSync(path.join(__dirname, 'findings.json'), JSON.stringify(result, null, 2) + '\n');
console.log(
  JSON.stringify(
    {
      cases: result.retreatCases.length,
      retreat: result.retreatCases,
      charge: result.chargePriority,
      work: result.workPriority,
      delay: result.assessmentDelay,
      anchors: result.nearbyAnchorControls,
    },
    null,
    2,
  ),
);

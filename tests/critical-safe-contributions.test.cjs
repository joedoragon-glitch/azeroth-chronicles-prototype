'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function scene(type = 'archer', cls = 'mage', gap = 150) {
  const g = new C('developer', cls, () => 0.9),
    z = g.zone();
  Object.assign(z, { props: [], nodes: [], npcs: [], buildings: [], enemies: [] });
  g.blocked = (x, y, zone, r = 15) => x < 50 + r || y < 50 + r || x > 2450 - r || y > 2450 - r;
  g.s.mercyTime = 0;
  Object.assign(g.hero, { x: 950, y: 1500, cd: g.hero.cd.map(() => 60) });
  g.hero.skills[1] = 1;
  g.s.companionCombatTraining = 2;
  g.setPartyChargeClock(() => g.s.time);
  const u = type.startsWith('pet:')
    ? g.unit('pet', 1000 + gap, 1500, type.slice(4))
    : g.unit(type, 1000 + gap, 1500);
  Object.assign(u, { hp: u.maxHp * 0.1, skill1Cd: 60, skill2Cd: 60, healCd: 60, cd: 0 });
  g.s.party = [u];
  const e = g.makeEnemy(
    { species: 'goblin', name: 'Screened foe', level: 1, hp: 100000, damage: 0, gold: 0, xp: 0 },
    { x: 1000, y: 1500 },
  );
  e.aggro = true;
  z.enemies = [e];
  g.zone();
  g.syncSquadDoctrine();
  return { g, z, u, e };
}
function step(g, n = 1) {
  for (let i = 0; i < n; i++) {
    g.s.time += 0.05;
    g.updateParty(0.05);
    g.resolveCompanionCharges();
  }
}
let cases = 0;
// Ranged basics continue from a useful position through their existing cooldowns.
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const type of [
    'archer',
    ...Object.entries(C.rules.petCompanions)
      .filter(([, d]) => d.role === 'ranged')
      .map(([x]) => 'pet:' + x),
  ]) {
    const { g, u, e } = scene(type, cls),
      start = { x: u.x, y: u.y };
    step(g, 40);
    assert(distance(start, u) < 0.001, type + ' stays at a safe firing position');
    assert(
      g.s.projectiles.filter((p) => p.source === u.id).length >= 2,
      type + ' keeps contributing through cooldowns',
    );
    assert(
      !g.companionRetreating(u),
      'standing fire does not receive movement-only retreat defense',
    );
    assert(g.companionSurvivalMode(u));
    cases++;
  }
console.log('PASS ' + cases + ' hero/ranged-role safe basic-fire cases');
// Every existing skill is judged on its actual range, not the pet/troop role label.
for (const type of [
  'soldier',
  'archer',
  ...Object.keys(C.rules.petCompanions).map((x) => 'pet:' + x),
])
  for (const slot of [1, 2]) {
    const { g, u, e } = scene(type),
      range = g.companionContributionRange(u, slot),
      minimum =
        65 +
        (slot === 2
          ? C.rules.companionJudgment.criticalChargeSafetyMargin
          : C.rules.companionJudgment.criticalInstantSafetyMargin);
    const allowed = range >= minimum;
    u.x = e.x + Math.min(150, range);
    u[slot === 1 ? 'skill1Cd' : 'skill2Cd'] = 0;
    const position = { x: u.x, y: u.y },
      hp = e.hp;
    const used = slot === 1 ? g.companionUseFirstSkill(u, e) : g.companionUseSecondSkill(u, e);
    assert.equal(used, allowed, type + ' slot ' + slot + ' uses existing safe range');
    assert.equal(distance(position, u), 0, 'casting never advances toward the target');
    if (used && slot === 2) {
      assert.equal(e.hp, hp, 'charged ability is not instant');
      step(g, 12);
      assert.equal(e.hp, hp);
      step(g);
      assert(u.skill2Cd > 0, 'full existing charge resolves');
    }
    if (!allowed) {
      assert.equal(e.hp, hp);
      assert(!g._companionCharges?.has(u.id));
    }
    cases++;
  }
// A threatened, unprotected or distant companion must withdraw rather than stay casting.
for (const risk of [
  'melee',
  'ranged',
  'boss',
  'captain',
  'telegraph',
  'motion',
  'screen',
  'wall',
  'hazard',
  'idle',
  'returning',
  'neutral',
  'range',
  'hero-distance',
]) {
  const { g, z, u, e } = scene();
  if (risk === 'melee') e.x = u.x - 60;
  if (risk === 'ranged') e.ranged = true;
  if (risk === 'boss') e.type = 'boss';
  if (risk === 'captain') e.captain = true;
  if (risk === 'telegraph') e.telegraph = {};
  if (risk === 'motion') e.motion = {};
  if (risk === 'screen') Object.assign(g.hero, { x: 1300, y: 1500 });
  if (risk === 'wall') g.blocked = (x, y, zone, r = 15) => x > 1080 - r && x < 1090 + r;
  if (risk === 'hazard') g.s.hazards.push({ x: u.x, y: u.y, radius: 70, life: 2, damage: 10 });
  if (risk === 'idle') e.aggro = false;
  if (risk === 'returning') e.returning = true;
  if (risk === 'neutral') e.neutral = true;
  if (risk === 'range') u.x = e.x + 250;
  if (risk === 'hero-distance') g.hero.x = 700;
  assert(!g.companionSafeContribution(u, e, 0), risk + ' blocks a supposedly safe shot');
  cases++;
}
// Risk arriving during a real charged preparation cancels it and immediately restores retreat.
for (const risk of ['closing-enemy', 'lost-screen', 'silence', 'hero-moving', 'hazard']) {
  const { g, u, e } = scene('soldier');
  u.skill2Cd = 0;
  step(g);
  assert(g.partyChargeState(u));
  const hp = e.hp,
    start = { x: u.x, y: u.y };
  if (risk === 'closing-enemy') e.x = u.x - 70;
  if (risk === 'lost-screen') g.hero.x = 1300;
  if (risk === 'silence') u.silenceField = { remaining: 1 };
  if (risk === 'hero-moving') g.hero.x = 650;
  if (risk === 'hazard') g.s.hazards.push({ x: u.x, y: u.y, radius: 70, life: 2, damage: 10 });
  if (risk === 'silence') g.mageSilenceActive = (actor) => actor === u;
  step(g);
  assert(!g.partyChargeState(u), risk + ' cancels the hold');
  assert(distance(u, start) > 0, risk + ' allows immediate movement');
  step(g, 15);
  assert.equal(e.hp, hp, 'cancelled skill cannot release later');
  cases++;
}
// Late damage phases re-check safety even if the actor update already ran.
{
  const { g, u, e } = scene('soldier');
  u.skill2Cd = 0;
  assert(g.companionUseSecondSkill(u, e));
  e.x = u.x - 70;
  g.s.time += 1;
  g.resolveCompanionCharges();
  assert(!g.partyChargeState(u));
  assert.equal(u.skill2Cd, 0);
  cases++;
}
// Existing BOSS/ADDS and selected-target intent remain authoritative.
{
  const { g, z, u, e } = scene('archer');
  const boss = g.makeEnemy(
    { species: 'ogre', name: 'Distant boss', level: 1, hp: 100000, damage: 0, gold: 0, xp: 0 },
    { x: 400, y: 1500 },
  );
  Object.assign(boss, { type: 'boss', family: 'thorn', aggro: true });
  e.summon = true;
  e.owner = boss.id;
  z.enemies.push(boss);
  g.syncSquadDoctrine();
  g.s.squadDoctrine = 'focus';
  assert(!g.companionSafeContribution(u, e, 0), 'BOSS order does not shoot an add instead');
  g.s.squadDoctrine = 'guard';
  assert(g.companionSafeContribution(u, e, 0), 'ADDS allows an existing safe engaged add');
  cases++;
}
// Area attacks cannot use the contribution exception to pull an idle bystander.
{
  const { g, z, u, e } = scene('pet:ridge');
  u.skill2Cd = 0;
  const idle = g.makeEnemy(
    { species: 'goblin', name: 'Idle bystander', level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 },
    { x: 1010, y: 1505 },
  );
  z.enemies.push(idle);
  assert(!g.companionUseSecondSkill(u, e));
  assert(!g.partyChargeState(u));
  cases++;
}
// Dreadmaw's existing attack-linked self/ally healing still requires a legal hit.
{
  const { g, u, e } = scene('pet:crypt');
  u.skill1Cd = 0;
  g.hero.hp = g.hero.maxHp * 0.5;
  const own = u.hp,
    ally = g.hero.hp;
  assert(!g.usePetSkill(u, null, 1));
  assert.equal(u.hp, own);
  assert(g.companionUseFirstSkill(u, e));
  assert.equal(u.hp, own, 'no free heal on launch');
  for (let i = 0; i < 12; i++) g.updateProjectiles(0.05);
  assert(u.hp > own);
  assert(g.hero.hp > ally);
  cases++;
}
// A moving hero keeps the companion following; it never advances just to obtain a target.
{
  const { g, u, e } = scene();
  step(g);
  const before = { x: u.x, y: u.y };
  g.hero.x = 650;
  step(g);
  assert(distance(u, before) > 0, 'leaves its firing spot when following becomes necessary');
  step(g, 100);
  assert(distance(u, g.hero) < 400, 'follows around the enemy rather than crossing it');
  const other = scene();
  other.u.x = 1250;
  other.g.hero.x = 1200;
  const gap = distance(other.u, other.e);
  step(other.g);
  assert(distance(other.u, other.e) >= gap, 'no attack chase to regain range');
  cases++;
}
// Silence keeps existing basic-fire eligibility, while an active trap prevents holding a firing spot.
{
  const { g, u, e } = scene();
  u.skill1Cd = 0;
  u.skill2Cd = 0;
  g.mageSilenceActive = (a) => a === u;
  step(g);
  assert(g.s.projectiles.some((p) => p.source === u.id));
  assert(!g.partyChargeState(u));
  assert.equal(u.skill1Cd, 0);
  cases++;
}
{
  const { g, u, e } = scene();
  g.isDungeon = () => true;
  g.traps = () => [
    {
      x: u.x,
      y: u.y,
      kind: 'seal',
      radius: 70,
      phase: 0.2,
      warningTime: 1,
      activeTime: 1,
      cycleLength: 8,
    },
  ];
  assert(!g.companionSafeContribution(u, e, 0));
  cases++;
}
// Actual engine ticks resolve safely launched fire and leave movement/health authoritative.
{
  const { g, u, e } = scene('archer');
  const hp = e.hp;
  for (let i = 0; i < 35; i++) g.tick(0.05);
  assert(e.hp < hp);
  assert(distance(u, e) > 65);
  assert(u.hp > 0);
  cases++;
}
console.log(
  'PASS ' +
    cases +
    ' safe contribution cases: ranged basics, all troop/pet skills, native charge deadlines, threat cancellation, doctrine, no pulls/chase, existing healing and real ticks',
);

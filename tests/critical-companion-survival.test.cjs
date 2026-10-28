'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function scene(type = 'soldier', cls = 'mage', native = false) {
  const g = new C('developer', cls, () => 0.9),
    z = g.zone();
  z.props = [];
  z.nodes = [];
  z.npcs = [];
  z.buildings = [];
  z.enemies = [];
  if (!native)
    g.blocked = (x, y, zone, r = 15) => x < 50 + r || y < 50 + r || x > 2450 - r || y > 2450 - r;
  g.s.mercyTime = 0;
  Object.assign(g.hero, { x: 1000, y: 1500, cd: g.hero.cd.map(() => 60) });
  const u = type.startsWith('pet:')
    ? g.unit('pet', 1000, 1500, type.slice(4))
    : g.unit(type, 1000, 1500);
  u.hp = u.maxHp * 0.2;
  g.s.party = [u];
  const e = g.makeEnemy(
    { species: 'goblin', name: 'Survival foe', level: 1, hp: 100000, damage: 0, gold: 0, xp: 0 },
    { x: 1050, y: 1500 },
  );
  e.aggro = true;
  z.enemies = [e];
  g.zone();
  return { g, z, u, e };
}
function step(g, n = 1) {
  for (let i = 0; i < n; i++) {
    g.s.time += 0.05;
    g.updateParty(0.05);
  }
}
let cases = 0;
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const type of [
    'soldier',
    'archer',
    ...Object.keys(C.rules.petCompanions).map((x) => 'pet:' + x),
  ]) {
    const { g, u, e } = scene(type, cls),
      start = distance(u, e),
      hp = e.hp;
    g.hero.skills[1] = 1;
    g.s.companionCombatTraining = 2;
    step(g);
    assert(g.companionSurvivalMode(u), type + ' recognizes critical immediately');
    assert(distance(u, e) > start, type + ' leaves an already-arrived unsafe hero formation');
    assert(!g._tacticalPartyTargets.has(u.id));
    assert.equal(g.companionUseFirstSkill(u, e), false);
    assert.equal(g.companionUseSecondSkill(u, e), false);
    step(g, 80);
    assert(distance(u, e) >= 90, type + ' avoids basic melee reach');
    assert(distance(u, g.hero) < C.rules.companionJudgment.criticalFollowRadius + 20);
    // Existing skills/shots may contribute after reaching a safe screened position.
    assert(distance(u, e) > 65, 'never closes to basic melee reach');
    u.hp = u.maxHp * 0.21;
    step(g);
    assert(
      !g.companionSurvivalMode(u),
      'ordinary judgment resumes immediately above critical health',
    );
    u.hp = u.maxHp * 0.25;
    step(g);
    assert(!g.companionSurvivalMode(u), 'no separate recovery threshold');
    cases++;
  }
console.log(
  'PASS ' +
    cases +
    ' class/role critical withdrawal, safe spacing, tether and ordinary recovery cases',
);
// Two wounded companions withdraw independently while healthy allies fight and hero intent survives.
{
  const { g, z, u, e } = scene('archer', 'paladin'),
    pet = g.unit('pet', 990, 1510, 'thorn'),
    healthy = g.unit('soldier', 1020, 1480);
  pet.hp = pet.maxHp * 0.1;
  g.s.party.push(pet, healthy);
  g.hero.order = { type: 'move', x: 1400, y: 1500 };
  const order = g.hero.order;
  const before = e.hp;
  step(g, 30);
  assert(e.hp < before, 'healthy companion continues attacking');
  assert(g._tacticalPartyTargets.has(healthy.id));
  assert(distance(u, e) > 65 && distance(pet, e) > 65, 'wounded units avoid close melee');
  assert.equal(g.hero.order, order);
  assert(!g.s.recallActive, 'individual survival never recalls the whole party');
  Object.assign(g.hero, { x: 1500, y: 1500 });
  Object.assign(e, { x: 1550, y: 1500 });
  step(g, 100);
  for (const wounded of [u, pet]) {
    assert(distance(wounded, g.hero) < 440, 'follows moving player');
    assert(distance(wounded, e) >= 90, 'physical clearance without leaving the hero behind');
  }
  cases++;
}
// Existing catch-up pace follows a continuously moving Ranger rather than falling behind forever.
{
  const { g, z, u } = scene('soldier', 'ranger');
  z.enemies = [];
  Object.assign(g.hero, { x: 500, y: 1500 });
  Object.assign(u, { x: 400, y: 1500 });
  for (let i = 0; i < 80; i++) {
    g.hero.x += 16;
    step(g);
  }
  assert(distance(u, g.hero) < 420);
  assert(u.x > 1200);
  assert(g.companionSurvivalMode(u));
  cases++;
}
// Crossing critical HP bypasses the ordinary assessment interval and cancels preparation.
for (const type of ['soldier', 'pet:thorn'])
  for (const phase of ['update', 'resolution']) {
    const { g, u, e } = scene(type);
    u.hp = u.maxHp * 0.21;
    g.hero.skills[1] = 1;
    g.s.companionCombatTraining = 2;
    g.setPartyChargeClock(() => g.s.time);
    assert(g.companionUseSecondSkill(u, e));
    g.hitParty(u, u.maxHp * 0.02, 0, null, true);
    assert(!g.partyChargeState(u).interrupted, 'small hit did not trigger normal interruption');
    const before = e.hp,
      start = { x: u.x, y: u.y };
    if (phase === 'update') {
      step(g);
      assert(distance(u, start) > 0, 'withdraws on first update');
    } else {
      g.s.time += 1;
      g.resolveCompanionCharges();
    }
    assert(!g.partyChargeState(u) && !g._companionCharges.has(u.id));
    assert.equal(e.hp, before, 'no charged release after critical damage');
    cases++;
  }
// Non-critical prior assessment must not delay entering survival mode.
{
  const { g, u, e } = scene();
  u.hp = u.maxHp;
  u.cd = 60;
  u.skill1Cd = 60;
  step(g);
  u.hp = u.maxHp * 0.1;
  const start = { x: u.x, y: u.y };
  step(g);
  assert(distance(u, start) > 0);
  assert(g.companionSurvivalMode(u));
  cases++;
}
// Keep paid work and cargo, but pause all work while critically wounded.
for (const work of ['build', 'upgrade', 'gather', 'deposit']) {
  const { g, z, u, e } = scene();
  const b = {
    id: 'survival-barracks',
    kind: 'barracks',
    x: u.x,
    y: u.y,
    progress: work === 'upgrade' ? 4 : 1,
    upgradePaid: true,
    upgradeProgress: 0,
    full: false,
  };
  z.buildings = [b];
  const n = { id: 'survival-resource', x: u.x, y: u.y, amount: 1000, resourceGroup: 'survival' };
  z.nodes = [n];
  u.carry = 15;
  u.order = { type: work, id: work === 'build' || work === 'upgrade' ? b.id : n.id };
  const order = structuredClone(u.order),
    progress = b.progress;
  step(g, 10);
  assert.deepEqual(u.order, order);
  assert.equal(u.carry, 15);
  assert.equal(n.amount, 1000);
  assert.equal(b.progress, progress);
  assert.equal(b.upgradeProgress, 0);
  assert(distance(u, e) >= 90, 'work remains paused at local physical clearance');
  z.enemies = [];
  u.hp = u.maxHp;
  Object.assign(u, { x: b.x, y: b.y });
  step(g);
  if (work === 'build') assert(b.progress > progress);
  if (work === 'upgrade') assert(b.upgradeProgress > 0);
  if (work === 'gather') assert(n.amount < 1000);
  cases++;
}
// Recall retains retreat priority and basic-only covering fire, without charged preparation.
{
  const { g, u, e } = scene('archer');
  g.recallParty();
  step(g, 30);
  g.toggleSquadDoctrine();
  step(g, 30);
  assert(g.companionSurvivalMode(u));
  assert(!g._companionCharges?.has(u.id), 'Recall never starts an active charged skill');
  assert(distance(u, e) >= 90, 'Recall keeps local physical clearance');
  assert(distance(u, g.hero) < 150, 'Recall remains nearby the stationary hero');
  cases++;
}
// Critical health does not strip existing Recall movement protection on a clear return.
{
  const { g, z, u, e } = scene();
  e.hp = 0;
  Object.assign(u, { x: 600, y: 1500, maxHp: 10000, hp: 1000 });
  g.recallParty();
  step(g);
  assert(g.companionRetreating(u));
  const before = u.hp;
  g.hitParty(u, 100);
  assert(before - u.hp > 0 && before - u.hp <= 50);
  cases++;
}
// A critical worker does not abandon safe construction after nearby danger is gone.
{
  const { g, z, u, e } = scene();
  e.hp = 0;
  z.buildings = [{ id: 'safe-work', kind: 'barracks', x: u.x, y: u.y, progress: 1 }];
  u.order = { type: 'build', id: 'safe-work' };
  step(g);
  assert(z.buildings[0].progress > 1);
  assert(!g.companionRetreatMode(u));
  cases++;
}
// Only current health and ordinary judgment survive reload; dev.141 locks are stripped.
{
  const { g, u } = scene();
  step(g);
  const saved = g.snapshot();
  assert(!('survivalRetreat' in saved.party[0]));
  const restored = C.restore(saved, () => 0.9),
    ru = restored.s.party[0];
  assert(restored.companionSurvivalMode(ru));
  restored.recallParty();
  assert(restored.companionSurvivalMode(ru));
  restored.enter('frontier');
  assert(restored.companionSurvivalMode(ru));
  ru.hp = ru.maxHp * 0.21;
  assert(!restored.companionSurvivalMode(ru));
  saved.party[0].hp = saved.party[0].maxHp * 0.21;
  saved.party[0].survivalRetreat = true;
  const legacy = C.restore(saved, () => 0.9);
  assert(!legacy.companionSurvivalMode(legacy.s.party[0]));
  assert(!('survivalRetreat' in legacy.s.party[0]));
  const bad = structuredClone(saved);
  bad.party[0].survivalRetreat = 'yes';
  assert.throws(() => C.restore(bad), /survival retreat/);
  u.active = false;
  assert(!g.companionSurvivalMode(u));
  u.active = true;
  u.hp = 0;
  assert(!g.companionSurvivalMode(u));
  cases++;
}
// Existing favorable-condition delay, support and pressure decide combat above 20%, without a recovery lock.
{
  const { g, z, u, e } = scene();
  step(g);
  u.hp = u.maxHp * 0.21;
  u.cd = 60;
  u.skill1Cd = 60;
  u.skill2Cd = 60;
  const startHp = e.hp;
  step(g);
  assert(!g.companionSurvivalMode(u));
  assert.equal(e.hp, startHp, 'ordinary rejoin observation still prevents an instant charge');
  step(g, 70);
  u.cd = 0;
  u.skill1Cd = 0;
  step(g);
  assert(
    e.hp < startHp,
    'safe ordinary foe can be attacked at 21%, below either abandoned recovery threshold',
  );
  const second = g.makeEnemy(
    { species: 'goblin', name: 'Second foe', level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 },
    { x: u.x + 40, y: u.y + 20 },
  );
  second.aggro = true;
  z.enemies.push(second);
  assert(
    g.companionSafetyAssessment(u, e, [u]).unsafe,
    'ordinary wounded-pressure caution still applies',
  );
  cases++;
}
// Idle foes are not attacked; possible ranged reach alone does not force a long flight.
{
  const { g, u, e } = scene();
  e.ranged = true;
  e.shotRange = 400;
  e.aggro = false;
  step(g, 100);
  assert(distance(u, e) >= 90, 'keeps physical clearance without fleeing possible ranged reach');
  assert(!e.aggro);
  cases++;
}
// Possible boss reach does not override the bounded hero-following band.
{
  const { g, u, e } = scene();
  e.type = 'boss';
  step(g, 130);
  assert(distance(u, e) >= 90, 'keeps physical clearance while remaining near the hero');
  assert(distance(u, g.hero) < g.companionSurvivalRadius(g.companionSurvivalThreats()) + 20);
  cases++;
}
// Supportive healing remains available during survival and releases the hold after recovery.
{
  const { g, z, u } = scene('archer');
  z.enemies = [];
  u.hp = u.maxHp * 0.1;
  step(g);
  assert(g.companionSurvivalMode(u));
  assert(g.rangerSupport('health', false, u));
  g.updateRangerSupport(5);
  step(g);
  assert(u.hp >= u.maxHp * 0.4);
  assert(!g.companionSurvivalMode(u));
  cases++;
}
// Enemy forced holds remain authoritative, then ordinary safety movement resumes.
{
  const { g, u, e } = scene();
  u.keeperHeld = true;
  const start = { x: u.x, y: u.y };
  step(g);
  assert.equal(distance(u, start), 0);
  u.keeperHeld = false;
  step(g);
  assert(distance(u, e) > distance(start, e));
  cases++;
}
// Friendly withdrawal and normal movement can pass enemy bodies after PT-002 rollback.
{
  const { g, z, u, e } = scene();
  z.props = [];
  Object.assign(u, { x: 700, y: 1500 });
  Object.assign(e, { x: 750, y: 1500 });
  assert(g.move(u, { x: 800, y: 1500 }, 1000, 0.1),
    'retreating units are no longer body-blocked by enemies');
  assert.equal(u.x, 800);
  cases++;
}
// Route around a physical wall; actors may overlap, but terrain never phases.
{
  const { g, z, u, e } = scene();
  e.hp = 0;
  Object.assign(u, { x: 600, y: 1500 });
  Object.assign(g.hero, { x: 1100, y: 1500 });
  const base = g.blocked;
  g.blocked = (x, y, zone, r = 15) =>
    base(x, y, zone, r) || (x > 800 - r && x < 830 + r && y > 1300 - r && y < 1700 + r);
  for (let i = 0; i < 180; i++) {
    step(g);
    assert(!g.blocked(u.x, u.y, g.s.zone, 15));
  }
  assert(distance(u, g.hero) < 150, 'keeps following around terrain');
  cases++;
}
// Native terrain and actual engine ticks: no injected movement, safety or combat predicates.
{
  const { g, z, u, e } = scene('archer', 'mage', true);
  u.healCd = 60;
  const p = g.safe(600, 900);
  Object.assign(g.hero, p);
  Object.assign(u, p);
  Object.assign(e, { x: p.x + 50, y: p.y });
  let ticks = 0;
  for (; ticks < 60; ticks++) g.tick(0.05);
  assert(g.companionSurvivalMode(u));
  assert(u.hp > 0);
  assert(distance(u, e) >= 90, 'native retreat stays outside basic melee reach');
  cases++;
}
console.log(
  'PASS ' +
    cases +
    ' critical survival scenarios including mixed party, movement, preparation timing, labor, Recall, save/travel, ranged foes, walls and native engine ticks',
);

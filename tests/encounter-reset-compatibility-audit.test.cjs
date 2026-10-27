'use strict';
// Issue #510: reproduce encounter territory / incoming-hit asymmetry using
// the game's REAL Campaign.damage, sight/terrain, aggro and reset methods.
// This test intentionally characterizes current behavior; it is not a fix.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const R = Campaign.rules;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function fixture() {
  const g = new Campaign('normal', 'ranger', () => 0.9);
  g.enter('vale');
  const z = g.zone();
  z.enemies = [];
  z.props = [];
  z.buildings = [];
  g.s.party = [];
  g.s.time = 30;
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  g.s.thornHeroInitiated = true;
  Object.assign(g.hero, { hp: 10000, maxHp: 10000, level: 3, slow: 0 });
  g.tacticalAutoRogue = () => false; // no Rogue tuning; isolate reset contract
  const candidates = [
    [1400, 1700], [1800, 1800], [2200, 1700], [2300, 2200],
    [2600, 1500], [1300, 2500], [1900, 2600],
    [800, 1800], [1900, 900], [900, 2200],
  ];
  let path;
  for (const [x, y] of candidates) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const home = { x, y },
        near = { x: x + dx * 420, y: y + dy * 420 },
        nearHero = { x: x + dx * 480, y: y + dy * 480 },
        far = { x: x + dx * 540, y: y + dy * 540 },
        farHero = { x: x + dx * 600, y: y + dy * 600 };
      if ([home, near, nearHero, far, farHero].some(p => g.blocked(p.x, p.y, 'vale', 15))) continue;
      if (!g.line(home, near) || !g.line(nearHero, near) || !g.line(farHero, far) ||
          !g.clearSegment(home, far, 15)) continue;
      path = { home, near, nearHero, far, farHero };
      break;
    }
    if (path) break;
  }
  assert(path, 'real Greenwood terrain must provide a clear 600-unit lane');
  const e = g.makeEnemy({
    species: 'goblin', name: 'reset-audit ordinary melee',
    form: 'normal', type: 'mob', level: 3, hp: 5000,
    damage: 1, gold: 0, xp: 0,
  }, path.home);
  Object.assign(e, { ranged: false, hybrid: false, cd: 100,
    specialCd: 100, idleWanderWait: 1000 });
  z.enemies = [e];
  Object.assign(g.hero, path.nearHero);
  assert(g.engage(e) !== false, 'native engage must succeed');
  return { g, e, path, z };
}
function put(g, e, actor, hero) {
  Object.assign(e, actor);
  Object.assign(g.hero, hero);
  assert.equal(g.line(g.hero, e), true, 'true LOS to actual nearby target');
  assert(dist(g.hero, e) <= 80, 'hero is in melee/basic range');
}
function testTerritory(label, changes, chaseLimit, mismatch) {
  const { g, e, path } = fixture();
  Object.assign(e, changes);
  assert(e.aggro);
  put(g, e, path.far, path.farHero);
  const distanceFromHome = dist(g.hero, e.home);
  assert.equal(Math.round(distanceFromHome), 600);
  const pursuerCanStay = g.tacticalRogueLeashAllows(e, g.hero, chaseLimit);
  const attackerWithinDefault = g.tacticalRogueLeashAllows(e, g.hero, 500);
  assert.equal(pursuerCanStay, true, label + ': target remains inside native chase leash');
  assert.equal(attackerWithinDefault, false, label + ': attacker is beyond ordinary damage leash');
  const hp = e.hp;
  const hit = g.damage(e, 13, 'hero');
  assert.equal(hit, !mismatch, label + ': actual Campaign.damage result at 600-home/60-actor units');
  assert.equal(e.hp, mismatch ? hp : hp - 13, label + ': native HP change agrees with damage gate');
  if (mismatch) {
    put(g, e, path.near, path.nearHero);
    const hpBefore = e.hp;
    assert.equal(g.damage(e, 13, 'hero'), true, label + ': same hit works inside 500');
    assert(e.hp < hpBefore);
  }
  console.log('AUDIT territory ' + label + ': chase=' + chaseLimit +
    ', attacker-home=600, actor-attacker=60, accepted=' + hit +
    ', mismatch=' + mismatch);
}
// Control: normal 500-unit leash already stops the same attacker at 600.
{
  const { g, e, path } = fixture();
  put(g, e, path.far, path.farHero);
  assert(!g.tacticalRogueLeashAllows(e, g.hero, 500));
  assert(!g.damage(e, 13, 'hero'));
  put(g, e, path.near, path.nearHero);
  assert(g.damage(e, 13, 'hero'));
}
testTerritory('summoned ordinary melee', { summon: true }, 900, true);
testTerritory('field captain', { fieldCaptain: true }, 900, true);
testTerritory('quota overtime ordinary', { quotaOvertime: 4 }, 1300, true);
// Bosses use matching damage and chase territory (700 outside a dungeon).
{
  const { g, e, path } = fixture();
  e.type = 'boss';
  put(g, e, path.far, path.farHero);
  assert(g.tacticalRogueLeashAllows(e, g.hero, 700));
  assert(g.damage(e, 13, 'hero'), 'boss non-dungeon 700/700 matches');
}
// The enemy actively makes a continuation decision inside its own 900 leash.
{
  const { g, e, path } = fixture();
  e.summon = true;
  put(g, e, path.far, path.farHero);
  const x = e.x;
  g.s.time += 0.1;
  g.updateEnemies(0.1);
  assert(e.aggro && !e.returning,
    'enemy remains engaged at attacker 600 from home');
  // Starting in real melee reach and on a long recovery may leave the actor
  // standing/attacking; engagement (not travel) is the relevant assertion.
  assert(Number.isFinite(e.x) && dist(e, path.home) > 500);
  assert.equal(g.damage(e, 13, 'hero'), false,
    'enemy still engaged but rejects a direct nearby player hit');
  console.log('AUDIT confirmed continuing hostile engagement versus rejected hero damage');
}
// Native leash reset transitions and their special-state cleanup stay separate.
{
  const { g, e, path } = fixture();
  Object.assign(e, { hp: e.maxHp - 100, noProgress: 4,
    pursuitBurst: 1.2, pursuitBurstUsed: true,
    pursuitBurstReadyAt: g.s.time + 3.2,
    frenzy: true, specialCd: 20 });
  put(g, e, path.far, path.farHero);
  g.disengage(e, 0.1);
  assert(e.returning > 0 && e.returning < 1, 'disengagement has a distinct returning phase');
  assert(!g.damage(e, 13, 'hero'), 'returning actor rejects live attacks');
  assert.equal(e.pursuitBurst, 0, 'active boost cancelled at disengagement');
  g.disengage(e, 1.1);
  assert.equal(e.returning, 0);
  assert.equal(e.aggro, false);
  assert.equal(e.hp, e.baseHp, 'completed encounter restores original HP');
  assert.equal(e.pursuitBurstUsed, false);
  assert.equal(e.pursuitBurstReadyAt, undefined);
  assert.equal(e.frenzy, false);
  assert.equal(e.noProgress, 0);
  assert.deepEqual({ x: e.x, y: e.y }, e.home);
  assert(g.engage(e) !== false, 'new engagement is valid after full reset');
  console.log('AUDIT leash reset state: returning phase, HP restoration, cooldown retirement, reengagement PASS');
}
// The real update loop must eventually reset a genuinely immobile chaser.
// Restrict ONLY movement in the fixture; do not edit movement implementation.
{
  const { g, e, path } = fixture();
  Object.assign(g.hero, path.nearHero);
  g.follow = () => false;
  g.enemyUnderFireSidestep = () => false;
  e.cd = 100;
  e.specialCd = 100;
  e.noProgress = 0;
  let firstReset = -1;
  const original = g.disengage.bind(g);
  g.disengage = (...args) => { if (firstReset < 0) firstReset = g.s.time; return original(...args); };
  for (let i = 0; i < 140 && firstReset < 0; i++) {
    g.s.time += 0.1;
    g.updateEnemies(0.1);
  }
  assert(firstReset >= 41.9 && firstReset <= 42.3,
    'unmoving, nonattacking ordinary enemy resets after about 12 seconds');
  console.log('AUDIT blocked-chase reset at game second ' + firstReset.toFixed(1));
}
// Exceptional performance reset must share finishDisengage with normal return.
{
  const { g, e } = fixture();
  e.hp = e.maxHp - 100;
  e.pursuitBurst = 1.2;
  e.pursuitBurstUsed = true;
  e.pursuitBurstReadyAt = g.s.time + 3.2;
  assert(g.emergencyResetEncounter(), 'active engagement is reset nonlethally');
  assert.equal(e.aggro, false);
  assert.equal(e.hp, e.baseHp);
  assert.equal(e.pursuitBurstUsed, false);
  assert.equal(e.pursuitBurstReadyAt, undefined);
  assert.deepEqual({ x: e.x, y: e.y }, e.home);
  assert(g.s.recallActive, 'party withdrawal state is activated');
}

// PR #508-only differential: exercise an ACTUALLY ELIGIBLE Ringleader-owned
// melee summon, then show that the same close-range hit is refused beyond
// the damage leash while the owner-verified summon is still engaged.
{
  const { g, e, z, path } = fixture();
  const owner = g.makeEnemy({
    species: 'goblin', name: 'Ringleader legitimate summoner',
    form: 'ringleader', type: 'mob', level: 3, hp: 5000,
    damage: 1, gold: 0, xp: 0,
  }, { x: path.home.x + 15, y: path.home.y + 15 });
  owner.form = 'ringleader';
  z.enemies.push(owner);
  Object.assign(e, { summon: true, owner: owner.id,
    rogueEmergencyReinforcement: true, ranged: false });
  assert(g.meleePursuitBurstEligible(e),
    'PR #508 includes real Ringleader-owned melee reinforcement');
  put(g, e, path.near, path.farHero);
  assert(dist(g.hero, e) > g.enemyMeleeBasicRange(e));
  const before = g.s.time;
  g.s.time += 0.1;
  g.updateEnemies(0.1);
  assert(e.pursuitBurst > 0, 'eligible Ringleader summon starts native burst');
  assert(Math.abs(e.pursuitBurstReadyAt - (g.s.time + 3.2)) < 1e-7,
    'PR #508 uses owner-approved 2-second normal recovery');
  put(g, e, path.far, path.farHero);
  assert(g.tacticalRogueLeashAllows(e, g.hero, 900));
  assert(!g.damage(e, 13, 'hero'),
    'CONFIRMED PR508: rapidly pursuing Ringleader summon rejects nearby hero hit');
  owner.captain = true;
  assert(!g.meleePursuitBurstEligible(e),
    'captain-owned summons correctly excluded from enhanced cadence');
  owner.captain = false;
  owner.type = 'boss';
  assert(!g.meleePursuitBurstEligible(e),
    'boss-owned summons correctly excluded from enhanced cadence');
  console.log('AUDIT PR508 differential: eligible enhanced-speed Ringleader summon remains attacker-immune across 500-900 home band');
}
console.log('PASS issue #510 native encounter reset/damage compatibility characterization');

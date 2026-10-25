'use strict';
// Phase 2B: REAL dev.185 skill/projectile paths. Does not modify runtime.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const distances = [350, 400, 450, 480];
const modes = ['normal', 'nightmare'];
function arena(mode, cls, distance) {
  const g = new Campaign(mode, cls, () => 0.9);
  g.enter('vale');
  const z = g.zone();
  // Controlled clear range lane, but unmodified cast, flight, hit, enemy and
  // companion methods. The separate Phase 2A test retains real Vale terrain.
  z.props = [];
  z.buildings = [];
  z.enemies = [];
  g.zone = () => z;
  g.s.time = 30;
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  g.s.thornHeroInitiated = true;
  g.s.party = [];
  g.s.projectiles = [];
  Object.assign(g.hero, {
    x: 1400 + distance, y: 1700, level: 3,
    hp: 10000, maxHp: 10000, mp: 10000, maxMp: 10000,
    order: null, immune: 0,
  });
  g.hero.skills[0] = 1;
  g.hero.cd[0] = 0;
  g.hero.chargedCd[0] = 0;
  const e = g.makeEnemy({
    species: 'goblin', name: 'Skill 1 pressure probe', form: 'normal',
    level: 3, hp: 50000, damage: 1, gold: 0, xp: 0,
  }, { x: 1400, y: 1700 });
  Object.assign(e, { aggro: true, fightStart: 0, cd: 100, specialCd: 100 });
  z.enemies = [e];
  assert(g.line(g.hero, e), 'launch lane must be genuinely clear');
  return { g, e };
}
function flight(g, e, maxSeconds = 2) {
  const startHp = e.hp;
  let firstHit = null;
  for (let i = 1; i <= Math.ceil(maxSeconds / 0.05); i++) {
    g.s.time += 0.05;
    g.advanceHeroSkillEffects(0.05);
    g.updateProjectiles(0.05);
    if (firstHit === null && e.hp < startHp) firstHit = i * 0.05;
  }
  return { firstHit, hit: e.hp < startHp };
}
let cases = 0;
let legalCasts = 0;
let impossibleLaunches = 0;
for (const mode of modes) for (const cls of ['ranger', 'mage'])
  for (const charged of [false, true]) for (const d of distances) {
    const { g, e } = arena(mode, cls, d);
    const reach = g.heroSkillRange(1, charged);
    const expectedReach = cls === 'ranger' ? 450 : charged ? 440 : 400;
    assert.equal(reach, expectedReach,
      'inspect released dev.185 actual hero Skill 1 target reach');
    const legal = d <= reach;
    const hpBefore = e.hp;
    const accepted = g.cast(1, e.id, charged);
    const launches = g.s.projectiles.filter(p => p.source === 'hero' && p.slot === 1);
    const timed = g._heroSkillEffects?.filter(x => ['wide-beam', 'hawk'].includes(x.kind)) || [];
    if (!legal) {
      // A deliberate out-of-reach input may create a skill-approach order;
      // this is NOT a fired projectile. It must neither spend cooldown nor
      // produce an instant damaging attack from 480 units.
      assert.equal(launches.length, 0, cls + ' cannot shoot from ' + d);
      assert.equal(timed.length, 0, cls + ' cannot trigger remote effect from ' + d);
      assert.equal(e.hp, hpBefore, 'out-of-reach input cannot hit');
      assert.equal(g.hero.cd[0], 0, 'out-of-range tap leaves original cooldown ready');
      assert.equal(g.hero.chargedCd[0], 0, 'out-of-range charge leaves charged cooldown ready');
      impossibleLaunches++;
    } else {
      assert(accepted, cls + ' actual legal cast from ' + d);
      if (!charged && cls === 'ranger') assert.equal(launches.length, 3, 'three real Ranger tap arrows');
      if (!charged && cls === 'mage') {
        assert.equal(launches.length, 1, 'one actual normal Mage beam projectile');
        assert(launches[0].mageSkill1Homing && launches[0].travelBudget === 540,
          'released dev.185 Mage beam is genuinely finite/homing');
      }
      if (charged) {
        assert.equal(launches.length, 0, 'charged Skill 1 is its own timed effect, not a fake projectile');
        assert.equal(timed.length, 1, 'charged Mage corridor / Ranger hawk launches');
      }
      assert.equal(e.hp, hpBefore, 'launched shot does not instantly deal hit damage');
      const result = flight(g, e);
      assert(result.hit && result.firstHit > 0,
        cls + '/' + charged + '/' + d + ' projectile/effect must deliver contact');
      assert(g.tacticalThreatSnapshot(e).some(hit => hit.source === 'hero' && hit.damage > 0),
        'actual projectile/Skill 1 hit is recorded as real hero pressure');
      assert.equal(g.tacticalHighestThreatTarget(e, g.hero) === g.hero, d <= 408,
        'actual Ranger/Mage damage widens selection only up to the existing 408-unit Rogue move');
      legalCasts++;
    }
    console.log('ROGUE_REAL_HERO_SKILL ' + JSON.stringify({
      mode, cls, charged, distance: d, range: reach, legal,
      accepted, fired: launches.length, timedEffects: timed.length,
      hpAfter: Number(e.hp.toFixed(2)),
      activePressure: g.tacticalActiveTargetCount(e),
      selected: g.tacticalHighestThreatTarget(e, g.hero) === g.hero,
      approach: g.hero.order?.type === 'skill-approach',
    }));
    cases++;
  }
// Archer uses a genuine native projectile, not seeded damage. At distances
// 350–480 it must first approach: the basic archer attack is NOT a 480-unit
// hitscan skill. The combat movement and firing method is called without
// replacing movement, routing, damage or projectile collision.
let archerHits = 0;
for (const mode of modes) for (const d of distances) {
  const { g, e } = arena(mode, 'ranger', d);
  const u = g.unit('archer', 1400 + d, 1700);
  Object.assign(u, { hp: 10000, maxHp: 10000, cd: 0, order: null });
  g.s.party = [u];
  g._tacticalPartyTargets = new Map();
  g.hero.x = u.x + 35;
  assert(!g.companionCoverAttack(u, e, true),
    'Archer basic cannot instantly fire at ' + d + ' units');
  let firstShot = null, flightHit = false, moved = false;
  const originalX = u.x;
  for (let i = 0; i < 65; i++) {
    g.s.time += 0.1;
    g.companionFight(u, e, [g.hero, u], 0.1);
    if (u.x !== originalX) moved = true;
    if (firstShot === null) {
      const arrow = g.s.projectiles.find(p => p.source === u.id && p.style === 'arrow');
      if (arrow) firstShot = Math.hypot(u.x - e.x, u.y - e.y);
    }
    const hpBefore = e.hp;
    g.updateProjectiles(0.1);
    if (e.hp < hpBefore) flightHit = true;
    if (flightHit) break;
  }
  assert(moved, 'Archer approaches from each long-range origin');
  // A direct companionFight call holds the wider squad/update controller
  // constant, so no shot within 6.5s is an observation, NOT a proven bug.
  // Do not silently count a distant target as having been hit.
  if (flightHit) {
    assert(g.tacticalThreatSnapshot(e).some(x => x.source === u.id && x.damage > 0),
      'any actual Archer hit is credited to its source');
    archerHits++;
  }
  console.log('ROGUE_REAL_ARCHER_APPROACH ' + JSON.stringify({
    mode, distance: d, firstShotDistance: firstShot === null ? null : Number(firstShot.toFixed(2)),
    hit: flightHit, moved: Number(Math.hypot(u.x - (1400 + d), u.y - 1700).toFixed(2)),
    finalDistance: Number(Math.hypot(u.x - e.x, u.y - e.y).toFixed(2)),
    selected: g.tacticalHighestThreatTarget(e, u) === u,
    pressure: g.tacticalActiveTargetCount(e),
  }));
}
// Positive-control actual Archer basic shot: spawn inside the established
// covering-fire distance and let the original engine launch and resolve it.
let realArcherShots = 0;
for (const mode of modes) {
  const { g, e } = arena(mode, 'ranger', 175);
  const u = g.unit('archer', e.x + 175, e.y);
  Object.assign(u, { cd: 0, hp: 10000, maxHp: 10000, order: null });
  g.s.party = [u];
  assert(g.companionCoverAttack(u, e, true),
    'real Archer covering basic launches from its valid reach');
  const shot = g.s.projectiles.find(p => p.source === u.id && p.style === 'arrow');
  assert(shot && shot.speed === 450, 'launched arrow retains authored flight speed');
  const before = e.hp;
  for (let i = 0; i < 12 && e.hp === before; i++) {
    g.s.time += 0.05;
    g.updateProjectiles(0.05);
  }
  assert(e.hp < before, 'actual Archer arrow delivers damage only after travel');
  assert(g.tacticalThreatSnapshot(e).some(hit => hit.source === u.id && hit.damage > 0),
    'native damage resolver credits the Archer threat');
  realArcherShots++;
  console.log('ROGUE_REAL_ARCHER_ARROW ' + JSON.stringify({
    mode, originDistance: 175, hit: true,
    impactSelected: g.tacticalHighestThreatTarget(e, u) === u,
    impactPressure: g.tacticalActiveTargetCount(e),
  }));
}
assert.equal(cases, 32);
assert.equal(realArcherShots, 2);
assert(legalCasts > 0 && impossibleLaunches > 0);
console.log('PASS 32 real Ranger/Mage Skill 1 paths, 8 ranged Archer approaches, 2 actual Archer arrows (dev.185)');

'use strict';
// Read-only Rogue range-pressure diagnostics for published dev.184.
// Deliberately separate target selection, nominal move reach, and eligibility.
// A ledger-seeded hit is NOT a simulation of a launched Ranger/Mage/Archer shot.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');

const distances = [350, 400, 450, 480, 520, 560];
const attackers = ['ranger', 'mage', 'archer'];
const roles = [
  { name: 'ordinary', selection: 360, initiation: 408 },
  { name: 'guardian', selection: 360, initiation: 408 },
  { name: 'ringleader', selection: 360, initiation: 408 },
  { name: 'captain', selection: 360, initiation: 528 },
  { name: 'boss', selection: 500, initiation: 600 },
];
const cfg = Campaign.rules.tacticalFoundation;
const reachScale = Campaign.rules.balance.enemySpecialReachMultiplier;
assert.equal(reachScale, 1.2, 'documented current special reach scaling');
assert.equal(cfg.moveCooldownSeconds, 2, 'released two-second Rogue cadence is preserved');
assert.equal(cfg.simultaneousPressureSources, 2, 'two active attackers remain normal pressure threshold');

function setup(role, attacker, distance) {
  const c = new Campaign('normal', attacker === 'mage' ? 'mage' : 'ranger', () => 0.9);
  c.enter('vale');
  const z = c.zone();
  z.props = [];
  z.enemies = [];
  // Reuse native actor and tactical methods but hold authored migrations and
  // terrain apart from the numerical-gate experiment. Geometry gets a
  // separate acceptance run, so a clean sightline here is intentional.
  c.zone = () => z;
  c.line = () => true;
  c.enemyRangedLine = () => true;
  c.s.valeFieldAwakened = true;
  c.s.thornHeroInitiated = true;
  c.s.mercyTime = 0;
  c.s.time = 30;
  c.s.party = [];
  const e = c.makeEnemy(
    { species: 'goblin', name: 'range audit ' + role.name, level: 3,
      hp: 1000, damage: 10, gold: 0, xp: 0 },
    { x: 1400, y: 1700 },
  );
  if (role.name === 'guardian') e.guard = true;
  if (role.name === 'ringleader') e.form = 'ringleader';
  if (role.name === 'captain') {
    e.captain = true;
    e.captainProfile = 'supply-vale';
  }
  if (role.name === 'boss') {
    e.type = 'boss';
    e.family = 'ridge';
  }
  Object.assign(e, {
    aggro: true, fightStart: 0, summonCd: 0, cd: 100, specialCd: 100,
  });
  z.enemies = [e];
  Object.assign(c.hero, {
    x: e.x + distance, y: e.y, level: e.level,
    hp: 10000, maxHp: 10000, order: null,
  });
  let target = c.hero;
  let source = 'hero';
  if (attacker === 'archer') {
    target = c.unit('archer', e.x + distance, e.y);
    Object.assign(target, { hp: 10000, maxHp: 10000, order: null });
    c.s.party = [target];
    c.hero.x = target.x + 190; // Hero cannot masquerade as the Archer threat.
    c._tacticalPartyTargets = new Map([[target.id, e.id]]);
    source = target.id;
  } else {
    c.hero.order = { type: 'attack', id: e.id };
  }
  // This is the source's real tactical threat-recording method. We are
  // inspecting what the subsequent selection/eligibility gates do with it;
  // no projectile, hit chance, damage or opponent movement is fabricated.
  c.tacticalRecordHit(e, source, 12);
  return { c, e, target, source };
}

let evaluated = 0;
let selectionGapCells = 0;
for (const role of roles) {
  for (const attacker of attackers) {
    const results = [];
    for (const distance of distances) {
      const { c, e, target, source } = setup(role, attacker, distance);
      assert.deepEqual(c.tacticalThreatSnapshot(e).map((record) => record.source), [source],
        role.name + '/' + attacker + '/' + distance + ': recent hostile hit is recorded');
      const pressure = c.tacticalActiveTargetCount(e);
      const healthySolo = c.tacticalRogueEligibility(e, pressure);
      if (distance <= 480) {
        assert.equal(pressure, 1, 'active single-attacker pressure recorded');
        assert.equal(healthySolo, false,
          role.name + '/' + attacker + '/' + distance +
          ': equal-level healthy single attacker does not automatically authorize Rogue');
      }
      e.hp = e.maxHp * 0.49;
      const woundedSolo = c.tacticalRogueEligibility(e, pressure);
      if (distance <= 480 && ['ordinary', 'guardian', 'ringleader'].includes(role.name))
        assert(woundedSolo, role.name + ': a genuinely wounded mob can reconsider retreat');
      c.hero.level = e.level + 1;
      const levelAdvantage = c.tacticalRogueEligibility(e, pressure);
      if (distance <= 480)
        assert(levelAdvantage, 'eligible under level disadvantage independent of cast reach');
      const selected = c.tacticalHighestThreatTarget(e, target) === target;
      const expectedSelected = distance <= role.selection;
      assert.equal(selected, expectedSelected,
        role.name + '/' + attacker + '/' + distance + ': current target-selection gate');
      const nominallyLegal = distance <= role.initiation;
      const started = c.tacticalRogueMove(e, target);
      assert.equal(started, expectedSelected && nominallyLegal,
        role.name + '/' + attacker + '/' + distance + ': composed move gate');
      if (started) {
        assert(e.telegraph?.rogueMove, 'successful tactical cast has its real warning');
        assert.equal(c._tacticalRogueLastCast.get(e.id), c.s.time,
          'released two-second cast timestamp is retained');
      }
      if (!selected && nominallyLegal) selectionGapCells++;
      results.push({
        d: distance, pressure, healthySolo, woundedSolo, levelAdvantage,
        selected, nominallyLegal, started,
      });
      evaluated++;
    }
    console.log('ROGUE_RANGE_MATRIX ' + JSON.stringify({
      role: role.name, attacker, results,
    }));
  }
}
assert.equal(evaluated, roles.length * attackers.length * distances.length);
assert(selectionGapCells > 0, 'detect at least one target-selection/nominal-initiation mismatch');
console.log('PASS read-only Rogue range matrix: ' + evaluated +
  ' cells; ' + selectionGapCells +
  ' nominally legal casts blocked upstream; no AI range or balance changes');

// The group-pressure gate is separate from distance. Seed an active Archer
// and Ranger against the same equal-level healthy mob without altering health.
// This is an intentionally controlled tactical-source test, not player input.
for (const distance of [350, 400, 450, 480]) {
  const { c, e } = setup(roles[0], 'ranger', distance);
  const archer = c.unit('archer', e.x + distance - 12, e.y + 15);
  Object.assign(archer, { hp: 10000, maxHp: 10000, order: null });
  c.s.party = [archer];
  c._tacticalPartyTargets = new Map([[archer.id, e.id]]);
  assert.equal(c.tacticalActiveTargetCount(e), 2,
    'two deliberate attackers at ' + distance + ' create pressure');
  assert(c.tacticalRogueEligibility(e, c.tacticalActiveTargetCount(e)),
    'healthy equal-level ordinary target becomes Rogue-eligible with two active attackers');
  const chosen = c.tacticalHighestThreatTarget(e, c.hero);
  assert.equal(chosen === c.hero, distance <= 360,
    'two pressure sources do not remove the original distance gate');
}
console.log('PASS active two-source pressure is eligible but does not extend threat selection');

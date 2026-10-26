'use strict';
// Stage 2: six Soldier/Archer combat actions, using genuine Campaign owners.
// No production installation, pets, Ranger heal/mana, or reactive Soldier Guard.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const Native = require('../src/prototype/critical-party-native.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

function arena(type, extra = false) {
  const g = new Campaign('normal', 'paladin', () => 0.9);
  completeFieldOpening(g);
  g.s.mercyTime = 0;
  g.zone().props = [];
  g.zone().buildings = [];
  g.zone().npcs = [];
  Object.assign(g.hero, { x: 500, y: 500, order: null });
  g.hero.skills[1] = 1;
  g.s.companionCombatTraining = 2;
  const unit = g.unit(type, 520, 500);
  g.s.party = [unit];
  const target = g.makeEnemy(
    { species: 'goblin', name: 'Native troop target', level: 1,
      hp: 100000, damage: 0, xp: 0, gold: 0 },
    { x: type === 'soldier' ? 585 : 680, y: 500 },
  );
  const enemies = [target];
  if (extra) {
    enemies.push(g.makeEnemy(
      { species: 'goblin', name: 'Area companion', level: 1,
        hp: 100000, damage: 0, xp: 0, gold: 0 },
      { x: target.x + 15, y: 500 },
    ));
  }
  g.zone().enemies = enemies;
  g.engage(target);
  return { g, unit, target, enemies };
}
function critical(g, sample = 0, level = 1) {
  let samples = 0;
  const session = Native.createSession(Critical, Levels, {
    enabled: true,
    stream: { next() { samples++; return sample; } },
  });
  session.setCriticalLevel('companion', level);
  g._criticalPartyNative = session;
  return { count: () => samples, session };
}
const damageMultiplier = Levels.LEVERS.damage.values[0];
let releases = 0;
for (const type of ['soldier', 'archer']) {
  assert.equal(Levels.ACTIONS['troop/' + type + '/basic'].lever, 'damage');
  assert.equal(Levels.ACTIONS['troop/' + type + '/first'].lever, 'damage');
  assert.equal(Levels.ACTIONS['troop/' + type + '/second'].lever, 'damage');

  // A defensive basic is the same native attack as an ordinary basic.
  const a = arena(type), b = arena(type);
  const tally = critical(b.g);
  const first = a.g.companionCoverAttack(a.unit, a.target, true);
  const second = b.g.companionCoverAttack(b.unit, b.target, true);
  assert.equal(second, first, type + ' same legal defensive basic outcome');
  assert.equal(tally.count(), 1, type + ' defensive basic rolls once at release');
  assert.equal(a.unit.cd, b.unit.cd, type + ' original basic cooldown');
  if (type === 'soldier') {
    assert(b.target.hp < a.target.hp, 'Soldier basic improves existing contact damage');
  } else {
    assert.equal(a.g.s.projectiles.length, 1);
    assert.equal(b.g.s.projectiles.length, 1);
    const base = a.g.s.projectiles[0], shot = b.g.s.projectiles[0];
    assert.equal(shot.criticalExecution.key, 'troop/archer/basic');
    assert(Object.isFrozen(shot.criticalExecution));
    assert(Math.abs(shot.damage - base.damage * damageMultiplier) < 1e-7);
  }
  releases++;

  // First skills preserve the Soldier ward condition and Archer three-arrow cap.
  const ordinary = arena(type), enhanced = arena(type);
  const firstSkill = critical(enhanced.g);
  assert(ordinary.g.companionUseFirstSkill(ordinary.unit, ordinary.target));
  assert(enhanced.g.companionUseFirstSkill(enhanced.unit, enhanced.target));
  assert.equal(firstSkill.count(), 1, type + ' first skill rolls once');
  assert.equal(ordinary.unit.skill1Cd, enhanced.unit.skill1Cd);
  assert.equal(ordinary.unit.skillGlobalCd, enhanced.unit.skillGlobalCd);
  if (type === 'soldier') {
    assert(enhanced.target.hp < ordinary.target.hp, 'Power Strike damage improves');
    assert.equal(ordinary.unit.wardReduction || 0, enhanced.unit.wardReduction || 0,
      'critical cannot invent or amplify a locked veteran ward');
  } else {
    assert.equal(ordinary.g.s.projectiles.length, 3);
    assert.equal(enhanced.g.s.projectiles.length, 3, 'Triple Shot has no fourth arrow');
    const burst = enhanced.g.s.projectiles, receipt = burst[0].criticalExecution;
    assert.equal(receipt.key, 'troop/archer/first');
    assert.equal(receipt.source, enhanced.unit.id);
    assert(Object.isFrozen(receipt));
    burst.forEach((shot, index) => {
      assert.strictEqual(shot.criticalExecution, receipt, 'all arrows share one action');
      assert(Math.abs(shot.damage - ordinary.g.s.projectiles[index].damage * damageMultiplier) < 1e-7);
      assert.equal(shot.slow || 0, ordinary.g.s.projectiles[index].slow || 0,
        'existing conditional veteran slow remains unchanged');
    });
    assert.equal(firstSkill.count(), 1, 'staggered arrow child cannot reroll');
  }
  releases++;

  // Charged second skill: windup is not a critical roll; after 0.65s each
  // admitted target inherits one already-selected bonus, not separate rolls.
  const baseArea = arena(type, true), critArea = arena(type, true);
  const charge = critical(critArea.g);
  const hpA = baseArea.enemies.map(e => e.hp);
  const hpB = critArea.enemies.map(e => e.hp);
  assert(baseArea.g.companionUseSecondSkill(baseArea.unit, baseArea.target));
  assert(critArea.g.companionUseSecondSkill(critArea.unit, critArea.target));
  assert.equal(charge.count(), 0, type + ' hold consumes zero RNG');
  assert.deepEqual(critArea.enemies.map(e => e.hp), hpB, 'windup deals no early damage');
  baseArea.g.advancePartyChargeClock(0.65);
  critArea.g.advancePartyChargeClock(0.65);
  baseArea.g.resolveCompanionCharges();
  critArea.g.resolveCompanionCharges();
  assert.equal(charge.count(), 1, type + ' actual post-hold release rolls once');
  assert.equal(baseArea.unit.skill2Cd, critArea.unit.skill2Cd);
  assert(baseArea.unit.skill2Cd > 0, 'charged cooldown starts only after release');
  if (type === 'archer') {
    assert.deepEqual(baseArea.enemies.map(e => e.hp), hpA,
      'Archer Piercing Volley cannot deal phantom release-time damage');
    assert.deepEqual(critArea.enemies.map(e => e.hp), hpB,
      'critical Archer Piercing Volley cannot deal phantom release-time damage');
    const baseline = baseArea.g.s.projectiles, arrows = critArea.g.s.projectiles;
    assert.equal(arrows.length, baseline.length, 'critical adds no arrows');
    assert(arrows.length > 0, 'Piercing Volley admitted real physical shafts');
    const receipt = arrows[0].criticalExecution;
    assert.equal(receipt.key, 'troop/archer/second');
    assert(Object.isFrozen(receipt));
    arrows.forEach((shot, i) => {
      assert.strictEqual(shot.criticalExecution, receipt, 'one cast receipt for all arrows');
      assert(Math.abs(shot.damage - baseline[i].damage * damageMultiplier) < 1e-7);
      assert.equal(shot.companionSkill, 'piercing-volley');
    });
    for (let i = 0; i < 20 && (baseline.length || arrows.length); i++) {
      baseArea.g.updateProjectiles(0.1);
      critArea.g.updateProjectiles(0.1);
    }
    assert.equal(charge.count(), 1, 'Archer physical impacts do not reroll');
  }
  const baseLosses = baseArea.enemies.map((e, i) => hpA[i] - e.hp);
  const criticalLosses = critArea.enemies.map((e, i) => hpB[i] - e.hp);
  assert(baseLosses.some(v => v > 0), 'native second skill must hit a legal target');
  assert(criticalLosses.every((v, i) => v >= baseLosses[i]),
    'critical cannot weaken native Area release');
  assert(criticalLosses.some((v, i) => v > baseLosses[i]),
    'native second skill improves at least one legal target');
  releases++;

  // A canceled charge, unavailable target or blocked first skill is NOT a release.
  const cancelled = arena(type), blocked = arena(type);
  const cancelRoll = critical(cancelled.g), blockRoll = critical(blocked.g);
  assert(cancelled.g.companionUseSecondSkill(cancelled.unit, cancelled.target));
  assert.equal(cancelRoll.count(), 0);
  cancelled.g.zone().enemies = [];
  cancelled.g.advancePartyChargeClock(0.65);
  cancelled.g.resolveCompanionCharges();
  assert.equal(cancelRoll.count(), 0, 'lost target never rolls');
  assert.equal(cancelled.unit.skill2Cd || 0, 0, 'cancel does not charge cooldown');
  blocked.unit.skill1Cd = 100;
  assert.equal(blocked.g.companionUseFirstSkill(blocked.unit, blocked.target), false);
  assert.equal(blockRoll.count(), 0, 'unavailable first does not roll');

  // Near-miss critical release and OFF release both leave original timing intact.
  const normal = arena(type), miss = critical(normal.g, 0.99);
  const noExtra = normal.g.companionCoverAttack(normal.unit, normal.target, true);
  assert(noExtra);
  assert.equal(miss.count(), 1);
  const result = normal.g.s.projectiles[0];
  if (type === 'archer') {
    assert.equal(result.criticalExecution.critical, false);
    assert.equal(result.damage, a.g.s.projectiles[0].damage);
  }
}
// Non-special basics have multiple genuine release owners. Check ordinary
// combat and gathering self-defense explicitly, not only covering fire.
for (const type of ['soldier', 'archer']) {
  for (const owner of ['combat', 'gathering']) {
    const baseline = arena(type), enhanced = arena(type);
    const counter = critical(enhanced.g);
    const prepare = ({g, unit, target}) => {
      unit.cd = 0;
      if (owner === 'combat') {
        unit.skillGlobalCd = 9; // Ordinary attack, not a ready first special.
        g._tacticalPartyTargets = new Map();
        if (type === 'archer') {
          unit.x = 450;
          g.partyFollowPoint = () => ({ x: unit.x, y: unit.y });
        }
      } else {
        // Only the gather-intent predicate is fixture-supplied. Native attack,
        // counterattack receipt storage and range/damage owners are unmodified.
        g.gatheringUnit = () => true;
        g.noteGatheringAttack(unit, target);
      }
    };
    prepare(baseline);
    prepare(enhanced);
    if (owner === 'combat') {
      baseline.g.companionFight(baseline.unit, baseline.target, [baseline.unit], 0.05);
      enhanced.g.companionFight(enhanced.unit, enhanced.target, [enhanced.unit], 0.05);
    } else {
      baseline.g.gatheringCounterattack(baseline.unit);
      enhanced.g.gatheringCounterattack(enhanced.unit);
    }
    assert.equal(counter.count(), 1, type + ' ' + owner + ' rolls at genuine basic release');
    assert.equal(baseline.unit.cd, enhanced.unit.cd, 'original attack clock retained');
    if (type === 'soldier') {
      assert(enhanced.target.hp < baseline.target.hp,
        'native Soldier ' + owner + ' improves the original sword hit');
    } else {
      assert.equal(baseline.g.s.projectiles.length, 1, owner + ' ordinary arrow exists');
      assert.equal(enhanced.g.s.projectiles.length, 1, owner + ' has no extra arrow');
      const shot = enhanced.g.s.projectiles[0];
      assert.equal(shot.criticalExecution.key, 'troop/archer/basic');
      assert(Math.abs(shot.damage -
        baseline.g.s.projectiles[0].damage * damageMultiplier) < 1e-7,
      'native Archer ' + owner + ' improves original arrow');
    }
  }
}
assert.equal(releases, 6);
assert.equal(Campaign.prototype._criticalPartyNative, undefined,
  'native criticals remain test-attached, never installed in production');
console.log('PASS 6 native Soldier/Archer combat families, charged cancellation, one roll per volley/area, cooldown parity, ordinary OFF');

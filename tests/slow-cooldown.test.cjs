'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const R = Campaign.rules;
const Persistence = require('../src/prototype/persistence');
const closeBound = (value, expected, label) =>
  assert(Math.abs(value - expected) < 1e-8, label + ': expected ' + expected + ', got ' + value);
for (const mode of ['normal', 'nightmare']) {
  const game = new Campaign(mode, 'mage', () => 0.9);
  game.hero.cd[7] = 40;
  for (let hit = 0; hit < 20; hit++)
    assert(game.applyRogueSlow(game.hero, R.tacticalFoundation.eliteRogueSlowSeconds));
  const expectedDebt = R.cooldownBalance.slowMaxStacks *
    (R.tacticalFoundation.eliteRogueSlowSeconds + R.cooldownBalance.slowDurationBonusSeconds) *
    R.cooldownBalance.slowDebtFraction;
  closeBound(game.hero.cd[7], 40 + expectedDebt, 'Rogue debt stops at the finite stack ceiling');
  assert.equal(game.hero.slowStacks, R.cooldownBalance.slowMaxStacks);
  const values = new Map(),
    p = Persistence.create({
      Campaign,
      storage: {
        getItem: (k) => values.get(k),
        setItem: (k, v) => values.set(k, v),
      },
    });
  assert(p.save(game, {}));
  const restored = p.load(mode);
  assert(restored, 'A successful debt-bearing save loads in ' + mode);
  assert.equal(restored.hero.cd[7], game.hero.cd[7], 'Do not cap or erase authorized debt');
  for (const value of [60, 60.001, 500, 1e9]) {
    const snapshot = game.snapshot();
    snapshot.hero.cd[7] = value;
    assert.equal(Campaign.restore(snapshot).hero.cd[7], value);
  }
  for (const value of [-1, Infinity, NaN, 1e9 + 1]) {
    const snapshot = game.snapshot();
    snapshot.hero.cd[7] = value;
    assert.throws(() => Campaign.restore(snapshot), /Invalid cooldown/);
  }
}
assert.equal(R.cooldownBalance.slowRecoveryMultiplier, 0.65);
assert.equal(R.cooldownBalance.enemySlowRecoveryMultiplier, 0.85);
const close = (value, expected, label) =>
  assert(Math.abs(value - expected) < 1e-8, label + ': expected ' + expected + ', got ' + value);

{
  const g = new Campaign('normal', 'paladin', () => 0.9);
  const hero = g.hero;
  hero.slow = 2;
  close(g.cooldownRecoveryElapsed(hero, 1), 0.65, 'full second under Slow');
  hero.slow = 0.25;
  close(g.cooldownRecoveryElapsed(hero, 1), 0.9125, 'partial second at expiry');
  hero.slow = 0;
  close(g.cooldownRecoveryElapsed(hero, 1), 1, 'normal recovery after expiry');
  hero.slow = 3;
  close(
    g.cooldownRecoveryElapsed(hero, 0.1) * 10,
    g.cooldownRecoveryElapsed(hero, 1),
    'fractional cooldown recovery is frame-rate stable',
  );
  hero.slow = 0;
  hero.immune = 3;
  assert.equal(g.applySlow(hero, 4), false, 'immunity prevents Slow and cooldown penalty');
  close(g.cooldownRecoveryElapsed(hero, 1), 1, 'immunity keeps normal cooldown recovery');
}
for (const cls of ['paladin', 'mage', 'ranger']) {
  const g = new Campaign('normal', cls, () => 0.9);
  g.zone().enemies = [];
  g.s.party = [];
  g.hero.cd = Array(8).fill(3);
  g.hero.slow = 0.05;
  g.updateParty = () => {};
  g.updateEnemies = () => {};
  g.tick(0.1);
  close(g.hero.cd[0], 3 - 0.0825, cls + ' active cooldown only pays for Slow overlap');
  close(g.hero.cd[7], 3 - 0.0825, cls + ' all skills share cooldown Slow');
  close(g.hero.slow, 0, cls + ' Slow duration still expires normally');
  g.tick(0.1);
  close(g.hero.cd[0], 3 - 0.1825, cls + ' ordinary recovery resumes immediately');
}
{
  const g = new Campaign('normal', 'ranger', () => 0.9);
  g.zone().enemies = [];
  const ally = g.unit('soldier', g.hero.x, g.hero.y);
  Object.assign(ally, {
    active: true,
    slow: 3,
    cd: 4,
    skill1Cd: 5,
    skill2Cd: 6,
    skillGlobalCd: 2,
    healCd: 10,
    manaCd: 10,
    survivalCd: 10,
  });
  g.s.party = [ally];
  g.updateEnemies = () => {};
  g.updateProjectiles = () => {};
  g.tick(0.1);
  for (const [key, start] of [
    ['cd', 4],
    ['skill1Cd', 5],
    ['skill2Cd', 6],
    ['skillGlobalCd', 2],
    ['healCd', 10],
    ['manaCd', 10],
    ['survivalCd', 10],
  ]) {
    close(ally[key], start - 0.065, 'slowed companion ' + key);
  }
}
{
  const g = new Campaign('normal', 'mage', () => 0.9);
  const e = g.makeEnemy(
    { species: 'goblin', name: 'Slow test foe', level: 1, hp: 1000, damage: 0, gold: 0, xp: 0 },
    { x: 2100, y: 2100 },
  );
  g.zone().enemies = [e];
  Object.assign(e, { slow: 3, cd: 5, specialCd: 6, summonCd: 7, healCd: 8 });
  g._tacticalRogueNext = new Map([[e.id, g.s.time + 10]]);
  const before = g._tacticalRogueNext.get(e.id);
  g.s.time += 0.1;
  g.updateEnemies(0.1);
  for (const [key, start] of [
    ['cd', 5],
    ['specialCd', 6],
    ['summonCd', 7],
    ['healCd', 8],
  ]) {
    close(e[key], start - 0.085, 'slowed monster ' + key);
  }
  close(g._tacticalRogueNext.get(e.id), before + 0.015, 'pending monster rogue cadence slows');
  // Old logic skipped Slow whenever a deadline crossed this particular tick.
  // A nearly-ready ability must remain unavailable if Slow still owes time.
  e.slow = 3;
  g._tacticalRogueNext.set(e.id, g.s.time + 0.09);
  e.royalPrerogativeReadyAt = g.s.time + 0.09;
  g.s.time += 0.1;
  g.updateEnemies(0.1);
  assert(g._tacticalRogueNext.get(e.id) > g.s.time, 'Rogue readiness does not skip a slow frame');
  assert(e.royalPrerogativeReadyAt > g.s.time, 'Royal interception does not skip a slow frame');
  const future = g._tacticalRogueNext.get(e.id);
  e.slow = 0;
  g.s.time += 0.1;
  g.updateEnemies(0.1);
  close(g._tacticalRogueNext.get(e.id), future, 'finished Slow adds no further rogue debt');
}
{
  const g = new Campaign('normal', 'mage', () => 0.9);
  g.hero.slow = 2.5;
  g.hero.cd[1] = 4;
  const restored = Campaign.restore(g.snapshot(), () => 0.9);
  close(restored.hero.slow, 2.5, 'legacy slow duration survives save/load');
  close(restored.hero.cd[1], 4, 'no new save field is required for cooldown Slow');
}
{
  const g = new Campaign('normal', 'mage', () => 0.9);
  const foe = g.makeEnemy(
    { species: 'goblin', name: 'New-cast target', level: 1, hp: 100000, damage: 0, gold: 0, xp: 0 },
    { x: 570, y: 500 },
  );
  g.zone().enemies = [foe];
  g.zone().props = [];
  g.line = () => true;
  Object.assign(g.hero, { x: 500, y: 500, slow: 2, immune: 0 });
  g.hero.cd = Array(8).fill(0);
  assert(g.cast(1, foe.id), 'new skill can be cast while already slowed');
  const freshlyStarted = g.hero.cd[0];
  assert(freshlyStarted > 0, 'freshly cast ability begins its normal cooldown');
  g.updateEnemies = () => {};
  g.updateParty = () => {};
  g.tick(0.1);
  close(g.hero.cd[0], freshlyStarted - 0.065, 'newly cast ability also recovers slowly');
}
console.log(
  'PASS Slow reduces remaining skill recovery on heroes, companions, enemy and rogue cooldowns; immunity, expiry and save contract',
);

// Combined #306/#307 cooldowns use the same pre-expiry Slow sample exactly once.
{
  const g = new Campaign('normal', 'mage', () => 0.9);
  const e = g.makeEnemy(
    {
      species: 'goblin',
      name: 'Combined cooldown probe',
      level: 1,
      hp: 1000,
      damage: 0,
      xp: 0,
      gold: 0,
    },
    { x: 2100, y: 2100 },
  );
  g.zone().enemies = [e];
  Object.assign(e, { slow: 0.05, cd: 100, specialCd: 100, supportHealCd: 10 });
  const readyKeys = [
    'royalPrerogativeReadyAt',
    'passiveRepairReadyAt',
    'passiveVeteranReadyAt',
    'ledgerNextAt',
    'ashNextAt',
  ];
  for (const key of readyKeys) e[key] = g.s.time + 0.095;
  g._tacticalRogueNext = new Map([[e.id, g.s.time + 0.095]]);
  g.s.time += 0.1;
  g.updateEnemies(0.1);
  close(e.supportHealCd, 10 - 0.0925, 'support healing uses partial Slow overlap once');
  for (const key of readyKeys)
    close(e[key], g.s.time + 0.0025, key + ' keeps its final-frame debt');
  close(
    g._tacticalRogueNext.get(e.id),
    g.s.time + 0.0025,
    'Rogue partial expiry is not consumed twice',
  );
  assert.equal(e.slow, 0);
}
{
  const g = new Campaign('normal', 'paladin', () => 0.9);
  let now = 0;
  g.setPartyChargeClock(() => now);
  g.hero.slow = 5;
  assert(g.beginPartyCharge(g.hero, 2));
  now = 0.65;
  assert.equal(g.partyChargeProgress(g.hero), 1, 'Slow never extends fixed preparation');
  assert(
    !g.recordPartyChargeDamage(g.hero, 100),
    'post-deadline damage is distinct from cooldown Slow',
  );
}
console.log(
  'Deferred combined cases: support healing, new passive cooldowns, partial expiry and fixed preparation',
);

{
  const g = new Campaign('normal', 'paladin', () => 0.9);
  let now = 0;
  g.setPartyChargeClock(() => now);
  Object.assign(g.hero, { x: 500, y: 500 });
  g.hero.skills[1] = 1;
  g.s.companionCombatTraining = 2;
  g.line = () => true;
  const u = g.unit('soldier', 520, 500);
  u.slow = 3;
  g.s.party = [u];
  const foe = g.makeEnemy(
    {
      species: 'goblin',
      name: 'Fresh charged target',
      level: 1,
      hp: 10000,
      damage: 0,
      gold: 0,
      xp: 0,
    },
    { x: 585, y: 500 },
  );
  g.zone().enemies = [foe];
  // Fresh Vale foes await a hero-initiated opening; that is unrelated to Slow.
  g.admitOpeningHeroAttack(foe);
  g.engage(foe);
  assert(g.companionUseSecondSkill(u, foe), 'already slowed companion begins its real preparation');
  now = 0.65;
  g.resolveCompanionCharges();
  close(
    u.skill2Cd,
    Campaign.rules.companionSkills.second.cooldown,
    'release starts the normal full cooldown',
  );
  g.updateParty(0.1);
  close(
    u.skill2Cd,
    Campaign.rules.companionSkills.second.cooldown - 0.065,
    'new charged cooldown is impaired even though Slow preceded activation',
  );
}

// Stacking is one scalar per target, with impact-time debt and no per-stack timers.
{
  const g = new Campaign('normal', 'paladin', () => 0.9);
  g.zone().enemies = [];
  g.s.party = [];
  const h = g.hero;
  h.cd = Array(8).fill(10);
  h.cd[7] = 0;
  const bonus = R.cooldownBalance.slowDurationBonusSeconds;
  close(bonus, 0.25, 'all Slow applications gain one quarter second');
  assert(g.applySlow(h, 2));
  close(h.slow, 2.25, 'ordinary Slow receives duration bonus');
  assert.equal(h.slowStacks, 1);
  close(h.cd[0], 10 + 2.25 * 0.35, 'first hit adds lasting ally cooldown debt');
  close(h.cd[7], 0, 'Slow does not restart a ready skill');
  assert(g.applySlow(h, 2));
  assert.equal(h.slowStacks, 2, 'repeat hit strengthens Slow');
  close(h.cd[0], 10 + 2 * 2.25 * 0.35, 'each successful hit adds debt once');
  close(g.cooldownRecoveryElapsed(h, 1), 0.65 / 1.35, 'second stack has diminishing recovery');
  const restored = Campaign.restore(g.snapshot(), () => 0.9);
  assert.equal(restored.hero.slowStacks, 2, 'save/load retains shared stack strength');
  close(restored.hero.cd[0], h.cd[0], 'save/load retains accumulated cooldown debt');
  g.updateEnemies = () => {};
  g.updateParty = () => {};
  h.slow = 0.05;
  g.tick(0.1);
  assert.equal(h.slow, 0, 'Slow expiry remains real-time');
  assert.equal(h.slowStacks, undefined, 'expiry clears stack strength');
  assert(h.cd[0] > 10, 'previously earned debt remains after Slow expires');
  assert(g.applySlow(h, 2));
  assert.equal(h.slowStacks, 1, 'a fresh Slow starts a fresh stack window');
}
{
  const g = new Campaign('normal', 'ranger', () => 0.9);
  const u = g.unit('soldier', g.hero.x, g.hero.y);
  g.s.party = [u];
  Object.assign(u, { cd: 0, skill1Cd: 4, skill2Cd: 8, healCd: 6, survivalCd: 5 });
  assert(g.applySlow(u, 2));
  close(u.skill1Cd, 4 + 2.25 * 0.35, 'companion first skill pays cooldown debt');
  close(u.skill2Cd, 8 + 2.25 * 0.35, 'companion charged skill pays cooldown debt');
  close(u.healCd, 6 + 2.25 * 0.35, 'companion healing pays cooldown debt');
  close(u.survivalCd, 5 + 2.25 * 0.35, 'companion survival pays cooldown debt');
  close(u.cd, 0, 'a ready companion attack remains ready');
  assert(g.applyRogueSlow(u, 2));
  close(u.rogueSlow, 2.25, 'Rogue movement Slow gets the same duration bonus');
  assert.equal(u.slowStacks, 2, 'Rogue hits share the same Slow stack counter');
  close(g.cooldownRecoveryElapsed(u, 1), 0.65 / 1.35, 'companion stack recovery');
}
{
  const g = new Campaign('normal', 'mage', () => 0.9);
  const e = g.makeEnemy(
    {
      species: 'goblin',
      name: 'Stacking cooldown foe',
      level: 1,
      hp: 1000,
      damage: 0,
      gold: 0,
      xp: 0,
    },
    { x: 2100, y: 2100 },
  );
  g.zone().enemies = [e];
  Object.assign(e, { cd: 10, specialCd: 9, supportHealCd: 6 });
  e.royalPrerogativeReadyAt = g.s.time + 7;
  g._tacticalRogueNext = new Map([[e.id, g.s.time + 4]]);
  assert(g.applySlow(e, 2.7));
  assert(g.applySlow(e, 2.7));
  close(e.slow, 2.95, 'strong Rogue source receives quarter-second bonus');
  assert.equal(e.slowStacks, 2);
  const debt = 2 * 2.95 * 0.15;
  close(e.cd, 10 + debt, 'enemy basic pays accumulated cooldown debt');
  close(e.specialCd, 9 + debt, 'enemy special pays accumulated cooldown debt');
  close(e.supportHealCd, 6 + debt, 'enemy healer cooldown pays accumulated debt');
  close(e.royalPrerogativeReadyAt, g.s.time + 7 + debt, 'enemy passive deadline pays debt');
  close(
    g._tacticalRogueNext.get(e.id),
    g.s.time + 4 + debt,
    'enemy Rogue readiness deadline pays debt',
  );
  close(
    g.cooldownRecoveryElapsed(e, 1, true),
    0.85 / 1.15,
    'second enemy stack suppresses recovery',
  );
  const before = e.cd;
  e.immune = 1;
  assert.equal(g.applySlow(e, 2.7), false, 'immune targets cannot gain more stacks');
  assert.equal(e.slowStacks, 2);
  close(e.cd, before, 'immune targets receive no extra debt');
}
{
  const g = new Campaign('normal', 'ranger', () => 0.9);
  const h = g.hero;
  h.cd.fill(0);
  for (let i = 0; i < 100; i++) assert(g.applySlow(h, 1));
  assert.equal(h.slowStacks, R.cooldownBalance.slowMaxStacks, 'even 100 overlapping Slows cap stack strength');
  assert(Number.isFinite(h.slowStacks), 'stack storage remains a scalar');
  close(
    g.cooldownRecoveryElapsed(h, 1),
    R.cooldownBalance.slowRecoveryMultiplier /
      (1 + (R.cooldownBalance.slowMaxStacks - 1) * R.cooldownBalance.slowStackPenalty),
    'perpetual Slow cannot suppress recovery past the stack ceiling',
  );
  assert.equal(
    h.cd.filter((c) => c > 0).length,
    0,
    'even extensive stacking never starts completed cooldowns',
  );
}
{
  const signatures = R.tacticalFoundation.rogueRingleaderSignatures;
  for (const role of ['melee', 'ranged'])
    for (const signature of Object.values(signatures[role]))
      if (signature.slowSeconds)
        close(
          signature.slowSeconds + R.cooldownBalance.slowDurationBonusSeconds,
          2.95,
          role + ' elite signature matches stronger Rogue Slow',
        );
  close(
    R.tacticalFoundation.eliteRogueSlowSeconds + R.cooldownBalance.slowDurationBonusSeconds,
    2.95,
    'elite Rogue basics share signature Slow duration',
  );
}
// Sustained overlapping Rogue hits cannot continue increasing cooldown debt.
// Both a regular ally and a boss pet share the protection; further strikes
// still refresh the timed Slow without becoming permanent skill lockouts.
{
  const g = new Campaign('normal', 'mage', () => 0.9);
  const ally = g.unit('soldier', g.hero.x, g.hero.y);
  const pet = g.unit('pet', g.hero.x, g.hero.y, 'thorn');
  g.s.party = [ally, pet];
  for (const unit of [g.hero, ally, pet]) {
    if (unit === g.hero) unit.cd[0] = 10;
    else unit.skill1Cd = 10;
    for (let i = 0; i < 80; i++) assert(g.applyRogueSlow(unit, 2.7));
    const actual = unit === g.hero ? unit.cd[0] : unit.skill1Cd;
    close(actual, 10 + R.cooldownBalance.slowMaxStacks * 2.95 * 0.35,
      unit === g.hero ? 'hero capped' : unit.type + ' capped');
    assert.equal(unit.slowStacks, R.cooldownBalance.slowMaxStacks);
    assert.equal(unit.rogueSlow, 2.95);
    assert.equal(g.slowMovementFactor(unit), R.tacticalFoundation.rogueSlowMovementFactor);
    const before = actual;
    assert(g.applyRogueSlow(unit, 2.7));
    close(unit === g.hero ? unit.cd[0] : unit.skill1Cd, before,
      'extra impacts refresh Slow without extending a cooldown');
  }
  // Older saved snapshots may contain uncapped stacks. Clamp their effective
  // recovery and the next real hit, without altering unrelated saved timers.
  const old = g.hero;
  old.slow = 2;
  old.slowStacks = 100;
  close(g.cooldownRecoveryElapsed(old, 1),
    R.cooldownBalance.slowRecoveryMultiplier /
      (1 + (R.cooldownBalance.slowMaxStacks - 1) * R.cooldownBalance.slowStackPenalty),
    'legacy inflated stacks are bounded at consumption');
  assert(g.applyRogueSlow(old, 2.7));
  assert.equal(old.slowStacks, R.cooldownBalance.slowMaxStacks);
}
console.log('PASS capped overlapping Slow, hit-time debt, legacy readiness, expiry and elite durations');

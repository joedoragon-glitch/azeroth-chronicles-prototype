'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const R = Campaign.rules;
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

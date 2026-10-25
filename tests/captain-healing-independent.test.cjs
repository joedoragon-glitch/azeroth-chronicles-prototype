'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const rules = Campaign.rules.enemySupportHealing;
const near = (actual, wanted, name) =>
  assert(Math.abs(actual - wanted) < 1e-6, name + ': ' + actual + ' !== ' + wanted);

function scene() {
  const g = new Campaign('normal', 'mage', () => 0.9);
  g.enter('supply-vale');
  const z = g.zone();
  g.zone = () => z;
  g.syncTreasuryRecovery = () => {};
  for (const kind of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) z[kind] = [];
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.time = 30;
  g.s.clock = 120;
  Object.assign(g.hero, { x: 1600, y: 1200, hp: 10000, maxHp: 10000 });
  function actor(species, x, options = {}) {
    const e = g.makeEnemy(
      { species, name: 'Independent captain healing ' + species, level: 1, hp: 1000, damage: 0, gold: 0, xp: 0 },
      { x, y: 300 },
    );
    Object.assign(e, { aggro: false, idleWanderWait: 1000, cd: 1000, specialCd: 1000, ...options });
    z.enemies.push(e);
    return e;
  }
  return { g, z, actor };
}
function elapsed(g, dt) {
  // Let real enemy cooldowns tick, without opportunistic casts obscuring the
  // independent self/ally readiness experiment.
  const heal = g.enemySupportHeal;
  const approach = g.enemySupportApproach;
  g.enemySupportHeal = () => false;
  g.enemySupportApproach = () => false;
  try {
    g.s.time += dt;
    g.updateEnemies(dt);
  } finally {
    g.enemySupportHeal = heal;
    g.enemySupportApproach = approach;
  }
}

{
  const { g, actor } = scene();
  const captain = actor('goblin', 300, {
    captain: true, roomCaptain: true, captainProfile: 'supply-vale', hp: 400,
  });
  const first = actor('wolf', 330, { hp: 300 });
  const second = actor('skeleton', 350, { hp: 600 });
  assert.equal(g.enemyHealProfile(captain), 'Salvage Surge');
  assert(g.enemySupportHeal(captain), 'idle Scornfang begins restorative area spell');
  for (const ally of [first, second]) {
    near(ally.supportHeal.remaining, ally.maxHp - ally.hp, 'captain restores all missing ordinary HP');
    near(ally.supportHeal.seconds, 3, 'captain heals ordinary ally in three seconds');
    assert(ally.supportHeal.allowIdle);
  }
  near(captain.supportHeal.remaining, 50 * g.enemyHealMultiplier(captain), 'original captain self budget');
  near(captain.supportHeal.seconds, 5, 'self pulse stays five seconds');
  near(captain.supportHealCd, 7, 'seven-second ordinary support readiness');
  assert(captain.supportHeal.allowIdle, 'self pulse survives idle state');
  const selfStart = captain.hp;
  g.advanceEnemySupportHeal(captain, 1);
  captain.aggro = true;
  g.advanceEnemySupportHeal(captain, 1);
  captain.aggro = false;
  g.advanceEnemySupportHeal(captain, 3);
  assert(captain.hp > selfStart, 'captain healing crosses idle-engaged-idle states');
  assert(!captain.supportHeal);
  for (const ally of [first, second]) {
    g.advanceEnemySupportHeal(ally, 3);
    near(ally.hp, ally.maxHp, 'captain completes every nearby ally');
  }
  elapsed(g, 7);
  near(captain.supportHealCd || 0, 0, 'ordinary support ready after seven seconds');
  first.hp = 300;
  assert(g.enemySupportHeal(captain), 'captain treats ally while self recovery remains on cooldown');
  assert(first.supportHeal);
  assert(!captain.supportHeal, 'self recovery not prematurely refreshed by fast support');
  g.advanceEnemySupportHeal(first, 3);
  elapsed(g, 3);
  assert(captain.supportHealCd > 0, 'ordinary support still on independent cooldown');
  assert(g.enemySupportHeal(captain), 'captain may self-heal at ten seconds despite pending support cooldown');
  assert(captain.supportHeal, 'self pulse is actually queued');
}
{
  const { g, actor } = scene();
  const healer = actor('ashbeast', 300, { ranged: true });
  const captain = actor('orc', 330, {
    captain: true, roomCaptain: true, captainProfile: 'supply-highlands', hp: 400,
  });
  assert(g.enemySupportHeal(healer), 'unengaged ranged guardian heals an unengaged captain');
  const amount = (captain.maxHp - captain.hp) * rules.captain.missingFraction;
  near(captain.supportHeal.remaining, amount, 'midpoint captain received budget');
  assert(captain.supportHeal.allowIdle, 'leader-recipient healing is not tied to combat');
  const start = captain.hp;
  g.advanceEnemySupportHeal(captain, 1);
  captain.aggro = true;
  g.advanceEnemySupportHeal(captain, 1);
  captain.aggro = false;
  g.advanceEnemySupportHeal(captain, 3);
  near(captain.hp, start + amount, 'captain receives full cast through aggro transitions');
  captain.hp = captain.maxHp * 0.6;
  assert(!g.enemySupportHeal(healer), 'same ordinary healer cannot re-treat captain before ten seconds');
  elapsed(g, 10);
  captain.hp = captain.maxHp * 0.6;
  assert(g.enemySupportHeal(healer), 'independent leader eligibility returns at ten seconds');
}
{
  const g = new Campaign('normal', 'mage', () => 0.9);
  g.enter('supply-march');
  const direjaw = g.zone().enemies.find(e => e.captainProfile === 'supply-march');
  assert(direjaw, 'native Direjaw found');
  direjaw.hp = direjaw.maxHp * 0.54;
  assert(g.triggerCaptainPhase(direjaw), 'Elastic Rebound still triggers below 55%');
  near(direjaw.hp, direjaw.maxHp, 'one-time 50%-of-max recovery remains intact');
  assert(!g.triggerCaptainPhase(direjaw), 'phase self-recovery cannot repeat');
}
const expected = [
  ['supply-vale', 3],
  ['supply-march', 3],
  ['supply-highlands', 3],
  ['supply-crown', 5],
];
for (const [id, count] of expected) {
  const slots = Campaign.rules.treasuryGuardFormations[id];
  assert.equal(slots.filter(slot => !slot.captain && slot.role === 'ranged').length, count);
}
console.log('PASS captain support: area/full ordinary repair, independent 7s/10s readiness, idle pulses, midpoint ally healing, Direjaw phase, Treasury formations');

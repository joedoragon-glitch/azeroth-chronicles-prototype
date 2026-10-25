'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const rules = Campaign.rules.enemySupportHealing;
const near = (actual, wanted, name) =>
  assert(Math.abs(actual - wanted) < 1e-6, name + ': ' + actual + ' !== ' + wanted);

// Director signed off Phase 5: captain-recipient midpoint is not provisional.
assert.equal(rules.captain.missingFraction, 0.5, 'approved captain recipient missing-HP fraction');
assert.equal(rules.captain.duration, 5, 'approved captain recipient treatment seconds');
assert.equal(rules.captain.threshold, 0.9, 'approved captain recipient eligibility gate');
assert.equal(rules.cooldown, 10, 'approved independent per-source leader eligibility');

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
// The signed-off 90% eligibility gate is inclusive; 90.1% must not trigger
// a source's separate 10-second captain-support clock.
{
  const { g, actor } = scene();
  const healer = actor('wolf', 300, { ranged: true });
  const captain = actor('ogre', 330, {
    captain: true, roomCaptain: true, captainProfile: 'supply-highlands', hp: 901,
  });
  assert(!g.enemySupportHeal(healer), '90.1%-HP captain is above approved treatment gate');
  captain.hp = 900;
  assert(g.enemySupportHeal(healer), '90%-HP captain meets inclusive treatment gate');
  near(captain.supportHeal.remaining, 50, 'approved half of 100 missing HP');
  near(captain.supportHeal.seconds, 5, 'approved five-second captain pulse');
  g.advanceEnemySupportHeal(captain, 5);
  near(captain.hp, 950, 'signed-off captain budget completes without full restoration');
}

// Distinct ranged guardians retain independent leader clocks: the captain
// can receive a later cast from another guard while the first one cools down.
{
  const { g, actor } = scene();
  const first = actor('wolf', 300, { ranged: true });
  const second = actor('ashbeast', 350, { ranged: true });
  const captain = actor('ogre', 325, {
    captain: true, roomCaptain: true,
    captainProfile: 'supply-highlands', hp: 300,
  });
  assert(g.enemySupportHeal(first), 'first guard starts healing wounded idle captain');
  near(captain.supportHeal.remaining, 700 * rules.captain.missingFraction,
    'first independent healer restores half the captain deficit');
  g.advanceEnemySupportHeal(captain, 5);
  near(captain.hp, 650, 'first guard finishes its five-second treatment');
  first.supportHealCd = 0; // Isolate the separate ten-second leader source clock.
  assert(!g.enemySupportHeal(first), 'first guard still has leader-specific cooldown');
  assert(g.enemySupportHeal(second), 'second guard can treat captain during first cooldown');
  near(captain.supportHeal.remaining, 350 * rules.captain.missingFraction,
    'second guard heals half of remaining wounds');
  g.advanceEnemySupportHeal(captain, 5);
  near(captain.hp, 825, 'sequential independent healers improve captain survival');
}
// Grafting treats four eligible owned ordinary broodlings in one area cast,
// each for its own full deficit; the captain's own heal stays on the slower budget.
{
  const { g, actor } = scene();
  const dreadmaw = actor('ashbeast', 300, {
    captain: true, roomCaptain: true,
    captainProfile: 'supply-crown', hp: 400,
  });
  const brood = [100, 200, 300, 400].map((hp, index) =>
    actor('ashbeast', 310 + index * 15, {
      hp, summon: true, owner: dreadmaw.id,
      ranged: index === 3,
    }),
  );
  assert.equal(brood.length, 4);
  assert.equal(brood.filter(u => u.ranged).length, 1);
  assert(g.enemySupportHeal(dreadmaw), 'Grafting includes all four wounded broodlings');
  for (const u of brood) {
    assert(u.supportHeal, 'every wounded broodling receives its own area pulse');
    near(u.supportHeal.remaining, u.maxHp - u.hp, 'full per-broodling deficit');
    near(u.supportHeal.seconds, 3, 'every broodling has three-second treatment');
    g.advanceEnemySupportHeal(u, 3);
    near(u.hp, u.maxHp, 'every broodling is fully restored without stacking');
  }
  near(dreadmaw.supportHeal.remaining, 50 * g.enemyHealMultiplier(dreadmaw),
    'Grafting self-heal remains original five-percent-of-max budget');
  near(dreadmaw.supportHeal.seconds, 5, 'Dreadmaw self-treatment stays five seconds');
  near(dreadmaw.supportHealCd, 7, 'ordinary brood support recharges in seven seconds');
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
// Keep boss restoration on its established combat-only baseline even when
// the source is a healing-skilled captain. Idle eligibility is for ordinary
// allies and captain recipients, not an accidental boss-support upgrade.
{
  const { g, actor } = scene();
  const healer = actor('goblin', 300, {
    captain: true, roomCaptain: true, captainProfile: 'supply-vale',
  });
  const boss = actor('wolf', 330, {
    type: 'boss', family: 'test-boss-only', hp: 700, aggro: false,
  });
  assert(g.enemySupportHeal(healer), 'captain may still apply baseline boss support');
  near(boss.supportHeal.remaining,
    boss.maxHp * rules.fraction * g.enemyHealMultiplier(healer),
    'boss support budget stays at its original scaled five-percent limit');
  near(boss.supportHeal.seconds, rules.duration, 'boss duration is unchanged');
  assert.equal(boss.supportHeal.allowIdle, false,
    'captain-origin boss support must not gain idle continuity');
  const before = boss.hp;
  g.advanceEnemySupportHeal(boss, 1);
  near(boss.hp, before, 'idle boss must not gain health from this pulse');
  assert(!boss.supportHeal, 'combat-only boss pulse cancels while idle');
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

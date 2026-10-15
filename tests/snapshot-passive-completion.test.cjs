'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const R = C.rules;
const near = (actual, expected, label) =>
  assert(Math.abs(actual - expected) < 1e-8, label + ': ' + actual + ' != ' + expected);

function arena(id, form = 'normal') {
  const c = new C('normal', 'paladin', () => 0.9),
    def = c.boss(id);
  c.enter(def.kind === 'dungeon' ? id : def.region);
  const e = c.bossEnemy(def, form, c.safe(850, 850));
  c.zone().enemies = [e];
  e.aggro = true;
  e.neutral = false;
  e.hp = e.maxHp;
  return { c, e };
}
function add(c, owner, species, attrs = {}) {
  const u = c.makeEnemy(
    { species, name: species, hp: 100, damage: 10, level: 5, gold: 0, xp: 0 },
    { x: owner.x + 25, y: owner.y + 25 },
  );
  Object.assign(u, { owner: owner.id, summon: true, aggro: true, ...attrs });
  c.zone().enemies.push(u);
  return u;
}
for (const form of ['normal', 'true']) {
  const key = form === 'true' ? 'true' : 'normal';
  {
    const { c, e } = arena('ridge', form);
    near(c.snapshotBossIncomingFactor(e), 1, 'Ridge has no phantom contracts');
    const guards = Array.from({ length: 3 }, () => add(c, e, 'archer'));
    near(c.snapshotBossIncomingFactor(e),
      1 - 3 * R.snapshotPassives.ridge.perArcher[key], 'three actual hired archers');
    guards[0].hp = 0;
    near(c.snapshotBossIncomingFactor(e),
      1 - 2 * R.snapshotPassives.ridge.perArcher[key], 'dead ally stops protection');
    guards[1].owner = 'unrelated';
    near(c.snapshotBossIncomingFactor(e),
      1 - R.snapshotPassives.ridge.perArcher[key], 'ownership isolation');
  }
  {
    const { c, e } = arena('mine', form);
    near(c.snapshotBossIncomingFactor(e), 1 - R.snapshotPassives.mine.shellReduction[key],
      'Garun sheltered core');
    e.open = 1;
    near(c.snapshotBossIncomingFactor(e), 1, 'exposed core loses shell protection');
    e.open = 0;
    e.hp = e.maxHp * 0.5;
    c.snapshotPassiveCoreRelock(e);
    near(e.hp, e.maxHp * (0.5 + R.snapshotPassives.mine.repairFraction[key]),
      'real core relock repairs');
    const hp = e.hp;
    c.snapshotPassiveCoreRelock(e);
    near(e.hp, hp, 'cooldown prevents repeated free healing');
  }
  {
    const { c, e } = arena('warlord', form);
    const orcs = [add(c, e, 'orc'), add(c, e, 'orc')];
    near(c.snapshotBossIncomingFactor(e),
      1 - 2 * R.snapshotPassives.warlord.perOrc[key], 'real warband protects governor');
    near(c.snapshotPassiveOutgoingFactor(orcs[0]),
      1 + R.snapshotPassives.warlord.orcDamage[key], 'owned Orc attacks harder');
    orcs[0].owner = 'foreign';
    near(c.snapshotPassiveOutgoingFactor(orcs[0]), 1, 'foreign Orc not rewarded');
  }
  {
    const { c, e } = arena('abyss', form);
    near(c.snapshotBossIncomingFactor(e), 1, 'no airborne invulnerability at baseline');
    e.passiveAerialUntil = c.s.time + 4;
    near(c.snapshotBossIncomingFactor(e), 1 - R.snapshotPassives.abyss.reduction[key],
      'completed flight grants finite cover');
    e.passiveAerialUntil = c.s.time;
    near(c.snapshotBossIncomingFactor(e), 1, 'flight cover expires');
  }
  {
    const { c, e } = arena('citadel', form);
    e.dressUntil = c.s.time + 5;
    near(c.snapshotBossIncomingFactor(e), 1, 'no imaginary Crown defenders');
    const guard = add(c, e, 'crownguard');
    near(c.snapshotBossIncomingFactor(e), 1 - R.snapshotPassives.citadel.reduction[key],
      'real living guard enables formation defense');
    guard.hp = 0;
    near(c.snapshotBossIncomingFactor(e), 1, 'dead guard removes formation defense');
  }
  {
    const { c, e } = arena('cindermaw', form);
    e.hp = e.maxHp * 0.5;
    const original = e.hp;
    c.snapshotPassiveRegen(1);
    near(e.hp, original, 'no free recovery without active Ash beasts');
    const ally = add(c, e, 'ashbeast');
    ally.hp = ally.maxHp * 0.5;
    c.snapshotPassiveRegen(1);
    near(e.hp, original + e.maxHp * R.snapshotPassives.cindermaw.bossRegen[key],
      'owner gets meaningful capped support healing');
    near(ally.hp, ally.maxHp * (0.5 + R.snapshotPassives.cindermaw.allyRegen[key]),
      'living Ash ally gets support');
    e.passiveRegenTotal = e.maxHp * R.snapshotPassives.cindermaw.bossHealCap[key];
    const capHp = e.hp;
    c.snapshotPassiveRegen(1);
    near(e.hp, capHp, 'healing cap cannot reset while engaged');
  }
  {
    const { c, e } = arena('darklord', form);
    c.s.party = [];
    for (let i = 0; i < 4; i++) c.snapshotPassiveRecordHit(e, 10, 'hero');
    near(c.snapshotBossIncomingFactor(e), 1 - R.snapshotPassives.darklord.reduction[key],
      'four real hits prime veteran defense');
    e.passiveVeteranUntil = c.s.time;
    near(c.snapshotBossIncomingFactor(e), 1, 'veteran defense expires');
    c.snapshotPassiveRecordHit(e, 10, 'hero');
    near(c.snapshotBossIncomingFactor(e), 1, 'veteran internal cooldown holds');
  }
}
{
  const c = new C('normal', 'paladin', () => 0.9);
  c.enter('supply-highlands');
  const e = c.zone().enemies.find(u => u.roomCaptain && u.captainProfile === 'supply-highlands');
  assert(e, 'real Crag captain exists');
  e.aggro = true;
  // The Treasury restores its authored population when zone() is accessed;
  // defeat actual living guards rather than replacing the entire zone roster.
  for (const u of c.zone().enemies)
    if (u.roomGuard) u.hp = 0;
  near(c.snapshotBossIncomingFactor(e), 1, 'Crag unprotected without a guard');
  const guard = add(c, e, 'wolf', { roomGuard: true, summon: false });
  near(c.snapshotBossIncomingFactor(e),
    1 - R.snapshotPassives.captains['supply-highlands'].selfReduction, 'Crag hiring protection');
  near(c.snapshotPassiveOutgoingFactor(guard),
    1 + R.snapshotPassives.captains['supply-highlands'].guardDamage, 'hired soldier offense');
  guard.hp = 0;
  near(c.snapshotBossIncomingFactor(e), 1, 'hired guard defeat removes protection');
}
{
  const c = new C('normal', 'paladin', () => 0.9);
  c.enter('frontier');
  const e = c.zone().enemies.find(u => u.fieldCaptain && u.captainProfile === 'frontier-overseer');
  assert(e, 'real roaming Frontier captain exists');
  e.aggro = true;
  for (let i = 0; i < 5; i++) c.snapshotPassiveRecordHit(e, 10, 'hero');
  near(c.snapshotBossIncomingFactor(e), 0.75, 'five real hits stack to 25% reduction');
  near(c.snapshotPassiveOutgoingFactor(e), 1.15, 'max enforcement adds dangerous retaliation');
  e.passiveViolationUntil = c.s.time;
  near(c.snapshotBossIncomingFactor(e), 1, 'enforcement expires');
}
assert.deepEqual(R.greenwoodPassives.rapidDeployment, { normal: 1.08, true: 1.15 });
assert.deepEqual(R.marchesPassives.groundwaterRecharge, { normal: 0.02, true: 0.05 });
assert.equal(R.roomCaptains['supply-crown'].summon.guardPerSummon, 0.25);
console.log('PASS Snapshot completion: 7 Normal/TRUE boss passives and 2 captain passives; original 4+3 preserved');

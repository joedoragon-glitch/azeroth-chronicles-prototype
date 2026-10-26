'use strict';
// Both hybrid ordinary and ringleaders keep ally support while receiving
// their own 10%-of-max, 3-second heal on an independent 5-second cooldown.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const cfg = Campaign.rules.enemySupportHealing;
const near = (a, b, why) =>
  assert(Math.abs(a - b) < 1e-7, why + ': ' + a + ' vs ' + b);
assert.equal(cfg.hybridSelf.fraction, 0.1);
assert.equal(cfg.hybridSelf.duration, 3);
assert.equal(cfg.hybridSelf.cooldown, 5);

function scene() {
  const g = new Campaign('normal', 'paladin', () => 0.9);
  g.enter('supply-vale');
  const z = g.zone();
  g.zone = () => z;
  g.syncTreasuryRecovery = () => {};
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) z[key] = [];
  g.s.party = [];
  g.s.time = 30;
  g.s.mercyTime = 0;
  Object.assign(g.hero, { x: 1300, y: 1200 });
  const mob = (species, x, more = {}) => {
    const e = g.makeEnemy({
      species, name: 'Hybrid healing fixture ' + species,
      hp: 1000, level: 3, damage: 5, gold: 0, xp: 0,
    }, { x, y: 300 });
    Object.assign(e, {
      ranged: true, hybrid: true, aggro: false,
      idleWanderWait: 1000, hp: 500, maxHp: 1000,
      cd: 100, specialCd: 100, ...more,
    });
    z.enemies.push(e);
    return e;
  };
  return { g, z, mob };
}

for (const [species, form, guard] of [
  ['orc', 'normal', false],
  ['mireling', 'normal', true],
  ['ogre', 'ringleader', false],
  ['reedbeast', 'ringleader', true],
]) {
  const { g, mob } = scene();
  const e = mob(species, 300, { form, guard });
  assert(g.enemyHealProfile(e), 'hybrid retains ranged ally-healing profile');
  assert(g.enemyHybridSelfHeal(e), species + '/' + form + ' starts self recovery');
  assert(!e.supportHeal, 'self-heal does not occupy incoming support slot');
  assert.equal(e.hybridSelfHealCd, 5, 'uniform hybrid cooldown');
  near(e.hybridSelfHeal.remaining, 100, 'uniform 10%-max budget');
  near(e.hybridSelfHeal.seconds, 3, 'uniform duration');
  g.advanceHybridSelfHeal(e, 1);
  near(e.hp, 500 + 100 / 3, 'first self pulse');
  g.advanceHybridSelfHeal(e, 2);
  near(e.hp, 600, 'complete three-second self recovery');
  assert(!e.hybridSelfHeal, 'completed self pulse retired');
  assert(!g.enemyHybridSelfHeal(e), 'five-second clock prevents immediate repeat');
  e.hybridSelfHealCd = 0;
  assert(g.enemyHybridSelfHeal(e), 'can use self-heal repeatedly once ready');
}

for (const first of ['self', 'ranged']) {
  for (const form of ['normal', 'ringleader']) {
    const { g, mob } = scene();
    const patient = mob('orc', 315, { form, hp: 300 });
    const healer = mob('goblin', 290, {
      hybrid: false, hp: 1000, maxHp: 1000,
    });
    if (first === 'self')
      assert(g.enemyHybridSelfHeal(patient), 'self heal first');
    assert(g.enemySupportHeal(healer),
      'ordinary ranged healer can treat hybrid even with independent self-heal active');
    assert(patient.supportHeal, 'incoming ranged healing allocated normally');
    if (first === 'ranged')
      assert(g.enemyHybridSelfHeal(patient),
        'hybrid self heal still activates with incoming ranged pulses underway');
    assert(patient.supportHeal && patient.hybridSelfHeal, 'both heal channels coexist');
    const before = patient.hp;
    g.advanceEnemySupportHeal(patient, 1);
    const afterRanged = patient.hp;
    g.advanceHybridSelfHeal(patient, 1);
    assert(afterRanged > before && patient.hp > afterRanged,
      'ranged and self sources both contribute HP in same second');
    near(patient.hp, 300 + 700 / 3 + 100 / 3, 'independent additive pulse amounts');
    g.advanceEnemySupportHeal(patient, 2);
    g.advanceHybridSelfHeal(patient, 2);
    near(patient.hp, 1000, 'concurrent healing clamps at maximum HP');
    assert(!patient.supportHeal && !patient.hybridSelfHeal,
      'completed concurrent channels retire without lingering suppression');
  }
}

{
  // A self-healing hybrid still has its full outgoing ranged triage repertoire.
  const { g, mob } = scene();
  const hybrid = mob('orc', 300, { form: 'ringleader' });
  const patient = mob('wolf', 330, { ranged: false, hybrid: false, hp: 500 });
  assert(g.enemyHybridSelfHeal(hybrid));
  assert(g.enemySupportHeal(hybrid), 'self-healing hybrid can independently treat an ally');
  assert(patient.supportHeal && hybrid.hybridSelfHeal);
  assert(!hybrid.supportHeal, 'old ringleader self-treatment does not double-dip');
  assert.equal(hybrid.hybridSelfHealCd, 5);
  assert.equal(hybrid.supportHealCd, 7, 'outgoing triage keeps independent cooldown');
}

{
  const { g, mob } = scene();
  const e = mob('orc', 300);
  for (const change of [
    { hybrid: false },
    { captain: true },
    { roomCaptain: true },
    { fieldCaptain: true },
    { type: 'boss' },
    { returning: 1 },
    { hp: 0 },
  ]) {
    const prev = { ...e };
    Object.assign(e, change);
    assert(!g.enemyHybridSelfHeal(e), 'excluded: ' + JSON.stringify(change));
    Object.assign(e, prev);
  }
  assert(!e.hybridSelfHeal, 'unqualified actors cannot create self-heal state');
  g.s.phase = 'peace';
  assert(!g.enemyHybridSelfHeal(e), 'peace prevents the heal');
}

{
  const { g, mob } = scene();
  const e = mob('ogre', 300);
  assert(g.enemyHybridSelfHeal(e));
  g.advanceHybridSelfHeal(e, 0.5);
  assert(e.hybridSelfHeal, 'pulse exists before complete return');
  g.finishDisengage(e);
  assert(!e.hybridSelfHeal && !e.hybridSelfHealCd,
    'complete encounter reset clears self recovery and its clock');
}

console.log('PASS hybrid self heal 10%/3s/5s parity, ordinary/guardian/ringleader, support concurrency, caps, resets');

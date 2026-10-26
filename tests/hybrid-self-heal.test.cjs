'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const cfg = C.rules.enemySupportHealing.hybridSelf;
const near = (actual, expected, label) =>
  assert(Math.abs(actual - expected) < 1e-5, label + ': ' + actual + ' vs ' + expected);

assert.deepEqual(
  { fraction: cfg.fraction, duration: cfg.duration, cooldown: cfg.cooldown },
  { fraction: 0.1, duration: 3, cooldown: 7 },
  'hybrid self-recovery authorial budget',
);

function scene(region = 'vale', species = 'goblin', extra = {}) {
  const g = new C('normal', 'paladin', () => 0.9);
  g.enter(region);
  const z = g.zone();
  g.zone = () => z; // Suppress unrelated replenishment while exercising real AI.
  g.syncTreasuryRecovery = () => {};
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) z[key] = [];
  g.s.time = 30;
  g.s.clock = 120;
  g.s.mercyTime = 0;
  g.s.party = [];
  Object.assign(g.hero, { x: 1200, y: 1300, hp: 10000, maxHp: 10000 });
  g.enemyAcquisitionRange = () => 0;
  const e = g.makeEnemy(
    { species, name: 'Hybrid self-heal fixture', form: 'normal',
      level: 3, hp: 1000, damage: 5, gold: 0, xp: 0 },
    { x: 350, y: 300 },
  );
  Object.assign(e, {
    hp: e.maxHp * 0.6,
    aggro: false,
    hybrid: true,
    ranged: true,
    cd: 1000,
    specialCd: 1000,
    idleWanderWait: 1000,
    ...extra,
  });
  z.enemies.push(e);
  const step = (dt) => {
    g.s.time += dt;
    g.updateEnemies(dt);
  };
  return { g, z, e, step };
}

// The five regional native hybrid species, a guardian and a ringleader
// all share exactly one self-heal; no special attacks need to be replaced.
for (const [region, species, extra] of [
  ['march', 'mireling', {}],
  ['march', 'reedbeast', { guard: true }],
  ['highlands', 'ogre', {}],
  ['frontier', 'orc', {}],
  ['crown', 'ashbeast', {}],
  ['frontier', 'orc', { form: 'ringleader' }],
]) {
  const { g, e, step } = scene(region, species, extra);
  const start = e.hp;
  e.supportHealCd = 5; // Self-healing cannot depend on allied triage readiness.
  assert(g.enemyHealProfile(e), species + ' retains ranged ally-healing profile');
  assert(g.enemyHybridSelfHeal(e), species + ' begins a separate self-heal');
  assert.equal(e.supportHeal.skill, 'Hybrid Recovery');
  assert.equal(e.supportHeal.allowIdle, true);
  near(e.supportHeal.remaining, e.maxHp * 0.1, 'full 10% HP healing budget');
  near(e.supportHeal.seconds, 3, 'three-second duration');
  near(e.hybridSelfHealCd, 7, 'seven-second independent cooldown');
  assert(!g.enemyHybridSelfHeal(e), 'no stacked duplicate treatment');
  step(1);
  near(e.hp, start + e.maxHp * 0.1 / 3, 'first second applies one-third');
  near(e.hybridSelfHealCd, 6, 'cooldown recovers while treatment is active');
  step(2);
  near(e.hp, start + e.maxHp * 0.1, 'complete self-heal after three seconds');
  assert(!e.supportHeal, 'gradual healing state finishes normally');
  near(e.hybridSelfHealCd, 4, 'four seconds remain before next start');
  assert(!g.enemyHybridSelfHeal(e), 'cannot re-cast before seven seconds');
  step(4);
  near(e.hybridSelfHealCd, 0, 'independent cooldown expires');
  assert(g.enemyHybridSelfHeal(e), 'repeatable after seven seconds, no one-use flag');
}

// A hybrid retains its ranged allied support *during its own cooldown*.
// A self-heal in progress must not be overwritten by an ally spell.
{
  const { g, z, e } = scene('march', 'mireling');
  const ally = g.makeEnemy(
    { species: 'reedbeast', name: 'ally patient', level: 1, hp: 1000, damage: 1 },
    { x: 385, y: 300 },
  );
  ally.hp = ally.maxHp * 0.5;
  ally.aggro = false;
  z.enemies.push(ally);
  assert(g.enemyHybridSelfHeal(e));
  const self = e.supportHeal;
  assert(g.enemySupportHeal(e), 'hybrid can still initiate native cross-species ranged triage');
  assert(ally.supportHeal, 'ally is healing on its original ranged-support schedule');
  assert.strictEqual(e.supportHeal, self, 'native allied cast does not overwrite active self-heal');
}

// Exclusions, busy-state gates and no waste on nearly healthy combatants.
for (const change of [
  { hybrid: false, ranged: true },
  { hybrid: false, ranged: false },
  { neutral: true },
  { returning: 1 },
  { hp: 0 },
  { captain: true },
  { roomCaptain: true },
  { fieldCaptain: true },
  { type: 'boss' },
]) {
  const { g, e } = scene();
  Object.assign(e, change);
  assert(!g.enemyHybridSelfHeal(e), 'ineligible actor cannot self-heal: ' + JSON.stringify(change));
}
{
  const { g, e } = scene();
  e.hp = e.maxHp * 0.95;
  assert(!g.enemyHybridSelfHeal(e), 'save the full restoration for meaningful HP loss');
  e.hp = e.maxHp * 0.7;
  e.supportHeal = { source: 'ally', remaining: 10, seconds: 3, allowIdle: true };
  assert(!g.enemyHybridSelfHeal(e), 'a received heal excludes simultaneous new self-heal');
  delete e.supportHeal;
  e.rangedAim = { timer: 1, total: 1, x: 300, y: 300 };
  assert(!g.enemyHybridSelfHeal(e), 'committed ranged windup cannot be displaced');
  e.rangedAim = null;
  g.hero.silenceField = { x: e.x, y: e.y, radius: 200, zone: g.zoneId, until: 100 };
  assert(!g.enemyHybridSelfHeal(e), 'silence denies active self-cast');
}
{
  const { g, e, step } = scene('frontier', 'orc', { form: 'ringleader' });
  assert(!g.enemySupportHeal(e),
    'hybrid ringleader cannot stack the old five-percent self-heal with the new recovery');
  assert(g.enemyHybridSelfHeal(e));
  e.returning = 1;
  step(0.1);
  assert(!e.supportHeal, 'native encounter return interrupts hybrid treatment');
}
console.log('PASS hybrid heal: five species, guard/ringleader, 10%-over-3s, 7s clock, allied support, statuses and resets');

'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

const near = (a, b, message) =>
  assert(Math.abs(a - b) < 1e-7, message + ': ' + a + ' vs ' + b);
function scene() {
  const g = new C('normal', 'mage', () => 0.9);
  completeFieldOpening(g);
  g.enter('supply-vale');
  const z = g.zone();
  g.zone = () => z; // Keep the real AI but exclude Treasury replacement spawns.
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) z[key] = [];
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.time = 30;
  g.s.clock = 120;
  Object.assign(g.hero, { x: 900, y: 800, hp: 10000, maxHp: 10000 });
  const mob = (species, x, props = {}) => {
    const e = g.makeEnemy(
      { species, name: species + ' support fixture', level: 1, hp: 1000, damage: 0, xp: 0, gold: 0 },
      { x, y: 300 },
    );
    Object.assign(e, { aggro: false, idleWanderWait: 1000, cd: 1000, specialCd: 1000, ...props });
    z.enemies.push(e);
    return e;
  };
  const step = (dt = 0.05) => {
    g.s.time += dt;
    g.updateEnemies(dt);
  };
  return { g, z, mob, step };
}
let cases = 0;
// The reported defect: both ordinary actors idle; a real automatic heal
// must complete rather than spending a cooldown and silently vanishing.
for (const [healerAggro, targetAggro] of [[false, false], [false, true], [true, false], [true, true]]) {
  const { g, mob, step } = scene();
  const healer = mob('goblin', 300, { ranged: true, aggro: healerAggro, pack: 'east-watch' });
  const patient = mob('wolf', 350, { hp: 400, aggro: targetAggro, pack: 'western-wolves' });
  // Keep actual combat targeting alive without a distant pursuit disrupting
  // this focused restorative clock.
  if (healerAggro || targetAggro) {
    // Hold the intended combat-state matrix stable. Target acquisition is
    // unrelated to the healing test; both engaged actors stay in leash range.
    g.hero.x = 600;
    g.enemyAcquisitionRange = () => 0;
  }
  step();
  assert(patient.supportHeal, 'automatic cross-species cast begins');
  assert(patient.supportHeal.allowIdle, 'ordinary-only effect survives idle state');
  near(healer.supportHealCd, 7, 'new support cooldown');
  for (let n = 0; n < 30; n++) step(0.1);
  near(patient.hp, patient.maxHp, 'complete ordinary recovery in three seconds');
  assert(!patient.supportHeal, 'healing pulse retires after completing');
  if (!healerAggro && !targetAggro) assert(!healer.aggro, 'triage does not itself provoke the healer');
  cases++;
}
// Even a lightly wounded idle ordinary ally qualifies, unlike the old 75%
// gate. A fully healthy unit still cannot consume a healing cooldown.
{
  const { g, mob, step } = scene();
  const healer = mob('orc', 300, { ranged: true });
  const ally = mob('skeleton', 330, { hp: 990 });
  step();
  assert(ally.supportHeal, 'ordinary cross-species triage does not require severe injury');
  near(ally.supportHeal.remaining, 10, 'only missing HP is budgeted');
  cases++;
}
{
  const { g, mob, step } = scene();
  const healer = mob('orc', 300, { ranged: true });
  mob('skeleton', 330, { hp: 1000 });
  step();
  assert(!(healer.supportHealCd > 0), 'a healthy battlefield does not spend the heal');
  cases++;
}
// A wounded ordinary ally can arrive from outside cast range; an idle healer
// takes the already bounded, collision-aware support route without joining combat.
{
  const { g, mob, step } = scene();
  const healer = mob('goblin', 300, { ranged: true });
  const ally = mob('wolf', 720, { hp: 400, pack: 'different-pack' });
  const before = healer.x;
  step(0.1);
  assert(healer.x > before, 'idle healer approaches the out-of-range ordinary ally');
  assert(!healer.aggro, 'approach alone does not engage the hero');
  for (let n = 0; n < 70 && !ally.supportHeal; n++) step(0.1);
  assert(ally.supportHeal, 'arriving wounded ordinary ally is eventually treated');
  cases++;
}
// Bosses/captains are still allied recipients, but only under their old
// threshold, 5%-over-5s heal, and ordinary-source 10s leader eligibility.
for (const kind of ['boss', 'captain']) {
  const { g, z, mob } = scene();
  const healer = mob('goblin', 300, { ranged: true });
  let leader;
  if (kind === 'boss') {
    leader = g.bossEnemy(g.boss('crypt'), 'normal', { x: 335, y: 300 });
    leader.aggro = true;
    z.enemies.push(leader);
  } else leader = mob('ogre', 335, { captain: true, roomCaptain: true, captainProfile: 'fixture-no-healing-profile' });
  leader.hp = leader.maxHp * 0.9;
  assert(!g.enemySupportHeal(healer), 'leader at 90% keeps old eligibility threshold');
  leader.hp = leader.maxHp * 0.5;
  assert(g.enemySupportHeal(healer), 'cross-species leader remains healable');
  near(leader.supportHeal.remaining, leader.maxHp * 0.05 * g.enemyHealMultiplier(healer), 'leader amount unchanged');
  near(leader.supportHeal.seconds, 5, 'leader duration unchanged');
  assert(!leader.supportHeal.allowIdle, 'leader does not inherit new idle pulse exemption');
  cases++;
}
// The existing no-heal safeguards still win over the ordinary full recovery.
for (const gate of ['cooldown', 'silence', 'line', 'range', 'neutral', 'returning', 'dead', 'already-healing']) {
  const { g, mob } = scene();
  const healer = mob('goblin', 300, { ranged: true });
  const target = mob('wolf', gate === 'range' ? 700 : 330, { hp: 400 });
  if (gate === 'cooldown') healer.supportHealCd = 2;
  if (gate === 'silence') g.hero.silenceField = { x: 300, y: 300, radius: 200, zone: g.zoneId, until: 100 };
  if (gate === 'line') g.line = () => false;
  if (gate === 'neutral') target.neutral = true;
  if (gate === 'returning') target.returning = 1;
  if (gate === 'dead') target.hp = 0;
  if (gate === 'already-healing') target.supportHeal = { source: 'other', remaining: 20, seconds: 3, allowIdle: true };
  assert(!g.enemySupportHeal(healer), gate + ' forbids an ordinary heal');
  cases++;
}
{
  const { g, mob, step } = scene();
  const healer = mob('goblin', 300, { ranged: true });
  const patient = mob('wolf', 330, { hp: 400 });
  assert(g.enemySupportHeal(healer));
  patient.returning = 1;
  step();
  assert(!patient.supportHeal, 'returning immediately cancels idle treatment');
  patient.returning = 0;
  patient.hp = 0;
  patient.supportHeal = { source: healer.id, remaining: 100, seconds: 3, allowIdle: true };
  step();
  assert(!patient.supportHeal, 'death cancels healing and never resurrects');
  const save = g.snapshot();
  assert(save.zones[save.zone].enemies.every(u => !u.supportHeal && !u.supportHealCd));
  cases++;
}
console.log('PASS ' + cases + ' cross-species enemy healing cases: idle pulses, live approach, combat variants, complete recovery, old leader limits and safeguards');

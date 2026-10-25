'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const R = Campaign.rules.enemySupportHealing;
const near = (a, b, name) => assert(Math.abs(a - b) < 1e-7, name + ': ' + a + ' vs ' + b);
let cases = 0;
function scene() {
  const g = new Campaign('normal', 'paladin', () => 0.9);
  g.enter('supply-vale');
  const z = g.zone();
  // Treasury replacement spawns may be wounded ranged captains; keep this
  // cooldown fixture's roster closed while retaining native healing AI.
  g.zone = () => z;
  g.syncTreasuryRecovery = () => {};
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) z[key] = [];
  g.s.time = 30;
  g.s.clock = 120;
  g.s.mercyTime = 0;
  Object.assign(g.hero, { x: 1300, y: 1200 });
  function mob(species, x, props = {}) {
    const e = g.makeEnemy(
      { species, name: 'Heal study ' + species, hp: 1000, level: 1, damage: 0, gold: 0, xp: 0 },
      { x, y: 300 },
    );
    Object.assign(e, { aggro: true, idleWanderWait: 1000, cd: 1000, specialCd: 1000, ...props });
    z.enemies.push(e);
    return e;
  }
  return { g, z, mob };
}
assert.equal(R.ordinary.fullRecovery, true);
assert.equal(R.ordinary.duration, 3);
assert.equal(R.ordinary.cooldown, 7);
assert.equal(R.fraction, 0.05);
assert.equal(R.duration, 5);
assert.equal(R.cooldown, 10);
for (const species of Object.keys(R.species)) {
  const { g, mob } = scene();
  const healer = mob(species, 300, { ranged: true, hp: 1000 });
  const friend = mob('wolf', 330, { hp: 400, pack: 'other-pack' });
  assert(g.enemySupportHeal(healer), species + ' treats other hostile species');
  near(friend.supportHeal.remaining, friend.maxHp - friend.hp, species + ' all missing HP queued');
  near(friend.supportHeal.seconds, 3, species + ' rapid pulses');
  near(healer.supportHealCd, 7, species + ' faster cast cadence');
  const before = friend.hp;
  g.advanceEnemySupportHeal(friend, 1);
  near(friend.hp - before, (friend.maxHp - before) / 3, 'one third of missing HP in first second');
  g.advanceEnemySupportHeal(friend, 2);
  near(friend.hp, friend.maxHp, '100% HP after three seconds');
  cases++;
}
// Mixed-species area cast preserves separate base leader and buffed ordinary effects.
for (const kind of ['captain', 'boss', 'field-captain']) {
  const { g, mob, z } = scene();
  const healer = mob('goblin', 300, { ranged: true });
  const ordinary = mob('wolf', 320, { hp: 400, pack: 'other-pack' });
  let leader;
  if (kind === 'boss') {
    leader = g.bossEnemy(g.boss('crypt'), 'normal', { x: 340, y: 300 });
    z.enemies.push(leader);
    leader.aggro = true;
    leader.hp = leader.maxHp * 0.4;
  } else {
    leader = mob('orc', 340, { hp: 400, captain: true, roomCaptain: kind === 'captain', fieldCaptain: kind === 'field-captain', captainProfile: 'supply-vale' });
  }
  assert(g.enemySupportHeal(healer), kind + ' remains eligible for ordinary healer');
  near(ordinary.supportHeal.remaining, ordinary.maxHp - ordinary.hp, 'ordinary full recovery still applies');
  near(ordinary.supportHeal.seconds, 3, 'ordinary rapid duration');
  near(leader.supportHeal.remaining, leader.maxHp * 0.05 * g.enemyHealMultiplier(healer), kind + ' original 5%');
  near(leader.supportHeal.seconds, 5, kind + ' original five-second duration');
  near(healer.supportHealCd, 7, 'ordinary healer remains on 7 second cycle');
  g.advanceEnemySupportHeal(ordinary, 3);
  g.advanceEnemySupportHeal(leader, 5);
  // When another ordinary ally is eligible, the short cast can still help it,
  // but cannot use that same opportunity to refresh the boss/captain.
  healer.supportHealCd = 0;
  ordinary.hp = ordinary.maxHp * 0.4;
  assert(g.enemySupportHeal(healer), 'ordinary recipient remains treatable');
  assert(ordinary.supportHeal, 'ordinary recipient got second cast');
  assert(!leader.supportHeal, kind + ' guarded from premature leader refresh');
  cases++;
}
// A leader remains eligible at the old ten-second interval even when a source
// has a shorter ordinary cast clock (no synthetic change to recipient stats).
{
  const { g, mob } = scene();
  const source = mob('skeleton', 300, { ranged: true, aggro: false });
  const leader = mob('orc', 320, { hp: 400, captain: true, roomCaptain: true, captainProfile: 'fixture-no-healing-profile', aggro: false });
  assert(g.enemySupportHeal(source));
  // The original pulse is transient; this case tests the separate leader
  // eligibility interval, not the previously audited idle-recipient defect.
  delete leader.supportHeal;
  g.updateEnemies(7);
  near(source.supportHealCd, 0, 'ordinary clock recovered in seven seconds');
  assert(!leader.supportHeal, 'leader must not receive seven-second recast: ' + JSON.stringify({ sourceCd: source.supportHealCd, sourceAggro: source.aggro, leaderAggro: leader.aggro, heal: leader.supportHeal, time: g.s.time }));
  // Prove the leader's own interval still blocks a direct cast at seven
  // seconds, with the ordinary caster ready and all geometry/action gates open.
  source.returning = 0;
  source.motion = null;
  source.telegraph = null;
  source.rangedAim = null;
  source.x = 300;
  source.y = 300;
  leader.x = 320;
  leader.y = 300;
  leader.returning = 0;
  leader.hp = leader.maxHp * 0.4;
  assert(g.enemyHealTeammate(source, leader) && g.enemyNeedsSupportHeal(leader, source) && g.line(source, leader), 'leader is otherwise eligible at seven seconds');
  assert(!g.enemySupportHeal(source), 'separate ten-second leader interval blocks an otherwise legal cast at seven seconds');
  assert(!leader.supportHeal, 'no premature leader treatment is queued');
  // Isolate the per-source leader clock from the live AI: a freely available
  // ordinary cast can automatically heal this leader at the ten-second tick,
  // consuming the very opportunity the manual assertion intends to test.
  source.supportHealCd = 4;
  g.updateEnemies(3);
  // Only test the per-source leader clock here. A long world update can put an
  // actor into ordinary return/aim/motion, which blocks the *action* even
  // after the clock has expired; those behavior gates are tested separately.
  source.returning = 0;
  source.motion = null;
  source.telegraph = null;
  source.rangedAim = null;
  source.supportHealCd = 0;
  // World-level aggression can move the caster far from this stationary
  // captain during a long simulated tick. Restore cast geometry so this
  // assertion measures the ten-second leader clock rather than range.
  source.x = 300;
  source.y = 300;
  leader.x = 320;
  leader.y = 300;
  leader.returning = 0;
  leader.hp = leader.maxHp * 0.4;
  delete leader.supportHeal;
  assert(
    g.enemySupportHeal(source),
    'leader interval expires after ten recovered seconds: ' +
      JSON.stringify({
        sourceHp: source.hp,
        leaderHp: leader.hp,
        inRoster: g.zone().enemies.includes(source) && g.zone().enemies.includes(leader),
        sourceAggro: source.aggro,
        sourceNeutral: source.neutral,
        sourceSkill: g.enemyHealProfile(source),
        silenced: g.mageSilenceActive(source),
        gap: Math.hypot(source.x - leader.x, source.y - leader.y),
        visible: g.line(source, leader),
        recovery: source.supportHealCd,
        slow: source.slow,
        returning: source.returning,
        leaderReturning: leader.returning,
        zone: g.zoneId,
      }),
  );
  assert(leader.supportHeal, 'leader receives its next legal ten-second treatment');
  near(leader.supportHeal.remaining, leader.maxHp * 0.05 * g.enemyHealMultiplier(source), 'leader remains on original budget');
  cases++;
}
// Boss and captain CASTERS themselves stay at the original 5% / 5s / 10s,
// even when treating an ordinary wounded monster.
for (const kind of ['captain', 'boss']) {
  const { g, z, mob } = scene();
  const ally = mob('wolf', 320, { hp: 400 });
  let source;
  if (kind === 'boss') {
    source = g.bossEnemy(g.boss('crypt'), 'normal', { x: 300, y: 300 });
    source.aggro = true;
    z.enemies.push(source);
  } else source = mob('goblin', 300, { roomCaptain: true, captain: true, captainProfile: 'supply-vale' });
  assert(g.enemySupportHeal(source), kind + ' authored healer still works');
  near(ally.supportHeal.remaining, ally.maxHp * 0.05 * g.enemyHealMultiplier(source), 'leader caster original budget');
  near(ally.supportHeal.seconds, 5, 'leader caster original duration');
  near(source.supportHealCd, 10, 'leader caster original cooldown');
  cases++;
}
// Ordinary melee sources remain non-healers; no new persisted fields.
{
  const { g, mob } = scene();
  const melee = mob('goblin', 300, { ranged: false });
  mob('wolf', 320, { hp: 400 });
  assert(!g.enemySupportHeal(melee));
  const snapshot = g.snapshot();
  assert(snapshot.zones[snapshot.zone].enemies.every(u => !('supportHeal' in u) && !('supportHealCd' in u) && !('leaderSupportHealCd' in u)));
  cases++;
}
console.log('PASS ' + cases + ' full ordinary healing: 12 species, cross-species support, leader isolation, three-second recovery and save shape');

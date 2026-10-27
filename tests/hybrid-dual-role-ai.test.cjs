'use strict';
// Both halves of hybrid AI remain active: ranged healing/space management,
// melee commitment/pursuit, and native recovery/special priorities.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const R = Campaign.rules;
assert.equal(R.balance.eliteMeleeBasicRange, R.meleeReach.elite);
assert.equal(R.rangedEnemyCombat.ringleaderHybridMeleeRange, R.meleeReach.ringleaderHybridStance);
assert.equal(R.rangedEnemyCombat.hybridBackstepCooldown, 5.5);
assert(R.rangedEnemyCombat.hybridBackstepSeconds > 0);

function scene() {
  const c = new Campaign('normal', 'ranger', () => 0.9);
  c.enter('vale');
  // Select a real native corridor with room to withdraw, not a mocked
  // teleport or an obstacle-ignoring move.
  let from, to;
  for (const [x, y] of [
    [1700, 1800], [2200, 1700], [2100, 2300],
    [1500, 2450], [2650, 2450], [1750, 2700],
  ]) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = { x, y }, b = { x: x + dx * Math.min(100, Math.max(20, R.meleeReach.ringleaderHybridStance - 5)), y: y + dy * Math.min(100, Math.max(20, R.meleeReach.ringleaderHybridStance - 5)) };
      const retreat = { x: x - dx * 125, y: y - dy * 125 };
      if (c.blocked(a.x, a.y, 'vale', 15) ||
          c.blocked(b.x, b.y, 'vale', 15) ||
          c.blocked(retreat.x, retreat.y, 'vale', 15) ||
          !c.line(a, b) || !c.clearSegment(a, retreat, 12)) continue;
      from = a; to = b;
      break;
    }
    if (from) break;
  }
  assert(from && to, 'native Greenwood space must permit a safe hybrid withdrawal');
  const e = c.makeEnemy({
    species: 'skeleton', name: 'Hybrid ringleader test',
    form: 'ringleader', level: 3, hp: 2000, damage: 10,
    gold: 0, xp: 0,
  }, from);
  e.ranged = true;
  e.hybrid = true;
  e.shotRange = 350;
  c.zone().enemies = [e];
  c.s.party = [];
  Object.assign(c.hero, { ...to, hp: 10000, maxHp: 10000 });
  c.s.mercyTime = 0;
  c.s.time = 30;
  c.engage(e);
  e.aggro = true;
  e.returning = 0;
  e.telegraph = null;
  e.motion = null;
  e.rangedAim = null;
  return { c, e };
}

{
  const { c, e } = scene();
  assert.equal(c.enemyHealProfile(e), 'Bonebind',
    'a melee-capable hybrid retains its native ranged team-healing role');
  assert.equal(c.enemyMeleeBasicRange(e), R.meleeReach.elite,
    'hybrid ringleaders inherit the tuned elite melee basic reach');
  assert(!c.meleePursuitBurstEligible(e),
    'ranged-capable hybrid Ringleaders keep original renewal in this strict melee rollout');
  e.cd = 0;
  const x = e.x, y = e.y;
  assert(!c.enemyHybridBackstep(e, c.hero, 0.1, 500),
    'a ready melee basic cannot be postponed by automatic defensive retreat');
  assert.deepEqual([e.x, e.y], [x, y]);
  e.cd = 0.9;
  const before = Math.hypot(c.hero.x - e.x, c.hero.y - e.y);
  assert(c.enemyHybridBackstep(e, c.hero, 0.1, 500),
    'hybrids get ranged evasive footwork while melee is recovering');
  assert(Math.hypot(c.hero.x - e.x, c.hero.y - e.y) > before,
    'defensive movement uses the real actor position');
  e.telegraph = { kind: 'circle', timer: 0.4, total: 0.4 };
  assert(!c.enemyHybridBackstep(e, c.hero, 0.1, 500),
    'committed warnings cannot be interrupted by hybrid backstep');
  e.telegraph = null;
  e.rangedAim = { timer: 0.25, total: 0.25 };
  assert(!c.enemyHybridBackstep(e, c.hero, 0.1, 500),
    'a hybrid cannot withdraw while already committing to a ranged shot');
  e.rangedAim = null;
  c.s.time += 0.5;
  for (let i = 0; i < 10; i++) c.enemyHybridBackstep(e, c.hero, 0.1, 500);
  const cooldownPosition = { x: e.x, y: e.y };
  c.hero.x = e.x + (toFinite(c.hero.x - e.x) >= 0 ? 1 : -1) * 60;
  c.hero.y = e.y;
  assert(!c.enemyHybridBackstep(e, c.hero, 0.1, 500),
    'backstep does not endlessly repeat inside its separate five-second cooldown');
  assert.deepEqual([e.x, e.y], [cooldownPosition.x, cooldownPosition.y]);
}
function toFinite(n) { return Number.isFinite(n) ? n : 0; }

{
  // The same hybrid can re-engage at melee distance and can still shoot from
  // beyond its tuned stance switch; the backstep is not a new permanent role.
  const { c, e } = scene();
  const near = { x: c.hero.x, y: c.hero.y };
  e.cd = 0;
  e.specialCd = 100;
  c.updateEnemies(0.1);
  assert(!e.rangedAim, 'inside tuned melee stance, hybrid should choose close combat');
  c.hero.x = e.x + (near.x - e.x) * 3;
  c.hero.y = e.y + (near.y - e.y) * 3;
  e.cd = 0;
  e.telegraph = null;
  e.motion = null;
  // Isolate the role choice from unrelated field encounter or Rogue clocks.
  // Above the switch but inside native projectile reach, a hybrid retains
  // the same ranged basic release as a pure ranged actor.
  const gap = Math.hypot(c.hero.x - e.x, c.hero.y - e.y);
  assert(gap > c.enemyHybridMeleeRange(e) && gap < c.enemyRangedRange(e),
    'test target is outside melee stance but inside ranged basic reach');
  c.enemyStartBasic(e, c.hero, true);
  assert(e.rangedAim,
    'hybrid retains the native ranged aim and launch above melee threshold');
}

console.log('PASS dual-role hybrids: ranged healing, recovery-only backstep, elite melee, role switch and no cast conflict');

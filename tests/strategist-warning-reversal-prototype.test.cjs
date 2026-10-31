'use strict';

// Nonproduction native Campaign proof. This test deliberately makes an
// unsupported class identity in memory to exercise the core receipt path;
// no fifth hero can be selected, loaded or saved from this branch.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');

function scene(family) {
  const g = new C('normal', 'paladin', () => 0.9);
  g.enter(family);
  g.s.mercyTime = 0;
  const z = g.zone();
  z.enemies = [];
  const index = family === 'mine' ? 0 : 1;
  // Search a small deterministic space in the REAL generated dungeon. No
  // fabricated terrain, collision bypass, synthetic warning, or renderer hitbox.
  for (let x = 280; x <= 1160; x += 110)
    for (let y = 260; y <= 1130; y += 110) {
      const origin = { x, y };
      const target = { x: x + 220, y };
      const onWarning = family === 'mine'
        ? { ...target }
        : { x: x + 150, y: y + 85 };
      const buddy = { x: onWarning.x + 9, y: onWarning.y + 5 };
      if ([origin, target, onWarning, buddy].some((p) =>
        g.blocked(p.x, p.y, family, 15))) continue;
      if (!g.line(origin, onWarning) || !g.line(origin, target)) continue;
      const boss = g.bossEnemy(g.boss(family), 'normal', origin);
      const warning = g.buildBossAttack(boss, index, target, false).first;
      g.prepareGroundAttack(boss, warning);
      if (!g.strategistReversalCovers(warning, onWarning) ||
          !g.strategistReversalCovers(warning, buddy)) continue;
      z.enemies = [boss];
      Object.assign(g.hero, onWarning, {
        class: 'strategist', hp: 2000, maxHp: 2000, immune: 0, keeperHeld: null,
      });
      const soldier = g.s.party.find((p) => p.type === 'soldier');
      assert(soldier, 'starter party remains present');
      Object.assign(soldier, buddy, { hp: 2000, maxHp: 2000, active: true, immune: 0 });
      for (const ally of g.s.party.filter((p) => p !== soldier))
        ally.active = false;
      boss.telegraph = warning;
      boss.aggro = true;
      assert.equal(warning.index, index);
      return { g, boss, warning, soldier };
    }
  throw Error('No open actual ' + family + ' dungeon positions with authentic warned impact');
}

for (const family of ['mine', 'archive']) {
  const { g, boss, warning, soldier } = scene(family);
  const hp = g.hero.hp, allyHp = soldier.hp, bossHp = boss.hp;
  assert(warning.timer > 0 && warning.total >= warning.timer);
  assert.equal(g.attemptStrategistReversal('not-the-source'), false);
  assert.equal(g.attemptStrategistReversal(boss.id), true,
    family + ': deliberate entry into actual native warning accepts one response');
  assert.equal(g.attemptStrategistReversal(boss.id), false,
    'duplicate command does not requeue or multiply the reversal');
  warning.timer = 0; // Real updateEnemies calls resolveAttack at this deadline.
  g.resolveAttack(boss);
  assert.equal(g.hero.hp, hp, 'successful reversal protects hero from all source effects');
  assert.equal(soldier.hp, allyHp, 'successful reversal protects companion in that same area');
  assert(boss.hp < bossHp, 'enemy is injured by its own redirected attack');
  assert(g.effects.some((e) => e.type === 'strategistReversal'),
    'native reversal effect receipt is emitted');
  assert(!warning.strategistReversal, 'receipt consumed on release');

  // An identical unreversed native warning still harms BOTH occupants.
  const baseline = scene(family);
  baseline.warning.timer = 0;
  baseline.g.resolveAttack(baseline.boss);
  assert(baseline.g.hero.hp < hp, family + ': ordinary warning still hurts the hero');
  assert(baseline.soldier.hp < allyHp,
    family + ': ordinary warning still hurts companions');

  // Presence, timing and class selection really gate the technique.
  const outside = scene(family);
  Object.assign(outside.g.hero, { x: outside.boss.x - 120, y: outside.boss.y - 120 });
  assert.equal(outside.g.attemptStrategistReversal(outside.boss.id), false,
    'standing outside native warned footprint cannot negate it');
  const late = scene(family);
  late.warning.timer = 0;
  assert.equal(late.g.attemptStrategistReversal(late.boss.id), false,
    'late command cannot retroactively cancel damage');
  const invalidClass = scene(family);
  invalidClass.g.hero.class = 'paladin';
  assert.equal(invalidClass.g.attemptStrategistReversal(invalidClass.boss.id), false,
    'original hero classes cannot use the fifth-class technique');
  const incapacitated = scene(family);
  incapacitated.g.hero.hp = 0;
  assert.equal(incapacitated.g.attemptStrategistReversal(incapacitated.boss.id), false,
    'fallen hero cannot reverse pending warnings');

  const distinct = scene(family);
  assert.equal(distinct.g.attemptStrategistReversal(distinct.boss.id), true);
  const previous = distinct.warning;
  // The next warning is a fresh genuine attack instance, even from the same boss.
  const next = distinct.g.buildBossAttack(distinct.boss,
    family === 'mine' ? 0 : 1,
    { x: distinct.g.hero.x, y: distinct.g.hero.y }, false).first;
  distinct.g.prepareGroundAttack(distinct.boss, next);
  distinct.boss.telegraph = next;
  assert.notEqual(next, previous);
  assert(!next.strategistReversal,
    'reversal does not passively shield subsequent warnings from the same enemy');
  assert.equal(distinct.g.attemptStrategistReversal(distinct.boss.id),
    distinct.g.strategistReversalCovers(next, distinct.g.hero),
    'a second authentic warning needs its own independently timed response');
  console.log('PASS Strategist ' + family +
    ' single-warning reversal, party protection, rebound and rejection gates');
}

// A successful counter cannot turn an unrelated healing / summon / charge
// warning into a free enemy-damage button. Original four classes remain inert.
const other = scene('mine');
other.boss.telegraph = other.g.buildBossAttack(other.boss, 4, other.g.hero, false).first;
other.g.prepareGroundAttack(other.boss, other.boss.telegraph);
assert.equal(other.g.attemptStrategistReversal(other.boss.id), false);
assert.equal(C.classes.strategist, undefined, 'no fifth-class admission');
assert.equal(C.classFoundationFor('strategist'), null, 'no hidden fifth-class foundation');
assert.throws(() => new C('normal', 'strategist'), /Unknown mode or class/);
console.log('PASS unsupported special excluded; no playable fifth class introduced');

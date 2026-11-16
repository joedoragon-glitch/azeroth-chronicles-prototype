'use strict';
// #895: Real native hostile melee release/cooldown, isolated from unrelated
// specials, plus an unforced boss/captain action-priority observation.
// This is not an owner-device balance or full-campaign acceptance test.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;
const close = (actual, expected, note) =>
  assert(Math.abs(actual - expected) < 1e-8, note + ': ' + actual + ' vs ' + expected);

assert.equal(R.balance.enemyOrdinaryMeleeBasicInterval, 0.8);
assert.equal(R.balance.enemyCaptainMeleeBasicInterval, 0.75);
assert.equal(R.bossCadence.basicCooldown, 0.75, 'boss basic recovery unchanged');
assert.equal(R.balance.companions.petBasicInterval, 0.85, 'pet cadence unchanged');
assert.equal(R.balance.companions.charmedMeleeBasicIntervalCeiling, 0.8,
  'owner-approved Charmed melee baseline matches the ordinary hostile');

function scene(attrs = {}, clock = 100, gap = 50) {
  const g = new Campaign('normal', 'paladin', () => 0.9);
  const z = g.zone();
  z.props = [];
  z.enemies = [];
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  g.s.thornHeroInitiated = true;
  g.s.clock = clock;
  g.s.time = 30;
  // Reuse a tested real same-bank corridor; never disable native collision.
  const p = { x: R.barriers[0].bounds[1] + 400, y: 1700 };
  assert(!g.blocked(p.x, p.y), 'native enemy start is walkable');
  assert(!g.blocked(p.x + gap, p.y), 'native hero start is walkable');
  assert(g.clearSegment(p, { x: p.x + gap, y: p.y }), 'real clear lane');
  const e = g.makeEnemy({
    species: 'goblin', family: attrs.type === 'boss' ? 'crypt' : null,
    name: 'Melee cadence fixture', type: attrs.type || 'mob',
    level: 5, hp: 20000, damage: 5, gold: 0, xp: 0,
  }, p);
  Object.assign(e, attrs);
  z.enemies = [e];
  Object.assign(g.hero, {
    x: p.x + gap, y: p.y, hp: 10000000, maxHp: 10000000, immune: 0,
  });
  g.engage(e);
  assert(e.aggro && g.line(e, g.hero), 'native enemy actually engaged');
  return { g, e };
}

function observe(attrs, options = {}) {
  const dt = options.dt || 0.05, duration = options.duration || 4.2;
  const { g, e } = scene(attrs, options.clock ?? 100, options.gap ?? 50);
  if (options.specialsDisabled) e.specialCd = 999;
  if (options.slow) e.slow = options.slow;
  const starts = [], warnings = [], oldBasic = g.enemyStartBasic,
    oldSpecial = g.startAttack, oldCaptain = g.startCaptainAttack;
  g.enemyStartBasic = function (actor, target, ranged) {
    const before = g.hero.hp;
    const result = oldBasic.call(this, actor, target, ranged);
    if (actor === e) starts.push({
      time: g.s.time, ranged: !!ranged, hit: g.hero.hp < before,
      cooldown: actor.cd,
    });
    return result;
  };
  g.startAttack = function (actor, ...args) {
    const success = oldSpecial.call(this, actor, ...args);
    if (actor === e && success) warnings.push({ time: g.s.time, type: 'boss' });
    return success;
  };
  g.startCaptainAttack = function (actor, ...args) {
    const success = oldCaptain.call(this, actor, ...args);
    if (actor === e && success) warnings.push({ time: g.s.time, type: 'captain' });
    return success;
  };
  for (let i = 0; i < Math.round(duration / dt); i++) {
    g.s.time += dt;
    g.updateEnemies(dt);
    assert(e.hp > 0 && g.hero.hp > 0, 'fixture actors stay alive for the full cadence');
  }
  return { g, e, starts, warnings };
}

for (const [name, attrs, base] of [
  ['ordinary', {}, 0.8],
  ['guardian', { guard: true }, 0.8],
  ['ringleader', { form: 'ringleader' }, 0.8],
  ['captain', { captain: true, captainProfile: 'frontier-overseer' }, 0.75],
  ['room captain', { roomCaptain: true, captainProfile: 'supply-vale' }, 0.75],
  ['field captain', { fieldCaptain: true, captainProfile: 'frontier-overseer' }, 0.75],
]) {
  for (const dt of [0.05, 0.1, 0.2]) {
    const { g, starts, warnings } = observe(attrs, { dt, specialsDisabled: true });
    close(g.nightTempo(), 1, name + ' daylight tempo');
    assert.equal(warnings.length, 0, name + ' skill isolate leaves native basics');
    assert(starts.length >= 4, name + ' launches repeated native basics at dt ' + dt);
    assert(starts.every((hit) => !hit.ranged && hit.hit),
      name + ' deals actual melee contact damage without skipped hits');
    for (const hit of starts) close(hit.cooldown, base, name + ' native cooldown');
    for (let i = 1; i < starts.length; i++) {
      const gap = starts[i].time - starts[i - 1].time;
      assert(gap + 1e-7 >= base && gap <= base + dt + 1e-7,
        name + ' actual hit gap ' + gap + ' within one simulation step of ' + base);
    }
  }
}

for (const [attrs, base] of [
  [{}, R.balance.enemyOrdinaryMeleeBasicInterval],
  [{ captain: true, captainProfile: 'frontier-overseer' },
    R.balance.enemyCaptainMeleeBasicInterval],
]) {
  const normal = observe(attrs, { specialsDisabled: true });
  const night = observe(attrs, { specialsDisabled: true, clock: 500 });
  close(night.g.nightTempo(), 1.1, 'night native monster bonus');
  close(night.starts[0].cooldown, base / 1.1,
    'night cooldown applies after new hostile-only base');
  assert(night.starts.length >= normal.starts.length,
    'night cannot reduce ordinary melee attack frequency');
  const slowed = observe(attrs, { specialsDisabled: true, slow: 0.7 });
  assert(slowed.starts[1].time > normal.starts[1].time,
    'hostile Slow delays real second basic contact');
  assert(slowed.e.slow === 0, 'Slow expiry is not permanent');
}

{
  const { g, e } = scene({ ranged: true, shotRange: 280 });
  g.enemyStartBasic(e, g.hero, true);
  close(e.cd, 1.4, 'original hostile ranged aim admission is unchanged');
  close(e.rangedAim.timer, R.rangedEnemyCombat.aimTime,
    'physical shot warning retains exact original aim time');
}
{
  const { g, e } = scene({ type: 'boss', family: 'crypt' });
  g.enemyStartBasic(e, g.hero, false);
  close(e.cd, 0.75, 'boss basic timer is preserved');
}
{
  const { g } = scene();
  const soldier = g.unit('soldier', g.hero.x + 15, g.hero.y);
  close(g.companionBasicInterval(soldier), 0.85, 'hired Soldier has no enemy buff');
  close(g.basicSkillCooldown(), 0.85, 'Paladin basic remains unmodified');
  g.hero.talents[1] = 5;
  close(g.basicSkillCooldown(), 0.68, 'hero earned CDR remains a separate path');
}

// Unforced observations: do not preseed boss.basicDue or remove its skills.
// Skill priority and telegraphs decide when a legitimate basic can occur.
for (const [name, attrs] of [
  ['captain', { captain: true, captainProfile: 'frontier-overseer' }],
  ['Crypt boss', { type: 'boss', family: 'crypt' }],
]) {
  const { starts, warnings, e } = observe(attrs, { duration: 24 });
  assert(warnings.length > 0, name + ' starts real specials naturally');
  assert(starts.length > 0, name + ' can also reach a real unscripted basic');
  assert(starts.some((hit) => hit.hit && !hit.ranged),
    name + ' damaging melee basic is distinct from authored skill');
  console.log('MELEE_895_UNFORCED ' + JSON.stringify({
    actor: name, specialStarts: warnings.length,
    basicStarts: starts.length, firstBasicAt: starts[0].time,
    finalBasicDue: !!e.basicDue,
  }));
}
console.log('PASS #895 native ordinary/elite/captain melee timing, night/Slow, Charmed isolation, hero independence and unforced basic fallback');

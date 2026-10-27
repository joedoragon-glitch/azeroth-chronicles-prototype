'use strict';
// Issue #510 vs staged PR #508: native ordinary/Ringleader 500-unit
// damage/chase/reset symmetry, and explicit isolation of the pre-existing
// 900/1300-unit summon/Overtime mismatch. Characterization, not a reset fix.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function lane() {
  const g = new Campaign('normal', 'ranger', () => 0.9);
  g.enter('vale');
  const z = g.zone();
  z.enemies = [];
  z.props = [];
  z.buildings = [];
  g.s.party = [];
  g.s.time = 30;
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  g.s.thornHeroInitiated = true;
  Object.assign(g.hero, { hp: 10000, maxHp: 10000, level: 3, slow: 0 });
  // Isolate normal encounter boundaries: Rogue and sidestep have independent
  // regression suites. No runtime source or decision formula is modified.
  g.tacticalAutoRogue = () => false;
  const homes = [
    [1400, 1700], [1800, 1800], [2200, 1700], [2300, 2200],
    [2600, 1500], [1300, 2500], [1900, 2600], [800, 1800],
    [1900, 900], [900, 2200],
  ];
  for (const [x, y] of homes) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const home = { x, y };
      const a = { x: x + dx * 420, y: y + dy * 420 };
      const b = { x: x + dx * 480, y: y + dy * 480 };
      const c = { x: x + dx * 540, y: y + dy * 540 };
      const d = { x: x + dx * 600, y: y + dy * 600 };
      if ([home, a, b, c, d].some(p => g.blocked(p.x, p.y, 'vale', 15))) continue;
      if (!g.line(home, a) || !g.line(a, b) || !g.line(c, d) ||
          !g.clearSegment(home, c, 15)) continue;
      return { g, z, home, innerEnemy: a, innerHero: b,
        outerEnemy: c, outerHero: d };
    }
  }
  assert.fail('missing unobstructed real 600-unit Greenwood lane');
}

function actor(form = 'normal') {
  const f = lane();
  const e = f.g.makeEnemy({
    species: 'goblin', name: 'strict encounter audit', form,
    level: 3, hp: 5000, damage: 1, gold: 0, xp: 0,
  }, f.home);
  e.ranged = false;
  e.hybrid = false;
  e.cd = 100;
  e.specialCd = 100;
  f.z.enemies = [e];
  Object.assign(f.g.hero, f.innerHero);
  assert(f.g.engage(e) !== false);
  assert(e.aggro);
  return { ...f, e };
}
function position(f, enemy, hero) {
  Object.assign(f.e, enemy);
  Object.assign(f.g.hero, hero);
  assert.equal(Math.round(distance(f.g.hero, f.e)), 60);
  assert(f.g.line(f.g.hero, f.e));
}
for (const form of ['normal', 'ringleader']) {
  const f = actor(form), { g, e } = f;
  assert(g.meleePursuitBurstEligible(e), form + ' native melee eligible');
  position(f, f.innerEnemy, f.innerHero);
  assert(g.tacticalRogueLeashAllows(e, g.hero, 500));
  const hp = e.hp;
  assert(g.damage(e, 13, 'hero'), form + ' accepts valid hit inside 500');
  assert(e.hp < hp);
  position(f, f.outerEnemy, f.outerHero);
  assert(!g.tacticalRogueLeashAllows(e, g.hero, 500),
    form + ' cannot chase beyond native 500-unit home leash');
  assert(!g.damage(e, 13, 'hero'),
    form + ' no damage beyond native legal encounter');
  g.s.time += 0.1;
  g.updateEnemies(0.1);
  assert(e.returning > 0, form + ' actually begins disengaging outside 500');
  assert(!g.meleePursuitBurstEligible(e), form + ' no enhanced burst while returning');
  assert(!g.damage(e, 13, 'hero'), form + ' return phase protected');
  g.disengage(e, 1.1);
  assert.equal(e.returning, 0);
  assert.equal(e.aggro, false);
  assert.equal(e.hp, e.baseHp);
  assert.equal(e.pursuitBurstUsed, false);
  assert.equal(e.pursuitBurstReadyAt, undefined);
  assert.deepEqual({ x: e.x, y: e.y }, e.home);
  assert(!g.meleePursuitBurstEligible(e), form + ' no cooldown leak across reset');
  console.log('PASS #508 ' + form + ': legal hit/leash, real return, HP and burst reset');
}
{
  const f = actor(), { g, e } = f;
  e.summon = true;
  assert(!g.meleePursuitBurstEligible(e), 'every summon excluded, including ordinary-owner');
  position(f, f.outerEnemy, f.outerHero);
  assert(g.tacticalRogueLeashAllows(e, g.hero, 900),
    'legacy summoned chase remains 900; no pursuit territory was modified');
  assert(!g.damage(e, 13, 'hero'),
    'existing 500/900 incoming-damage defect remains and is not fixed by #508');
  g.s.time += 0.1;
  g.updateEnemies(0.1);
  assert(e.aggro && !e.returning, 'native summon may still engage at 600');
  assert(!g.meleePursuitBurstEligible(e), 'legacy summon never inherits 2s recovery');
  console.log('PASS #508 summon: preexisting outer-band asymmetry unchanged, enhancement excluded');
}
{
  const f = actor(), { g, e } = f;
  e.quotaOvertime = 9;
  e.pursuitBurst = 4;
  assert(!g.meleePursuitBurstEligible(e), 'captain Overtime worker excluded');
  position(f, f.outerEnemy, f.outerHero);
  assert(g.tacticalRogueLeashAllows(e, g.hero, 1300),
    'Overtime 1300-unit encounter territory unchanged');
  assert(!g.damage(e, 13, 'hero'),
    'preexisting Overtime damage mismatch not silently changed');
  g.s.time += 0.1;
  g.updateEnemies(0.1);
  assert(!g.meleePursuitBurstEligible(e), 'Overtime not newly eligible after tick');
  assert(e.pursuitBurst > 0, 'existing Overtime burst survives unchanged');
  console.log('PASS #508 captain Overtime: 1300 original leash, existing 4s burst, enhancement excluded');
}
console.log('PASS #508 vs #510: strict melee expansion introduces no new damage-leash/reset mismatch');

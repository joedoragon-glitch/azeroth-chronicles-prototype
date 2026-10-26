'use strict';
// Greenwood anti-kiting correction: one native Pursuit Burst, reused sooner.
// No Vale-specific dash, warning, strike, Slow, or new movement timer.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const pursuit = Campaign.rules.balance.pursuit;
const melee = Campaign.rules.meleeReach;

assert.equal(pursuit.burstMultiplier, 1.5, 'the native speed formula must not change');
assert.equal(pursuit.burstSeconds, 1.2, 'the native burst duration must not change');
assert.equal(pursuit.valeRecoverySeconds, 0.5, 'brief native pursuit recovery');
assert.equal(Campaign.rules.balance.meleeBasicRange, melee.enemy);
assert.equal(Campaign.rules.rangedEnemyCombat.ringleaderHybridMeleeRange, melee.ringleaderHybridStance);
assert.equal(typeof Campaign.prototype.startValeMeleeCounter, 'undefined',
  'the old separate anti-kite cast was retired');
assert.equal(typeof Campaign.prototype.advanceValeMeleeCounter, 'undefined');
assert.equal(Campaign.valeMeleeCounter, undefined, 'no duplicate tuning mechanism');

function scene(region = 'vale', species = 'goblin', guard = false) {
  const c = new Campaign('normal', 'ranger', () => 0.9);
  c.enter(region);
  const z = c.zone();
  const candidates = [
    [1400, 1700], [1800, 1800], [2200, 1700], [2300, 2200],
    [2600, 1500], [1300, 2500], [1900, 2600],
  ];
  let first = null, last = null;
  if (region === 'vale') {
    for (const [x, y] of candidates) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = { x, y }, b = { x: x + dx * 350, y: y + dy * 350 };
        if (!c.blocked(a.x, a.y, region, 15) &&
            !c.blocked(b.x, b.y, region, 15) &&
            c.line(a, b) && c.clearSegment(a, b, 15)) {
          first = a; last = b; break;
        }
      }
      if (first) break;
    }
    assert(first && last, 'use a real Greenwood corridor, not a collision override');
  } else {
    first = { x: 450, y: 450 };
    last = { x: 750, y: 450 };
  }
  const e = c.makeEnemy({
    species, name: 'Native pursuit fixture', form: 'normal',
    level: 3, hp: 2000, damage: 5, gold: 0, xp: 0,
  }, first);
  e.guard = guard;
  e.ranged = false;
  z.enemies = [e];
  c.s.party = [];
  c.s.valeFieldAwakened = true;
  c.s.thornHeroInitiated = true;
  c.s.time = 30;
  c.s.mercyTime = 0;
  Object.assign(c.hero, {
    x: last.x, y: last.y, hp: 10000, maxHp: 10000,
    level: 3, slow: 0,
  });
  // Isolate native pursuit from the separately tested Rogue decision system.
  c.tacticalAutoRogue = () => false;
  c.engage(e);
  return { c, e, first, last };
}
function tick(c, dt = 0.1) {
  c.s.time += dt;
  c.updateEnemies(dt);
}

for (const [species, guard] of [
  ['goblin', false], ['skeleton', false],
  ['goblin', true], ['skeleton', true],
]) {
  const { c, e, first, last } = scene('vale', species, guard);
  assert(c.valePursuitBurstEligible(e), 'native Greenwood melee/guardian is eligible');
  assert.equal(c.enemyMeleeBasicRange(e), melee.enemy);
  const hp = c.hero.hp;
  tick(c);
  assert.equal(e.pursuitBurst, 1.2, 'real combat tick activates the native burst');
  assert(e.pursuitBurstUsed);
  assert(Math.abs(Math.hypot(e.x - first.x, e.y - first.y) - 26.25) < 0.1,
    'native 175 units/s x 1.5 speed, no 1400-unit/s leap');
  assert.equal(e.pursuitBurstReadyAt, c.s.time + 1.7,
    '1.2-second burst plus 0.5-second recovery, not seven seconds');
  assert(!e.telegraph, 'no ground target or warned interception');
  assert(!e.motion, 'no separate rush motion');
  assert.equal(c.hero.slow, 0, 'pursuit cannot apply Slow');
  assert.equal(c.hero.hp, hp, 'distant burst has no remote bonus damage');

  // Sustain out-of-reach pressure in a bounded native corridor. Reposition
  // actors between ticks to isolate pursuit cadence; every tick still moves
  // the native enemy through Campaign.move() and the real collision system.
  let normalSteps = 0, burstStarts = 1, lastBurst = e.pursuitBurst;
  for (let i = 0; i < 32; i++) {
    Object.assign(e, { x: first.x, y: first.y });
    Object.assign(c.hero, { x: last.x, y: last.y });
    tick(c);
    if (e.pursuitBurst === pursuit.burstSeconds && lastBurst <= 0)
      burstStarts++;
    if (e.pursuitBurst <= 0) normalSteps++;
    lastBurst = e.pursuitBurst;
    assert(!e.telegraph);
    assert(!e.motion);
    assert.equal(c.hero.hp, hp);
    assert.equal(c.hero.slow, 0);
    assert(Math.hypot(e.x - first.x, e.y - first.y) <= 26.25 + 0.1,
      'one tick is bounded by the native pursuit formula');
  }
  assert(burstStarts >= 2, 'repeated kiting causes repeat burst within the same engagement');
  assert(normalSteps >= 1, 'the brief ordinary-speed recovery is genuine');
  assert(e.pursuitBurstReadyAt - c.s.time < 1.71,
    'no old seven-second recharge can prevent repeat anti-kiting');
}

{
  const { c, e } = scene('vale', 'skeleton', true);
  assert(c.valePursuitBurstEligible(e), 'eligible before save');
  const snapshot = c.snapshot();
  const restored = Campaign.restore(snapshot);
  const resumed = restored.zone().enemies.find(u => u.id === e.id);
  assert(resumed, 'the v4 enemy remains available after restoration');
  // Saved combat engagement may be reset by the normal restoration policy.
  // Re-engage the surviving actor before testing conditional chase eligibility.
  if (!resumed.aggro) restored.engage(resumed);
  assert(restored.valePursuitBurstEligible(resumed),
    'native pursuit stays available in a restored/re-engaged campaign: ' +
    JSON.stringify({ region: restored.regionIndex(), aggro: resumed.aggro,
      ranged: resumed.ranged, species: resumed.species, returning: resumed.returning }));
}

{
  const { c, e } = scene();
  for (const changes of [
    { ranged: true, hybrid: false }, { form: 'ringleader' },
    { captain: true }, { roomCaptain: true }, { type: 'boss' },
    { summon: true }, { rogueEmergencyReinforcement: true },
    { aggro: false }, { hp: 0 }, { nightOnly: true },
    { species: 'wraith' },
  ]) {
    const old = { ...e };
    Object.assign(e, changes);
    assert(!c.valePursuitBurstEligible(e), JSON.stringify(changes));
    Object.keys(changes).forEach(k => { if (!(k in old)) delete e[k]; });
    Object.assign(e, old);
  }
  e.ranged = true;
  e.hybrid = true;
  assert(c.valePursuitBurstEligible(e), 'true melee/ranged hybrids share the pilot');
  assert.equal(c.enemyHybridMeleeRange(e), melee.enemy, 'hybrid stance remains unchanged');
  e.form = 'ringleader';
  assert(!c.valePursuitBurstEligible(e), 'hybrid Ringleader is excluded');
  const { c: crypt, e: cryptGuardian } = scene('crypt', 'skeleton', true);
  assert(crypt.valePursuitBurstEligible(cryptGuardian), 'Vale dungeon guardians included');
  const { c: march, e: outsider } = scene('march', 'mireling');
  assert(!march.valePursuitBurstEligible(outsider), 'other regions unchanged');
  c.s.phase = 'peace';
  assert(!c.valePursuitBurstEligible(e), 'no burst anti-kiting after peace');
}

{
  // Live engagements loaded from the old seven-second scheduling contract
  // must promptly adopt the corrected cadence, not keep an obsolete delay.
  const { c, e } = scene();
  e.pursuitBurst = 0;
  e.pursuitBurstReadyAt = c.s.time + 7;
  tick(c);
  assert(e.pursuitBurstReadyAt <= c.s.time + 1.7 + 1e-7,
    'old-save long readiness is clamped to the native Vale pursuit cadence');
}

{
  // Existing saves may contain an already-issued old ground warning/motion.
  // On the next simulation tick they must be harmlessly retired, not launched.
  for (const kind of ['telegraph', 'motion']) {
    const { c, e } = scene();
    const hp = c.hero.hp;
    e[kind] = kind === 'telegraph'
      ? { valeMeleeCounter: true, timer: 0.01, recovery: 0.65,
          x: c.hero.x, y: c.hero.y, radius: 100 }
      : { valeMeleeCounter: true, life: 0.6,
          target: { x: c.hero.x, y: c.hero.y }, targetId: 'hero' };
    tick(c);
    assert.equal(e[kind], null, 'retired legacy '+kind);
    assert.equal(c.hero.hp, hp, 'legacy marker cannot cause damage');
    assert.equal(c.hero.slow, 0, 'legacy marker cannot cause Slow');
  }
}

{
  // Ordinary melee contact is still the only native melee-damage path.
  const { c, e } = scene();
  const d = Math.hypot(c.hero.x-e.x, c.hero.y-e.y);
  c.hero.x = e.x + (c.hero.x-e.x) / d * (melee.enemy - 5);
  c.hero.y = e.y + (c.hero.y-e.y) / d * (melee.enemy - 5);
  assert(c.line(e, c.hero));
  e.cd = 0;
  tick(c);
  assert(e.cd > 0, 'native melee basic executes inside tuned reach');
  assert.equal(c.enemyMeleeBasicRange(e), melee.enemy);
  c.hero.class = 'paladin';
  assert.equal(c.heroSkillRange(1, false), 120);
  assert.equal(c.companionCombatReach(c.unit('soldier', 250, 250)), melee.soldier);
  assert.equal(c.companionCombatReach({ type: 'pet' }), melee.pet);
}

console.log('PASS native Greenwood anti-kiting: cadence, speed, no Slow/extra hit, exclusions, saves, and melee basics');

'use strict';
// Narrow Greenwood pilot: repeatable collision-aware melee intercept, not a
// ringleader, captain, boss, ranged, or cross-region balance adjustment.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const cfg = Campaign.valeMeleeCounter;
assert.equal(cfg.cooldownSeconds, 4.5);
assert(cfg.enabled && cfg.warningSeconds > 0 && cfg.travelSpeed > 175);

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
    assert(first && last, 'test uses a real unobstructed native Vale corridor');
  } else {
    first = { x: 450, y: 450 };
    last = { x: 750, y: 450 };
  }
  const e = c.makeEnemy({
    species, name: 'Vale anti-kite test', form: 'normal',
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
    x: last.x, y: last.y, hp: 10000, maxHp: 10000, level: 3,
  });
  c.engage(e);
  return { c, e, z };
}

for (const [species, guard] of [
  ['goblin', false], ['skeleton', false], ['goblin', true], ['skeleton', true],
]) {
  const { c, e } = scene('vale', species, guard);
  assert(c.valeMeleeCounterEligible(e), species + ' melee guard=' + guard);
  assert(!c.startValeMeleeCounter(e, c.hero, 0.1), 'one tick cannot instantly intercept');
  assert(!c.startValeMeleeCounter(e, c.hero, 0.1), 'buildup is real');
  assert(!c.startValeMeleeCounter(e, c.hero, 0.1), 'not yet at threshold');
  assert(c.startValeMeleeCounter(e, c.hero, 0.1), 'repeated ordinary chase gains response');
  const warning = e.telegraph;
  assert(warning?.valeMeleeCounter && warning.kind === 'circle');
  assert.equal(e.specialCd, cfg.cooldownSeconds);
  assert(!c.startValeMeleeCounter(e, c.hero, 0.1), 'cannot overlap own warning');
  const committed = { x: warning.x, y: warning.y };
  c.hero.x += 15;
  assert.deepEqual({ x: warning.x, y: warning.y }, committed,
    'warning locks ground rather than homing after the player turns');
  c.resolveValeMeleeCounter(e, warning);
  e.telegraph = null;
  assert(e.motion?.valeMeleeCounter);
  const before = { x: e.x, y: e.y };
  for (let i = 0; i < 12 && e.motion; i++) c.advanceValeMeleeCounter(e, 0.075);
  assert(!e.motion, 'the intercepted move has a bounded termination');
  assert(Math.hypot(e.x - before.x, e.y - before.y) > 0,
    'a clear native lane allows physical closing distance');
  assert(e.specialCd > 0, 'landing does not erase the independent cooldown');
  assert(!c.startValeMeleeCounter(e, c.hero, 0.1), 'immediate repeat refused');
  // Re-establish an out-of-reach spacing in the same active encounter;
  // the first successful lunge has intentionally closed the original gap.
  Object.assign(e, before);
  Object.assign(c.hero, committed);
  e.specialCd = 0;
  for (let i = 0; i < 5 && !e.telegraph; i++) c.startValeMeleeCounter(e, c.hero, 0.1);
  assert(e.telegraph?.valeMeleeCounter, 'the same actor can initiate again after recovery');
}

{
  // The pilot must be easy to observe but completely unable to change other tiers.
  const { c, e } = scene();
  for (const changes of [
    { ranged: true }, { hybrid: true }, { form: 'ringleader' },
    { captain: true }, { roomCaptain: true }, { type: 'boss' },
    { summon: true }, { rogueEmergencyReinforcement: true },
    { aggro: false }, { hp: 0 }, { nightOnly: true },
    { species: 'wraith' }, { species: 'stalker' },
  ]) {
    const original = { ...e };
    Object.assign(e, changes);
    assert(!c.valeMeleeCounterEligible(e), JSON.stringify(changes));
    // A temporarily introduced exclusion flag must not leak into later cases.
    for (const key of Object.keys(changes)) if (!(key in original)) delete e[key];
    Object.assign(e, original);
  }
  const { c: crypt, e: cryptGuardian } = scene('crypt', 'skeleton', true);
  assert.equal(crypt.regionIndex(), 0, 'the Vale dungeon belongs to Greenwood');
  assert(crypt.valeMeleeCounterEligible(cryptGuardian),
    'native Greenwood dungeon melee guardians share the regional pilot');
  const { c: elsewhere, e: outsider } = scene('march', 'mireling');
  assert(!elsewhere.valeMeleeCounterEligible(outsider), 'no other region');
  c.s.phase = 'peace';
  assert(!c.valeMeleeCounterEligible(e), 'peace disables hostility');
}

{
  // Verify real updateEnemies dispatch, beyond isolated helper calls.
  const { c, e } = scene();
  let observed = false;
  for (let i = 0; i < 12; i++) {
    c.s.time += 0.1;
    c.updateEnemies(0.1);
    if (e.telegraph?.valeMeleeCounter || e.motion?.valeMeleeCounter) {
      observed = true;
      break;
    }
  }
  assert(observed, 'native engaged melee actor initiates a warned anti-kite cast');
  assert(e.specialCd > 0, 'native enemy tick starts the separate recovery clock');
}

{
  // A victim who stays inside a reachable, marked landing must face actual
  // health loss, so this cannot silently devolve into a cosmetic dash.
  const { c, e } = scene();
  e.damage = 100;
  const delta = { x: c.hero.x - e.x, y: c.hero.y - e.y };
  const magnitude = Math.hypot(delta.x, delta.y);
  const marked = { x: e.x + delta.x / magnitude * 125,
    y: e.y + delta.y / magnitude * 125 };
  assert(c.clearSegment(e, marked, 15), 'positive-hit test uses unobstructed terrain');
  Object.assign(c.hero, marked);
  const before = c.hero.hp;
  c.resolveValeMeleeCounter(e, { ...marked, targetId: 'hero', valeMeleeCounter: true });
  for (let i = 0; i < 12 && e.motion; i++) c.advanceValeMeleeCounter(e, 0.075);
  assert(!e.motion, 'committed leap terminates after reaching a reachable mark');
  assert(c.hero.hp < before, 'an undodged, reachable interception must actually hit');
}

{
  const { c, e } = scene();
  const initial = c.hero.hp;
  const warning = {
    x: e.x + 125, y: e.y, targetId: 'hero', valeMeleeCounter: true,
  };
  c.resolveValeMeleeCounter(e, warning);
  c.hero.x = e.x + 350;
  for (let i = 0; i < 12 && e.motion; i++) c.advanceValeMeleeCounter(e, 0.075);
  assert.equal(c.hero.hp, initial, 'a target outside the committed landing escapes damage');
  assert(!e.motion);
  // No hit from an unrealistic instant charge through a solid map barrier.
  const wall = scene();
  wall.c.s.time = 30;
  wall.e.motion = {
    valeMeleeCounter: true,
    target: { x: -50, y: -50 }, targetId: 'hero', life: 0.075,
  };
  const hp = wall.c.hero.hp;
  wall.c.advanceValeMeleeCounter(wall.e, 0.075);
  assert.equal(wall.c.hero.hp, hp, 'blocked/expired movement does not create remote damage');
  assert(!wall.e.motion);
}

{
  const { c, e } = scene();
  const before = c.random;
  c.startValeMeleeCounter(e, c.hero, 0.1);
  assert.equal(c.random, before, 'anti-kite behavior does not consume gameplay RNG');
  c.disengage(e, 1.1);
  assert(!c.valeMeleeCounterEligible(e), 'disengaging actors cannot open fresh intercepts');
}

console.log('PASS Greenwood melee and guardian counter: early and repeatable warning, native closing, dodge, exclusions, cooldown and reset');

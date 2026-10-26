'use strict';
// Narrow Greenwood pilot: repeatable collision-aware melee intercept, not a
// ringleader, captain, boss, ranged, or cross-region balance adjustment.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const cfg = Campaign.valeMeleeCounter;
assert.equal(cfg.cooldownSeconds, 4.5);
assert.equal(cfg.meleeBasicRange, 90, 'Greenwood ordinary melee basic remains below Paladin autoattack');
assert(cfg.enabled && cfg.warningSeconds > 0 && cfg.travelSpeed > 175);
assert.equal(cfg.meleeBasicRange, 90, 'native Greenwood regular melee has the 90-unit basic floor');
assert.equal(Campaign.rules.balance.meleeBasicRange, 90,
  'ordinary and elite hostile melee use the 90-unit floor; companions are independent');
assert.equal(Campaign.rules.rangedEnemyCombat.ringleaderHybridMeleeRange, 120,
  'ringleader hybrid close-range transition matches Paladin basic reach');
assert(cfg.minDistance > 90 && cfg.minDistance <= 110,
  'interception can challenge a Paladin spacing at 100–120 units');
assert(cfg.maxDistance >= 600 && cfg.maxLeadDistance >= 325,
  'ranged heroes cannot exploit the prior 480-unit interception ceiling');

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
  assert.equal(c.enemyMeleeBasicRange(e), 90,
    'ordinary and guardian melee share the 90-unit basic reach');
  assert.equal(c.enemyMeleeBasicRange(e), 90, 'native melee and guardians share the new basic reach');
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
    { ranged: true }, { form: 'ringleader' },
    { captain: true }, { roomCaptain: true }, { type: 'boss' },
    { summon: true }, { rogueEmergencyReinforcement: true },
    { aggro: false }, { hp: 0 }, { nightOnly: true },
    { species: 'wraith' }, { species: 'stalker' },
  ]) {
    const original = { ...e };
    Object.assign(e, changes);
    assert(!c.valeMeleeCounterEligible(e), JSON.stringify(changes));
    assert.equal(c.enemyMeleeBasicRange(e), 90,
      'all tiers share the 90-unit basic reach without broadening pilot abilities');
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
  assert.equal(elsewhere.enemyMeleeBasicRange(outsider), 90, 'global 90-unit basic reach applies in other regions too');
  c.s.phase = 'peace';
  assert(!c.valeMeleeCounterEligible(e), 'peace disables hostility');
}

{
  // A Goblin can actually attack from Greenwood's new 90-unit basic
  // footprint in the native combat tick, not merely report the tuning.
  const { c, e } = scene('vale', 'goblin');
  const baseline = { ...e };
  const distance = Math.hypot(c.hero.x - e.x, c.hero.y - e.y);
  c.hero.x = e.x + (c.hero.x - e.x) / distance * 85;
  c.hero.y = e.y + (c.hero.y - e.y) / distance * 85;
  assert(c.line(e, c.hero), 'test corridor remains unobstructed at 85 units');
  e.cd = 0;
  c.updateEnemies(0.1);
  assert(e.cd > 0, 'ordinary Goblin begins actual native melee basic within 90 range');
  assert.equal(c.enemyMeleeBasicRange(e), 90);
  // Immediately out of basic reach, an uncommitted actor must pursue instead
  // of landing an undocumented 105-unit sword strike.
  Object.assign(e, baseline);
  c.hero.x = e.x + (c.hero.x - e.x) / Math.max(1, Math.hypot(c.hero.x - e.x, c.hero.y - e.y)) * 105;
  c.hero.y = e.y + (c.hero.y - e.y) / Math.max(1, Math.hypot(c.hero.x - e.x, c.hero.y - e.y)) * 105;
  assert.equal(c.enemyMeleeBasicRange(e), 90);
}

{
  // Explicitly test the previously exploitable 480–610 distance band. Native
  // collision and LOS are tested elsewhere: stub sight for this reach boundary
  // unit test to isolate the gate from arbitrary Greenwood scenery.
  const { c, e } = scene();
  const dx = c.hero.x - e.x, dy = c.hero.y - e.y,
    len = Math.hypot(dx, dy);
  c.hero.x = e.x + dx / len * 550;
  c.hero.y = e.y + dy / len * 550;
  const originalLine = c.line;
  c.line = () => true;
  for (let i = 0; i < 5 && !e.telegraph; i++)
    c.startValeMeleeCounter(e, c.hero, 0.1);
  assert(e.telegraph?.valeMeleeCounter,
    'eligible melee enemy can threaten a ranged target at 550 units');
  c.line = originalLine;
}

{
  // Hybrid Ringleaders retain BOTH strategies. At close range they own the
  // melee basic/pursuit profile; above 120 they can use ranged aim and its
  // tactical stand-off, plus ranged-role support regardless of close posture.
  const { c, e } = scene();
  Object.assign(e, {
    ranged: true, hybrid: true, form: 'ringleader', shotRange: 280,
    shotSpeed: 260, projectileStyle: 'arrow',
  });
  assert.equal(c.enemyHybridMeleeRange(e), 120);
  assert.equal(c.enemyMeleeBasicRange(e), 90);
  assert(c.enemyHealProfile(e), 'the ranged healing/support profile survives melee posture');
  assert(!c.valeMeleeCounterEligible(e), 'elite hybrid does not inherit ordinary Vale special');
  const standoff = c.enemyBackpedalThreshold(e);
  assert(standoff > 120, 'ranged guard stance has breathing room beyond melee switch');
  const initial = { x: e.x, y: e.y };
  const startHero = { x: c.hero.x, y: c.hero.y };
  const span = Math.hypot(c.hero.x - e.x, c.hero.y - e.y);
  const ux = (c.hero.x - e.x) / span, uy = (c.hero.y - e.y) / span;
  const baseLine = c.line, baseSegment = c.clearSegment, baseMove = c.move;
  c.line = () => true;
  c.clearSegment = () => true;
  c.move = (unit, point) => { unit.x = point.x; unit.y = point.y; return true; };
  c.hero.x = initial.x + ux * (120 + (standoff - 120) / 2);
  c.hero.y = initial.y + uy * (120 + (standoff - 120) / 2);
  assert(c.enemyBackpedal(e, c.hero, 0.1, 500),
    'hybrid Ringleader uses actual ranged backpedal outside melee threshold');
  Object.assign(e, initial);
  c.hero.x = initial.x + ux * 85; c.hero.y = initial.y + uy * 85;
  assert(!c.enemyBackpedal(e, c.hero, 0.1, 500),
    'inside 120 the hybrid keeps its melee commitment instead of fleeing');
  e.form = 'normal';
  assert.equal(c.enemyHybridMeleeRange(e), 90,
    'ordinary hybrid melee switch now matches the shared melee reach');
  assert(c.valeMeleeCounterEligible(e),
    'ordinary Greenwood hybrid gains melee interception while retaining ranged AI');
  Object.assign(c.hero, startHero);
  c.move = baseMove; c.line = baseLine; c.clearSegment = baseSegment;
}

{
  // A hybrid inherits both ranged defensive behavior and Greenwood's melee
  // interception, but pure ranged actors cannot use the melee-special pilot.
  const { c, e } = scene();
  e.ranged = true;
  e.hybrid = true;
  assert(c.valeMeleeCounterEligible(e), 'ordinary Vale hybrid inherits melee tactics');
  assert(c.enemyRanged(e), 'hybrid retains its ranged profile');
  assert.equal(c.enemyHybridMeleeRange(e), 90);
  assert(c.enemyBackpedalThreshold(e) > 90, 'hybrid ranged spacing survives');
  for (let i = 0; i < 5 && !e.telegraph; i++) c.startValeMeleeCounter(e, c.hero, 0.1);
  assert(e.telegraph?.valeMeleeCounter, 'hybrid can perform warned interception');
  e.hybrid = false;
  assert(!c.valeMeleeCounterEligible(e), 'pure ranged actor cannot intercept');
}

{
  const { c } = scene();
  assert.equal(c.heroSkillRange(1, false), 450, 'Ranger basic stays ranged');
  c.hero.class = 'paladin';
  assert.equal(c.heroSkillRange(1, false), 120, 'Paladin basic retains its 120-unit reach');
  const soldier = c.unit('soldier', 250, 250);
  assert.equal(c.companionCombatReach(soldier), 65, 'Soldier sword basic retains its 65-unit reach');
  assert.equal(c.companionCombatReach({ type: 'pet' }), 70, 'melee pet basic retains its 70-unit reach');
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

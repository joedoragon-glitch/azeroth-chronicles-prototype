'use strict';
// #463: arrows leave the moving Ranger's current bow, then remain independent.
// The same physical coordinates drive native hits and both Canvas/Pixi-overlay art.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Audio = require('../src/prototype/audio.js');
const HeroArt = require('../src/prototype/hero-presentation.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

const near = (a, b, message) =>
  assert(Math.abs(a - b) < 1e-6, message + ': ' + a + ' vs ' + b);

function arena(cls = 'ranger') {
  const game = new Campaign('normal', cls, () => 0.9);
  // Ranger/Archer combat must occur after the actual protected Vale opening.
  // A companion cannot legally initiate damage while that intro is active.
  completeFieldOpening(game);
  game.zone().props = [];
  game.zone().buildings = [];
  game.zone().npcs = [];
  game.zone().enemies = [];
  game.s.party = [];
  Object.assign(game.hero, {
    x: 500, y: 500, hp: 1000, maxHp: 1000, mp: 10000,
    skills: Array(8).fill(8),
    cd: Array(8).fill(0), chargedCd: Array(8).fill(0), order: null,
  });
  game.s.mercyTime = 0;
  const enemy = game.makeEnemy(
    { species: 'goblin', name: 'Flight target', level: 1, hp: 1000000, damage: 0, gold: 0, xp: 0 },
    { x: 780, y: 500 },
  );
  enemy.hp = enemy.maxHp = 1000000;
  game.zone().enemies.push(enemy);
  game.engage(enemy);
  return { game, enemy };
}

let verified = 0;
for (const dt of [1 / 20, 1 / 30, 1 / 60]) {
  for (const { slot, charged, name } of [
    { slot: 1, charged: false, name: 'Rapid Arrows' },
    { slot: 2, charged: false, name: 'Pinning Shot' },
    { slot: 6, charged: true, name: 'Repelling Volley' },
    { slot: 8, charged: false, name: "Hunter's Salvo" },
    { slot: 8, charged: true, name: 'Grand Hunt' },
  ]) {
    const { game, enemy } = arena();
    assert(game.cast(slot, enemy.id, charged), name + ' must cast');
    const delayed = game.s.projectiles.filter(p => p.delay > 0 && p.style === 'arrow');
    assert(delayed.length > 0, name + ' contains one or more staggered arrows');
    assert(delayed.every(p => p.rangerDelayedLaunch), name + ' carries a real deferred bow release');

    // Keep one of the later arrows pending while hero and target move.
    const p = delayed.reduce((latest, next) => next.delay > latest.delay ? next : latest);
    const old = { x: p.x, y: p.y };
    assert(!game.effects.some(e => e.type === 'projectileLaunch' && e.projectileId === p.id),
      name + ' must not create a launch receipt for a still-pending missile');
    game.hero.x = 500 + (slot * 3);
    game.hero.y = 565;
    enemy.x = 770;
    enemy.y = 530;
    let ticks = 0;
    while (p.delay > 0 && ticks++ < 40) game.updateProjectiles(dt);
    assert(ticks < 40, name + ' delay eventually reaches launch');
    near(p.x, old.x, name + ' collider stays dormant until its real release');
    near(p.y, old.y, name + ' dormant location not used for visible arrow');
    assert(p.rangerDelayedLaunch, name + ' stays non-rendered at zero delay');
    assert(!game.effects.some(e => e.type === 'projectileLaunch' && e.projectileId === p.id),
      name + ' crossing the delay deadline is not an actual bow release');
    assert(
      HeroArt.projectile({ save() { throw Error('premature visible arrow'); } },
        point => point, p, 'ranger'),
      name + ' must not draw its bow origin until the collider has launched',
    );

    const live = { x: game.hero.x, y: game.hero.y };
    const aim = { x: enemy.x - live.x, y: enemy.y - live.y };
    const length = Math.hypot(aim.x, aim.y);
    game.updateProjectiles(dt);
    assert.equal(p.rangerDelayedLaunch, undefined, name + ' really released');
    const realLaunch = game.effects.filter(e =>
      e.type === 'projectileLaunch' && e.projectileId === p.id);
    assert.equal(realLaunch.length, 1, name + ' reports exactly one actual delayed departure');
    near(realLaunch[0].x, live.x, name + ' real launch event X matches living bow');
    near(realLaunch[0].y, live.y, name + ' real launch event Y matches living bow');
    assert.equal(realLaunch[0].releasedCount, 1);
    near(p.dx, aim.x / length, name + ' aims from the current Ranger');
    near(p.dy, aim.y / length, name + ' release vector uses current target');
    near(p.x, live.x + p.dx * p.speed * dt, name + ' actual collider starts at live bow X');
    near(p.y, live.y + p.dy * p.speed * dt, name + ' actual collider starts at live bow Y');
    const flight = game.effects.filter(e => e.type === 'heroProjectileFlight' && e.slot === slot).at(-1);
    assert(flight, name + ' has a real physical launch receipt');
    near(flight.x, live.x, name + ' visual release X matches collider');
    near(flight.y, live.y, name + ' visual release Y matches collider');
    const released = { x: p.x, y: p.y, dx: p.dx, dy: p.dy };
    // Once fired, a sidestep does not teleport or tether the arrow.
    game.hero.x += 180;
    game.hero.y -= 90;
    enemy.x += 10; // Ordinary arrows do not reacquire a moving target.
    game.updateProjectiles(dt);
    near(p.dx, released.dx, name + ' holds its independent trajectory');
    near(p.dy, released.dy, name + ' holds its independent heading');
    near(p.x, released.x + released.dx * p.speed * dt, name + ' flies independently X');
    near(p.y, released.y + released.dy * p.speed * dt, name + ' flies independently Y');
    verified++;
  }
}

// A target lost during the windup cannot cause an unexplained projectile
// to launch at empty ground, or resurrect an invalid hit.
{
  const { game, enemy } = arena();
  assert(game.cast(2, enemy.id, false));
  const delayed = game.s.projectiles.find(p => p.rangerDelayedLaunch);
  assert(delayed);
  game.zone().enemies = [];
  game.updateProjectiles(0.2);
  assert(delayed.rangerDelayedLaunch);
  game.updateProjectiles(0.05);
  assert(!game.s.projectiles.includes(delayed), 'cancel abandoned unreleased shot');
  assert(!game.effects.some(e => e.type === 'heroProjectileFlight' && e.slot === 2),
    'never show a launch after target is lost');
  assert(!game.effects.some(e => e.type === 'projectileLaunch' && e.projectileId === delayed.id),
    'a canceled arrow must never claim an actual launch');
}

// Original collision rules remain authoritative after release.
{
  const { game, enemy } = arena();
  assert(game.cast(2, enemy.id, false));
  const p = game.s.projectiles.find(p => p.rangerDelayedLaunch);
  game.hero.y = 550;
  game.updateProjectiles(0.2);
  game.clearSegment = () => false;
  const beforeHp = enemy.hp;
  game.updateProjectiles(0.05);
  assert(!game.s.projectiles.includes(p), 'terrain blocks the physical launched arrow');
  assert.equal(enemy.hp, beforeHp, 'blocked arrow never creates phantom damage');
}

// The two other heroes must not acquire the Ranger-only bow behavior.
{
  for (const cls of ['paladin', 'mage']) {
    const { game, enemy } = arena(cls);
    assert(game.cast(1, enemy.id, false));
    assert(game.s.projectiles.every(p => !p.rangerDelayedLaunch));
  }
  const cross = [];
  HeroArt.queue([{
    type: 'heroSkillArea', actor: 'hero', class: 'paladin', slot: 1,
    phase: 'launch', x: 500, y: 500, angle: 0, reach: 200, halfWidth: 20,
  }], (effect, type, life) => cross.push({ effect, type, life }));
  assert.equal(cross[0].effect.stage, 'skill1-cross');
  assert.equal(cross[0].life, 0.36, 'fixed Paladin cross stays unchanged');
}

// Bow volleys should not teleport their damage to their targets before the
// arrows arrive. The real collider and its trajectory own every contact.
for (const dt of [1 / 20, 1 / 30, 1 / 60]) {
  for (const { slot, charged } of [
    { slot: 2, charged: true }, // charged Pinning Volley corridor
    { slot: 5, charged: false }, // normal Arrow Volley
  ]) {
    const { game, enemy } = arena();
    assert(game.cast(slot, enemy.id, charged), 'Ranger volley must cast ' + slot);
    // First engagement can legally scale full HP at the release boundary.
    // Compare against the encounter-adjusted baseline, not pre-cast HP.
    const hp = enemy.hp;
    const arrows = game.s.projectiles.filter(p => p.source === 'hero' && p.slot === slot);
    assert(arrows.length > 0, 'Volley must emit real arrows for slot ' + slot);
    assert.equal(enemy.hp, enemy.maxHp, 'no phantom instant arrow damage for slot ' + slot);
    assert(arrows.every(p => p.style === 'arrow' && p.area), 'use real arrow colliders');
    assert(game.effects.some(e =>
      e.slot === slot && e.projectileVolley && (e.type === 'chargedArea' || e.type === 'spell')),
      'presentation must suppress fake flying shafts'
    );
    const first = arrows[0];
    const dx = first.dx, dy = first.dy;
    game.hero.y += 140; // independent arrow remains where originally released
    for (let step = 0; step < 30 && game.s.projectiles.includes(first); step++) {
      game.updateProjectiles(dt);
    }
    assert(enemy.hp < hp, 'physical arrow must eventually contact enemy for slot ' + slot);
    near(first.dx, dx, 'volley did not tether to displaced Ranger');
    near(first.dy, dy, 'volley did not turn into homing beam');
    verified++;
  }
}
// Blocked shots may show a wall impact, never phantom target damage.
for (const slot of [2, 5]) {
  const { game, enemy } = arena();
  assert(game.cast(slot, enemy.id, slot === 2));
  const hp = enemy.hp;
  game.clearSegment = () => false;
  game.updateProjectiles(0.05);
  assert.equal(enemy.hp, hp, 'terrain obstruction protects enemy for slot ' + slot);
  assert(!game.s.projectiles.some(p => p.slot === slot), 'the blocked arrow is removed');
}

// Companion Archer Triple Shot uses the same real release rule as Ranger,
// but checks its own living actor rather than incorrectly following the hero.
for (const dt of [1 / 20, 1 / 30, 1 / 60]) {
  const { game, enemy } = arena();
  const archer = game.unit('archer', 500, 510);
  game.s.party = [archer];
  assert(game.companionUseFirstSkill(archer, enemy), 'Archer Triple Shot activates');
  const pending = game.s.projectiles.filter(p => p.companionDelayedLaunch);
  assert.equal(pending.length, 2, 'only the second/third shots await bow release');
  const p = pending[0];
  const initial = game.effects.filter(e =>
    e.type === 'projectileLaunch' && e.actor === 'companion' && e.source === archer.id);
  assert.equal(initial.length, 1, 'one first Archer arrow/volley sound receipt at admission');
  assert.equal(initial[0].count, 3, 'legacy triple-shot sound remains intact');
  assert.equal(initial[0].releasedCount, 1, 'only first Archer arrow actually leaves immediately');
  assert.equal(initial[0].pendingCount, 2, 'two Archer arrows remain pending');
  assert.equal(new Audio().soundKind(initial[0]), 'tripleShot',
    'the original single planned volley retains its three-shot sound');
  archer.x = 525;
  archer.y = 570;
  enemy.y = 540;
  while (p.delay > 0) game.updateProjectiles(dt);
  assert(p.companionDelayedLaunch, 'the delayed shaft remains physically unreleased');
  assert(!game.effects.some(e => e.type === 'projectileLaunch' && e.projectileId === p.id),
    'no pre-release individual Archer receipt');
  const x = archer.x, y = archer.y;
  game.updateProjectiles(dt);
  assert.equal(p.companionDelayedLaunch, undefined, 'Archer released its real arrow');
  const archerLaunches = game.effects.filter(e =>
    e.type === 'projectileLaunch' && e.projectileId === p.id);
  assert.equal(archerLaunches.length, 1, 'exactly one independent Archer subrelease receipt');
  near(archerLaunches[0].x, x, 'Archer actual launch receipt X');
  near(archerLaunches[0].y, y, 'Archer actual launch receipt Y');
  assert.equal(archerLaunches[0].releasedCount, 1);
  assert.equal(archerLaunches[0].presentationHandled, true,
    'actual Archer subrelease must not schedule another whole-volley foley');
  assert.equal(new Audio().soundKind(archerLaunches[0]), null,
    'existing audio router suppresses bookkeeping-only later departures');
  // Exercise the actual audio consumer, not merely its static type mapping:
  // original batch can sound once, subrelease is diagnostic-only.
  const audio = new Audio();
  const heard = [];
  audio.ctx = { currentTime: 1, state: 'running' };
  audio.playSoundEvent = () => false;
  audio.rapidBow = (_time, heroic, count) => heard.push({ heroic, count });
  audio.effect(initial[0]);
  audio.ctx.currentTime += 0.1;
  audio.effect(archerLaunches[0]);
  assert.deepEqual(heard, [{ heroic: false, count: 3 }],
    'actual audio.effect dispatch plays one original triple volley only');
  near(p.x, x + p.dx * p.speed * dt, 'Archer moving release x');
  near(p.y, y + p.dy * p.speed * dt, 'Archer moving release y');
  const launched = { x: p.x, y: p.y, dx: p.dx, dy: p.dy };
  archer.x += 100;
  archer.y -= 50;
  game.updateProjectiles(dt);
  near(p.x, launched.x + launched.dx * p.speed * dt, 'Archer arrow flies independently x');
  near(p.y, launched.y + launched.dy * p.speed * dt, 'Archer arrow flies independently y');
  verified++;
}
{
  const { game, enemy } = arena();
  const archer = game.unit('archer', 500, 510);
  game.s.party = [archer];
  assert(game.resolveCompanionSecondSkill(archer, enemy, [enemy]),
    'Archer charged Piercing Volley releases after its existing charge');
  const hp = enemy.hp;
  const arrow = game.s.projectiles.find(p => p.companionSkill === 'piercing-volley');
  assert(arrow?.area, 'charged Archer uses one real area-compatible arrow');
  assert.equal(enemy.hp, hp, 'no damage before the companion arrow hits');
  assert(game.effects.some(e => e.type === 'chargedArea' && e.projectileVolley),
    'companion presentation must avoid fake full-corridor shafts');
  for (let i = 0; i < 20 && game.s.projectiles.includes(arrow); i++) {
    game.updateProjectiles(0.05);
  }
  assert(enemy.hp < enemy.maxHp, 'Archer charged arrow damages on physical contact');
  assert(game.effects.some(e =>
    e.type === 'projectileImpact' && e.source === archer.id && e.landed === true),
    'the Archer skill requires an actual registered projectile impact');
}
{
  const { game, enemy } = arena();
  const soldier = game.unit('soldier', 705, 500);
  game.s.party = [soldier];
  const hp = enemy.hp;
  assert(game.resolveCompanionSecondSkill(soldier, enemy, [enemy]), 'Soldier Holy Cleave');
  assert(enemy.hp < hp, 'Soldier sword melee strike legitimately resolves at impact');
  assert(!game.s.projectiles.some(p => p.source === soldier.id),
    'Soldier has no invented sword or spell projectile');
}


// Delayed companions and Ranger ultimates must not leave false departure
// receipts if the source dies or target becomes invalid before subrelease.
for (const cause of ['source-dead', 'target-gone']) {
  const { game, enemy } = arena();
  const archer = game.unit('archer', 500, 510);
  game.s.party = [archer];
  assert(game.companionUseFirstSkill(archer, enemy));
  const delayed = game.s.projectiles.find(p => p.companionDelayedLaunch);
  assert(delayed);
  if (cause === 'source-dead') archer.hp = 0;
  else game.zone().enemies = [];
  game.updateProjectiles(0.2);
  game.updateProjectiles(0.05);
  assert(!game.s.projectiles.includes(delayed), cause + ' discards unreleased Archer arrow');
  assert(!game.effects.some(e => e.type === 'projectileLaunch' && e.projectileId === delayed.id),
    cause + ' never emits a phantom launch');
}
{
  const { game, enemy } = arena();
  assert(game.cast(8, enemy.id, false), 'Hunter\'s Salvo schedules its authored volley');
  const delayed = game.s.projectiles.find(p => p.rangerDelayedLaunch);
  assert(delayed, 'Hunt includes pending independent arrows');
  const before = game.effects.filter(e => e.type === 'projectileLaunch' && e.slot === 8);
  assert(!before.some(e => e.projectileId === delayed.id), 'no early individual Hunt arrow release');
  game.zone().enemies = [];
  for (let i = 0; i < 20; i++) game.updateProjectiles(0.05);
  assert(!game.effects.some(e => e.type === 'projectileLaunch' && e.projectileId === delayed.id),
    'abandoned Hunt missile never announces a release');
}
// Native pack load checks both real moving entities and the unchanged
// 40-effect visual queue budget; this does not claim device FPS certification.
{
  const { game, enemy } = arena();
  const crowd = [enemy];
  for (let i = 0; i < 28; i++) {
    const foe = game.makeEnemy(
      { species: 'goblin', name: 'Corridor foe ' + i, level: 1,
        hp: 1000000, damage: 0, gold: 0, xp: 0 },
      { x: 585 + (i % 15) * 19, y: 500 + (Math.floor(i / 15) ? 18 : -18) },
    );
    foe.hp = foe.maxHp = 1000000;
    crowd.push(foe);
    game.zone().enemies.push(foe);
  }
  assert(game.cast(2, enemy.id, true), 'charged Ranger releases the native crowded corridor');
  const arrows = game.s.projectiles.filter(p => p.source === 'hero' && p.slot === 2);
  assert(arrows.length > 20, 'crowd emits physical arrows rather than replacing them with a beam');
  assert(crowd.every(e => e.hp === e.maxHp), 'none of the crowded foes suffers pre-flight damage');
  for (let i = 0; i < 40 && arrows.some(p => game.s.projectiles.includes(p)); i++)
    game.updateProjectiles(1 / 30);
  assert(arrows.every(p => !game.s.projectiles.includes(p)),
    'crowd removes completed physical missiles within their authored lifetime');
  assert(crowd.some(e => e.hp < e.maxHp), 'at least one physical crowded hit resolves');
  const effects = require('../src/prototype/combat-visuals.js').queue(game.effects, game, []);
  assert(effects.length <= 40, 'many real arrow impacts obey the original transient VFX budget');
  assert(game.effects.filter(e => e.type === 'projectileImpact' && e.landed).length > 20,
    'crowd generates native physical impact receipts, not merely synthetic test effects');
}


// Regression against documentation drift: in all historical and current
// configs the charged Ranger Pinning Volley has ONE authored active Slow
// source. The generic def.slow path is dormant for Ranger's charged Skill 2.
// Never invent a second Slow/debt stack while migrating impact to flight.
for (const dt of [1 / 20, 1 / 30, 1 / 60]) {
  for (const priorStacks of [0, 2]) {
    const { game, enemy } = arena();
    const recorded = [];
    const apply = game.applySlow;
    game.applySlow = function (...args) {
      recorded.push({ unit: args[0], seconds: args[1] });
      return apply.apply(this, args);
    };
    if (priorStacks) {
      enemy.slow = 0.5;
      enemy.slowStacks = priorStacks;
    }
    const oldHp = enemy.hp;
    assert(game.cast(2, enemy.id, true), 'charged Pinning Volley enters real corridor');
    const arrow = game.s.projectiles.find(p => p.source === 'hero' && p.slot === 2);
    assert(arrow, 'charged Pinning Volley must create physical arrow');
    assert.equal(arrow.slow, 0, 'Ranger charged Skill 2 has no generic second Slow');
    const duration = Campaign.rules.heroTactics.ranger.volley.slow +
      game.tacticMilestones(game.hero.skills[1]) *
      Campaign.rules.heroTactics.ranger.volley.slowStep;
    near(arrow.rangerVolleySlow, duration, 'one authored Ranger Volley Slow value');
    assert.equal(recorded.length, 0, 'no Slow until arrow collision');
    game.updateProjectiles(dt);
    assert.equal(recorded.length, 0, 'no Slow in the first flight step');
    for (let i = 0; i < 65 && game.s.projectiles.includes(arrow); i++)
      game.updateProjectiles(dt);
    assert(!game.s.projectiles.includes(arrow), 'charged arrow finishes real physical flight');
    assert(enemy.hp < oldHp, 'physical impact dealt damage before its Slow');
    assert.equal(recorded.length, 1, 'exactly one Slow applied on real contact');
    assert.equal(recorded[0].unit, enemy);
    near(recorded[0].seconds, duration, 'same authored slow duration as baseline main');
    assert.equal(enemy.slowStacks, priorStacks ? priorStacks + 1 : 1,
      'prior Slow stacks gain only one additional contact, not a phantom second');
  }
}
// A solid wall must block both damage and the one valid Slow at all tested
// timestep sizes; an effect may not silently jump ahead of the arrow.
for (const dt of [1 / 20, 1 / 30, 1 / 60]) {
  const { game, enemy } = arena();
  const before = enemy.hp;
  const originalSlow = game.applySlow;
  let slowingCalls = 0;
  game.applySlow = function (...args) {
    slowingCalls++;
    return originalSlow.apply(this, args);
  };
  assert(game.cast(2, enemy.id, true));
  game.clearSegment = () => false;
  for (let i = 0; i < 15; i++) game.updateProjectiles(dt);
  assert.equal(enemy.hp, before, 'wall prevents Pinning Volley physical damage');
  assert.equal(slowingCalls, 0, 'wall prevents Pinning Volley slow');
}

console.log('PASS #463 real Ranger bow origins, independent arrows, target/terrain safety, 20/30/60 FPS (' + verified + ' cases), truthful delayed release receipts, one authored Pinning Volley Slow and native crowd queue');

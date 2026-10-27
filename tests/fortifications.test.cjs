'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
function world(id = 'frontier') {
  const g = new C('developer', 'paladin', () => 0.9);
  g.s.zone = id;
  g.zone();
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.clock = 120;
  return g;
}
function hostile(g, x = 3000, y = 950, ranged = true) {
  const e = g.makeEnemy(
    {
      species: 'archer',
      name: 'Garrison fixture',
      level: 10,
      hp: 10000,
      damage: 80,
      xp: 0,
      gold: 0,
    },
    { x, y },
  );
  Object.assign(e, { ranged, shotRange: 280, cd: 0, specialCd: 999, rogueCd: 999, aggro: true });
  g.zone().enemies = [e];
  for (const other of g.zone().enemies) if (other !== e) other.hp = 0;
  return e;
}
function fixture() {
  const g = world();
  const e = hostile(g);
  Object.assign(g.hero, { x: 3340, y: 950, hp: 10000, maxHp: 10000, immune: 0 });
  return { g, e };
}
// Native species matrix: actual firing must fit within passive detection,
// both outdoors and inside an authored fort, at the original 10%/30% defaults.
{
  const { g, e } = fixture();
  const near = (actual, expected, label) =>
    assert(Math.abs(actual - expected) < 1e-8, label + ': ' + actual + ' vs ' + expected);
  const profiles = [
    // Species, authored basic reach, new outside detection, fortified basic/detection.
    ['mireling', 230, 286, 328.9],
    ['goblin', 240, 286, 343.2],
    ['reedbeast', 250, 286, 357.5],
    ['ogre', 260, 286, 371.8],
    ['orc', 260, 286, 371.8],
    ['ashbeast', 270, 297, 386.1],
    ['archer', 280, 308, 400.4],
    ['crownguard', 280, 308, 400.4],
    ['wraith', 280, 308, 400.4],
    ['skeleton', 290, 319, 414.7],
  ];
  for (const [species, shotRange, outsideDetection, fortifiedRange] of profiles) {
    Object.assign(e, { species, ranged: true, shotRange, x: 3000 });
    assert(g.enemyFort(e), species + ': inside native fort');
    near(g.enemyRangedRange(e), fortifiedRange, species + ': fortified firing');
    near(g.enemyAcquisitionRange(e), fortifiedRange, species + ': fortified detection');
    e.x = 3250;
    assert.equal(g.enemyFort(e), null, species + ': left fort');
    near(g.enemyRangedRange(e), shotRange * 1.1, species + ': ordinary firing');
    near(g.enemyAcquisitionRange(e), outsideDetection, species + ': ordinary detection');
  }
  // Forced ranged or saved unfamiliar species use the native 280 fallback.
  Object.assign(e, { species: 'other', ranged: true });
  delete e.shotRange;
  near(g.enemyRangedRange(e), 308, 'fallback ordinary firing');
  near(g.enemyAcquisitionRange(e), 308, 'fallback ordinary detection');
  // Explicit melee flag always wins over a species or stray saved shotRange.
  Object.assign(e, { species: 'skeleton', ranged: false, shotRange: 900 });
  near(g.enemyAcquisitionRange(e), 286, 'melee retains its 286-unit awareness');
}
// The tuning scalars remain independently authored, but effective ranged
// detection automatically covers any greater range allowed by basic firing.
{
  const { g, e } = fixture();
  const balance = C.rules.balance;
  const oldDetection = balance.enemyAcquisitionRangeMultiplier;
  const oldFiring = balance.enemyRangedBasicRangeMultiplier;
  const near = (actual, expected, label) =>
    assert(Math.abs(actual - expected) < 1e-8, label + ': ' + actual + ' vs ' + expected);
  try {
    assert.equal(oldDetection, 1.1);
    assert.equal(oldFiring, 1.1);
    near(g.enemyAcquisitionRange(e), 400.4, 'fort detection baseline');
    near(g.enemyRangedRange(e), 400.4, 'fort firing baseline');
    balance.enemyRangedBasicRangeMultiplier = 0.9;
    near(g.enemyAcquisitionRange(e), 400.4, 'shorter fort shots do not shrink detection');
    near(g.enemyRangedRange(e), 327.6, 'shortened fort firing');
    balance.enemyRangedBasicRangeMultiplier = 1.35;
    near(g.enemyAcquisitionRange(e), 491.4, 'longer fort shots expand minimum detection');
    near(g.enemyRangedRange(e), 491.4, 'longer fort firing');
    balance.enemyRangedBasicRangeMultiplier = oldFiring;
    balance.enemyAcquisitionRangeMultiplier = 1.2;
    near(g.enemyAcquisitionRange(e), 436.8, 'independent fort detection may exceed firing');
    near(g.enemyRangedRange(e), 400.4, 'fort firing unaffected by detection tuning');
    e.x = 3250;
    assert.equal(g.enemyFort(e), null);
    near(g.enemyAcquisitionRange(e), 312, 'detection-only tuning outside fort');
    near(g.enemyRangedRange(e), 308, 'outside firing unchanged');
    balance.enemyAcquisitionRangeMultiplier = 0.8;
    near(g.enemyAcquisitionRange(e), 308, 'outside firing protects detection floor');
    e.x = 3000;
    near(g.enemyAcquisitionRange(e), 400.4, 'fort firing protects detection floor');
    e.ranged = false;
    near(g.enemyAcquisitionRange(e), 208, 'melee detection still independent');
  } finally {
    balance.enemyAcquisitionRangeMultiplier = oldDetection;
    balance.enemyRangedBasicRangeMultiplier = oldFiring;
  }
}
// Native wall-line and passive aggro must agree with fortified basic reach.
{
  const { g, e } = fixture();
  e.aggro = false;
  assert(g.enemyFort(e));
  assert(g.enemyRangedLine(e, g.hero));
  g.updateEnemies(0.01);
  assert(e.aggro, 'idle fortified ranged actor auto-detects inside basic shot range');
}
// One catalog covers every regional hold, every field compound, fortified
// interiors and Crown command/final courtyard, and survives save restoration.
for (const id of [
  'vale',
  'march',
  'highlands',
  'frontier',
  'crown',
  'abyss',
  'citadel',
  'side-highlands-signal',
]) {
  const g = world(id),
    areas = g.fortAreas();
  assert(areas.length > 0, id);
  for (const plan of C.rules.creatureStrongholds.filter((p) => p.region === id))
    assert(
      areas.some((f) => f.id === plan.id),
      plan.id,
    );
  if (!g.isDungeon() && !g.sideDungeon()) assert(areas.some((f) => f.id.startsWith('field-')));
  const restored = C.restore(g.snapshot(), () => 0.9);
  assert.deepEqual(
    restored.fortAreas().map((f) => f.id),
    areas.map((f) => f.id),
  );
}
{
  const { g, e } = fixture();
  assert.equal(g.enemyFort(e).id, 'raider-drill-redoubt');
  assert(Math.abs(g.enemyRangedRange(e) - 400.4) < 1e-8);
  assert(!g.line(e, g.hero), 'ordinary sight blocked by stockade');
  assert(g.enemyRangedLine(e, g.hero));
  assert(!g.clearSegment(e, g.hero), 'movement still blocked');
  g.updateEnemies(0.01);
  assert(e.rangedAim, 'actual AI aims through own walls at extended range');
  e.rangedAim.timer = 0;
  g.updateEnemies(0.01);
  const p = g.s.projectiles.find((p) => p.sourceId === e.id);
  assert(p?.fortId);
  assert(g.fortProjectileLift(p) > 0);
  const start = g.hero.hp;
  for (let i = 0; i < 100 && g.s.projectiles.length; i++) g.updateProjectiles(0.02);
  assert(g.hero.hp < start, 'shot crosses stockade and damages hero');
  assert(!g.s.projectiles.length);
  // Position derived fresh on every use: no stale fort bonus when walking out.
  e.x = 3250;
  assert.equal(g.enemyFort(e), null);
  assert(Math.abs(g.enemyRangedRange(e) - 308) < 1e-8);
}
{
  const { g, e } = fixture();
  Object.assign(g.hero, { x: 3340, y: 950 });
  g.updateEnemies(0.01);
  e.rangedAim.timer = 0;
  g.updateEnemies(0.01);
  const p = g.s.projectiles[0];
  g.hero.y += 90;
  const hp = g.hero.hp;
  for (let i = 0; i < 130; i++) g.updateProjectiles(0.02);
  assert.equal(g.hero.hp, hp, 'wall fire stays dodgeable');
  assert(p.fortId);
  assert.equal(g.s.projectiles.length, 0);
}
{
  const { g, e } = fixture();
  const fort = g.enemyFort(e);
  g.zone().props.push({ id: 'unrelated-tree', x: 3290, y: 950, r: 22 });
  assert(!g.enemyRangedLine(e, g.hero), 'unrelated solids stop shots');
  g.zone().props.pop();
  g.zone().props.push({
    id: 'other-fort-wall',
    x: 3290,
    y: 950,
    r: 22,
    stronghold: 'orc-road-fort',
    structure: 'stockade',
  });
  assert(!g.enemyRangedLine(e, g.hero), 'other fort walls stop shots');
  assert(g.fortShotBlocked({ x: 1450, y: 1600 }, fort), 'ravine blocks wall fire');
}
for (const type of ['mob', 'boss']) {
  const { g, e } = fixture();
  Object.assign(g.hero, { x: 3050, y: 980 });
  if (type === 'boss') Object.assign(e, { type: 'boss', family: 'thorn' });
  const hp = e.hp;
  assert(g.damage(e, 100));
  assert.equal(hp - e.hp, 60, '40% fort reduction for ' + type);
  e.x = 3250;
  e.y = 950;
  e.home = { x: e.x, y: e.y };
  g.hero.x = 3270;
  g.hero.y = 950;
  const outside = e.hp;
  assert(g.damage(e, 100));
  assert.equal(outside - e.hp, 100, 'protection ends on leaving');
}
{
  const { g, e } = fixture();
  Object.assign(g.hero, { x: 3050, y: 980 });
  const hp = e.hp;
  assert(g.damage(e, 100, 'hero', { piercing: true }));
  assert.equal(hp - e.hp, 100, 'existing piercing bypass contract');
  const u = g.unit('soldier', 3050, 980);
  g.s.party = [u];
  const before = e.hp;
  assert(g.damage(e, 100, u.id));
  assert.equal(before - e.hp, 60);
  e.hp = 0;
  assert.equal(g.enemyFort(e), null);
  assert.equal(g.enemyFort(u), null);
  e.hp = 100;
  e.neutral = true;
  assert.equal(g.enemyFort(e), null);
}
{
  const { g, e } = fixture();
  e.x = 3250;
  const p = { source: 'enemy', sourceId: e.id, x: e.x, y: e.y, speed: 300, life: 2 };
  g.prepareFortProjectile(p, e);
  assert(!p.fortId, 'outside launches never gain wall permissions');
  e.x = 3050;
  g.prepareFortProjectile(p, e);
  g.s.projectiles = [p];
  const restored = C.restore(g.snapshot(), () => 0.9);
  assert.equal(restored.s.projectiles.length, 0, 'flight remains transient');
  g.s.zone = 'vale';
  g.zone();
  assert.equal(g.projectileFort(p), null, 'zone-bound permission');
}
// Interior fortification partitions are bypassed, never gaps between rooms or
// map limits; non-fort interiors retain all ordinary collision.
for (const id of ['abyss', 'citadel']) {
  const g = world(id);
  const a = C.rules.dungeonArchitecture[id];
  const w = a.partitions[0];
  const area = g.fortAreas()[0];
  let found = false;
  for (let x = w.x1 + 1; x < w.x2; x += 8)
    for (let y = w.y1 + 1; y < w.y2; y += 8) {
      const p = { x, y };
      if (g.blocked(x, y, id, 0) && !g.fortShotBlocked(p, area)) found = true;
    }
  assert(found, id + ' own partitions');
  assert(g.fortShotBlocked({ x: 20, y: 20 }, area), 'boundary remains solid');
}
console.log(
  'PASS regional/compound/interior fort coverage, AI range/wall aim, real impact/dodge, 40% damage, exit/piercing, obstacles and lifecycle',
);
// Low obstacles are enemy-only cover allowances in the field and interiors.
for (const id of ['vale', 'crypt', 'archive', 'mine', 'supply-vale', 'side-highlands-signal']) {
  const g = world(id);
  const start = id === 'vale' ? { x: 400, y: 1600 } : g.safe(220, 250);
  const e = hostile(g, start.x, start.y);
  Object.assign(g.hero, { x: start.x + 180, y: start.y });
  g.zone().props = g
    .zone()
    .props.filter((p) => p.decorative || Math.hypot(p.x - start.x, p.y - start.y) > 300);
  if (!g.clearSegment(e, g.hero, 0, true)) continue;
  g.zone().props.push({ id: 'low-cart', structure: 'cart', x: start.x + 90, y: start.y, r: 25 });
  assert(!g.line(e, g.hero));
  assert(g.enemyRangedLine(e, g.hero), id + ' can fire over cart');
  assert(!g.clearSegment(e, g.hero), 'movement unchanged');
  assert(!g.line(g.hero, e), 'friendly sight unchanged');
  const p = {
    source: 'enemy',
    sourceId: e.id,
    x: e.x,
    y: e.y,
    dx: 1,
    dy: 0,
    speed: 260,
    life: 2,
    damage: 30,
    style: 'arrow',
  };
  g.prepareFortProjectile(p, e, g.hero);
  assert(p.rangedArc);
  assert(g.fortProjectileLift(p) > 0);
  g.s.projectiles = [p];
  const hp = g.hero.hp;
  for (let j = 0; j < 50 && g.s.projectiles.length; j++) g.updateProjectiles(0.02);
  assert(g.hero.hp < hp, id + ' real shot over low cover');
}
for (const id of ['crypt', 'archive', 'supply-crown']) {
  const g = world(id),
    a = C.rules.dungeonArchitecture[id] || C.rules.treasuryArchitecture[id],
    cover = g.enemyShotCover();
  for (const w of a.partitions)
    assert.equal(
      cover.partitions.has(w.id),
      C.rules.balance.fortifications.lowPartitionIds.includes(w.id),
      'only authored low screens/shelves pass',
    );
}
console.log(
  'PASS enemy-only low props/screens in fields, dungeons and other interiors; friendly sight and movement preserved',
);
// A dodged arc lands once at its original aim point, even on a long final tick.
for (const dt of [0.02, 2]) {
  const { g, e } = fixture();
  const target = { x: 3340, y: 950 },
    d = Math.hypot(target.x - e.x, target.y - e.y);
  const p = {
    source: 'enemy',
    sourceId: e.id,
    x: e.x,
    y: e.y,
    dx: (target.x - e.x) / d,
    dy: (target.y - e.y) / d,
    speed: 280,
    life: 2.8,
    damage: 30,
    style: 'arrow',
  };
  g.prepareFortProjectile(p, e, target);
  assert.equal(p.fortDistance, d);
  assert(Math.abs(p.life - d / p.speed) < 1e-8, 'arc life ends at fixed target');
  g.hero.y += 100;
  const hp = g.hero.hp,
    impacts = [];
  g.enemyVfxProjectileImpact = (shot, point) => impacts.push(point);
  g.s.projectiles = [p];
  for (let i = 0; i < 200 && g.s.projectiles.length; i++) g.updateProjectiles(dt);
  assert.equal(g.hero.hp, hp, 'dodged shot does not home');
  assert.equal(g.s.projectiles.length, 0);
  assert(Math.hypot(p.x - target.x, p.y - target.y) < 1e-6, 'no ground overshoot');
  assert(g.fortProjectileLift(p) < 1e-6, 'flight reaches ground at removal');
  assert.equal(impacts.length, 1, 'one terminal ground impact');
  assert(impacts[0].terrain);
  const landed = { x: p.x, y: p.y };
  g.updateProjectiles(1);
  assert.deepEqual({ x: p.x, y: p.y }, landed, 'cannot bounce or continue');
  assert.equal(impacts.length, 1);
}
console.log(
  'PASS fixed landing point, dodge, short/long ticks, one ground impact and no continued arc flight',
);

// Fort launch speed improves accuracy without extending special-shot footprints.
{
  const { g, e } = fixture();
  const p = {
    source: 'enemy',
    sourceId: e.id,
    x: e.x,
    y: e.y,
    dx: 1,
    dy: 0,
    speed: 280,
    life: 2.8,
    damage: 30,
    style: 'arrow',
  };
  g.prepareFortProjectile(p, e, g.hero);
  assert.equal(p.speed, 364);
  const time = p.life;
  assert(Math.abs(time - 340 / 280 / 1.3) < 1e-8, '30% faster fixed flight');
  g.prepareFortProjectile(p, e, g.hero);
  assert.equal(p.speed, 364);
  assert.equal(p.life, time, 'no stacked boost');
  const special = {
    source: 'enemy',
    sourceId: e.id,
    x: e.x,
    y: e.y,
    dx: 1,
    dy: 0,
    speed: 280,
    life: 2.8,
    damage: 30,
  };
  g.prepareFortProjectile(special, e);
  assert(Math.abs(special.fortDistance - 784) < 1e-8);
  assert(Math.abs(special.life * special.speed - 784) < 1e-8, 'same special footprint');
  const ordinary = { ...special, speed: 280, life: 2.8 };
  delete ordinary.fortBaseSpeed;
  delete ordinary.fortBaseLife;
  e.x = 3250;
  g.prepareFortProjectile(ordinary, e);
  assert.equal(ordinary.speed, 280, 'outside-fort speed unchanged');
}
console.log(
  'PASS fort-only 30% projectile speed, fixed footprint/lifetime and idempotent launch preparation',
);

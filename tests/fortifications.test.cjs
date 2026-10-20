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

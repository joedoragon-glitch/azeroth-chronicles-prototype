'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  zlib = require('node:zlib');
const C = require('../../../src/prototype/engine'),
  R = C.rules;
const seed = JSON.parse(
  zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'dev107-save.json.gz'))),
);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  clone = (o) => JSON.parse(JSON.stringify(o));
const g = C.restore(clone(seed), () => 0.9),
  z = g.zone(),
  old = seed.zones.frontier;
assert.equal(z.frontierSceneVersion, 1);
const ids = new Set(z.props.map((p) => p.id));
assert.equal(ids.size, z.props.length);
for (const p of old.props) assert(ids.has(p.id), 'original prop retained: ' + p.id);
assert.deepEqual(
  z.enemies.map((e) => [e.id, e.x, e.y, e.home, e.hp <= 0]),
  old.enemies.map((e) => [e.id, e.x, e.y, e.home, e.hp <= 0]),
  'enemy identities, placement, home and dead state retained',
);
for (const key of ['normal', 'true', 'rescued', 'quests', 'statistics', 'inventory'])
  if (seed[key]) assert.deepEqual(g.s[key], seed[key], 'progress retained: ' + key);
const after = JSON.stringify(g.snapshot());
for (let i = 0; i < 5; i++) g.zone();
assert.equal(JSON.stringify(g.snapshot()), after, 'migration is idempotent');
const tooLarge = clone(g.snapshot());
tooLarge.zones.frontier.props = Array.from({ length: 513 }, () => ({}));
assert.throws(() => C.validate(tooLarge), /Invalid zone assets/, 'asset bound remains enforced');
const reloaded = C.restore(g.snapshot(), () => 0.9);
assert.deepEqual(reloaded.zone().props, z.props, 'reload retains final scenery');
assert.deepEqual(reloaded.zone().roads, z.roads, 'reload retains final roads');
let paths = 0;
for (const p of z.footpaths) {
  assert(g.distanceToRoad(z, p[0]) < 1, 'front path starts on street');
  for (let j = 1; j < p.length; j++)
    assert(g.clearSegment(p[j - 1], p[j]), 'front path is walkable');
  paths++;
}
assert(paths >= 15);
for (const id of Object.keys(R.frontierSceneLayout.props)) {
  const p = z.props.find((p) => p.id === id);
  if (!p || !/house|workshop/.test(p.structure || '')) continue;
  const door = g.safe(p.x + 40, p.y + 40),
    road = g.nearestRoadPoint(z, door);
  assert(g.route(road, door).length, id + ' door is reachable');
  assert(
    z.footpaths.some((path) => dist(path.at(-1), door) < 5),
    id + ' has a visible path to the door',
  );
}
for (const pool of R.frontierRainPools) {
  assert(g.blocked(pool.x, pool.y, 'frontier', 0, true), 'pool center blocks');
  for (const q of pool.points) {
    const mid = { x: (q.x + pool.x) / 2, y: (q.y + pool.y) / 2 };
    assert(g.blocked(mid.x, mid.y, 'frontier', 0, true), 'visible water matches collision');
  }
}
assert(!g.blocked(2790, 2220, 'frontier', 15, true), 'dry crossing stays open');
assert(
  !R.rainPoolBlocked(R.frontierRainPools, 2722, 1852, 0),
  'rounded former rectangular corner opens',
);
assert(g.blocked(850, 2850, 'frontier', 0, true), 'grain silo body blocks');
assert(!g.blocked(960, 2850, 'frontier', 0, true), 'loading apron is walkable');
for (const y of [70, 3300]) {
  const [l, r] = R.channelBanks(3, y);
  assert(g.blocked((l + r) / 2, y, 'frontier', 0, true), 'main channel remains continuous');
}
for (const id of ['bridge-north', 'bridge-south']) {
  const n = z.npcs.find((n) => n.id === id);
  assert(g.clearSegment({ x: 1300, y: n.y }, { x: 1600, y: n.y }), id + ' deck stays clear');
}
for (const family of ['warlord', 'abyss']) g.s.rescued[family] = true;
g.refreshNPCs();
for (const family of ['warlord', 'abyss']) {
  const n = z.npcs.find((n) => n.id === 'service-' + family),
    xy = z.frontierTownPlacements[n.id];
  assert(n);
  assert.deepEqual([n.x, n.y], xy, 'newly rescued specialist uses reserved plot');
  assert(!g.blocked(n.x, n.y), 'specialist plot is accessible');
}
const flowers = z.props.filter((p) => p.id.startsWith('frontier-poppy-'));
assert(flowers.length >= 14, 'more natural poppy patches');
assert.equal(new Set(flowers.map((p) => p.poppyForm)).size, 4, 'all four flower formations placed');
assert(
  flowers.every((p) => p.decorative && p.r === 0),
  'flowers add no blockers',
);
// Existing constructions and actors take precedence over a new solid plot.
const occupied = clone(seed);
Object.assign(occupied.hero, { x: 210, y: 205 });
const og = C.restore(occupied, () => 0.9);
assert.equal(og.hero.x, 210);
assert.equal(og.hero.y, 205);
assert(
  og
    .zone()
    .props.filter((p) => p.r > 0)
    .every((p) => dist(p, og.hero) > p.r + 14),
  'no new solid traps the hero',
);
const built = clone(seed);
built.zones.frontier.buildings.push({
  id: 'barracks-9999',
  kind: 'barracks',
  name: 'Owner camp',
  x: 210,
  y: 205,
  progress: 4,
  full: true,
  queue: 0,
});
const bg = C.restore(built, () => 0.9),
  building = bg.zone().buildings.find((b) => b.id === 'barracks-9999');
assert.deepEqual([building.x, building.y], [210, 205], 'player construction stays put');
assert(
  bg
    .zone()
    .props.filter((p) => p.r > 0)
    .every((p) => dist(p, building) > p.r + 100),
  'new plots clear player construction',
);

// The visible mouth continues to the exact floor boundary, without a half-tile cap.
{
  const { createCanvas } = require('@napi-rs/canvas'),
    Renderer = require('../../../src/prototype/renderer'),
    V = require('../../../src/prototype/visuals'),
    FX = require('../../../src/prototype/combat-visuals');
  const c = createCanvas(900, 600),
    ctx = c.getContext('2d');
  g.s.clock = 120;
  Object.assign(g.hero, { x: 1350, y: 3300 });
  Renderer.create({
    canvas: c,
    ctx,
    getGame: () => g,
    platform: { cameraZoom: 1, cameraAnchor: () => ({ x: 450, y: 324 }) },
    Campaign: C,
    PrototypeVisuals: V,
    PrototypeCombatVisuals: FX,
    now: () => 16000,
    chargePresentation: () => null,
    isPaused: () => false,
  }).draw();
  const pixel = (x, y) => {
    const qx = 450 + (x - 1350 - (y - 3300)) * 0.76,
      qy = 324 + (x - 1350 + (y - 3300)) * 0.27;
    return [...ctx.getImageData(Math.round(qx), Math.round(qy), 1, 1).data];
  };
  const mouth = pixel((R.channelBanks(3, 3395)[0] + R.channelBanks(3, 3395)[1]) / 2, 3395),
    beyond = pixel(1455, 3420);
  assert(mouth[2] >= mouth[0], 'dark channel remains at the mouth');
  assert(
    beyond[1] > beyond[0] + 4 && beyond[0] < 35 && beyond[2] < 40,
    'beyond mouth is shaded background, not a brown ground cap',
  );
}

console.log(
  JSON.stringify({
    pass: true,
    originalProps: old.props.length,
    currentProps: z.props.length,
    footpaths: paths,
    poppies: flowers.length,
    enemyCount: z.enemies.length,
    pools: 2,
    saveAndRescue: true,
    occupiedPlots: true,
  }),
);

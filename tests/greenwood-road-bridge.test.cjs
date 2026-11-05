'use strict';
// Focused Greenwood road/bridge acceptance. No browser matrix or broad suite.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Landscape = require('../src/prototype/greenwood-landscape.js');

const rng = () => 0.73;
const g = new Campaign('normal', 'paladin', rng);
const z = g.zone();
assert.equal(Campaign.rules.greenwoodLayout.version, 2);
assert.equal(z.greenwoodRoadBridgeVersion, 1, 'separate non-destructive road migration');
assert.equal(z.greenwoodRoutes.length, 16);
assert.deepEqual(z.greenwoodRoadKinds, ['cart', 'farm', 'farm', 'farm']);
assert.equal(z.greenwoodRoutes[6].points.length, 6, 'south footpath spans both banks and exits deck straight');
assert.equal(Math.round(z.roads[1].at(-1).x / Campaign.rules.greenwoodLayout.scale), 1560,
  'farm cart traffic stops on solid ground before the timber pedestrian bridge');
assert.equal(Math.round(z.footpaths[2][0].x / Campaign.rules.greenwoodLayout.scale), 1560,
  'walking path continues seamlessly from the farm lane to the southern deck');
assert.equal(z.greenwoodRoutes[7].points.length, 3, 'Treasury spur has no duplicated cart segment');

const gaps = Campaign.rules.barriers[0].gaps;
assert.deepEqual(gaps.map(([a, b]) => Math.round(b - a)), [100, 56]);
for (const [i, bridge] of z.bridgeApproaches.entries()) {
  assert.equal(bridge.width, [100, 56][i], 'physical and documented deck widths agree');
  const [lo, hi] = gaps[i];
  const mid = (lo + hi) / 2;
  const nearestGrid = Math.round((mid - 25) / 50) * 50 + 25;
  assert(nearestGrid > lo + 15 && nearestGrid < hi - 15,
    'real 25+50n route grid retains a radius-15 crossing row');
  assert(g.clearSegment(bridge.west, bridge.east, 15), 'bridge centerline traversable');
  assert(g.clearSegment(bridge.east, bridge.west, 15), 'reverse bridge centerline traversable');
  assert(g.route(bridge.west, bridge.east).length, 'native solver crosses west to east');
  assert(g.route(bridge.east, bridge.west).length, 'native solver crosses east to west');
}
const prepared = Landscape.prepareRoadPaint(z.roads, z.footpaths, z.greenwoodRoadKinds);
assert.equal(prepared.widths.cart * 2, 88);
assert.equal(prepared.widths.farm * 2, 52);
assert.equal(prepared.widths.path * 2, 24);
assert(prepared.wide[0].points.length > z.roads[0].length, 'cart bends are smoothly sampled');
assert(prepared.fragments.length > 0, 'woodland paths survive main-road junction clipping');
for (const road of prepared.wide)
  for (const p of road.points)
    assert(Number.isFinite(p.x) && Number.isFinite(p.y), 'every curve vertex finite');
const sampleCtx = {
  save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() { this.fills = (this.fills || 0) + 1; },
};
Landscape.drawRoads(sampleCtx, z.roads, (p) => p, z.footpaths, z.greenwoodRoadKinds);
Landscape.drawRoads(sampleCtx, z.roads, (p) => p, z.footpaths, z.greenwoodRoadKinds);
assert.equal(sampleCtx.fills, 12, 'exactly six unified fills per drawing, never per overlapping segment');

const original = g.snapshot(),
  ids = (zone) => ({
    npcs: zone.npcs.map((n) => n.id),
    buildings: zone.buildings.map((b) => b.id),
    enemies: zone.enemies.map((e) => [e.id, e.hp, e.home?.x, e.home?.y]),
    tribute: zone.nodes.map((n) => [n.id, n.amount]),
  });
const restored = Campaign.restore(original, rng);
assert.deepEqual(ids(restored.zone()), ids(z), 'save retains actors, constructions and tribute');
const once = restored.snapshot(), twice = Campaign.restore(once, rng).snapshot();
assert.equal(twice.zones.vale.greenwoodRoadBridgeVersion, 1);
assert.deepEqual(ids(twice.zones.vale), ids(once.zones.vale), 'second load remains stable');
assert.deepEqual(twice.zones.vale.footpaths, once.zones.vale.footpaths, 'road correction idempotent');
assert.deepEqual(twice.quests, once.quests, 'quests unchanged');
assert.deepEqual(twice.paid, once.paid, 'paid progress unchanged');
console.log('PASS Greenwood road hierarchy, 16 routes, junction painter, two bridge gaps, v4 idempotence');

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
assert.equal(z.greenwoodHomesteadVersion, 1, 'published Thornfang homestead retained alongside roads');
assert.equal(z.greenwoodCompositionVersion, 1, 'botanical overlay runs after completed route shaping');
assert.equal(z.greenwoodRoutes.length, 18,
  '17 canonical roads and depot corridors remain indexed; mill farm spur appends last');
assert.equal(z.greenwoodRoutes.at(-1).kind, 'farm', 'mill access does not shift canonical paths');
assert.equal(z.greenwoodRoutes[6].kind, 'path', 'independent freight apron retained');
assert.deepEqual(z.greenwoodRoutes[6].points.at(-1), Campaign.rules.greenwoodLayout.anchors.cache);
assert.deepEqual(z.greenwoodRoadKinds, ['cart', 'farm', 'farm', 'farm', 'farm'],
  'fifth source-owned road kind is the appended mill spur');
assert.equal(z.greenwoodRoutes[7].points.length, 6, 'south footpath spans both banks and exits deck straight');
assert.equal(Math.round(z.roads[1].at(-1).x / Campaign.rules.greenwoodLayout.scale), 1560,
  'farm cart traffic stops on solid ground before the timber pedestrian bridge');
assert.equal(Math.round(z.footpaths[3][0].x / Campaign.rules.greenwoodLayout.scale), 1560,
  'walking path continues seamlessly from the farm lane to the southern deck');
assert.equal(z.greenwoodRoutes[8].points.length, 3, 'Treasury spur has no duplicated cart segment');

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
// Independent designer acceptance: major routes must not retain a jagged
// sequence of discrete steering elbows, even when centerlines still connect.
const largestHeadingJump = (points) => {
  let peak = 0;
  for (let i = 1; i + 1 < points.length; i++) {
    const a = points[i - 1], b = points[i], c = points[i + 1],
      incoming = Math.atan2(b.y - a.y, b.x - a.x),
      outgoing = Math.atan2(c.y - b.y, c.x - b.x),
      turn = Math.abs(Math.atan2(Math.sin(outgoing - incoming), Math.cos(outgoing - incoming)));
    peak = Math.max(peak, turn);
  }
  return (peak * 180) / Math.PI;
};
for (const road of prepared.wide)
  assert(largestHeadingJump(road.points) <= 15,
    'roadbed has flowing turn samples rather than sharp disconnected elbows');
assert(prepared.fragments.reduce((n, run) => n + run.length - 1, 0) <= 420,
  'bounded pedestrian rendering subdivision keeps per-frame road draw overhead small');
const south = Campaign.rules.greenwoodLayout.anchors.south;
const westBank = Landscape.riverBanks(south.y, Campaign.rules.greenwoodLayout.size)[0];
assert(z.roads[1].at(-1).x < westBank,
  'farm traffic terminates on dry land, leaving a separate approach to the timber bridge');
assert(g.route(
  { x: 1560 * Campaign.rules.greenwoodLayout.scale, y: south.y },
  { x: 1950 * Campaign.rules.greenwoodLayout.scale, y: south.y },
).length, 'native route traverses actual narrow south-bank path and both bridge shoulders');
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
// Existing v4 campaigns with their completed Greenwood scene take zone()'s
// saved-scene fast path. A new road pass must still run there exactly once.
const legacy = JSON.parse(JSON.stringify(original)), oldVale = legacy.zones.vale;
const at = (x, y) => ({
  x: x * Campaign.rules.greenwoodLayout.scale,
  y: y * Campaign.rules.greenwoodLayout.scale,
});
delete oldVale.greenwoodRoadBridgeVersion;
delete oldVale.greenwoodRoadKinds;
oldVale.roads[1][oldVale.roads[1].length - 1] = at(1740, 2280);
oldVale.footpaths[3] = [at(1740, 2280), at(2150, 2350),
  at(2300, 2220), at(2670, 2220)];
oldVale.footpaths[4] = [at(2070, 1000), at(1870, 1000),
  at(1870, 1250), at(2120, 1250)];
for (const [index, points] of [
  [1, oldVale.roads[1]], [7, oldVale.footpaths[3]], [8, oldVale.footpaths[4]],
]) oldVale.greenwoodRoutes[index].points = points;
oldVale.bridgeApproaches[0].width = 180;
oldVale.bridgeApproaches[1].width = 130;
const pristine = JSON.stringify(legacy);
const migrated = Campaign.restore(legacy, rng);
const migratedZone = migrated.zone();
assert.equal(JSON.stringify(legacy), pristine, 'old v4 input snapshot unchanged');
assert.equal(migratedZone.greenwoodRoadBridgeVersion, 1,
  'completed v4 scene receives independent road pass on zone fast path');
assert.equal(migratedZone.footpaths[3].length, 6, 'old south approach adapted');
assert.equal(migratedZone.greenwoodRoutes[8].points.length, 3,
  'old Treasury overlap reconciled without losing destination');
assert.deepEqual(ids(migratedZone), ids(z),
  'legacy migration preserves NPCs, buildings, enemies and tribute');
assert.equal(migratedZone.greenwoodCompositionVersion, z.greenwoodCompositionVersion,
  'published botanical scene is not rebuilt by road migration');
const migratedSnap = migrated.snapshot(),
  replay = Campaign.restore(migratedSnap, rng).zone();
assert.deepEqual(replay.footpaths, migratedZone.footpaths,
  'second restore cannot shift old saved footpaths again');
assert.deepEqual(replay.greenwoodRoutes, migratedZone.greenwoodRoutes,
  'second restore cannot reprocess old route data');

console.log('PASS Greenwood road hierarchy, 17 canonical routes plus one mill spur, two bridge gaps, v4 idempotence');

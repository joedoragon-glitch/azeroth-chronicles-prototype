'use strict';
// Focused watermill geography, traversal and one-time v4 scene repair.
// This is not a visual/artistic acceptance test or a full campaign suite.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const { rng } = require('../tools/greenwood-layout/fixtures.cjs');
const cfg = C.rules.greenwoodLayout;
assert.equal(cfg.version, 2, 'new geography is the active layout');
assert.equal(C.data.regions[0].size, 3200);
assert.equal(cfg.upperCreek[0].y, 0, 'northern tributary starts at map edge');
assert(cfg.upperCreek.at(-1).y < cfg.pond.y, 'creek feeds upstream pond');
assert.deepEqual(
  cfg.waters.filter((p) => p.shallow).length,
  1,
  'only northern source extension is walkable shallow water',
);
assert.equal(C.rules.terrain[0][0].pools.length, 5);
assert.equal(C.rules.terrain[0][0].blockingPools.length, 4);
assert.deepEqual(
  C.rules.terrain[0][1],
  { kind: 'water', x: 2720, y: 1320, r: 140 },
  'eastern farm pond untouched',
);
assert.equal(C.rules.barriers[0].gaps.length, 2, 'no third main-river bridge');

const crossMid = (c) => ({
  x: (c.from.x + c.to.x) / 2,
  y: (c.from.y + c.to.y) / 2,
});
const isSame = (p, lane) => Array.isArray(p) && p.length === lane.length &&
  p.every((q, j) => Math.hypot(q.x - lane[j].x, q.y - lane[j].y) < 0.01);
const seen = new Set();
for (const seed of [0x47564101,0x47564102,0x47564103,0x47564104]) {
  const g = new C('normal', 'paladin', rng(seed)), z = g.zone();
  const bridge = cfg.millBridge;
  assert(z.greenwoodWatermillVersion === 1, 'new scene repair marker set');
  assert.equal(z.bridgeApproaches.length, 2);
  assert.equal(z.roads.filter((p) => isSame(p, cfg.millServiceLane)).length, 1);
  assert.equal(z.props.filter((p) => p.id === 'greenwood-working-mill').length,1);
  assert.equal(z.props.filter((p) => p.id === 'greenwood-mill-sluice').length,1);
  assert.equal(z.enemies.filter((e) => e.type === 'mob' && !e.summon).length, 32);
  assert.equal(z.nodes.reduce((n,p)=>n+p.amount,0),640);
  assert(z.props.length <= 400, 'retain regional artwork budget');

  const center = crossMid(bridge);
  assert.equal(g.blocked(center.x,center.y,'vale',12,true),false,
    'timber deck genuinely passes the deep tailrace');
  assert.equal(g.blocked(cfg.tailrace.at(-2).x,cfg.tailrace.at(-2).y,'vale',0,true),true,
    'tailrace beyond deck remains impassable');
  assert.equal(g.blocked(cfg.upperCreek[2].x,cfg.upperCreek[2].y,'vale',0,true),false,
    'upper source is deliberately shallow, not an unmarked new strategic barrier');
  assert.equal(g.clearSegment(bridge.from, bridge.to, 12),true,
    'whole bridge crossing, not only the center, is physically usable');
  const snap = g.snapshot();
  const key = JSON.stringify([
    snap.zones.vale.nodes.map((p)=>[p.id,p.amount]),
    snap.zones.vale.npcs.map((p)=>[p.id,p.x,p.y]),
    snap.zones.vale.enemies.map((p)=>[p.id,p.home?.x,p.home?.y]),
  ]);
  delete snap.zones.vale.greenwoodWatermillVersion;
  snap.zones.vale.roads = snap.zones.vale.roads.filter((p)=>!isSame(p,cfg.millServiceLane));
  snap.zones.vale.greenwoodRoutes = (snap.zones.vale.greenwoodRoutes || []).filter(
    (r)=>!isSame(r.points,cfg.millServiceLane));
  const original = JSON.stringify(snap);
  const old = C.restore(snap,rng(seed)),oz=old.zone();
  assert.equal(JSON.stringify(snap),original,'no input save mutation');
  assert.equal(oz.greenwoodWatermillVersion,1,'one-time additive upgrade applied');
  assert.equal(oz.roads.filter((p)=>isSame(p,cfg.millServiceLane)).length,1);
  const again=C.restore(old.snapshot(),rng(seed));
  assert.equal(again.zone().roads.filter((p)=>isSame(p,cfg.millServiceLane)).length,1,
    'repeat restoration never duplicates mill access');
  assert.equal(JSON.stringify([
    again.zone().nodes.map((p)=>[p.id,p.amount]),
    again.zone().npcs.map((p)=>[p.id,p.x,p.y]),
    again.zone().enemies.map((p)=>[p.id,p.home?.x,p.home?.y]),
  ]),key,'resource, sites and enemy homes remain stable');
  seen.add(oz.props.length);
}
assert(seen.size >= 1);
console.log('PASS Greenwood mill: source-to-edge, two original crossings, genuine local deck, shallow upstream, preserved counts, stable repeated v4 restoration');

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
// #820 established the approved DRY Thornfang homestead at the former
// eastern pond. A mill improvement must never resurrect its retired lake.
assert.equal(C.rules.terrain[0].length, 1, 'no retired eastern water circle');
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
  assert(z.greenwoodWatermillVersion === 2, 'new scene repair marker set');
  assert.equal(z.greenwoodHomesteadVersion,1,'current dry eastern homestead retained');
  assert(!C.rules.terrain[0].some((water)=>water.kind==='water' &&
    water.x===2720 && water.y===1320),'retired eastern pond stays absent');
  assert.equal(z.bridgeApproaches.length, 2);
  assert.equal(z.roads.filter((p) => isSame(p, cfg.millServiceLane)).length, 1);
  assert.equal(z.footpaths.filter((p) => isSame(p, cfg.millDoorFootpath)).length, 1);
  assert.equal(z.greenwoodRoutes.length,19,'17 #824 routes plus farm and narrow door path');
  assert(z.roads.slice(0,4).some((road)=>road.some((point)=>
    Math.hypot(point.x-cfg.millServiceLane[0].x,point.y-cfg.millServiceLane[0].y)<0.01)),
    'the mill farm spur branches from an EXISTING road, not isolated terrain');
  assert.deepEqual(cfg.millDoorFootpath[0],cfg.millServiceLane.at(-1),
    'pedestrian path starts exactly at the dry farm-track terminus');
  assert.deepEqual(cfg.millDoorFootpath.at(-1),cfg.millEntrance,
    'footpath reaches the actual mill entrance landing');
  assert.equal(z.props.filter((p) => p.id === 'greenwood-working-mill').length,1);
  assert.equal(z.props.filter((p) => p.id === 'greenwood-mill-sluice').length,1);
  assert.equal(z.enemies.filter((e) => e.type === 'mob' && !e.summon).length, 32);
  assert.equal(z.nodes.reduce((n,p)=>n+p.amount,0),640);
  assert(z.props.length <= 400, 'retain regional artwork budget');
  for (const id of ['greenwood-working-mill','greenwood-mill-0','greenwood-mill-1','greenwood-mill-2']) {
    const p = z.props.find((e)=>e.id===id);
    assert(p, 'retained unique mill work object '+id);
    assert(g.distanceToRoad(z,p)+0.01>=g.roadSetback(p),
      'mill/working objects keep visual space beside road: '+id);
  }

  const center = crossMid(bridge);
  assert.equal(C.rules.rainPoolBlocked(C.rules.terrain[0][0].blockingPools,
    center.x,center.y,0),true,
    'bridge is over actual deep tailrace water, not a dry decorative crossing');
  assert.equal(g.blocked(center.x,center.y,'vale',12,true),false,
    'timber deck genuinely passes the deep tailrace');
  assert.equal(g.blocked(cfg.tailrace[1].x,cfg.tailrace[1].y,'vale',0,true),true,
    'tailrace beyond deck remains impassable');
  assert.equal(g.blocked(cfg.upperCreek[2].x,cfg.upperCreek[2].y,'vale',0,true),false,
    'upper source is deliberately shallow, not an unmarked new strategic barrier');
  assert.equal(g.clearSegment(bridge.from, bridge.to, 12),true,
    'whole bridge crossing, not only the center, is physically usable');
  assert(!g.blocked(cfg.millEntrance.x,cfg.millEntrance.y,'vale',12,true),
    'the visible mill loading entrance has dry terrain');
  assert(!g.blocked(cfg.millEntrance.x,cfg.millEntrance.y,'vale',12),
    'the entrance also has a real body-clear landing outside mill scenery');
  const approach=g.route(cfg.millServiceLane[0],cfg.millEntrance);
  assert(approach.length>0 &&
    Math.hypot(approach.at(-1).x-cfg.millEntrance.x,
      approach.at(-1).y-cfg.millEntrance.y)<0.01,
    'the real native route ends AT the entrance, not at a substituted safe point');
  for (let i=1;i<cfg.millDoorFootpath.length;i++)
    assert(g.clearSegment(cfg.millDoorFootpath[i-1],cfg.millDoorFootpath[i],12,true),
      'every footpath leg physically follows dry ground or the real timber deck: '+i);

  const culvert = cfg.creekCulvert;
  const streamPoint = crossMid(culvert);
  assert.equal(g.blocked(streamPoint.x, streamPoint.y, 'vale', 12, true), false,
    'northern freight road remains traversable over the shallow creek culvert');
  assert.equal(g.clearSegment(culvert.from, culvert.to, 12), true,
    'culvert road surface is passable end to end, not just at its midpoint');
  const woodland = cfg.woodlandCulvert;
  const woodlandCenter = crossMid(woodland);
  assert.equal(woodland.kind, culvert.kind);
  assert(woodland.width < culvert.width, 'the woodland culvert matches the narrower lane');
  assert(g.clearSegment(woodland.from, woodland.to, 12, true),
    'the second culvert spans the already walkable creek without creating a barrier');
  assert(Math.abs(woodlandCenter.x / cfg.scale - 1262) < 1 &&
    Math.abs(woodlandCenter.y / cfg.scale - 274.5) < 1,
    'the deck is centered on the upstream road and creek intersection');
  assert.equal(g.blocked(cfg.millServiceLane[0].x,cfg.millServiceLane[0].y,'vale',12,true),
    false,'farm route starts on dry, walkable ground');

  const snap = g.snapshot();
  const key = JSON.stringify([
    snap.zones.vale.nodes.map((p)=>[p.id,p.amount]),
    snap.zones.vale.npcs.map((p)=>[p.id,p.x,p.y]),
    snap.zones.vale.enemies.map((p)=>[p.id,p.home?.x,p.home?.y]),
  ]);
  delete snap.zones.vale.greenwoodWatermillVersion;
  snap.zones.vale.roads = snap.zones.vale.roads.filter((p)=>!isSame(p,cfg.millServiceLane));
  snap.zones.vale.footpaths = snap.zones.vale.footpaths.filter((p)=>!isSame(p,cfg.millDoorFootpath));
  snap.zones.vale.greenwoodRoutes = (snap.zones.vale.greenwoodRoutes || []).filter(
    (r)=>!isSame(r.points,cfg.millServiceLane));
  const original = JSON.stringify(snap);
  const old = C.restore(snap,rng(seed)),oz=old.zone();
  assert.equal(JSON.stringify(snap),original,'no input save mutation');
  assert.equal(oz.greenwoodWatermillVersion,2,'one-time additive connected upgrade applied');
  assert.equal(oz.roads.filter((p)=>isSame(p,cfg.millServiceLane)).length,1);
  const again=C.restore(old.snapshot(),rng(seed));
  assert.equal(again.zone().roads.filter((p)=>isSame(p,cfg.millServiceLane)).length,1,
    'repeat restoration never duplicates mill access');
  assert.equal(again.zone().footpaths.filter((p)=>isSame(p,cfg.millDoorFootpath)).length,1,
    'repeat restoration never duplicates a mill door path');
  assert.equal(JSON.stringify([
    again.zone().nodes.map((p)=>[p.id,p.amount]),
    again.zone().npcs.map((p)=>[p.id,p.x,p.y]),
    again.zone().enemies.map((p)=>[p.id,p.home?.x,p.home?.y]),
  ]),key,'resource, sites and enemy homes remain stable');
  seen.add(oz.props.length);
}
assert(seen.size >= 1);
console.log('PASS Greenwood mill: source-to-edge, two original crossings, genuine local deck, shallow upstream, preserved counts, stable repeated v4 restoration');

// The normal focused PR workflow already uploads greenwood-mill-river/.
// Run the five-scene native capture only on this feature branch in CI;
// standalone local execution is available for visual review as well.
if (process.env.CI && process.env.GITHUB_HEAD_REF ===
  'design/greenwood-watermill-district-20261105')
  require('../tools/greenwood-layout/watermill-review.cjs');

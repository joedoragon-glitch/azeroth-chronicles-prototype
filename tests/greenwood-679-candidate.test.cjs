'use strict';
// #679/#680: narrow native contract, not a game-wide certification suite.
const assert = require('node:assert/strict');
const { rng } = require('../tools/greenwood-layout/fixtures.cjs');
const C = require('../src/prototype/engine.js');
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const expected = {
  'greenwood-refinement-millhaven-poultry': 'poultry-yard',
  'greenwood-refinement-millhaven-flowers': 'wildflowers',
  'greenwood-refinement-hamlet-pen': 'animal-pen',
  'greenwood-refinement-orchard-flowers': 'wildflowers',
  'greenwood-refinement-pond-reeds-west': 'reeds',
  'greenwood-refinement-pond-reeds-east': 'reeds',
  'greenwood-refinement-den-thorn-bed': 'thorn-bed',
};
assert.equal(C.rules.greenwoodLayout.sceneVersion, 5);
assert.equal(C.data.regions[0].enemy_count, 32);
assert.equal(C.rules.thornPatrol.startLeg, 7);
assert.equal(C.rules.thornPatrol.direction, -1);
assert.equal(C.rules.thornPatrol.route.length, 8);
assert.equal(C.rules.thornPatrol.speed, 82);
for (const seed of [0x47564101, 0x47564102, 0x47564103, 0x47564104]) {
  const g = new C('normal', 'paladin', rng(seed)), z = g.zone();
  assert.equal(z.greenwoodRedesignScene, 5);
  assert.equal(z.greenwoodRefinementVersion, 1, 'overlay applied once');
  assert.equal(g.zoneSize(), 3200);
  assert.equal(z.enemies.filter((e) => e.type === 'mob' && !e.summon).length, 32,
    'no ordinary monster count changes');
  assert.equal(z.nodes.reduce((n, p) => n + p.amount, 0), 640,
    'original source quantity unchanged');
  for (const [id, structure] of Object.entries(expected)) {
    const matches = z.props.filter((p) => p.id === id);
    assert.equal(matches.length, 1, 'one authored stable prop: ' + id);
    const p = matches[0];
    assert.equal(p.structure, structure);
    assert.equal(p.r, 0, 'new prop does not become a collision obstacle: ' + id);
    assert.equal(p.decorative, true, 'new prop remains presentation-only: ' + id);
    assert.equal(p.roadBlocker, undefined, 'no path blocker: ' + id);
    assert(!g.blocked(p.x, p.y, 'vale', 0, true), 'dry land: ' + id);
    assert(g.distanceToRoad(z, p) > 40, 'clear of roads: ' + id);
    assert(!z.buildings.some((b) => dist(p, b) < 85), 'clear of paid camp: ' + id);
    assert(!z.npcs.some((n) => dist(p, n.servicePoint || n) < 60), 'clear of service: ' + id);
  }
  assert(z.greenwoodSceneAudit.every((x) => !x.essential || x.placed),
    'no authored essential clearance lost');
  const input = g.snapshot(), serialized = JSON.stringify(input);
  const restored = C.restore(input, rng(seed));
  assert.equal(JSON.stringify(input), serialized, 'restore must not mutate submitted save');
  assert.equal(restored.zone().props.filter((p) => expected[p.id]).length,
    Object.keys(expected).length, 'no duplicate art on reload');
  // Simulate a release-5 save and preserve a player-owned custom prop.
  const old = JSON.parse(serialized), oldZone = old.zones.vale;
  // Recreate a legitimate old scene-5 save that predates the overlay.
  delete oldZone.greenwoodRefinementVersion;
  delete oldZone.greenwoodRefinementAudit;
  oldZone.props = oldZone.props.filter((p) => !expected[p.id]);
  oldZone.props.push({ id: 'player-custom-greenwood-679', structure: 'barrel',
    playerOwned: true, x: 2900, y: 3100, r: 0, decorative: true });
  const oldInput = JSON.stringify(old), migrated = C.restore(old, rng(seed));
  assert.equal(JSON.stringify(old), oldInput);
  const newProps = migrated.zone().props;
  for (const id of Object.keys(expected))
    assert.equal(newProps.filter((p) => p.id === id).length, 1,
      'old scene-5 save gains a single additive candidate: ' + id);
  assert(newProps.some((p) => p.id === 'player-custom-greenwood-679' && p.playerOwned),
    'owned objects survive the scenery regeneration');
  assert.equal(migrated.zone().enemies.filter((e) => e.type === 'mob' && !e.summon).length, 32);
  assert.equal(migrated.zone().nodes.reduce((n, p) => n + p.amount, 0), 640);
}
console.log('PASS #679 authored micro-scenes, owned props, source preservation and four seeded v4 saves');
// The observed, complete patrol path is recorded; waypoint-only coverage is
// insufficient to claim the Goblin/frontier corridor or Mira escort is safe.
const g = new C('normal', 'paladin', rng(0x47564101));
g.xp(120);
const e = g.zone().enemies.find((e) => e.family === 'thorn' && e.type === 'boss');
const mira = g.thornCaptive();
assert(e && mira && mira.id === 'cage-thorn');
const order = [], visited = [], path = [];
let prevLeg = null, maxGap = 0, minMillhaven = Infinity, homecoming = false;
for (let step = 0; step < 18000; step++) {
  const before = { x: e.x, y: e.y }, beforeMira = { x: mira.x, y: mira.y };
  g.s.time += 0.1;
  g.updateThornPatrol(e, 0.1);
  g.updateThornCaptive(0.1);
  const leg = e.thornLeg;
  if (leg !== prevLeg) {
    order.push(leg);
    visited.push({ leg, x: e.x, y: e.y, second: Math.round(g.s.time) });
    if (prevLeg === 0 && leg === 7) homecoming = true;
    prevLeg = leg;
  }
  if (step % 20 === 0) path.push([Math.round(e.x), Math.round(e.y)]);
  maxGap = Math.max(maxGap, dist(e, mira));
  minMillhaven = Math.min(minMillhaven, dist(e, { x: 650, y: 600 }));
  assert(dist(before, e) <= C.rules.thornPatrol.speed * 0.1 + 0.1, 'no boss teleport');
  assert(dist(beforeMira, mira) <= C.rules.thornPatrol.captiveSpeed * 0.1 + 0.1, 'no Mira teleport');
  if (homecoming) break;
}
console.log('GREENWOOD_679_PATROL_OBSERVATION ' + JSON.stringify({
  order, visited, homecoming,
  maxCaptiveGap: Math.round(maxGap), minMillhaven: Math.round(minMillhaven),
  sampledPath: path.filter((_, i) => i % 5 === 0),
}));
assert.deepEqual(order, [7, 6, 5, 4, 3, 2, 1, 0, 7],
  'complete den-to-den southern-first route with stable saved indices');
assert(homecoming);
assert(maxGap <= C.rules.thornPatrol.waitForCaptive + 25, 'captive travels with the scout');
assert(minMillhaven > 360, 'patrol does not enter Millhaven');
console.log('PASS #679 full eight-leg den-to-den native patrol, captive continuity and town exclusion');

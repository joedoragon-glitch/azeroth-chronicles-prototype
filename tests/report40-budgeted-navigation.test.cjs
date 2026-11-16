'use strict';
// #886: native Greenwood parity and strict per-callback work quotas.
// These are CI/Node tests, not Chromebook frame-time or device acceptance.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const g = new Campaign('normal', 'mage', () => .5);
const leg = Campaign.rules.thornPatrol.route[4];
const target = { id: 'skeleton-territory', x: leg[0], y: leg[1] };
const samples = [[1700, 1000], [1300, 900], [1200, 800]];
const rows = [];
function drive(iterator, maxFrames = 2000, game = g) {
  let pending = null, reply, frames = 0, totalProbes = 0, totalNodes = 0;
  let output;
  while (frames++ < maxFrames) {
    let probes = 0, nodes = 0, complete = false;
    while (true) {
      if (!pending) {
        const state = iterator.next(reply);
        reply = undefined;
        if (state.done) {
          complete = true;
          output = state.value;
          break;
        }
        pending = state.value;
      }
      if (pending.kind === 'blocked') {
        if (probes >= 128) break;
        probes++;
        reply = game.blocked(...pending.args);
      } else if (pending.kind === 'node') {
        if (nodes >= 24) break;
        nodes++;
        reply = undefined;
      } else throw Error('unexpected resumable solver request');
      pending = null;
    }
    assert(probes <= 128 && nodes <= 24, 'a frame cannot exceed its guide quota');
    totalProbes += probes;
    totalNodes += nodes;
    if (complete) return { output, frames, totalProbes, totalNodes };
  }
  throw Error('guide search failed to finish under the explicit bounded driver');
}
for (const [x, y] of samples) {
  Object.assign(g.hero, { x, y });
  const native = g.navigationTarget(target);
  assert(native && native.path.length, 'native Greenwood route exists');
  const { output, frames, totalProbes, totalNodes } =
    drive(g.budgetedNavigationTarget(target, { x, y }));
  assert.deepEqual(output, native,
    'incremental map target must preserve the exact authored destination, candidate and BFS waypoints');
  let from = { x, y };
  for (const waypoint of output.path) {
    assert(g.clearSegment(from, waypoint, 15, false),
      'every resulting leg is collision-valid on authored Greenwood terrain');
    from = waypoint;
  }
  assert(frames > 1, 'expensive search is divided into bounded slices');
  rows.push({ from: [x, y], frames, totalProbes, totalNodes, pathLength: output.path.length });
}
// Exercise the same optional resolver on the five actual regional maps.
// Preserve authored rest frontages and both offshore-ferry dock choices.
const regionalRoutes = [];
for (const region of Campaign.data.regions) {
  const game = new Campaign('normal', 'ranger', () => .73);
  game.enter(region.id);
  game.zone();
  const destinations = game.mapDestinations();
  const town = destinations.find((place) => place.kind === 'rest' && place.id === 'rest');
  assert(town, region.id + ' retains its actual rest frontage');
  const harbor = Campaign.rules.harbors?.[region.id];
  const ferry = harbor ? destinations.find((place) =>
    place.kind === 'transport' && place.harbor === true &&
    Math.hypot(place.x - harbor.boat.x, place.y - harbor.boat.y) < 1) : null;
  if (harbor) assert(ferry, region.id + ' retains the authored ferry');
  for (const target of [town, ferry].filter(Boolean)) {
    const original = game.navigationTarget(target);
    assert(original, region.id + ' native destination exists: ' + target.id);
    const { output, frames } = drive(
      game.budgetedNavigationTarget(target, { x: game.hero.x, y: game.hero.y }),
      2500, game,
    );
    assert.deepEqual(output, original,
      region.id + ' bounded guide must choose the same native frontage and path');
    let from = game.hero;
    for (const point of output.path) {
      assert(game.clearSegment(from, point, 15, false),
        region.id + ' generated route has a collision-safe segment');
      from = point;
    }
    regionalRoutes.push({ region: region.id, destination: target.id, frames });
  }
}
assert.equal(drive(g.budgetedNavigationTarget(null)).output, null);
console.log('PASS #886 exact native Greenwood destination/path parity with 128-probe/24-node slices ' +
  JSON.stringify({ greenwood: rows, regionalRoutes }));

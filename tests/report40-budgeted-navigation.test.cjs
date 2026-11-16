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
function drive(iterator, maxFrames = 2000) {
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
        reply = g.blocked(...pending.args);
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
assert.equal(drive(g.budgetedNavigationTarget(null)).output, null);
console.log('PASS #886 exact native Greenwood destination/path parity with 128-probe/24-node slices ' +
  JSON.stringify(rows));

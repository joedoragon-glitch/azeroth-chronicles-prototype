'use strict';
// Report #40 focused source-native navigation attribution. This is an
// offline headless benchmark of actual Greenwood geometry, NOT a Chromebook
// slowdown reproduction, device FPS claim, or a reason to change route logic.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const { performance } = require('node:perf_hooks');

// The Western road observer can point to Thornfang's "Skeleton territory"
// patrol leg. Use rounded synthetic player positions along that area instead
// of storing or publishing any exact position trace from the private report.
const goal = Campaign.rules.thornPatrol.route[4];
const samples = [
  [1700, 1000], [1600, 1000], [1500, 1000], [1400, 1000],
  [1300, 1000], [1300, 900], [1200, 800],
];
const g = new Campaign('normal', 'mage', () => .5);
const nativeBlocked = g.blocked, nativeRoute = g.route;
let routeCalls = 0, blockedCalls = 0, segmentCalls = 0;
g.blocked = function (...args) {
  blockedCalls++;
  return nativeBlocked.apply(this, args);
};
const nativeSegment = g.clearSegment;
g.clearSegment = function (...args) {
  segmentCalls++;
  return nativeSegment.apply(this, args);
};
g.route = function (...args) {
  routeCalls++;
  return nativeRoute.apply(this, args);
};
const rows = [];
for (const [x, y] of samples) {
  Object.assign(g.hero, { x, y });
  const prior = { blockedCalls, segmentCalls, routeCalls };
  const t = performance.now();
  const result = g.navigationTarget({
    id: 'thorn-lead-4', name: 'Skeleton territory', x: goal[0], y: goal[1],
  });
  const durationMs = performance.now() - t;
  const row = {
    // Rounded/source-derived reconstruction, NOT the owner's coordinate trace.
    from: [x, y],
    to: goal,
    durationMs: +durationMs.toFixed(2),
    routeCalls: routeCalls - prior.routeCalls,
    blockedCalls: blockedCalls - prior.blockedCalls,
    segmentCalls: segmentCalls - prior.segmentCalls,
    hasPath: !!result?.path?.length,
    waypoints: result?.path?.length ?? 0,
  };
  rows.push(row);
}
assert(rows.some(row => row.routeCalls > 0), 'native navigationTarget should call route()');
assert(rows.some(row => row.hasPath), 'at least one Greenwood witness route must be reachable');
assert(rows.every(row => Number.isFinite(row.durationMs) && row.durationMs >= 0),
  'all route timings must be finite');

// Report both wall time and terrain checks; terrain checks reveal structural
// algorithmic work without treating CI runner milliseconds as Chromebook time.
const calls = rows.map(row => row.durationMs).sort((a,b) => a-b);
console.log('REPORT40_NAVIGATION_ROUTE_COST ' + JSON.stringify({
  label: 'native-Greenwood-Thornfang-Skeleton-lead',
  target: goal,
  sampledRoutes: rows.length,
  fastestMs: calls[0],
  medianMs: calls[Math.floor(calls.length/2)],
  slowestMs: calls.at(-1),
  totalRouteCalls: routeCalls,
  totalBlockedCalls: blockedCalls,
  totalSegmentCalls: segmentCalls,
  samples: rows,
  evidence: 'native Node on GitHub runner, not physical Chromebook; report 40 did not record route durations',
}));
delete g.route; delete g.clearSegment; delete g.blocked;
console.log('PASS reconstructed native Greenwood witness navigation route-cost attribution');

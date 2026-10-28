'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');

function fixture(corridor, count) {
  const g = new C('developer', 'paladin', () => 0.73);
  const z = g.zone();
  z.enemies = [];
  z.props = [];
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.normal.crypt = true;
  g.s.true.crypt = true;
  Object.assign(g.hero, { x: 300, y: 1500 });
  if (corridor) {
    for (let x = 100; x <= 900; x += 25)
      for (const y of [1450, 1550])
        z.props.push({ id: 'lane-' + x + '-' + y, x, y, r: 30 });
  }
  for (let i = 0; i < count; i++) {
    const e = g.makeEnemy(
      { species: 'goblin', name: 'Crowd profile foe', level: 1,
        hp: 100000, damage: 0, gold: 0, xp: 0 },
      { x: 328 + i * 9, y: corridor ? 1500 : 1480 + (i % 4) * 50 },
    );
    z.enemies.push(e);
  }
  return g;
}

function run(corridor, count, measured) {
  const g = fixture(corridor, count);
  const originalMethod = g.move;
  if (measured) {
    g.startCrowdDiagnostics();
    assert.equal(g.crowdDiagnosticsReport().recording, true);
  }
  for (let tick = 0; tick < 18; tick++) {
    g.s.time += 0.05;
    if (measured) g.crowdDiagnosticsBeginFrame();
    for (const unit of [g.hero, ...g.zone().enemies])
      g.move(unit, { x: 750, y: 1500 }, 100, 0.05);
    g.separateActors(0.05);
    if (measured) g.crowdDiagnosticsEndFrame();
  }
  const snapshot = g.snapshot();
  const report = g.crowdDiagnosticsReport();
  if (measured) {
    assert.equal(report.sampledSimulationTicks, 18);
    assert(report.metrics.blockedCalls.mean > 0);
    assert(report.metrics.segmentPoints.mean > 0);
    assert(report.metrics.moveCalls.mean >= count + 1);
    assert(report.metrics.separationBodies.mean >= count + 1);
    assert(report.metrics.moveMs.samples === 18);
    for (const key of ['moveMs', 'blockedMs', 'routeMs', 'separationMs'])
      assert(Number.isFinite(report.metrics[key].p95), key + ' is numeric');
    g.stopCrowdDiagnostics();
    assert.equal(g.crowdDiagnosticsReport().recording, false);
    assert.equal(g.move, originalMethod, 'Stop restores original movement behavior');
    assert.equal(Object.hasOwn(g, 'blocked'), false,
      'Stop removes all instance profiling wrappers');
  } else {
    assert.equal(report.sampledSimulationTicks, 0, 'Default never profiles gameplay');
    assert.equal(Object.hasOwn(g, 'blocked'), false);
  }
  return { snapshot, report };
}

const comparisons = [];
for (const corridor of [false, true]) {
  for (const count of [3, 8, 16]) {
    const baseline = run(corridor, count, false);
    const sampled = run(corridor, count, true);
    assert.deepEqual(sampled.snapshot, baseline.snapshot,
      'Opt-in instrumentation cannot alter gameplay state: ' + corridor + '/' + count);
    comparisons.push({
      arena: corridor ? 'corridor' : 'open',
      enemies: count,
      blockedCalls: sampled.report.metrics.blockedCalls.mean,
      segmentPoints: sampled.report.metrics.segmentPoints.mean,
      nearbyActorHits: sampled.report.metrics.nearbyActorHits.mean,
      maxCell: sampled.report.metrics.maxCellBodies.max,
      separationMs: sampled.report.metrics.separationMs.mean,
    });
  }
}
const open3 = comparisons.find(x => x.arena === 'open' && x.enemies === 3),
  corridor16 = comparisons.find(x => x.arena === 'corridor' && x.enemies === 16);
assert(corridor16.maxCell > open3.maxCell, 'Density is visible in actor-bin counts');
assert(corridor16.nearbyActorHits > open3.nearbyActorHits,
  'Dense crowds produce more candidate actor encounters');
assert(corridor16.segmentPoints > 0 && corridor16.blockedCalls > 0);

// The regular route() counter cannot see companionRoute()'s separate A*.
// Verify the new opt-in counters cover actual companion movement without
// changing game state, and that Stop restores all instance wrappers.
function companionNavigationProbe(measured) {
  const g = fixture(false, 0);
  const u = g.unit('soldier', 300, 1500, 'vale');
  g.s.party = [u];
  const originalRoute = g.companionRoute;
  const originalFollow = g.followCompanion;
  const originalClear = g.companionTravelClear;
  if (measured) {
    g.startCrowdDiagnostics();
    g.crowdDiagnosticsBeginFrame();
  }
  g.companionRoute(u, { x: 330, y: 1500 });
  g.followCompanion(u, { x: 360, y: 1500 }, 100, 0.05, 10);
  if (measured) g.crowdDiagnosticsEndFrame();
  const saved = g.snapshot();
  if (measured) {
    const metrics = g.crowdDiagnosticsReport().metrics;
    assert.equal(metrics.companionRouteCalls.max, 1, 'separate A* attempts are counted');
    assert.equal(metrics.companionFollowCalls.max, 1, 'companion follow is measured');
    assert(metrics.companionTravelClearCalls.max >= 1, 'direct/route clearance is measured');
    for (const key of ['companionRouteMs', 'companionFollowMs', 'companionTravelClearMs'])
      assert(Number.isFinite(metrics[key].max), key + ' reports finite milliseconds');
    assert.equal(metrics.routeCalls.max, 0, 'hero route() remains distinct from companion A*');
    g.stopCrowdDiagnostics();
    assert.equal(g.companionRoute, originalRoute);
    assert.equal(g.followCompanion, originalFollow);
    assert.equal(g.companionTravelClear, originalClear);
    assert(!Object.hasOwn(g, 'companionRoute'), 'Stop removes temporary A* wrapper');
  } else {
    assert(!Object.hasOwn(g, 'companionRoute'), 'no production A* profiler');
    assert.equal(g.crowdDiagnosticsReport().sampledSimulationTicks, 0);
  }
  return saved;
}
assert.deepEqual(companionNavigationProbe(true), companionNavigationProbe(false),
  'companion route timing must preserve identical campaign state');

// Collection is bounded, and the unsaved report never enters the campaign snapshot.
const bounded = fixture(true, 2);
bounded.startCrowdDiagnostics();
for (let i = 0; i < 180; i++) {
  bounded.crowdDiagnosticsBeginFrame();
  bounded.move(bounded.hero, { x: 600, y: 1500 }, 100, 0.05);
  bounded.crowdDiagnosticsEndFrame();
  bounded.s.time += 0.05;
}
assert.equal(bounded.crowdDiagnosticsReport().sampledSimulationTicks, 120);
assert(!JSON.stringify(bounded.snapshot()).includes('crowdDiagnostics'),
  'Diagnostics must remain outside v4 campaign saves');
bounded.stopCrowdDiagnostics();

// Production-shell callback records only actual gameplay ticks, not paused menus.
const { shell } = require('./helpers/production-shell.cjs');
const app = shell('en');
app.scope.Prototype.game.startCrowdDiagnostics();
app.frame(0);
app.frame(33);
assert(app.scope.Prototype.game.crowdDiagnosticsReport().sampledSimulationTicks >= 1);
app.elements.get('menu-button').click();
const before = app.scope.Prototype.game.crowdDiagnosticsReport().sampledSimulationTicks;
app.frame(66);
assert.equal(app.scope.Prototype.game.crowdDiagnosticsReport().sampledSimulationTicks, before,
  'Menu/paused redraws must never contaminate the crowd sample');
app.scope.Prototype.game.stopCrowdDiagnostics();

console.log('Crowd characterization (diagnostic counts; timing includes profiler overhead):');
for (const row of comparisons) console.log(JSON.stringify(row));
console.log('PASS crowd diagnostics: no state differences, low/medium/high density, bounded samples, actual frame integration');

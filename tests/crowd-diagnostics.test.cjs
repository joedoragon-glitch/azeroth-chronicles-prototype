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
    if (measured) g.crowdDiagnosticsEndFrame();
  }
  const snapshot = g.snapshot();
  const report = g.crowdDiagnosticsReport();
  if (measured) {
    assert.equal(report.sampledSimulationTicks, 18);
    assert(report.metrics.blockedCalls.mean > 0);
    assert(report.metrics.segmentPoints.mean > 0);
    assert(report.metrics.moveCalls.mean >= count + 1);
    assert(report.metrics.moveMs.samples === 18);
    for (const key of ['moveMs', 'blockedMs', 'routeMs'])
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
      moveMs: sampled.report.metrics.moveMs.mean,
    });
  }
}
const open3 = comparisons.find(x => x.arena === 'open' && x.enemies === 3),
  corridor16 = comparisons.find(x => x.arena === 'corridor' && x.enemies === 16);
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
  'Menu/paused redraws must never contaminate navigation samples');
app.scope.Prototype.game.stopCrowdDiagnostics();

console.log('Navigation characterization (terrain counts; timing includes profiler overhead):');
for (const row of comparisons) console.log(JSON.stringify(row));
console.log('PASS navigation diagnostics: no state differences, terrain profiling, bounded samples, actual frame integration');


// #534: Test-only source-call attribution. This does not install production
// wrappers, add saved fields, or change the runtime profiler. It exercises the
// real March terrain and native five-unit companion simulation, rather than
// attributing every blocked() query to A* or treating overlapping times as
// exclusive CPU costs. The logger is diagnostic evidence, not a speed target.
function marchCompanionCallsite(measured, mode) {
  const g = new C('developer', 'mage', () => 0.73);
  g.enter('march');
  assert.equal(g.zoneId, 'march');
  const z = g.zone();
  z.enemies = [];
  g.s.party = [];
  g.s.mercyTime = 0;
  const location = g.safe(244, 784);
  Object.assign(g.hero, location);
  const members = [
    ['soldier', undefined],
    ['archer', undefined],
    ['soldier', undefined],
    ['pet', 'warlord'],
    ['pet', 'ridge'],
  ];
  g.s.party = members.map(([type, family], index) => {
    const offset = (index - 2) * 12;
    const point = g.safe(location.x + offset, location.y + 80 + (index % 2) * 16);
    return g.unit(type, point.x, point.y, family);
  });
  if (mode === 'critical-combat') {
    for (const [i, u] of g.s.party.entries()) {
      if (i < 2) u.hp = u.maxHp * 0.15;
    }
    const enemy = g.makeEnemy(
      { species: 'goblin', name: 'Profiling combat foe', level: 1,
        hp: 100000, damage: 0, gold: 0, xp: 0 },
      { x: location.x + 70, y: location.y + 70 },
    );
    enemy.aggro = true;
    z.enemies.push(enemy);
  } else if (mode === 'recall') {
    g.recallParty();
    assert.equal(g.s.recallActive, true, 'the real Recall order remains active');
  }
  const names = [
    'safe', 'partyFollowPoint', 'followRecalledCompanion',
    'followPartyMember', 'companionSurvivalPoint', 'followCriticalCompanion',
    'companionCautiousCombat', 'companionSafetyAssessment',
    'companionSurvivalScore', 'companionAreaDanger',
    'companionPositionProtected', 'line', 'enemyRangedLine',
    'followCompanion', 'companionRoute', 'clearSegment', 'move',
  ];
  const counts = new Map(names.map((name) => [name, { calls: 0, blocked: 0, ms: 0, maxBlocked: 0 }]));
  let blocked = 0;
  const originals = new Map();
  if (measured) {
    const originalBlocked = g.blocked;
    originals.set('blocked', originalBlocked);
    g.blocked = function (...args) {
      blocked++;
      return originalBlocked.apply(this, args);
    };
    for (const name of names) {
      const original = g[name];
      assert.equal(typeof original, 'function', name + ' is a current source method');
      originals.set(name, original);
      g[name] = function (...args) {
        const before = blocked, start = performance.now();
        try {
          return original.apply(this, args);
        } finally {
          const row = counts.get(name);
          row.calls++;
          row.blocked += blocked - before;
          row.maxBlocked = Math.max(row.maxBlocked, blocked - before);
          row.ms += performance.now() - start;
        }
      };
    }
  }
  for (let i = 0; i < 10; i++) {
    g.s.time += 0.05;
    g.updateParty(0.05);
  }
  const snapshot = g.snapshot();
  for (const [name, original] of originals) {
    // All instrumentation is local to this test instance. No wrapper is
    // attached to the Campaign prototype or saved into a campaign.
    delete g[name];
    assert.equal(g[name], original);
  }
  return {
    snapshot,
    results: {
      mode,
      totalBlocked: blocked,
      methods: [...counts].map(([name, metrics]) => ({
        name, ...metrics, ms: +metrics.ms.toFixed(2),
      })).filter(({ calls }) => calls).sort((a, b) => b.blocked - a.blocked),
    },
  };
}
for (const mode of ['calm-follow', 'recall', 'critical-combat']) {
  const baseline = marchCompanionCallsite(false, mode),
    sampled = marchCompanionCallsite(true, mode);
  assert.deepEqual(sampled.snapshot, baseline.snapshot,
    mode + ': test-only callsite instrumentation must preserve campaign state');
  assert(sampled.results.totalBlocked > 0, mode + ': real March collision calls observed');
  if (mode === 'critical-combat')
    assert(sampled.results.totalBlocked < 3500,
      'the bounded retreat must substantially reduce the unbounded 5,284-query baseline');

  console.log('MARCH_COMPANION_CALLSITE ' + JSON.stringify(sampled.results));
}


// Resumable planning must produce the native A*/BFS result, including
// obstacle detours, while bounding *nested* authoritative terrain probes.
{
  const g = new C('developer', 'mage', () => 0.73);
  g.s.time = 80;
  g.s.mercyTime = 0;
  const z = g.zone();
  z.enemies = [];
  z.props = [];
  const start = { x: 600, y: 1000 },
    destination = { x: 900, y: 1000 };
  g.blocked = (x, y, _zone, r = 15) =>
    x < 40 + r || y < 40 + r || x > 2745 - r || y > 2745 - r ||
    (x > 730 - r && x < 780 + r && y > 750 - r && y < 1150 + r);
  assert(!g.clearSegment(start, destination), 'the synthetic narrow-wall detour is real');
  const native = {
    companion: g.companionRoute(start, destination),
    tactical: g.route(start, destination),
  };
  for (const mode of ['companion', 'tactical']) {
    assert(native[mode].length, mode + ' native route can pass the obstacle');
    const originalBlocked = g.blocked;
    let pending = null, result, probes = 0, turns = 0, sawPending = false;
    while (!result && turns++ < 350) {
      g.s.time += 0.05;
      let tickChecks = 0;
      g.blocked = function (...args) {
        tickChecks++;
        return originalBlocked.apply(this, args);
      };
      try {
        const next = g.advanceBudgetedRoute(start, destination, mode, pending);
        probes += tickChecks;
        assert(tickChecks <= g.routePlanningLimits().terrainProbesPerSearch,
          'one ' + mode + ' search cannot consume an unlimited nested segment');
        if (next.pending) {
          sawPending = true;
          pending = next.state;
        } else result = next.path;
      } finally {
        g.blocked = originalBlocked;
      }
    }
    assert(sawPending, mode + ' must genuinely suspend at the work limit');
    assert(result, mode + ' completes a resumable path');
    assert.deepEqual(result, native[mode],
      mode + ' original route selection and smoothing remain unchanged');
    assert(probes > g.routePlanningLimits().terrainProbesPerSearch);
  }
  // Shared with all route-planning consumers, even when multiple actors ask
  // for different searches in one simulation update.
  g.s.time += 0.05;
  const originalBlocked = g.blocked;
  let combined = 0;
  g.blocked = function (...args) { combined++; return originalBlocked.apply(this, args); };
  try {
    for (let i = 0; i < 4; i++)
      g.advanceBudgetedRoute(start, destination, i % 2 ? 'tactical' : 'companion');
  } finally { g.blocked = originalBlocked; }
  assert(combined <= g.routePlanningLimits().terrainProbesPerTick,
    'companion, delivery and enemy planning share one tick allowance');
  assert(!JSON.stringify(g.snapshot()).includes('routePlanning'),
    'search frontiers and counters are never persisted');
  delete g.blocked;
}
console.log('PASS resumable companion/tactical route parity, shared hard terrain budget, and transient state');

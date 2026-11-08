'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  cp = require('node:child_process');
const { performance } = require('node:perf_hooks');
const C = require('../src/prototype/engine'),
  D = require('../src/prototype/data'),
  R = require('../src/prototype/rules');
const base = process.env.PERF_BASE_SHA || process.env.CI_BASE_SHA || '5a7be00b68e640d51f5a8b9f493fb05695b4bf4a';
const original = cp.execFileSync('git', ['show', base + ':src/prototype/navigation.js'], {
  encoding: 'utf8',
});
function install(K, source) {
  const mod = { exports: {} };
  new Function('module', source)(mod);
  mod.exports.install(K, D, R, C.dungeonIds);
}
class Baseline extends C {}
class Candidate extends C {}
install(Baseline, original);
install(Candidate, fs.readFileSync('src/prototype/navigation.js', 'utf8'));
function game(K, zone) {
  const g = new K('normal', 'paladin', () => 0.73);
  g.enter(zone);
  return g;
}
function lanes(zone) {
  const g = game(C, zone),
    size = g.zoneSize(),
    out = [];
  for (let y = 200; y < size - 500 && out.length < 3; y += 160)
    for (let x = 200; x < size - 500 && out.length < 3; x += 160) {
      const a = { x, y },
        b = { x: x + 300, y: y + 160 };
      if (g.blocked(a.x, a.y) || g.blocked(b.x, b.y) || g.clearSegment(a, b)) continue;
      const path = g.route(a, b);
      if (path.length) out.push({ a, b });
    }
  assert(out.length, zone + ' has authored obstructed lanes');
  return out;
}
function run(K, zone, mode, lanes) {
  const g = game(K, zone),
    original = g.blocked,
    rows = [],
    plans = Array(7).fill(null);
  let probes = 0;
  g.blocked = function (...args) {
    probes++;
    return original.apply(this, args);
  };
  const start = performance.now();
  for (let tick = 0; tick < 240; tick++) {
    g.s.time += 0.05;
    const before = probes,
      result = [];
    for (let i = 0; i < 7; i++) {
      if (plans[i]?.done) {
        result.push(plans[i].result);
        continue;
      }
      const lane = lanes[i % lanes.length],
        r = g.advanceBudgetedRoute(lane.a, lane.b, mode, plans[i]);
      result.push({ pending: r.pending, path: r.path ? JSON.parse(JSON.stringify(r.path)) : null });
      plans[i] = r.pending ? r.state : { done: true, result: result.at(-1) };
    }
    rows.push({ tick, probes: probes - before, result });
    if (plans.every((p) => p.done)) break;
  }
  assert(
    plans.every((p) => p.done),
    zone + ' completes bounded planning',
  );
  return { rows, probes, ms: performance.now() - start };
}
const results = [];
for (const zone of ['march', 'highlands', 'frontier']) {
  const paths = lanes(zone);
  for (const mode of ['pursuit', 'elite-pursuit', 'companion']) {
    const a = run(Baseline, zone, mode, paths),
      b = run(Candidate, zone, mode, paths);
    assert.deepEqual(
      b.rows.map((r) => r.result),
      a.rows.map((r) => r.result),
      zone + ' ' + mode + ' identical completion tick/waypoints for seven simultaneous routes',
    );
    results.push({
      zone,
      mode,
      ticks: a.rows.length,
      baselineProbes: a.probes,
      candidateProbes: b.probes,
      baselineMs: a.ms,
      candidateMs: b.ms,
      paths,
    });
  }
}
// Every invocation must observe in-place geometry changes even in the same tick.
const g = game(C, 'march');
let blocked = false,
  calls = 0;
g.blocked = () => {
  calls++;
  return blocked;
};
g.budgetedTacticalRoute = function* () {
  const p = { kind: 'blocked', args: [500, 500, g.zoneId, 15] };
  const a = yield p,
    b = yield p;
  assert.equal(a, b);
  return [{ x: a ? 1 : 2, y: 0 }];
};
assert.equal(
  g.advanceBudgetedRoute({ x: 500, y: 500 }, { x: 550, y: 500 }, 'pursuit').path[0].x,
  2,
);
blocked = true;
assert.equal(
  g.advanceBudgetedRoute({ x: 500, y: 500 }, { x: 550, y: 500 }, 'pursuit').path[0].x,
  1,
);
assert.equal(calls, 2);
// Native enemy update/combat, not just stand-alone route completion. Reconstruct
// an obstructed encounter from existing ordinary actors on unchanged terrain.
function encounter(K) {
  const g = game(K, 'march'),
    p = results[0].paths[0];
  const enemies = g
    .zone()
    .enemies.filter(
      (e) =>
        e.hp > 0 &&
        !e.neutral &&
        !g.enemyRanged(e) &&
        e.type !== 'boss' &&
        !e.captain &&
        !e.roomCaptain,
    )
    .slice(0, 7);
  assert.equal(enemies.length, 7);
  g.zone().enemies = enemies;
  g.s.party = [];
  g.s.mercyTime = 0;
  g.hero.x = p.b.x;
  g.hero.y = p.b.y;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i],
      q = g.safe(p.a.x + (i % 3) * 16, p.a.y + Math.floor(i / 3) * 16);
    e.x = q.x;
    e.y = q.y;
    // A staged spawn keeps its native leash anchored at the staged home.
    // Leaving the old home across the map makes the engine immediately reset.
    e.home = { ...q };
    e.path = [];
    g.engage(e, true, false);
    assert(e.aggro, 'native engagement admitted the staged melee enemy');
  }
  return g;
}
const originalEncounter = encounter(Baseline),
  nextEncounter = encounter(Candidate);
function countPursuit(g) {
  const advance = g.advanceBudgetedRoute;
  let count = 0;
  g.advanceBudgetedRoute = function (...args) {
    if (args[2] === 'pursuit') count++;
    return advance.apply(this, args);
  };
  return () => count;
}
const oldPursuit = countPursuit(originalEncounter),
  newPursuit = countPursuit(nextEncounter);
let peakSimultaneousPursuit = 0;
for (let tick = 0; tick < 120; tick++) {
  const before = newPursuit();
  originalEncounter.tick(0.05);
  nextEncounter.tick(0.05);
  assert.equal(newPursuit(), oldPursuit(), 'native pursuit scheduling at tick ' + tick);
  peakSimultaneousPursuit = Math.max(peakSimultaneousPursuit, newPursuit() - before);
  assert.equal(
    JSON.stringify(nextEncounter.s),
    JSON.stringify(originalEncounter.s),
    'native combat/AI/save state after tick ' + tick,
  );
}
assert(
  peakSimultaneousPursuit >= 2,
  'the real encounter must exercise overlapping budgeted pursuit',
);
assert.deepEqual(
  C.restore(nextEncounter.snapshot(), () => 0.73).snapshot(),
  C.restore(originalEncounter.snapshot(), () => 0.73).snapshot(),
  'v4 round-trip parity after native encounter',
);
const lane = results[0].paths;
const times = { baseline: [], candidate: [] };
for (let i = 0; i < 12; i++)
  for (const name of i % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate']) {
    const r = run(name === 'baseline' ? Baseline : Candidate, 'march', 'pursuit', lane);
    if (i >= 2) times[name].push(r.ms);
  }
const summary = (v) => {
  const s = v.slice().sort((a, b) => a - b);
  return { median: s[5], p95: s.at(-1) };
};
const report = {
  base,
  results,
  nativeCombatTicks: 120,
  nativePursuitCalls: newPursuit(),
  peakSimultaneousPursuit,
  saveRoundTrip: true,
  timing: { baseline: summary(times.baseline), candidate: summary(times.candidate) },
  note: 'Native authored-geometry planner CPU; identical yielded budgets/completion ticks; not device FPS or encounter certification',
};
fs.mkdirSync('test-results', { recursive: true });
fs.writeFileSync('test-results/route-probe-reuse.json', JSON.stringify(report, null, 2) + '\n');
console.log(
  'PASS same-tick route/collision/budget parity',
  JSON.stringify({ ...report, results: results.map(({ paths, ...r }) => r) }),
);

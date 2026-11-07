'use strict';
// P0 #839 diagnostic-only: exact native route behavior, scoped tracing and
// enemy-phase marker fidelity. No replacement collision model or gameplay AI.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Campaign = require('../src/prototype/engine');

const root = path.join(__dirname, '..');
const app = readFileSync(path.join(root, 'src/prototype/app.js'), 'utf8');
const engine = readFileSync(path.join(root, 'src/prototype/engine.js'), 'utf8');
const navigation = readFileSync(path.join(root, 'src/prototype/navigation.js'), 'utf8');
const game = () => new Campaign('developer', 'mage', () => 0.73);

test('native route returns identical waypoints with observer enabled, and observer retires', () => {
  const g = game();
  const origin = { x: g.hero.x, y: g.hero.y };
  const target = { x: origin.x + 145, y: origin.y + 50 };
  const baseline = g.route(origin, target);
  const row = {
    routeCalls: 0, routeMs: 0, maxRouteMs: 0,
    budgetedCalls: 0, budgetedMs: 0, maxBudgetedMs: 0,
  };
  const trace = { phase: 'roster', phases: { roster: row } };
  g.setEnemyRouteTrace(trace);
  const observed = g.route(origin, target);
  assert.deepEqual(observed, baseline, 'instrumentation must not change the native route');
  assert.equal(row.routeCalls, 1);
  assert(Number.isFinite(row.routeMs) && row.routeMs >= 0);
  assert(Number.isFinite(row.maxRouteMs) && row.maxRouteMs >= 0);
  const budget = g.advanceBudgetedRoute(origin, target, 'pursuit');
  assert(budget && typeof budget === 'object', 'native incremental planner returned a result');
  assert.equal(row.budgetedCalls, 1, 'incremental planning must not be lost behind full-route count');
  assert(Number.isFinite(row.budgetedMs) && row.budgetedMs >= 0);
  g.setEnemyRouteTrace(null);
  assert.deepEqual(g.route(origin, target), baseline);
  g.advanceBudgetedRoute(origin, target, 'pursuit');
  assert.equal(row.routeCalls, 1, 'disabled recorder no longer accumulates route calls');
  assert.equal(row.budgetedCalls, 1, 'disabled recorder no longer accumulates incremental calls');
});

test('native campaign enemy markers bracket the same source tick with state parity', () => {
  const reference = game(), observed = game();
  const marks = [];
  reference.tick(0.05, { x: 0, y: 0, speedFactor: 1 });
  observed.tick(0.05, {
    x: 0, y: 0, speedFactor: 1,
    performanceEnemyMark: (name) => marks.push(name),
  });
  assert.deepEqual(marks, [
    'rosterStart', 'rosterEnd', 'rogueStationsStart', 'rogueStationsEnd',
    'elitesStart', 'elitesEnd', 'packsStart', 'packsEnd',
    'reinforcementsStart', 'reinforcementsEnd',
  ]);
  assert.deepEqual(observed.s, reference.s, 'sampling cannot modify game-state/save fields');
});

test('renderer opt-in and exception cleanup are explicit and bounded', () => {
  assert.match(app, /enemyDetail: rendererDiagnosticActive \? \{ phase: null, phases: Object\.create\(null\) \} : null/);
  assert.match(app, /performanceEnemyMark: stageTimes\.enemyDetail/);
  assert.match(app, /finally \{[\s\S]*?if \(stageTimes\.enemyDetail\) game\.setEnemyRouteTrace\(null\)/);
  assert.match(app, /enemyDetail: stages\.enemyDetail/);
  assert.match(app, /game\.setEnemyRouteTrace\(null\);\s*\}\s*\/\/ Preserve the existing crowd recorder contract:[\s\S]*?game\.crowdDiagnosticsEndFrame\(\)/);
  assert.match(engine, /const enemyMark = typeof input\.performanceEnemyMark === 'function'/);
  assert.match(navigation, /const trace = enemyRouteTraces\.get\(this\)/);
  assert.match(navigation, /if \(!trace\) return originalRoute\.apply\(this, args\)/);
  assert.match(navigation, /if \(!trace\) return originalBudgetedRoute\.apply\(this, args\)/);
  assert.match(app, /budgetedCalls: row\.budgetedCalls/);
  assert.match(navigation, /finally \{[\s\S]*?row\.routeCalls\+\+/);
});

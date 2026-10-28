'use strict';
// Owner-requested PT-002 reversal, rooted in the pre-October 16 terrain-only movement.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

function scenario() {
  const game = new Campaign('developer', 'paladin', () => 0.73);
  const zone = game.zone();
  zone.enemies = [];
  zone.props = [];
  zone.buildings = [];
  game.s.party = [];
  game.s.mercyTime = 0;
  Object.assign(game.hero, { x: 900, y: 1500 });
  return game;
}
const g = scenario(), zone = g.zone();
assert.equal(typeof g.actorCrowd, 'undefined', 'no actor spatial bins');
assert.equal(typeof g.actorStepAllowed, 'undefined', 'no actor-body movement predicate');
assert.equal(typeof g.separateActors, 'undefined', 'no passive separation');
assert.equal(typeof g.crowdEscaping, 'undefined', 'no crowd-phasing state');
assert.equal(typeof g.observeCrowdFrame, 'undefined', 'no frame pressure collision feedback');
assert.equal(Campaign.rules.actorSpacing, undefined, 'retired collision configuration removed');

const enemy = g.makeEnemy(
  { species: 'goblin', name: 'Passage test', level: 1, hp: 100000,
    damage: 0, gold: 0, xp: 0 }, { x: 930, y: 1500 });
zone.enemies.push(enemy);
const soldier = g.unit('soldier', 940, 1500);
g.s.party.push(soldier);
// Both combat and travel movement cross other actors without moving the other actor.
g.engage(enemy);
assert(g.clearSegment(g.hero, { x: 980, y: 1500 }),
  'terrain sweep stays independent of other bodies');
assert(g.move(g.hero, { x: 980, y: 1500 }, 800, 0.1));
assert.equal(g.hero.x, 980, 'hero crosses enemy and companion');
assert.equal(enemy.x, 930, 'enemy is not displaced');
assert.equal(soldier.x, 940, 'companion is not displaced');
assert(g.move(enemy, { x: 980, y: 1500 }, 500, 0.1),
  'enemy can cross to hero position');
assert.equal(enemy.x, g.hero.x, 'actors may overlap exactly in combat');
assert(g.move(soldier, { x: 980, y: 1500 }, 400, 0.1),
  'companion can cross other bodies');
assert.equal(soldier.x, g.hero.x, 'companions may share combat coordinates');
g.s.time += 0.05;
g.tick(0.05); // Full simulation must not call retired actor separation.

const wall = { id: 'real-wall', x: 1060, y: 1500, r: 35 };
zone.props.push(wall);
const before = { x: g.hero.x, y: g.hero.y };
assert(!g.clearSegment(before, { x: 1130, y: 1500 }),
  'terrain/scenery must still block travel');
g.move(g.hero, { x: 1130, y: 1500 }, 1500, 0.1);
assert.equal(g.hero.x, before.x, 'blocked movement preserves original X');
assert.equal(g.hero.y, before.y, 'blocked movement preserves original Y');

// Retain unrelated route-search CPU budget without coupling it to actor grids.
g.s.time = 15;
assert(g.reserveMovementPlan(enemy));
assert(g.reserveMovementPlan(soldier));
const another = { x: 1500, y: 1500 };
assert(g.reserveMovementPlan(another));
assert(!g.reserveMovementPlan(another), 'only three nonhero plans per tick');
assert(g.reserveMovementPlan(g.hero), 'one hero plan remains available');
assert(!g.reserveMovementPlan(g.hero), 'four-plan limit holds');
g.s.time += 0.05;
assert(g.reserveMovementPlan(another), 'plan counter resets on next tick');

g.startCrowdDiagnostics(); // Existing exported API remains compatible, terrain-only.
g.crowdDiagnosticsBeginFrame();
g.move(g.hero, { x: 900, y: 1500 }, 100, 0.05);
g.crowdDiagnosticsEndFrame();
const report = g.crowdDiagnosticsReport();
assert.equal(report.sampledSimulationTicks, 1);
assert(!Object.hasOwn(report.metrics, 'nearbyActorHits'));
assert(!Object.hasOwn(report.metrics, 'separationCalls'));
g.stopCrowdDiagnostics();
assert(!JSON.stringify(g.snapshot()).includes('crowdDiagnostics'),
  'diagnostics never enter saved campaign');
const restored = Campaign.restore(g.snapshot(), () => 0.73);
assert.equal(typeof restored.actorCrowd, 'undefined');
assert.equal(typeof restored.separateActors, 'undefined');
console.log('PASS PT-002 rollback: hero/enemy/companion overlap, no stale actor hooks, terrain solid, navigation budget, save and diagnostics');

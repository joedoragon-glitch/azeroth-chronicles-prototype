'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const g = new C('developer', 'paladin', () => 0.73);
const e = g.makeEnemy({ species: 'goblin', name: 'Ground AoE source',
  level: 2, hp: 200, damage: 15, gold: 0, xp: 0 }, { x: 1000, y: 1000 });
g.s.party = [];

// Purely target-centered warnings must not call terrain collision or search
// for connected floor. Inaccessible scenery may overlap either warning.
let terrainCalls = 0;
const previousBlocked = g.blocked, previousSegment = g.clearSegment;
g.blocked = () => { terrainCalls++; return true; };
g.clearSegment = () => { terrainCalls++; return false; };
const blast = { kind: 'circle', x: 1040, y: 1000, radius: 90,
  timer: 1.2, total: 1.2, coefficient: 1 };
const sequence = [];
assert(g.prepareAttackSequence(e, blast, sequence));
assert.equal(terrainCalls, 0, 'normal AoE requires zero terrain-placement calls');
assert.equal(sequence.length, 0, 'no invented sequential fallback');
assert.deepEqual(blast.arenaPatches, [{ x: 1040, y: 1000, radius: 90 }]);
const committed = JSON.stringify(g.attackPatches(blast));
g.hero.x = 1100;
g.hero.y = 1000;
assert.equal(JSON.stringify(g.attackPatches(blast)), committed,
  'moving target cannot move a committed warning');

const lanes = { kind: 'line', count: 2, angle: 0, fromX: 1000, fromY: 1000,
  x: 1300, y: 1000, timer: 1, total: 1, coefficient: 1 };
assert(g.prepareAttackSequence(e, lanes, []));
assert.equal(terrainCalls, 0, 'twin ground lanes require no terrain fitting');
assert.deepEqual(lanes.arenaLines.map(({ fromX, fromY, x, y }) => [fromX, fromY, x, y]),
  [[1000, 915, 1300, 915], [1000, 1085, 1300, 1085]]);
g.blocked = previousBlocked;
g.clearSegment = previousSegment;

// Blast damage uses the same committed footprint, even if the caster cannot
// see through a wall. Physical directed attacks still use LOS.
let hits = 0, lineQueries = 0;
const originalTargets = g.combatTargets, originalHit = g.hitParty, originalLine = g.line;
g.combatTargets = () => [g.hero];
g.hitParty = () => { hits++; return true; };
g.line = () => { lineQueries++; return false; };
g.hero.x = 1040;
g.hero.y = 1000;
g.resolveArea(e, blast);
assert.equal(hits, 1, 'circular blast hits its warned footprint behind scenery');
assert.equal(lineQueries, 0, 'no caster LOS rejection for ground blast');
g.hero.x = 1100;
g.hero.y = 915;
g.resolveArea(e, lanes);
assert.equal(hits, 2, 'ground corridor hits its warned footprint behind scenery');
assert.equal(lineQueries, 0, 'no projectile LOS for ground corridor');
const directed = { kind: 'line', fromX: 1000, fromY: 1000,
  x: 1200, y: 1000, angle: 0, coefficient: 1 };
g.hero.x = 1100;
g.hero.y = 1000;
g.resolveArea(e, directed);
assert.equal(hits, 2, 'directed physical attack remains obstruction-sensitive');
assert(lineQueries > 0, 'physical attack still checks LOS');

g.combatTargets = originalTargets;
g.hitParty = originalHit;
g.line = originalLine;
console.log('PASS PT-007 ground warning/damage coherence and retained physical LOS');

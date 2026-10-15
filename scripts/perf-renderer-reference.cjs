'use strict';
// Counterfactual renderer: identical CURRENT art, labels, lights and facing,
// with the independently retained original occlusion broad phase and without
// optional #294 viewport arguments. Never compare two different art revisions.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Original = require('../tests/helpers/perf-ws2-baseline.cjs');
module.exports = function reference(root, { originalOcclusion = true } = {}) {
  let source = fs.readFileSync(path.join(root, 'src/prototype/renderer.js'), 'utf8');
  const start = source.indexOf('  function occlusionPairs(');
  const end = source.indexOf('\n  function create(', start);
  assert(start > 0 && end > start);
  if (originalOcclusion)
    source = source.slice(0, start) + Original.occlusionPairs.toString() + '\n' + source.slice(end);
  const a = source.indexOf('      if (!game.isDungeon())\n        PrototypeVisuals.terrain(');
  const b = source.indexOf('      PrototypeCombatVisuals.ground(', a);
  assert(a > 0 && b > a);
  let calls = 0;
  const terrain = source.slice(a, b).replace(/,\s*canvas,?(?=\s*\))/g, () => {
    calls++;
    return '';
  });
  assert.equal(calls, 0, 'optional #294 viewport integration remains disabled');
  return source.slice(0, a) + terrain + source.slice(b);
};

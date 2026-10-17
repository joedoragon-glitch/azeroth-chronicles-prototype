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
  // Same current art/state: compare the exact #308 pure phase function with
  // the Community weak memo. Pixel/state assertions remain byte-exact.
  const phaseStart = source.indexOf('    const phaseMemory = new WeakMap();');
  const phaseEnd = source.indexOf('    function visualPosition(', phaseStart);
  assert(phaseStart > 0 && phaseEnd > phaseStart, 'explicit Community phase source boundary');
  const originalPhase = function visualPhase(e) {
    let h = 2166136261 >>> 0;
    for (const ch of String(e.id || e.name || e.species || e.family || e.type || 'azeroth')) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return (h % 628) / 100;
  };
  source = source.slice(0, phaseStart) + originalPhase.toString() + '\n' + source.slice(phaseEnd);
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

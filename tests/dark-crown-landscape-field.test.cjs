'use strict';
// Focused pure-math contract; runtime/painter/collision acceptance belongs to later phases.
const assert = require('node:assert/strict');
const L = require('../src/prototype/dark-crown-landscape.js');

assert.equal(L.VERSION, 2);
assert.equal(L.WORLD_SIZE, 3800);
assert.equal(L.sample(NaN, 100), null);
assert.equal(L.sample(100, Infinity), null);

const geology = {
  flows: [{ x: 900, y: 2800, rx: 460, ry: 640, angle: 0.3, age: 0.11 }],
  islands: [{ x: 700, y: 2550, rx: 220, ry: 270, seed: 11 }],
};
const originalInput = JSON.stringify(geology);
const center = L.sample(700, 2550, geology);
const outer = L.sample(1100, 2550, geology);
assert(center.island > 0.95, 'older-ground island has a coherent central habitat');
assert(outer.island < 0.01, 'island vegetation does not become universal scatter');
assert(center.shrubs > outer.shrubs, 'older sheltered core grows more shrubs');
assert(center.trees > outer.trees, 'rare island tree potential is confined to the older core');

const young = L.sample(900, 2800, geology);
assert(young.flow > 0.95 && young.age < 0.2, 'authored young lava flow controls its own substrate age');
assert(young.trees < 0.01, 'fresh basalt does not acquire natural woodland');

const hot = L.sample(700, 2550, { ...geology, hazardAt: () => 1 });
for (const key of ['soil', 'pioneer', 'shrubs', 'trees'])
  assert.equal(hot[key], 0, 'heat excludes ' + key);
const built = L.sample(700, 2550, { ...geology, exclusionAt: () => 1 });
assert.equal(built.shrubs, 0, 'built streets and industrial pads can exclude vegetation');

for (const [x, y] of [[0, 0], [80, 160], [1380, 1000], [2110, 2390], [3799, 3799]]) {
  const a = L.sample(x, y, geology);
  const b = L.sample(x, y, geology);
  assert.deepEqual(a, b, 'repeat world coordinate is deterministic');
  assert(Object.values(a).every((v) => typeof v === 'string' || (Number.isFinite(v) && v >= 0 && v <= 1)));
  const near = L.sample(x + 0.001, y, geology);
  assert(Math.abs(a.age - near.age) < 0.002, 'no floor/atlas seam in continuous geological field');
  assert(Math.abs(a.island - near.island) < 0.002, 'no tile boundary seam in habitat field');
}
assert.notDeepEqual(L.sample(250, 900, geology), L.sample(2750, 3200, geology),
  'geological fields differ across the full region');
assert.equal(JSON.stringify(geology), originalInput, 'render model does not mutate author data');

const start = process.hrtime.bigint();
for (let y = 0; y < 3800; y += 80)
  for (let x = 0; x < 3800; x += 80)
    assert(L.sample(x, y, geology), 'world tile sample exists');
const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
console.log('PASS Dark Crown volcanic fields, coherent island habitats, heat exclusions, deterministic world anchoring, ' +
  'and ' + Math.ceil(3800 / 80) ** 2 + ' tile samples (' + elapsedMs.toFixed(2) + ' ms; local timing only)');

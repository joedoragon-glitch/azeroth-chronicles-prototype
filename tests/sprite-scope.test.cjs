'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { audit } = require('../scripts/sprite-scope-audit.cjs');
const pipeline = require('../scripts/sprite-pipeline.cjs');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const source = read('src/prototype/visuals.js');
const coverage = read('docs/GRAPHICS_CANON_SPRITE_COVERAGE.md');
const current = audit();
const terrain = require('../tools/sprites/terrain-specifications.json');
const march = terrain.candidates.find((entry) => entry.resourceKey === 'terrain:ground:march');
const floorSection = source.match(/const floorPalettes = \[([\s\S]*?)\n  \];/);
assert(floorSection, 'the source must still declare outdoor floor palettes');
assert(
  floorSection[1].includes("['#3e5544', '#4b614b', '#30483c', '#a2b48e']"),
  'Flooded Marches current palette must be sourced from the outdoor floor owner',
);
assert.deepEqual(march.palette, ['#3e5544', '#4b614b', '#30483c', '#a2b48e']);
const oldOre = require('../tools/sprites/approved.json');
const oreKey = 'prop:ore-sorting-bay:highlands';
assert(!oldOre.assets[oreKey], 'owner-selected procedural ore bay cannot carry stale active raster approval');
assert(
  Object.values(oldOre.history[oreKey]).some((record) => record.review?.status === 'approved'),
  'ore-bay original and prior creative approval must remain available for re-review',
);
assert.deepEqual(
  current,
  JSON.parse(read('docs/evidence/SPRITE_SCOPE_RECONCILIATION.json')),
  'checked-in scope evidence must match the current source; reconcile new map states deliberately',
);
assert.throws(
  () =>
    audit({
      source: source.replace(
        'function decoration(kind) {',
        "function decoration(kind) { switch (kind) { case 'new-authored-prop': break; }",
      ),
    }),
  /Unclassified renderer family: new-authored-prop/,
);
assert.throws(
  () => audit({ coverage: coverage.replaceAll('`sceneRole:fish-study`', '`removed-role`') }),
  /Unclassified contextual state: fish-study/,
);
assert.throws(
  () =>
    audit({
      catalog: pipeline.catalog().filter((c) => c.declaredKey !== 'enemy:ashbeast:ranged-guard'),
    }),
  /Current guard lacks an exact generation decision/,
);
assert.throws(
  () => audit({ catalog: pipeline.catalog().filter((c) => c.id !== '046') }),
  /Current captain lacks an exact generation decision/,
);
assert.throws(
  () => audit({ catalog: pipeline.catalog().filter((c) => c.id !== '275') }),
  /Environment candidate lacks its reviewed exact decision/,
);
assert.throws(
  () => audit({ source: source.replaceAll('#294b36', '#102030') }),
  /Terrain palette lacks current source evidence/,
);
const Sprites = require('../src/prototype/sprites.js');
const pureRangedMirelingGuard = {
  renderKind: 'enemy',
  type: 'mob',
  species: 'mireling',
  guard: true,
  ranged: true,
  hybrid: false,
};
assert.deepEqual(
  Sprites.candidateKeys(pureRangedMirelingGuard),
  ['enemy:mireling:hybrid-ranged-guard'],
  'the canonical ranged Mireling guard body covers both ranged AI variants',
);
assert.equal(
  pureRangedMirelingGuard.hybrid,
  false,
  'sprite selection must never change combat roles',
);
assert.deepEqual(
  Sprites.candidateKeys({ ...pureRangedMirelingGuard, guard: false }),
  ['enemy:mireling:ranged'],
  'ordinary ranged Mirelings retain their own artwork identity',
);
assert.deepEqual(Sprites.candidateKeys({ ...pureRangedMirelingGuard, hybrid: true }), [
  'enemy:mireling:hybrid-ranged-guard',
]);
console.log(
  'PASS current renderer/map coverage, exact guard/captain loadouts and future scope drift rejection',
);

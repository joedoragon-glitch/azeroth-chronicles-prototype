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
// Keep strict source fingerprint protection, but distinguish a reviewed-canon
// delta from a source-only SHA change that needs a targeted code/art review.
function assertReviewedSpriteEvidence(actual, reviewed) {
  const { sources: actualSources, ...actualScope } = actual;
  const { sources: reviewedSources, ...reviewedScope } = reviewed;
  assert.deepEqual(
    actualScope,
    reviewedScope,
    'Sprite-canon evidence differs: review families, palettes, loadouts and decisions before updating current evidence',
  );
  const changedSources = [
    ...new Set([...Object.keys(actualSources), ...Object.keys(reviewedSources)]),
  ].filter((file) => actualSources[file] !== reviewedSources[file]);
  assert.equal(
    changedSources.length,
    0,
    'Source-only sprite evidence fingerprint drift: ' +
      changedSources.join(', ') +
      '. Enumerated scope still matches. Review the exact code/art diff before refreshing ' +
      'only the current scope evidence; preserve approved sprite canon and historical receipts.',
  );
}
const terrain = require('../tools/sprites/terrain-specifications.json');
const march = terrain.candidates.find((entry) => entry.resourceKey === 'terrain:ground:march');
const floorSection = source.match(/const floorPalettes = \[([\s\S]*?)\n  \];/);
assert(floorSection, 'the source must still declare outdoor floor palettes');
assert(
  floorSection[1].includes("['#3e5544', '#4b614b', '#30483c', '#a2b48e']"),
  'Flooded Marches current palette must be sourced from the outdoor floor owner',
);
assert.deepEqual(march.palette, ['#3e5544', '#4b614b', '#30483c', '#a2b48e']);
const highlands = terrain.candidates.find(
  (entry) => entry.resourceKey === 'terrain:ground:highlands',
);
assert.deepEqual(highlands.palette, ['#4a593b', '#74734b', '#3b4d36', '#c6b079']);
assert(
  floorSection[1].includes("['#4a593b', '#74734b', '#3b4d36', '#c6b079']"),
  'Highlands palette must stay grounded in the current renderer',
);
const oldOre = require('../tools/sprites/approved.json');
const oreKey = 'prop:ore-sorting-bay:highlands';
assert(!oldOre.assets[oreKey], 'owner-selected procedural ore bay cannot carry stale active raster approval');
assert(
  Object.values(oldOre.history[oreKey]).some((record) => record.review?.status === 'approved'),
  'ore-bay original and prior creative approval must remain available for re-review',
);
assertReviewedSpriteEvidence(
  current,
  JSON.parse(read('docs/evidence/SPRITE_SCOPE_RECONCILIATION.json')),
);
// Source-only changes, including incidental renderer/rules edits, still
// require provenance review; a new sprite family cannot escape canon review.
for (const file of ['src/prototype/renderer.js', 'src/prototype/rules.js']) {
  const sourceOnly = {
    ...current,
    sources: { ...current.sources, [file]: 'deliberately-invalid-source-hash' },
  };
  assert.throws(
    () => assertReviewedSpriteEvidence(sourceOnly, current),
    /Source-only sprite evidence fingerprint drift/,
    file + ' source-only changes need an actionable review disposition',
  );
}
assert.throws(
  () =>
    assertReviewedSpriteEvidence(
      {
        ...current,
        families: {
          ...current.families,
          decoration: [...current.families.decoration, 'unreviewed-family'],
        },
      },
      current,
    ),
  /Sprite-canon evidence differs/,
  'unreviewed sprite-canon changes must remain failures',
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

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { build } = require('../scripts/sprite-showroom-index.cjs');
const index = build();
assert.equal(index.schemaVersion, 1);
assert(index.entries.length >= index.counts.datedReviewCases);
assert.equal(new Set(index.entries.map((x) => x.id)).size, index.entries.length,
  'a single showroom card per identity');
const active = require('../assets/sprites/manifest.json').sprites;
for (const [key, record] of Object.entries(active)) {
  const x = index.entries.find((entry) => entry.id === key);
  assert(x && x.registeredRaster === record.src, 'source-driven registered sprite drift');
}
for (const src of index.packagedResources) {
  assert(/^\.\/assets\/(?:sprites|materials)\/[a-zA-Z0-9_/-]+\.(png|webp)$/.test(src) &&
    !src.includes('..'), 'archive must be within published local sprite media');
  assert(fs.existsSync(path.join(root, src.slice(2))), 'broken optional showroom archive');
}
assert(Object.keys(index.sourceFingerprints || {}).length >= 8,
  'showroom must fingerprint current source modules and image registries');
for (const [file, hash] of Object.entries(index.sourceFingerprints)) {
  assert(/^[a-f0-9]{16}$/.test(hash), 'invalid source fingerprint: ' + file);
  assert(fs.existsSync(path.join(root, file)), 'fingerprinted source file missing: ' + file);
}
for (const entry of index.entries) {
  assert(entry.subcategory && typeof entry.subcategory === 'string',
    'source-driven subsection missing for ' + entry.id);
  assert(Array.isArray(entry.tags) && entry.tags.length > 0,
    'searchable tags missing for ' + entry.id);
  assert(Array.isArray(entry.regions) && entry.regions.includes(entry.region),
    'region facets missing for ' + entry.id);
  assert(Array.isArray(entry.sourceFiles) && entry.sourceFiles.length > 0,
    'live renderer source provenance missing for ' + entry.id);
  for (const file of entry.sourceFiles)
    assert(fs.existsSync(path.join(root, file)), 'source module unavailable: ' + file);
  if (entry.sourceKind === 'current-world-fixture')
    assert(entry.areas?.length, 'world asset should expose exact authored areas: ' + entry.id);
  if (entry.displayStatus === 'procedural-with-sprite')
    assert(entry.registeredRaster || entry.archive?.length,
      'retained sprite label without a retained image: ' + entry.id);
}
const paladin = index.entries.find((e) => e.id === 'hero:paladin');
assert.equal(paladin.displayStatus, 'procedural-with-sprite');
assert(paladin.currentDesign?.summary.includes('Paladin'),
  'recorded owner design choices should be visible in the showroom');
const skeleton = index.entries.find((e) => e.id === 'enemy:skeleton');
assert(skeleton?.historicalDesign?.summary?.length,
  'dated art instructions should remain available and clearly dated');
assert(index.entries.some((x) => x.sourceKind === 'dated-reference' &&
  x.referenceDate === '2026-10-19' && x.states.length),
  'dated procedural reference fixtures must be discoverable');
assert(!JSON.stringify(index).includes('data:image/'),
  'the gallery is indexed metadata, not regenerated base64 image payload');
console.log('PASS sprite showroom index: fresh resolver links, unique identities, ' +
  index.packagedResources.length + ' verified lazy media paths, no embedded images');

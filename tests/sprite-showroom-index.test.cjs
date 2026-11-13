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
  assert(/^\.\/assets\/sprites\/[a-zA-Z0-9_/-]+\.(png|webp)$/.test(src) &&
    !src.includes('..'), 'archive must be within published local sprite media');
  assert(fs.existsSync(path.join(root, src.slice(2))), 'broken optional showroom archive');
}
assert(index.entries.some((x) => x.sourceKind === 'dated-reference' &&
  x.referenceDate === '2026-10-19' && x.states.length),
  'dated procedural reference fixtures must be discoverable');
assert(!JSON.stringify(index).includes('data:image/'),
  'the gallery is indexed metadata, not regenerated base64 image payload');
console.log('PASS sprite showroom index: fresh resolver links, unique identities, ' +
  index.packagedResources.length + ' verified lazy media paths, no embedded images');

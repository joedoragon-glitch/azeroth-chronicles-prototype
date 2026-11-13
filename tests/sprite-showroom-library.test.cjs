'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { build } = require('../scripts/sprite-showroom-index.cjs');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const index = build();
assert.equal(index.schemaVersion, 1);
assert.equal(index.counts.exactContracts, 75);
assert.equal(index.counts.liveRegistrations, 32);
assert.equal(index.counts.datedReviewCases, 513);
assert.equal(index.counts.currentMaterials, 2);
assert.equal(index.entries.length, new Set(index.entries.map((e) => e.id)).size,
  'one stable card per exact identity, no duplicate gallery');
const byId = new Map(index.entries.map((e) => [e.id, e]));
const specs = require('../tools/sprites/specifications.json');
const manifest = require('../assets/sprites/manifest.json');
for (const spec of specs.assets) {
  const entry = byId.get(spec.key);
  assert(entry, 'missing exact showroom identity: ' + spec.key);
  assert.equal(entry.sourceKind, 'current-contract', 'current fixture must outrank dated handoff');
  assert.equal(entry.states[0].region, spec.region);
  assert.deepEqual(entry.states[0].entity, spec.entity);
  assert.equal(!!entry.registeredRaster, !!manifest.sprites[spec.key]);
  assert(['raster', 'procedural'].includes(entry.representation));
  if (entry.representation === 'raster') assert(entry.activeSpriteKey);
}
for (const key of Object.keys(manifest.sprites))
  assert(byId.has(key), 'registered artwork omitted: ' + key);
assert(byId.has('hero:rogue'), 'fourth playable hero must not be absent from showroom');
assert.equal(byId.get('hero:rogue').representation, 'procedural');
assert(index.counts.currentWorldIdentities >= 4, 'current world census not attached');
assert(index.counts.currentSourceAreas >= 19, 'authored areas not enumerated');
const sharedBarrel = byId.get('shared:prop:barrel');
assert(sharedBarrel, 'common barrel should have one semantic artwork identity');
assert(sharedBarrel.regions.length >= 5,
  'shared props must retain all five region appearances');
assert(sharedBarrel.states.length >= 5,
  'shared props must expose actual regional states rather than five cards');
assert.equal(index.entries.filter((e) => e.id === 'shared:prop:barrel').length, 1);
assert.equal(index.entries.filter((e) => e.name === 'Barrel' &&
  e.sourceKind === 'current-world-fixture').length, 1,
  'a source-shared barrel should not flood the gallery with duplicates');
assert.equal(byId.get('hero:paladin').representation, 'procedural');
assert.equal(byId.get('hero:ranger').representation, 'raster');
assert(byId.get('hero:paladin').registeredRaster,
  'retained Paladin source must be visible without becoming selected');
assert(byId.get('prop:ore-sorting-bay:highlands').archive.length,
  'historical procedural-selected Ore Bay remains inspectable');
assert.equal(byId.get('registered-terrain:road:vale').representation, 'material');
assert.equal(byId.get('archived-terrain:ground:crown').representation, 'historical');
const cases = require('../tools/visual-review/approved-art-pass/handoff-index.json');
for (const row of cases.entries)
  assert(byId.has(row.id), 'dated art-review case lost: ' + row.id);
for (const entry of index.entries) {
  assert(!entry.registeredRaster || /^\.\/assets\/(sprites|materials)\//.test(entry.registeredRaster));
  for (const item of entry.archive)
    assert(fs.existsSync(path.join(root, item.src.slice(2))), 'missing preserved art');
  assert(entry.states.length <= 12);
}
const payload = JSON.stringify(index);
assert(payload.length < 2_000_000, 'gallery must not embed a giant historical capture archive');
const html = read('tools/sprites/showroom.html');
const script = read('tools/sprites/showroom.js');
const css = read('tools/sprites/showroom.css');
new vm.Script(script, { filename: 'showroom.js' });
assert(html.includes('id="single-review"') && html.includes('id="library-root"'),
  'one showroom page hosts both focused comparison and browse modes');
for (const id of ['asset-query', 'asset-grid', 'asset-inspector', 'asset-preview',
  'asset-revision', 'asset-more', 'asset-copy', 'asset-note', 'canonical', 'viewport']) {
  assert(html.includes('id="' + id + '"'), 'missing display/control: ' + id);
}
assert(script.includes("comparison.json") && script.includes("startFocusedComparison"),
  'legacy exact candidate preview must remain accessible');
assert(script.includes('PrototypeVisuals.draw') && script.includes('PrototypeSprites.draw'),
  'the actual installed artists paint studio previews');
assert(css.includes('library-preview-grid') && css.includes('max-width: 780px'),
  'responsive comparison/browsing layout required');
assert(!html.includes('src="http'), 'standalone showroom cannot require a third-party CDN');
console.log('PASS unified Sprite Showroom: ' + index.entries.length +
  ' distinct visual entries, 75 current fixtures, 513 dated review cases, ' +
  index.packagedResources.length + ' on-demand sprite resources, ' +
  Math.ceil(payload.length / 1024) + ' KiB metadata, one original showroom page');

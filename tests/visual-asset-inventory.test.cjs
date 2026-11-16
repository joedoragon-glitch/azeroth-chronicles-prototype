'use strict';
// Focused, read-only inventory regression. Never opens or mutates game saves.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const files = (dir, pattern) =>
  fs.readdirSync(path.join(root, dir)).filter((name) => pattern.test(name));
const base = (name) => path.posix.basename(String(name || ''));
const manifest = read('assets/sprites/manifest.json');
const specifications = read('tools/sprites/specifications.json');
const approved = read('tools/sprites/approved.json');
const decisions = read('tools/sprites/current-design-decisions.json');
const materials = read('assets/materials/manifest.json');
const materialHistory = read('tools/sprites/materials/approved.json');
const oldReview = read('tools/visual-review/approved-art-pass/handoff-index.json');
const Sprites = require('../src/prototype/sprites.js');

assert(Sprites.installManifest(manifest), 'production sprite manifest must load');
const contracts = new Map(specifications.assets.map((s) => [s.key, s]));
assert.equal(contracts.size, specifications.assets.length, 'duplicate exact processing key');
const registered = Object.entries(manifest.sprites);
assert.equal(registered.length, Object.keys(approved.assets).length);
let rasterSelected = 0;
let registeredProcedural = 0;
for (const spec of specifications.assets) {
  const candidate = Sprites.candidateKeys(spec.entity, spec.region)[0];
  assert.equal(candidate, spec.key, 'contract resolves a different visual identity');
  const definition = Sprites.definitionFor(spec.entity, spec.region);
  const representation = definition?.key === spec.key ? 'raster' : 'procedural';
  const selected = decisions.assets[spec.key]?.selectedRepresentation;
  if (selected) assert.equal(representation, selected, 'owner representation changed');
  if (manifest.sprites[spec.key]) {
    if (representation === 'raster') rasterSelected++;
    else registeredProcedural++;
  } else {
    assert.equal(representation, 'procedural', 'unregistered key unexpectedly selected');
  }
}
for (const [key, entry] of registered) {
  const record = approved.assets[key];
  assert(record && contracts.has(key), 'unknown active raster identity: ' + key);
  assert.equal(base(entry.src), record.output.file, 'approved/manifest output mismatch: ' + key);
}
const activeResources = new Set();
const resource = (value) => {
  if (!value) return;
  assert(value.startsWith('./assets/sprites/'), 'unsafe sprite resource root');
  activeResources.add(base(value));
  assert(fs.existsSync(path.join(root, value.slice(2))), 'missing active sprite: ' + value);
};
for (const [, entry] of registered) {
  resource(entry.src);
  for (const clip of Object.values(entry.clips || {}))
    for (const frame of clip.frames || []) resource(frame.src);
  for (const variant of Object.values(entry.variants || {})) resource(variant.src);
}
const historicalResources = new Set();
const sources = new Set();
function includeRecord(record, historical = false) {
  if (!record) return;
  if (record.source?.file) sources.add(record.source.file);
  for (const extra of record.extras || []) {
    if (extra.output?.file && historical) historicalResources.add(extra.output.file);
    for (const source of extra.sources || []) if (source.file) sources.add(source.file);
  }
  if (record.output?.file && historical) historicalResources.add(record.output.file);
}
for (const record of Object.values(approved.assets)) includeRecord(record);
for (const entries of Object.values(approved.history || {}))
  for (const record of Object.values(entries)) includeRecord(record, true);
const spriteFiles = files('assets/sprites', /\.(png|webp)$/i);
const unexplained = spriteFiles.filter(
  (name) => !activeResources.has(name) && !historicalResources.has(name),
);
assert.deepEqual(unexplained, [], 'unowned sprite outputs in assets/sprites');
assert(spriteFiles.every((name) => activeResources.has(name) || historicalResources.has(name)));
const originals = files('tools/sprites/sources', /\.(png|webp)$/i);
assert.deepEqual(
  originals.filter((name) => !sources.has(name)),
  [],
  'original master without provenance',
);
for (const source of sources)
  assert(fs.existsSync(path.join(root, 'tools/sprites/sources', source)),
    'missing preserved original: ' + source);
const registeredMaterials = Object.values(materials.materials).map((r) => base(r.src));
const historicalMaterials = new Set();
for (const group of Object.values(materialHistory.history || {}))
  for (const record of Object.values(group))
    if (record.output?.hash) historicalMaterials.add(record.output.hash + '.png');
const materialFiles = files('assets/materials', /\.(png|webp)$/i);
const unknownMaterials = materialFiles.filter(
  (name) => !registeredMaterials.includes(name) && !historicalMaterials.has(name),
);
assert.deepEqual(unknownMaterials, [], 'orphan material raster');
for (const name of registeredMaterials)
  assert(materialFiles.includes(name), 'missing live material: ' + name);
for (const name of historicalMaterials)
  assert(materialFiles.includes(name), 'missing archived material: ' + name);
const oldIds = new Set();
for (const item of oldReview.entries) {
  assert(!oldIds.has(item.id), 'duplicated historical art-review identity');
  oldIds.add(item.id);
  assert(
    item.handoff.startsWith('tools/sprites/design-handoffs/') &&
      fs.existsSync(path.join(root, item.handoff)),
    'missing historical art handoff: ' + item.id,
  );
}
console.log(
  'PASS visual asset inventory: ' +
    contracts.size + ' exact contracts, ' +
    registered.length + ' registered identities (' +
    rasterSelected + ' fixture-selected raster / ' +
    registeredProcedural + ' procedural), ' +
    activeResources.size + ' active image resources, ' +
    (spriteFiles.length - activeResources.size) + ' archived image resources, ' +
    originals.length + ' preserved source masters, ' +
    materialFiles.length + ' material rasters, ' +
    oldIds.size + ' historical art handoffs',
);

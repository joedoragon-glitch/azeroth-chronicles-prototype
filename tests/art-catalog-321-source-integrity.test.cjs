'use strict';
// Read-only catalog / live sprite-selector audit, deliberately no browser, no game mutation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const json = (relative) => JSON.parse(read(relative));

// Parse the actual quoted RFC-4180 CSV (including quoted line breaks, BOM and CRLF).
function parseCsv(value) {
  const rows = [];
  let row = [], field = '', quoted = false;
  const source = value.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (c === ',' || c === '\r' || c === '\n')) {
      row.push(field);
      field = '';
      if (c !== ',') {
        if (c === '\r' && source[i + 1] === '\n') i++;
        if (row.some(Boolean)) rows.push(row);
        row = [];
      }
    } else field += c;
  }
  assert.equal(quoted, false, 'Unterminated quoted CSV cell');
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  assert(header?.includes('catalogNumber') && header?.includes('id'), 'Missing CSV identity headings');
  return rows.map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ''])));
}

const legacy = parseCsv(read('tools/visual-review/approved-art-pass/Asset_Assessment.csv'));
const approved = json('tools/visual-review/approved-art-pass/Approved_All_Plans.json');
const scope = json('docs/evidence/SPRITE_SCOPE_RECONCILIATION.json');
const sprites = json('assets/sprites/manifest.json');
const materials = json('assets/materials/manifest.json');
const crosswalk = json('docs/evidence/ART_CATALOG_321_SOURCE_CROSSWALK_20261025.json');
const triage = json('docs/evidence/ART_CATALOG_321_DEEP_SOURCE_TRIAGE_20261025.json');

assert.equal(legacy.length, 513);
assert.equal(new Set(legacy.map((r) => r.id)).size, 513, 'Duplicate original art IDs');
assert.deepEqual(legacy.map((r) => Number(r.catalogNumber)), Array.from({ length: 513 }, (_, i) => i + 1));
assert.equal(approved.entries.length, 513);
assert.equal(legacy.filter((r) => r.implementationStatus === 'Implemented').length, 465);
assert.equal(legacy.filter((r) => r.implementationStatus === 'Protected').length, 47);
assert.equal(legacy.filter((r) => r.implementationStatus === 'Context retained').length, 1);
assert(legacy.every((r) => r.planApproval.startsWith('Approved by Joel')));
assert.deepEqual(legacy.map((r) => r.id), crosswalk.originalRows.map((r) => r.id));
assert.deepEqual(legacy.map((r) => r.id), triage.cases.map((r) => r.legacyId));
assert.equal(triage.cases.length, 513);
assert(crosswalk.originalRows.every((r) => r.historicalApprovalRecorded));
assert(triage.cases.every((r) => !r.canvasVisualVerified && !r.pixiVisualVerified),
  'This historical source-only ledger cannot silently claim new paired visual proof');
const previousDecoration = new Set(legacy.filter((r) => r.category === 'decoration')
  .map((r) => r.id.slice('decoration:'.length)));
assert.equal(previousDecoration.size, 188);
const liveDecoration = new Set(scope.families.decoration);
for (const id of previousDecoration)
  assert(liveDecoration.has(id), 'Lost previously assessed decoration family: ' + id);
const extraDecoration = [...liveDecoration].filter((id) => !previousDecoration.has(id)).sort();
const registeredExtra = crosswalk.postCatalogSourceAdditions
  .map((r) => r.id.slice('decoration:'.length)).sort();
assert.deepEqual(extraDecoration, registeredExtra, 'Source additions must have explicit crosswalk entries');
assert.deepEqual(extraDecoration,
  triage.newSourceCases.map((r) => r.sourceCaseId.slice('decoration:'.length)).sort(),
  'Source additions must have explicit triage entries');
for (const group of ['structure', 'landmark']) {
  const prefix = group + ':';
  const previous = legacy.filter((r) => r.category === group).map((r) => r.id.slice(prefix.length));
  const present = new Set(scope.families[group === 'structure' ? 'settlement' : group]);
  for (const id of previous) assert(present.has(id), 'Missing ' + group + ': ' + id);
}
assert.equal(Object.keys(sprites.sprites).length, 33);
assert.equal(Object.keys(materials.materials).length, 5);
assert(sprites.sprites['transport:ferry'], 'Ferry resource should be registered');
assert(!sprites.sprites['prop:ore-sorting-bay:highlands'], 'Retired ore raster reintroduced without review');

// Execute the same Sprite.definitionFor selector used by the Canvas and Pixi GPU adapter.
// These are *synthetic routing fixtures*, not proof that the authored scene spawns them.
const selector = require('../src/prototype/sprites.js');
assert.equal(selector.installManifest(sprites), true, 'Failed to load current game sprite registry');
const fixture = (attributes) => ({ id: 'audit-fixture', x: 100, y: 100, hp: 10, ...attributes });
const check = (name, attributes, region, expected) => {
  const actual = selector.definitionFor(fixture(attributes), region, false)?.key || null;
  assert.equal(actual, expected, 'Current art dispatch changed: ' + name);
  return { name, expected };
};
const cases = [
  check('normal Ranger raster', { renderKind: 'hero', class: 'ranger' }, 0, 'hero:ranger'),
  check('Paladin procedural despite retained registered master', { renderKind: 'hero', class: 'paladin' }, 0, null),
  check('Mage procedural despite retained registered master', { renderKind: 'hero', class: 'mage' }, 0, null),
  check('crowned Ranger procedural', { renderKind: 'hero', class: 'ranger', crowned: true }, 0, null),
  check('crowned Mage procedural', { renderKind: 'hero', class: 'mage', crowned: true }, 0, null),
  check('Soldier procedural despite retained registered master', { renderKind: 'ally', type: 'soldier' }, 0, null),
  check('allied Archer raster', { renderKind: 'ally', class: 'archer' }, 0, 'ally:archer'),
  check('ordinary Goblin raster', { renderKind: 'enemy', species: 'goblin', type: 'normal' }, 0, 'enemy:goblin'),
  check('mounted Crown rider procedural', { renderKind: 'enemy', species: 'wolf', mountedCrownRider: true }, 4, null),
  check('pet family procedural', { renderKind: 'ally', type: 'pet', petFamily: 'thorn' }, 0, null),
  check('Vale cottage owner-selected procedural', { renderKind: 'prop', structure: 'vale-cottage' }, 0, null),
  check('Frontier dead tree raster', { renderKind: 'prop', structure: 'dead-tree' }, 3, 'prop:dead-tree:frontier'),
  check('newly registered ferry', { renderKind: 'npc', kind: 'transport', icon: '⛵', name: 'March ferry' }, 1, 'transport:ferry'),
];
for (const [structure, region] of [
  ['wildflowers', 0], ['cattails', 1], ['alpine-scrub', 2], ['heather', 2],
  ['mint-workbench', 2], ['ore-sorting-bay', 2], ['caravan-loading-bay', 2],
]) cases.push(check('owner-selected procedural ' + structure,
  { renderKind: 'prop', structure }, region, null));

console.log('PASS Art Catalog #321 source integrity · 513 unique historic IDs · ' +
  extraDecoration.length + ' post-catalog decorations · ' + cases.length +
  ' native selector fixtures · NO visual parity certification');

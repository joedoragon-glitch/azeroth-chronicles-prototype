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
console.log(
  'PASS current renderer/map coverage, exact guard/captain loadouts and future scope drift rejection',
);

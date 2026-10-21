'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const C = require('../../../src/prototype/engine'),
  R = C.rules,
  table = R.sceneryTraversal.radii;
const make = () => {
  const c = new C('developer', 'paladin', () => 0.73);
  for (const reg of C.data.regions) c.enter(reg.id);
  return c;
};
R.sceneryTraversal.radii = {};
const baseline = make();
R.sceneryTraversal.radii = table;
const candidate = make();
const placements = [];
for (const [id, zone] of Object.entries(baseline.s.zones))
  for (const kind of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) {
    const current = candidate.s.zones[id][kind];
    assert.equal(current.length, zone[kind].length);
    for (const p of current) {
      const old = zone[kind].find((e) => e.id === p.id);
      assert(old, 'identity preserved');
      if (old.x !== p.x || old.y !== p.y || JSON.stringify(old.home) !== JSON.stringify(p.home))
        placements.push({ zone: id, kind, id: p.id });
    }
  }
assert.deepEqual(placements, [], 'traversal does not change authored generation');
const entries = [];
for (const region of C.data.regions) {
  candidate.enter(region.id);
  const z = candidate.zone();
  for (const p of z.props) {
    if (!Object.hasOwn(table, p.structure)) continue;
    const current = candidate.sceneryMovementRadius(p, z),
      old = p.decorative ? null : p.r;
    entries.push({
      region: region.id,
      id: p.id,
      type: p.structure,
      x: p.x,
      y: p.y,
      old,
      current,
      decision:
        old === current
          ? 'deferred access conflict'
          : table[p.structure] === 0
            ? 'walkable boardwalk'
            : 'solid trunk',
    });
  }
}
const summary = {};
for (const row of entries) summary[row.decision] = (summary[row.decision] || 0) + 1;
const report = {
  source: '9a44fd5',
  fixture: 'fresh developer campaign, deterministic .73',
  scope: 'first-pass selected outdoor types; not a whole-game collision certificate',
  placementDifferences: placements.length,
  summary,
  entries,
};
fs.writeFileSync(
  path.resolve(__dirname, '../../../docs/evidence/SCENERY_TRAVERSAL_354.json'),
  JSON.stringify(report, null, 2) + '\n',
);
console.log('PASS unchanged fresh-map placement/identity and explicit first-pass census', summary);

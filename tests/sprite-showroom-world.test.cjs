'use strict';
const assert = require('node:assert/strict');
const { census } = require('../scripts/sprite-showroom-world.cjs');
const result = census();
assert(result.areas.length >= 19, 'source world census must traverse authored regions and interiors');
assert(result.observedInstances > 100, 'world must yield actual visual entities');
const ids = new Set();
for (const entry of result.rows) {
  assert(!ids.has(entry.id), 'a world semantic identity must be unique: ' + entry.id);
  ids.add(entry.id);
  assert(entry.states.length && entry.states[0].entity,
    'live entry must have current-source renderer fixture');
  assert(['raster','procedural'].includes(entry.representation));
  assert(!entry.states[0].entity.id.includes('../'), 'no generated filename identity escape');
}
for (const hero of ['paladin','mage','ranger','rogue'])
  assert(ids.has('hero:' + hero), 'missing playable hero from showroom world scan: ' + hero);
assert(result.rows.some((e) => e.sourceKind === 'current-world-fixture'),
  'new authored map visuals must be available without October handoffs');
console.log('PASS showroom current-world census: ' + result.areas.length + ' areas, ' +
  result.observedInstances + ' source entities, ' + result.rows.length +
  ' semantic visual identities, all four heroes including Rogue');

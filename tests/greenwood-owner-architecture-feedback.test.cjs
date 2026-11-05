'use strict';
// Owner playtest corrections for the three Greenwood roofs and open homestead.
// Native scene/save/notification checks; no comprehensive test suite.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const { rng } = require('../tools/greenwood-layout/fixtures.cjs');

const rails = [
  ['rear-rail', 'thorn-homestead-rear-rail', 'thorn-rear-rail'],
  ['east-rail', 'thorn-homestead-east-rail', 'thorn-east-rail'],
];
const footprint = (z) => ({
  enemies: z.enemies.map((e) => [e.id, e.x, e.y, e.home?.x, e.home?.y]),
  tribute: z.nodes.map((n) => [n.id, n.amount, n.x, n.y]),
  buildings: z.buildings.map((b) => [b.id, b.x, b.y, b.progress]),
  routes: JSON.stringify(z.greenwoodRoutes),
  estate: z.npcs.filter((n) => n.kind === 'dungeon' && n.family === 'crypt')
    .map((n) => [n.id, n.x, n.y]),
});
for (const seed of [0x47564101, 0x47564103]) {
  const g = new C('normal', 'paladin', rng(seed));
  const z = g.zone();
  const lodge = z.props.find((p) => p.id === 'greenwood-thorn-homestead-lodge');
  assert(lodge, 'Thornfang retains the actual existing home');
  assert.equal(z.greenwoodThornOpenYardVersion, 1);
  for (const [id] of rails)
    assert(!z.props.some((p) => p.id === 'greenwood-thorn-homestead-' + id),
      'unfinished decorative fence removed: ' + id);
  assert(z.props.some((p) => p.id === 'greenwood-thorn-homestead-standard'),
    'existing Crown banner retained');
  assert(z.props.some((p) => p.id === 'greenwood-thorn-homestead-rest-bay'),
    'existing wolf shelter retained');
  const original = JSON.parse(JSON.stringify(g.snapshot()));
  const older = JSON.parse(JSON.stringify(original));
  const oldVale = older.zones.vale;
  delete oldVale.greenwoodThornOpenYardVersion;
  for (const [id, structure, facility] of rails)
    oldVale.props.push({
      id: 'greenwood-thorn-homestead-' + id,
      x: lodge.x + (id === 'rear-rail' ? -90 : 130),
      y: lodge.y + 130,
      structure,
      greenwoodFacility: facility,
      greenwoodAuthored: true,
      r: 0, decorative: true,
    });
  const before = footprint(oldVale);
  const input = JSON.stringify(older);
  const restored = C.restore(older, rng(seed));
  assert.equal(JSON.stringify(older), input, 'never mutate the imported save');
  assert.deepEqual(footprint(restored.zone()), before,
    'cosmetic rail removal preserves enemies, resources, buildings and routes');
  assert.equal(restored.zone().greenwoodThornOpenYardVersion, 1);
  for (const [id] of rails)
    assert(!restored.zone().props.some((p) => p.id === 'greenwood-thorn-homestead-' + id));
  assert.deepEqual(C.restore(restored.snapshot(), rng(seed)).zone().props,
    restored.zone().props, 'second restore is idempotent');
  // A player-replaced object must never be silently deleted by the new pass.
  const owned = JSON.parse(JSON.stringify(older));
  const ownedRail = owned.zones.vale.props.find(
    (p) => p.id === 'greenwood-thorn-homestead-rear-rail');
  ownedRail.playerOwned = true;
  const protectedSave = C.restore(owned, rng(seed));
  assert(protectedSave.zone().props.some((p) => p.id === ownedRail.id && p.playerOwned));

  // Only crossing the approach threshold emits the bilingual regional notice.
  const label = "Thornfang's Homestead";
  const count = () => g.notices.filter((n) => n.text === label).length;
  const sc = C.rules.greenwoodLayout.scale;
  g.hero.x = lodge.x + 335 * sc;
  g.hero.y = lodge.y;
  g.tick(0.016);
  assert.equal(count(), 0);
  g.hero.x = lodge.x + 180 * sc;
  g.tick(0.016);
  assert.equal(count(), 1, 'named homestead announces on the first approach');
  const notice = g.notices.find((n) => n.text === label);
  assert.equal(notice.textEs, 'Hogar de Thornfang');
  assert.equal(notice.region, 'vale');
  assert.equal(notice.kind, 'narration');
  g.tick(0.016);
  assert.equal(count(), 1, 'no repeated notices while inside');
  g.hero.x = lodge.x + 335 * sc;
  g.tick(0.016);
  g.hero.x = lodge.x + 180 * sc;
  g.tick(0.016);
  assert.equal(count(), 2, 'leaving and approaching again reannounces');
  assert(!Object.hasOwn(g.snapshot(), 'thornHomesteadNear'),
    'notification proximity is transient, not a new save field');
}
console.log('PASS Greenwood open homestead, named arrival and owner-safe v4 migration');

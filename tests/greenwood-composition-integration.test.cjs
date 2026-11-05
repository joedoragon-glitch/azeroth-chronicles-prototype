'use strict';
// Greenwood landscape v1: one authored physical roadbed and additive rural
// scenery, including save-safe current and prior scene-5 composition.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const { rng } = require('../tools/greenwood-layout/fixtures.cjs');
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const ids = (z) => z.props.map((p) => p.id).sort();
const state = (z) => ({
  monsters: z.enemies.map((e) => [e.id, e.x, e.y, e.home?.x, e.home?.y]),
  payments: z.nodes.map((n) => [n.id, n.amount]),
  buildings: z.buildings.map((b) => [b.id, b.x, b.y, b.progress]),
});
const valley = C.rules.greenwoodLayout;
assert.equal(valley.version, 2);
assert.equal(valley.sceneVersion, 5, 'original scenery source/version is not regenerated');
const barrier = C.rules.barriers[0];
assert.deepEqual(
  barrier.gaps.map(([lo, hi]) => hi - lo),
  [110, 64],
  'actual and visible north/south crossing widths are the same authored gap',
);
const all = [];
for (const seed of [0x47564101, 0x47564102, 0x47564103, 0x47564104]) {
  const g = new C('normal', 'paladin', rng(seed)), z = g.zone();
  assert.equal(z.greenwoodCompositionVersion, 1, 'current scene gets once-only finishing');
  assert.equal(z.greenwoodRedesignScene, 5, 'prior scenery version retained');
  assert.equal(z.greenwoodRoutes.length, 16, 'all historic corridors retained');
  assert.equal(z.roads.length, 4);
  assert.equal(z.footpaths.length, 12);
  assert.equal(z.props.length <= 400, 'native per-region scenery budget');
  assert(z.props.some((p) => p.greenwoodKitchen), 'recognizable kitchen beds exist');
  assert(z.props.some((p) => p.greenwoodField), 'larger working field art exists');
  assert(z.greenwoodCompositionAudit?.length, 'actual placement audit available');
  const junction = { x: 1870, y: 1000 };
  const cart = z.greenwoodRoutes[0].points;
  const treasury = z.greenwoodRoutes[7].points;
  assert(cart.some((p) => dist(p, junction) < 1), 'freight junction is a shared vertex');
  assert(dist(treasury[0], junction) < 1, 'Treasury spur starts at shared junction');
  assert(!treasury.some((p) => dist(p, { x: 2070, y: 1000 }) < 1),
    'Treasury spur no longer reverse-paints main freight corridor');
  assert(cart.length > 9, 'principal corners become continuous eased geometry');
  const orchard = z.npcs.find((n) => n.id === 'orchard');
  assert(orchard, 'original orchard landmark remains');
  if (z.greenwoodCompositionAudit.find((p) => p.id === 'orchard')?.placed)
    assert(g.distanceToRoad(z, orchard) > 88, 'site marker moved off roadbed');
  for (const [key, r] of [
    ['north', 55], ['south', 32],
  ]) {
    const bridge = valley.anchors[key];
    assert(barrier.gaps.some(([lo, hi]) => Math.abs((lo + hi) / 2 - bridge.y) < 1 &&
      Math.abs((hi - lo) / 2 - r) < 1), key + ' legal gap follows deck artwork');
    assert(!g.blocked(bridge.x, bridge.y, 'vale', 0, true),
      key + ' bridge midpoint is legally traversable');
  }
  assert.equal(z.enemies.filter((e) => e.type === 'mob' && !e.summon).length, 32);
  assert.equal(z.nodes.reduce((sum, n) => sum + n.amount, 0), 640);
  assert.equal(new Set(ids(z)).size, z.props.length, 'no duplicate authored prop IDs');
  const snap = g.snapshot();
  const original = JSON.stringify(snap), before = state(z);
  const loaded = C.restore(snap, rng(seed));
  assert.equal(JSON.stringify(snap), original, 'restore does not mutate input');
  assert.deepEqual(ids(loaded.zone()), ids(z), 'reload keeps exact authored scene IDs');
  assert.deepEqual(state(loaded.zone()), before, 'reload leaves monsters/tribute/buildings alone');
  assert.equal(loaded.zone().greenwoodCompositionVersion, 1, 'migration idempotent');
  // Recreate a prior compatible scene-5 snapshot with no composition overlay.
  const previous = JSON.parse(original), old = previous.zones.vale;
  delete old.greenwoodCompositionVersion;
  delete old.greenwoodCompositionAudit;
  delete old.greenwoodCompositionFruitCount;
  old.props = old.props.filter((p) => !p.greenwoodComposition);
  old.props.push({ id: 'player-owned-greenwood-test', x: 3050, y: 3050,
    structure: 'barrel', decorative: true, r: 0, playerOwned: true });
  const oldState = state(old), input = JSON.stringify(previous);
  const migrated = C.restore(previous, rng(seed)), zz = migrated.zone();
  assert.equal(JSON.stringify(previous), input, 'old save untouched');
  assert.equal(zz.greenwoodCompositionVersion, 1, 'old current-layout save gains new scene');
  assert.deepEqual(state(zz), oldState, 'visual migration preserves functional state');
  assert(zz.props.some((p) => p.id === 'player-owned-greenwood-test' && p.playerOwned));
  assert.equal(new Set(ids(zz)).size, zz.props.length, 'old save never receives duplicates');
  assert.deepEqual(ids(C.restore(migrated.snapshot(), rng(seed)).zone()), ids(zz),
    'repeated restore is exactly idempotent');
  all.push({ seed, props: z.props.length, additionalFruit: z.greenwoodCompositionFruitCount,
    placements: z.greenwoodCompositionAudit.filter((p) => p.placed).length,
    notPlaced: z.greenwoodCompositionAudit.filter((p) => !p.placed).map((p) => p.id) });
}
console.log('PASS Greenwood composition road/bridge, field/flower/landmark and v4 migration ' +
  JSON.stringify(all));

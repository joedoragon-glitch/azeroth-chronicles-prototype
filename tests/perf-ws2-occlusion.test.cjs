'use strict';
// Pre-snapshot occlusion coverage contract. The historical WS2 benchmark
// asserted byte-for-byte identity with the *old* limited visibility model.
// That parity is intentionally superseded by expanded visual cover. Retain
// tests/helpers/perf-ws2-baseline.cjs for the historical benchmark only.
const assert = require('node:assert/strict');
const { majorOccluder, occlusionPairs } = require('../src/prototype/renderer.js');
const project = (e) => ({ x: e.sx ?? e.x, y: e.sy ?? e.y });
const height = (e) => e.height ?? 90;
const actor = (renderKind, id, x = 100, y = 100) => ({
  renderKind, id, x, y, sx: x + 50, sy: y + 45, hp: 100,
});
const cover = (id, structure, x = 120, y = 120) => ({
  renderKind: 'prop', id, structure, x, y, sx: x + 50, sy: y + 45, decorative: true,
});
for (const structure of [
  'house', 'dead-tree', 'mangrove', 'rock-cluster', 'tower',
  'fortress', 'stonewall', 'command-tent', 'forge', 'hatchery',
  'weapon-rack', 'supply-stack',
]) assert(majorOccluder(cover(structure, structure)), structure + ' must provide foreground cover');
for (const structure of ['grass', 'pine-sapling', 'flowers', 'stump', 'road']) {
  assert(!majorOccluder(cover(structure, structure)), structure + ' is low ground clutter');
}
const hero = actor('hero', 'hero');
const ally = actor('ally', 'ally', 102, 102);
const enemy = actor('enemy', 'enemy', 104, 104);
const house = cover('house', 'house');
const original = JSON.stringify([hero, ally, enemy, house]);
let result = occlusionPairs([hero, ally, enemy, house], project, height);
assert.deepEqual(result.map((p) => p.actor.id), ['hero', 'ally', 'enemy']);
assert(result.every((p) => p.front.length === 1 && p.front[0].entity.id === 'house'));
assert.equal(JSON.stringify([hero, ally, enemy, house]), original, 'render planning must be pure');
assert.equal(occlusionPairs([house, hero], project, height).length, 0, 'back cover is not a mask');
assert.equal(
  occlusionPairs([{ ...enemy, hp: 0 }, house], project, height).length,
  0,
  'dead enemies never create contours',
);
assert.equal(
  occlusionPairs([{ ...enemy, neutral: true }, house], project, height).length,
  0,
  'neutral wildlife never creates hostile contours',
);
assert.equal(
  occlusionPairs([hero, { ...house, interactionOnly: true }], project, height).length,
  0,
  'interaction-only props do not conceal actors',
);
// Saturated scenes retain bounded allocations without silently dropping every
// actor after the original twelve-mask budget.
const actors = Array.from({ length: 28 }, (_, i) =>
  actor(i === 0 ? 'hero' : i < 6 ? 'ally' : 'enemy', 'actor-' + i, 100 + i / 100, 100 + i / 100),
);
const covers = Array.from({ length: 22 }, (_, i) =>
  cover('cover-' + i, 'house', 120 + i / 100, 120 + i / 100),
);
result = occlusionPairs([...actors, ...covers], project, height);
assert.equal(result.length, 24, 'expanded mask budget is still bounded');
assert(result.every((p) => p.front.length <= 16), 'expanded per-actor cover remains bounded');
assert.equal(result[0].actor.id, 'actor-0', 'hero priority persists');
assert(result.slice(1, 6).every((p) => p.actor.renderKind === 'ally'), 'companions retain priority');
assert(result.some((p) => p.actor.renderKind === 'enemy'), 'some enemy silhouettes remain visible');
// Projected horizontal distance is no longer truncated at the old 155px
// threshold for objects whose authored height makes them legitimate cover.
const tall = { ...house, sx: hero.sx + 180, sy: hero.sy + 35, height: 180 };
assert(occlusionPairs([hero, tall], project, height).length === 1, 'tall broad cover is considered');
console.log('PASS expanded occlusion classification, depth, bounded masks and visibility priority');

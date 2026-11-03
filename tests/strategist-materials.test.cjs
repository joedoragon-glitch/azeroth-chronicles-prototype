'use strict';

// Focused dormant fifth-class material resolver regressions. No playable class is admitted.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const M = require('../src/prototype/strategist-materials.js');
const R = Campaign.rules;

assert.deepEqual(M.MATERIALS, ['water', 'mineral', 'wood', 'fire']);

// These paths must fast-fail without reading zones, creating a cache or scanning props.
for (const name of ['paladin', 'mage', 'ranger', 'rogue']) {
  const other = { hero: { class: name }, get s() { throw Error('Non-Strategist performed world work'); } };
  assert.equal(M.forCombat(other, 'wood', { range: 180 }), null);
}
assert.equal(Campaign.classFoundationFor('strategist'), null);
assert.equal(Campaign.classes.strategist, undefined);

const game = new Campaign('normal', 'paladin', () => 0.5);
const zone = {
  id: 'vale', props: [], buildings: [], nodes: [],
};
game.s.zone = 'vale';
game.s.zones.vale = zone;
// Explicitly diagnostic-only hero identity, never a real registered fifth-class save.
game.hero.class = 'strategist';
game.hero.x = 100;
game.hero.y = 100;
const cast = (material, range = 160) => M.forCombat(game, material, { zone, rules: R, range });
const put = (id, structure, x = 140, y = 100, options = {}) => {
  const p = { id, structure, x, y, r: 0, decorative: true, ...options };
  zone.props.push(p);
  M.invalidate(game, zone.id);
  return p;
};

const ore = put('genuine-ore', 'silver-ore-face');
assert.equal(cast('mineral')?.id, ore.id, 'genuine decorative ore is material');
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'dirt' }), null);
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'mudflat' }), null);
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'stone-seat' }), null);

for (const structure of ['house', 'crown-ash-house', 'frontier-patched-house', 'cottage', 'barracks']) {
  assert.equal(M.propMaterial({ x: 100, y: 100, structure }), null, 'protected home: ' + structure);
}
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'woodpile', protectedHome: true }), null);
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'woodpile', decorative: true }), 'wood');
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'appalachian-tree', r: 18 }), 'wood');
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'burned-log' }), 'wood');
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'barrel' }), null);
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'barrel', containsWater: true }), 'water');
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'barrel', containsWater: true, empty: true }), null);
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'well' }), 'water');
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'forge', lit: false }), null);
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'ember-pit', active: true }), 'fire');
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'forge', heatActive: false }), null);
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'fumarole' }), null);
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'wet-grass' }), null);
assert.equal(M.propMaterial({
  x: 100, y: 100, structure: 'flame-glow', authoritativeCombatFire: true,
  kind: 'active-fire-hazard', expiresAt: 11,
}, 10), 'fire');
assert.equal(M.propMaterial({
  x: 100, y: 100, structure: 'flame-glow', authoritativeCombatFire: true,
  kind: 'active-fire-hazard', expiresAt: 10,
}, 10), null);

const flame = put('warm-ember', 'ember-pit', 140, 105);
assert.equal(cast('fire')?.id, flame.id);
flame.extinguished = true;
assert.equal(cast('fire'), null, 'an extinguished source is refused even with a warm cache');

const wood = put('real-stump', 'stump', 145, 120);
assert.equal(cast('wood')?.id, wood.id);
assert.equal(cast('mineral')?.id, ore.id, 'materials coexist without shared lockout');
wood.x = 2000;
wood.y = 2000;
M.invalidate(game, zone.id);
assert.equal(cast('wood'), null, 'a moved prop is no longer usable after invalidation');

// Ordinary inland water cannot be confused with passable ground; the shoreline
// point can be seen from dry land. Barriers are not opaque sight occluders.
const dryZone = { id: 'vale', props: [], buildings: [] };
game.hero.x = 630;
game.hero.y = 1320 - 125 - 32;
assert(M.forCombat(game, 'water', { zone: dryZone, rules: R, range: 60 }));
assert.equal(M.hasSight({ x: 30, y: 20 }, { x: 130, y: 20 }, null, dryZone, R), true);
const blockZone = { id: 'vale', props: [
  { id: 'wall', structure: 'stonewall', x: 75, y: 20, r: 16, decorative: false },
], buildings: [] };
assert.equal(M.hasSight({ x: 30, y: 20 }, { x: 130, y: 20 }, null, blockZone, R), false);
assert.equal(M.hasSight({ x: 30, y: 80 }, { x: 130, y: 80 }, null, blockZone, R), true);

for (const [region, material, expected] of [
  [0, 'water', true], [1, 'water', true], [2, 'mineral', false],
  [3, 'water', true], [4, 'fire', true],
]) {
  const sources = M.terrainSources(R, ['vale', 'march', 'highlands', 'frontier', 'crown'][region], region);
  assert.equal(sources.some((s) => s.material === material), expected);
}
assert.equal(M.terrainSources(R, 'arena', -1).length, 0);

// The same identity catalog applies to worker use, but an actual staff
// qualification and a real reachable route are separate mandatory gates.
const worker = { x: 110, y: 100, id: 'trusted-worker' };
const lab = { zone: 'vale', id: 'field-lab' };
game.hero.x = 100;
game.hero.y = 100;
const gatherZone = { id: 'vale', props: [{ id: 'log', structure: 'fallen-log', x: 150, y: 100, r: 0, decorative: true }], buildings: [] };
const baseline = { zone: gatherZone, rules: R, worker, lab, range: 120 };
assert.equal(M.forGather(game, 'wood', baseline), null, 'unauthenticated Lab cannot gather');
assert.equal(M.forGather(game, 'wood', { ...baseline, authorize: () => false, route: () => [worker] }), null);
assert.equal(M.forGather(game, 'wood', { ...baseline, authorize: () => true, route: () => [] }), null);
assert.equal(M.forGather(game, 'wood', { ...baseline, authorize: () => true, route: () => [{ x: 900, y: 900 }] }), null);
assert.equal(M.forGather(game, 'wood', { ...baseline, authorize: () => true,
  route: (_from, to) => [{ x: to.x, y: to.y }] })?.id, 'log');
assert.equal(M.forGather(game, 'water', { ...baseline, authorize: () => true,
  route: (_from, to) => [{ x: to.x, y: to.y }] })?.material, 'water',
  'regional real water can be selected if actual worker route succeeds');

// A legit inherited Lab can be serviced by its independent owner even when
// the current hero is another class; this is not permission to cast skills.
game.hero.class = 'paladin';
assert.equal(cast('wood'), null);
assert.equal(M.forGather(game, 'wood', { ...baseline, authorize: () => true,
  route: (_from, to) => [{ x: to.x, y: to.y }] })?.id, 'log');

assert.equal(M.findSource(game, 'earth', { zone: gatherZone, rules: R, at: worker, range: 120 }), null);
assert.equal(M.forCombat(game, 'water', { zone: dryZone, rules: R, range: 999999 }), null);

console.log('PASS Strategist source truth, line of sight, class isolation and authenticated gathering');

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
for (const kind of ['cistern', 'water-trough']) {
  assert.equal(M.propMaterial({ x: 100, y: 100, structure: kind }), null,
    kind + ' needs actual water state, not a container-shaped visual');
  assert.equal(M.propMaterial({ x: 100, y: 100, structure: kind, containsWater: true }),
    'water');
  assert.equal(M.propMaterial({ x: 100, y: 100, structure: kind, containsWater: true, empty: true }),
    null);
}
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'ore-cart' }), null);
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'ore-cart', containsOre: true }), 'mineral');
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'ore-cart', containsOre: true, empty: true }), null);
for (const kind of ['forge', 'furnace', 'silver-refining-hearth',
  'citadel-forge-bay', 'geothermal-heat-intake']) {
  assert.equal(M.propMaterial({ x: 100, y: 100, structure: kind }), null,
    kind + ' cannot assume heat from its artwork');
  assert.equal(M.propMaterial({ x: 100, y: 100, structure: kind, heatActive: true }),
    'fire', kind + ' with live heat is usable');
  assert.equal(M.propMaterial({ x: 100, y: 100, structure: kind, heatActive: false }), null);
}
// Source identity is not sufficient when an entire authored family is
// explicitly noninteractive. All identities here come from the live PR deltas.
for (const [id, structure] of [
  ['millhaven-poultry', 'poultry-yard'], ['millhaven-flowers', 'wildflowers'],
  ['hamlet-pen', 'animal-pen'], ['orchard-flowers', 'wildflowers'],
  ['pond-reeds-west', 'reeds'], ['pond-reeds-east', 'reeds'],
  ['den-thorn-bed', 'thorn-bed'],
]) assert.equal(M.propMaterial({
  id: 'greenwood-refinement-' + id, x: 100, y: 100, structure,
  decorative: true, r: 0, greenwoodAuthored: true, greenwoodRefinement: 1,
}), null, 'decorative Greenwood overlay never supplies material: ' + id);
for (const [id, structure, tag] of [
  ['crown-civic-forecourt-0', 'crown-civic-tilecourt', 'crownCivicForecourt'],
  ['crown-foundry-work-furnace', 'crown-foundry-furnace', 'crownFoundryWorker'],
  ['side-entrance-side-crown-foundry-1', 'crown-foundry-yard-flue', 'crownFoundryExterior'],
]) assert.equal(M.propMaterial({
  id, structure, x: 100, y: 100, decorative: true, r: 0, [tag]: true,
}), null, 'Crown presentation scene is not a material: ' + id);
for (const [tag, structure] of [
  ['greenwoodRefinement', 'fallen-log'], ['crownCivicForecourt', 'stone-marker'],
  ['crownFoundryWorker', 'forge'], ['crownFoundryExterior', 'woodpile'],
]) assert.equal(M.propMaterial({
  x: 100, y: 100, structure, [tag]: tag === 'greenwoodRefinement' ? 1 : true,
  heatActive: true,
}), null, 'scene role must override reused material-looking artwork: ' + tag);
assert.equal(M.propMaterial({
  id: 'crown-layout-citadel-command-0', x: 100, y: 100, structure: 'crown-wall',
}), null, 'state/civic compound property is protected');
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'forge', lit: false }), null);
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'ember-pit', active: true }), 'fire');
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'forge', heatActive: false }), null);
assert.equal(M.propMaterial({ x: 100, y: 100, structure: 'fumarole' }), 'fire');
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

// The engine stores temporary flame patches in s.hazards, not zone.props.
game.s.hazards = [
  { x: 145, y: 100, kind: 'circle', radius: 25, life: 4,
    family: 'abyss', persistent: true, name: 'Delayed flame patch' },
];
assert.equal(cast('fire')?.id, 'combat-fire-0',
  'real timed Abyss flame patches qualify while active');
game.s.hazards[0].life = 0;
assert.equal(cast('fire'), null, 'expired combat fire cannot supply a skill');
game.s.hazards[0] = {
  x: 145, y: 100, kind: 'circle', radius: 15, life: 3, family: 'mire',
  name: 'Mud patch', persistent: true,
};
assert.equal(cast('fire'), null, 'unrelated mud hazards do not magically become fire');
game.s.hazards[0] = {
  x: 145, y: 100, kind: 'circle', radius: 15, life: 3,
  authoritativeCombatFire: true, material: 'fire',
};
assert.equal(cast('fire')?.id, 'combat-fire-0', 'future owned live fire may opt in');
game.s.hazards = [];

const inactiveIntake = put('cold-thermal-intake', 'geothermal-heat-intake', 151, 103);
assert.equal(cast('fire'), null, 'unverified equipment is not active by depiction alone');
inactiveIntake.heatActive = true;
M.invalidate(game, zone.id); // A newly activated source requires a fresh spatial index.
assert.equal(cast('fire')?.id, inactiveIntake.id);
inactiveIntake.heatActive = false;
assert.equal(cast('fire'), null, 'lost heat is rejected even before cache invalidation');
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
const actualPond = M.terrainSources(R, 'vale', 0).find(
  (s) => s.material === 'water' && Number.isFinite(s.shape?.r),
);
assert(actualPond, 'the active Greenwood geometry must contain an authentic water circle');
game.hero.x = actualPond.shape.x;
game.hero.y = actualPond.shape.y - actualPond.shape.r - 32;
assert(M.forCombat(game, 'water', { zone: dryZone, rules: R, range: 60 }),
  'the active authored source, not an older Greenwood coordinate, is usable');
assert.equal(M.hasSight({ x: 30, y: 20 }, { x: 130, y: 20 }, null, dryZone, R), true);
const blockZone = { id: 'vale', props: [
  { id: 'wall', structure: 'stonewall', x: 75, y: 20, r: 16, decorative: false },
], buildings: [] };
assert.equal(M.hasSight({ x: 30, y: 20 }, { x: 130, y: 20 }, null, blockZone, R), false);
assert.equal(M.hasSight({ x: 30, y: 80 }, { x: 130, y: 80 }, null, blockZone, R), true);
assert.equal(M.hasSight({ x: 30, y: 20 }, { x: 130, y: 20 }, null,
  { id: 'side-vale-cellars', props: [
    { id: 'side-wall-1', structure: 'cellar-pier', x: 75, y: 20,
      r: 28, decorative: false },
  ], buildings: [] }, R), false,
  'native cellar pillars are actual sight blockers, even outside generic wall names');
const greenwoodWall = { id: 'saved-wall', structure: 'fence', r: 0, decorative: true,
  greenwoodWall: { a: { x: 75, y: 0 }, b: { x: 75, y: 60 } } };
assert.equal(M.hasSight({ x: 30, y: 20 }, { x: 130, y: 20 }, null,
  { id: 'vale', props: [greenwoodWall], buildings: [] }, R), false,
  'authored linear walls block sight even when stored as zero-radius props');

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
const gatherZone = { id: 'vale', props: [
  { id: 'log', structure: 'fallen-log', x: 150, y: 100, r: 0, decorative: true },
  { id: 'well', structure: 'well', x: 190, y: 100, r: 0, decorative: true },
], buildings: [] };
const baseline = { zone: gatherZone, rules: R, worker, lab, range: 120,
  passable: (_a, _b, _zone) => true };
assert.equal(M.forGather(game, 'wood', baseline), null, 'unauthenticated Lab cannot gather');
assert.equal(M.forGather(game, 'wood', { ...baseline, authorize: () => false, route: () => [worker] }), null);
assert.equal(M.forGather(game, 'wood', { ...baseline, authorize: () => true, route: () => [] }), null);
assert.equal(M.forGather(game, 'wood', { ...baseline, authorize: () => true, route: () => [{ x: 900, y: 900 }] }), null);
assert.equal(M.forGather(game, 'wood', { ...baseline, authorize: () => true,
  route: (_from, to) => [{ x: to.x, y: to.y }] })?.id, 'log');
const remote = { id: 'highlands', props: [
  { id: 'quarry-log', x: 3000, y: 100, structure: 'fallen-log', r: 0, decorative: true },
], buildings: [] };
assert.equal(M.forGather(game, 'wood', { zone: remote, rules: R, worker,
  lab: { zone: 'highlands' }, range: 3300, authorize: () => true,
  passable: () => true,
  route: (_from, to) => [{ x: to.x, y: to.y }] })?.id, 'quarry-log',
  'a staffed Lab may plan a region-scale journey without a global frame scan');
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


// The parent overworld's rivers/lava cannot supply nonexistent dungeon sources.
for (const [id, parent] of [
  ['crypt', 0], ['archive', 1], ['mine', 2], ['abyss', 3], ['citadel', 4],
  ['supply-vale', 0], ['side-vale-cellars', 0],
]) {
  assert.deepEqual(M.terrainSources(R, id, parent), [],
    'never leak regional terrain or harbors into an interior: ' + id);
}
assert.equal(M.forGather(game, 'wood', {
  zone: { id: 'mine', props: [{ x: 110, y: 120, structure: 'woodpile' }], buildings: [] },
  rules: R, worker: { x: 100, y: 100 }, lab: { zone: 'mine' },
  range: 150, authorize: () => true,
  route: (_from, to) => [to], passable: () => true,
}), null, 'Field Labs belong to overworld regions, not dungeons');
assert.equal(M.forGather(game, 'wood', {
  ...baseline, authorize: () => true, route: (_from, to) => [to],
  passable: () => false,
}), null, 'an endpoint does not validate a physically blocked worker segment');

// Source-catalog audit regressions from actual authored zone and dungeon owners.
assert.equal(M.propMaterial({
  id: 'greenwood-nature-43', x: 100, y: 100, structure: null,
  greenwoodAuthored: true, greenwoodNature: 'tree',
}), 'wood', 'Greenwood original forest trees do not have structure identifiers');
assert.equal(M.propMaterial({
  id: 'greenwood-nature-51', x: 100, y: 100, structure: null,
  greenwoodAuthored: true, greenwoodNature: 'fallen-log', decorative: true,
}), 'wood', 'real Greenwood woodland logs are not excluded for being decorative');
assert.equal(M.propMaterial({
  id: 'unverified-nature', x: 100, y: 100, structure: null,
  greenwoodAuthored: true, greenwoodNature: 'tree',
}), null, 'arbitrary metadata must not invent Greenwood sources');
for (const structure of ['stacked-lumber', 'mangrove']) {
  assert.equal(M.propMaterial({ x: 100, y: 100, structure }), 'wood', structure);
}
for (const structure of ['ore-cart', 'crystal', 'appalachian-silver-workings']) {
  assert.equal(M.propMaterial({
    x: 100, y: 100, structure, miningFacility: true, containsOre: true,
  }), 'mineral', 'real source: ' + structure);
}
assert.equal(M.propMaterial({
  x: 100, y: 100, structure: 'crystal', sceneRole: 'art-object',
}), null, 'the Mine art gallery is not an exposed geological crystal source');
assert.equal(M.propMaterial({
  x: 100, y: 100, structure: 'appalachian-silver-workings',
}), null, 'a mining facility must have real authored mining provenance');
for (const structure of ['ember', 'ogre-hearth', 'roadside-lantern', 'grave-lamp']) {
  assert.equal(M.propMaterial({ x: 100, y: 100, structure }), 'fire', structure);
}
assert.equal(M.propMaterial({
  id: 'settlement-major-2', x: 100, y: 100, structure: 'crown-wall',
}), null, 'a town-owned stone wall is not a free mineral resource');

assert.deepEqual(M.closestToShape({ x: 10, y: 50 }, {
  x1: 0, x2: 20, y1: 0, y2: 100, gaps: [[40, 60]],
}), { x: 10, y: 61 },
'crossing gaps are not lava even though they lie inside the lava rectangle');
const crownBarrier = R.barriers[4];
const sampleBank = R.channelBanks(4, 1000)[0];
game.hero.class = 'strategist';
game.hero.x = sampleBank - 28;
game.hero.y = 1000;
assert.equal(M.forCombat(game, 'fire', {
  zone: { id: 'crown', props: [], buildings: [] }, rules: R, range: 250,
})?.id, 'regional-channel',
'a real lava bank beyond a dry crossing should be considered using gap edges');

assert.deepEqual(M.closestToShape({ x: 5, y: 10 }, {
  points: [[0, 0], [0, 20], [20, 20], [20, 0]],
}), { x: 0, y: 10 }, 'tuple-encoded March harbor shore geometry must be recognized');
assert(M.terrainSources(R, 'march', 1).some((source) => source.id === 'march-drainage'),
  'actual walkable March drainage is a Water source, not a terrain barrier');
const drain = M.terrainSources(R, 'march', 1).find((source) => source.id === 'march-drainage');
game.hero.class = 'strategist';
game.hero.x = 600;
game.hero.y = R.drainageBanks(600).y;
assert(M.forCombat(game, 'water', { zone: { id: 'march', props: [], buildings: [] },
  rules: R, range: 50 })?.material === 'water',
'active shallow March drainage must be usable without inventing a wall');

// Deterministic cost guards: after a lazy two-pass build, repeated combat
// queries must not enumerate all thousands of authored props again.
let fullPropPasses = 0;
const many = [];
for (let i = 0; i < 2500; i++) many.push({
  id: 'cosmetic-' + i, x: 1400 + (i % 70) * 23,
  y: 600 + Math.floor(i / 70) * 20,
  structure: 'dry-scrub', decorative: true, r: 0,
});
many.push({ id: 'valid-nearby-stump', x: 125, y: 105,
  structure: 'stump', decorative: true, r: 0 });
const watched = new Proxy(many, {
  get(target, key, receiver) {
    if (key === Symbol.iterator) {
      fullPropPasses++;
      return target[Symbol.iterator].bind(target);
    }
    return Reflect.get(target, key, receiver);
  },
});
const denseZone = { id: 'vale', props: watched, buildings: [] };
game.hero.x = 100; game.hero.y = 100;
assert.equal(M.forCombat(game, 'wood', { zone: denseZone, rules: R, range: 130 })?.id,
  'valid-nearby-stump');
const builtPasses = fullPropPasses;
assert(builtPasses <= 3, 'first lookup should build only a few lazy indexes');
for (let i = 0; i < 80; i++) {
  assert.equal(M.forCombat(game, 'wood', { zone: denseZone, rules: R, range: 130 })?.id,
    'valid-nearby-stump');
}
assert.equal(fullPropPasses, builtPasses,
  '80 combat lookups must reuse spatial+occluder grids, not enumerate 2500 props per cast');

// Worst-case denied visibility and worker routes are capped, so a deliberately
// adversarial battlefield cannot trigger unbounded LOS/route work.
const wallBlocked = [{ id: 'occluder', x: 120, y: 100, r: 13,
  structure: 'stonewall', decorative: false }];
for (let i = 0; i < 200; i++) wallBlocked.push({
  id: 'wood-behind-' + i, x: 150 + (i % 4),
  y: 100 + (i % 5), r: 0, decorative: true, structure: 'fallen-log',
});
let sightAttempts = 0;
const sightRules = {
  terrain: [[], [], [], [], []], barriers: [], harbors: {},
  dungeonArchitecture: { vale: {
    partitions: {
      some() { sightAttempts++; return false; },
    },
  } },
};
assert.equal(M.forCombat(game, 'wood', {
  zone: { id: 'vale', props: wallBlocked, buildings: [] },
  rules: sightRules, range: 180,
}), null);
assert(sightAttempts > 0 && sightAttempts <= 32,
  'no more than 32 line-of-sight probes per Strategist combat lookup');
let routeAttempts = 0;
const impossibleLab = { id: 'vale', props: wallBlocked, buildings: [] };
assert.equal(M.forGather(game, 'wood', {
  zone: impossibleLab, rules: sightRules, range: 500,
  worker: { x: 100, y: 100 }, lab: { id: 'lab', zone: 'vale' },
  authorize: () => true, passable: () => true,
  route: () => { routeAttempts++; return []; },
}), null);
assert.equal(routeAttempts, 24, 'at most 24 actual route probes per Lab query');



// Revisioned semantic-source contract: visuals and coordinates may change,
// but only a code-owned, zone-scoped source definition may authorize a material.
const semanticRules = Object.create(R);
semanticRules.environmentalSources = { vale: {
  'vale-public-water': { material: 'water', requires: 'containsWater' },
  'vale-work-heat': { material: 'fire', requires: 'activeHeat' },
  'vale-owned-tree': { material: 'wood', requires: 'permanent' },
} };
const identified = {
  id: 'art-v1', materialSourceKey: 'vale-public-water', x: 158, y: 100,
  structure: 'decorative-modern-vessel', containsWater: true, decorative: true, r: 0,
};
const semanticZone = { id: 'vale', props: [identified], buildings: [], environmentSourceRevision: 0 };
game.hero.class = 'strategist';
game.hero.x = 100; game.hero.y = 100;
const semanticCast = material => M.forCombat(game, material, {
  zone: semanticZone, rules: semanticRules, range: 100,
});
assert.equal(semanticCast('water')?.id, 'art-v1', 'stable proof independent of artwork');
assert.equal(M.materialForProp(identified, game.s.time, 'vale', R), null,
  'saved alias without current regional authoring cannot invent sources');
assert.equal(M.propMaterial(identified, game.s.time), null, 'raw metadata not enough');
assert.equal(M.materialForProp({
  ...identified, materialSourceKey: 'unlisted', structure: 'woodpile',
}, game.s.time, 'vale', semanticRules), null, 'unknown key cannot fall back to material-looking art');
assert.equal(M.materialForProp(identified, game.s.time, 'crown', semanticRules), null,
  'another region cannot borrow the Vale key');
identified.x = 1500; identified.y = 1500;
assert.equal(semanticCast('water'), null, 'cached moved object cannot haunt its old cell');
semanticZone.environmentSourceRevision++;
assert.equal(semanticCast('water'), null, 'revision refreshes relocated index');
identified.x = 152; identified.y = 105; identified.id = 'art-v2';
identified.structure = 'replacement-sprite';
semanticZone.environmentSourceRevision++;
assert.equal(semanticCast('water')?.id, 'art-v2',
  'replacement art keeps stable gameplay key with actual new position');
identified.containsWater = false;
assert.equal(semanticCast('water'), null, 'empty is immediately denied');
identified.containsWater = true;
assert.equal(semanticCast('water')?.id, 'art-v2', 'live state is consulted again');
const wall = { id: 'mutable-wall', x: 126, y: 100, structure: 'stonewall',
  r: 14, decorative: false };
semanticZone.props.push(wall);
assert.equal(semanticCast('water'), null, 'new wall blocks optical sight');
wall.x = 1700; semanticZone.environmentSourceRevision++;
assert.equal(semanticCast('water')?.id, 'art-v2',
  'moving wall updates occlusion only after event/revision');
semanticZone.props[0] = { ...identified, id: 'art-v3' };
assert.equal(semanticCast('water'), null,
  'same-length prop replacement cannot return the removed cached source');
semanticZone.environmentSourceRevision++;
assert.equal(semanticCast('water')?.id, 'art-v3',
  'same-length array replacement updates via zone revision');
semanticZone.props[0] = {
  ...identified, id: 'residential-tree', materialSourceKey: 'vale-owned-tree',
  structure: 'tree', protectedHome: true,
};
semanticZone.environmentSourceRevision++;
assert.equal(semanticCast('wood'), null, 'property protection outranks definitions');
semanticZone.props[0] = {
  id: 'replaced-heat', materialSourceKey: 'vale-work-heat',
  x: 152, y: 105, structure: 'painted-furnace', heatActive: false,
};
semanticZone.environmentSourceRevision++;
assert.equal(semanticCast('fire'), null, 'art alone is not an operating furnace');
semanticZone.props[0].heatActive = true;
semanticZone.environmentSourceRevision++;
assert.equal(semanticCast('fire')?.id, 'replaced-heat', 'heat needs live proof');
semanticZone.props[0].heatActive = false;
assert.equal(semanticCast('fire'), null, 'live extinguish denies existing cached Fire');
semanticZone.props.splice(0, 1);
assert.equal(semanticCast('fire'), null, 'removed asset is never a ghost source');
assert.equal(M.materialForProp({ id: 'test-water', x: 1, y: 1, dry: true },
  game.s.time, 'vale', { environmentalSources: { vale: {
    'test-water': { material: 'water', requires: 'permanent' },
  } } }), null, 'even permanent water must honor real dry state');
for (const requires of ['invalid', 'permanent', 'containsWater', 'containsOre']) {
  assert.equal(M.materialForProp({
    id: 'test-fire', materialSourceKey: 'vale-work-heat',
    x: 152, y: 105, heatActive: true,
  }, game.s.time, 'vale', { environmentalSources: { vale: {
    'vale-work-heat': { material: 'fire', requires },
  } } }), null, 'fire declaration must require heat: ' + requires);
}

// Audited catalog inventory across the five regions. This is intentionally
// source-derived rather than a heavy, full-campaign world-generation sweep:
// actual placed-zone and phone pathing coverage belongs to integration QA.
const catalogInventory = Campaign.data.regions.map((region, index) => {
  const counts = Object.fromEntries(M.MATERIALS.map((m) => [m, 0]));
  for (const kind of R.natureThemes[index]) {
    const material = M.propMaterial({ x: 100, y: 100, structure: kind });
    if (material) counts[material]++;
  }
  for (const source of M.terrainSources(R, region.id, index)) counts[source.material]++;
  return { zone: region.id, catalogSources: counts };
});
assert.equal(catalogInventory.length, 5, 'all five authored regional catalogs inspected');
console.log('Strategist authored TEMPLATE inventory (not placed zones): ' +
  JSON.stringify(catalogInventory));

console.log('PASS Strategist source truth, line of sight, class isolation and authenticated gathering');

'use strict';
// Exterior-only Winter Estate scene acceptance; scoped native engine and art test.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const C = require('../src/prototype/engine.js');
const V = require('../src/prototype/visuals.js');
const { rng } = require('../tools/greenwood-layout/fixtures.cjs');

const before = { x: 2830, y: 2850 }, after = { x: 2830, y: 2940 };
const fixtures = [
  ['estate-scaffold', 2970, 2830],
  ['stacked-lumber', 2740, 3080],
  ['tool-rack', 2640, 2970],
  ['supply-stack', 3060, 3040],
];
assert.equal(C.rules.greenwoodLayout.sceneVersion, 5,
  'estate pass does not rebuild the main Greenwood scene');
assert.deepEqual(C.rules.greenwoodLayout.anchors.crypt, after);
const material = (z) => ({
  enemies: z.enemies.map((e) => [e.id, e.x, e.y, e.home?.x, e.home?.y, e.hp]),
  nodes: z.nodes.map((e) => [e.id, e.amount, e.x, e.y]),
  buildings: z.buildings.map((e) => [e.id, e.x, e.y, e.progress]),
});
const entrance = (z) => z.npcs.find((n) =>
  n.id === 'entrance' && n.kind === 'dungeon' && n.family === 'crypt');
const end = (z) => z.roads[3].at(-1);
const checkScene = (z) => {
  assert.equal(z.greenwoodEstateFacadeVersion, 1, 'versioned estate pass applied');
  assert.deepEqual({ x: entrance(z).x, y: entrance(z).y }, after);
  assert.deepEqual({ x: end(z).x, y: end(z).y }, after,
    'physical road terminates at the new actual entrance');
  const route = z.greenwoodRoutes.find((r) =>
    r.kind === 'farm' && r.points.length === 7 && r.points[0].x === 2320);
  assert(route, 'original 6-point eastern cart route retained');
  assert.deepEqual(route.points.at(-1), after);
  assert.deepEqual(route.points.at(-2), { x: 2500, y: 2660 },
    'estate cartway has a real shared junction with Scornfang depot apron');
  const depot = z.footpaths.find((p) => p.length === 2 &&
    p[0].x === 2500 && p[0].y === 2660);
  assert(depot && depot.at(-1).x === 2600 && depot.at(-1).y === 2610,
    'existing freight depot path joins the estate cartway');
  for (let j = 0; j < fixtures.length; j++) {
    const [structure, x, y] = fixtures[j],
      prop = z.props.find((p) => p.id === 'greenwood-estate-' + j);
    assert(prop && prop.structure === structure);
    assert.deepEqual({ x: prop.x, y: prop.y }, { x, y });
  }
  assert(z.props.length <= 400, 'existing Greenwood scenery budget');
};
for (const seed of [0x47564101, 0x47564103]) {
  const g = new C('normal', 'paladin', rng(seed)), z = g.zone();
  checkScene(z);
  const snapshot = g.snapshot(), original = JSON.stringify(snapshot);
  const old = JSON.parse(original), oldVale = old.zones.vale;
  delete oldVale.greenwoodEstateFacadeVersion;
  Object.assign(entrance(oldVale), before);
  for (const route of oldVale.greenwoodRoutes || []) {
    const last = route.points.at(-1);
    if (route.kind === 'farm' && last.x === after.x && last.y === after.y)
      Object.assign(last, before);
  }
  for (const road of oldVale.roads || []) {
    const last = road.at(-1);
    if (last.x === after.x && last.y === after.y) Object.assign(last, before);
  }
  fixtures.forEach(([structure], j) => {
    const prop = oldVale.props.find((p) => p.id === 'greenwood-estate-' + j);
    prop.x = before.x - 150 + j * 100;
    prop.y = before.y + 175;
    assert.equal(prop.structure, structure);
  });
  oldVale.props.push({
    id: 'owner-retained-estate-test', x: 2740, y: 3005, r: 0,
    structure: 'barrel', playerOwned: true, decorative: true,
  });
  const originalOld = JSON.stringify(old), oldState = material(oldVale),
    restored = C.restore(old, rng(seed));
  assert.equal(JSON.stringify(old), originalOld, 'restore input remains immutable');
  const updated = restored.zone();
  checkScene(updated);
  assert.deepEqual(material(updated), oldState,
    'only scene art, road endpoint and matching dungeon marker relocate');
  assert(updated.props.some((p) => p.id === 'owner-retained-estate-test' && p.playerOwned));
  const second = C.restore(restored.snapshot(), rng(seed)).zone();
  checkScene(second);
  assert.deepEqual(second.roads, updated.roads, 'road shift idempotent');
  assert.deepEqual(material(second), material(updated), 'functional state idempotent');
  assert.equal(JSON.stringify(snapshot), original, 'fresh snapshot untouched');
}
// Verify the actual native dungeon paint, rather than an unused preview branch.
const scene = new C('normal', 'paladin', rng(0x47564103));
const gate = entrance(scene.zone());
const canvas = createCanvas(600, 360), ctx = canvas.getContext('2d');
V.draw(ctx, { ...gate, renderKind: 'npc' }, { x: 300, y: 260 }, 0);
const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
let left = canvas.width, right = -1, top = canvas.height, bottom = -1;
for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
  if (!pixels[(y * canvas.width + x) * 4 + 3]) continue;
  left = Math.min(left, x); right = Math.max(right, x);
  top = Math.min(top, y); bottom = Math.max(bottom, y);
}
assert(right - left > 150, 'estate reads as a broad building, not a tomb-sized door');
assert(bottom - top > 90, 'residential wings and roof extend above the old crypt entrance');
console.log('PASS native winter estate facade, southward route, four work props and old v4 restore');

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

  // The owner's yellow nameplate is a world-space label over the building,
  // not a toast, discovery marker or campaign-state event.
  const Renderer = require('../src/prototype/renderer.js');
  const V = require('../src/prototype/visuals.js');
  const FX = require('../src/prototype/combat-visuals.js');
  const { createCanvas } = require('@napi-rs/canvas');
  const sc = C.rules.greenwoodLayout.scale;
  const canvas = createCanvas(852, 393), ctx = canvas.getContext('2d');
  const drawnText = [];
  const paintText = ctx.fillText.bind(ctx);
  ctx.fillText = (text, ...args) => {
    drawnText.push(String(text));
    return paintText(text, ...args);
  };
  const renderer = Renderer.create({
    canvas, ctx, getGame: () => g,
    platform: {
      cameraZoom: 1.5,
      cameraAnchor: (w, h) => ({ x: w * 0.5, y: h * 0.58 }),
    },
    Campaign: C,
    PrototypeVisuals: V,
    PrototypeCombatVisuals: FX,
    now: () => 16000,
    chargePresentation: () => null,
    isPaused: () => false,
  });
  const visual = { ...lodge, renderKind: 'prop' };
  g.hero.x = lodge.x + 100 * sc;
  g.hero.y = lodge.y;
  assert.equal(renderer.labelVisible(visual), true, 'homestead gets nearby world label');
  renderer.draw();
  assert(drawnText.includes("Thornfang's Homestead"),
    'native yellow world label paints above the actual homestead');
  g.hero.x = lodge.x + 300 * sc;
  assert.equal(renderer.labelVisible(visual), false, 'no distant homestead nameplate');
  assert(!g.notices.some((n) => /Thornfang's Homestead/.test(n.text)),
    'approaching never creates a narrative popup');

}
console.log('PASS Greenwood open homestead, native world label and owner-safe v4 migration');

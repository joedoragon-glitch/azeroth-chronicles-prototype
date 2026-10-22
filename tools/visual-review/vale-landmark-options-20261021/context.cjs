'use strict';
// Existing live geometry, procedural fallback drawings only; no candidate activation.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const root = path.resolve(__dirname, '../../..'),
  C = require(root + '/src/prototype/engine');
const V = require(root + '/src/prototype/visuals'),
  { options } = require('./designs.cjs');
global.document = { createElement: () => createCanvas(1, 1) };
global.OffscreenCanvas = function (w, h) {
  return createCanvas(w, h);
};
for (const item of options) {
  const g = new C('normal', 'mage', () => 0.8),
    z = g.zone(),
    e = z.npcs.find((n) => n.id === item.entity);
  g.s.clock = 190;
  g.s.party = [];
  Object.assign(g.hero, g.safe(e.x, e.y + 110));
  const canvas = createCanvas(1000, 680),
    ctx = canvas.getContext('2d');
  const platform = require(root + '/src/prototype/platform').init({
    location: { search: '?experience=desktop' },
    localStorage: { getItem: () => null },
    document: { body: { getAttribute: () => null, setAttribute: () => {} } },
  });
  platform.selectCameraZoom(1.5);
  const renderer = require(root + '/src/prototype/renderer').create({
    canvas: { width: 1000, height: 680 },
    ctx,
    getGame: () => g,
    platform,
    Campaign: C,
    PrototypeVisuals: V,
    PrototypeCombatVisuals: require(root + '/src/prototype/combat-visuals'),
    PrototypeSprites: null,
    PrototypeMaterials: null,
    now: () => 16000,
    chargePresentation: () => null,
    isPaused: () => false,
  });
  const before = JSON.stringify(g.s);
  renderer.draw();
  assert.equal(JSON.stringify(g.s), before);
  fs.writeFileSync(
    path.join(__dirname, item.id + '-current-context.webp'),
    canvas.toBuffer('image/webp'),
  );
}
console.log(
  'Six native current-plot contexts retained at 150%; procedural fallback, no candidates active, campaign unchanged.',
);

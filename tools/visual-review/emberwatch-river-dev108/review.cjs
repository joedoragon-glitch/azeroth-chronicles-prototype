'use strict';
const fs = require('fs'),
  path = require('path'),
  { createCanvas } = require('@napi-rs/canvas'),
  sharp = require('sharp');
const C = require('../../../src/prototype/engine'),
  V = require('../../../src/prototype/visuals'),
  FX = require('../../../src/prototype/combat-visuals'),
  Renderer = require('../../../src/prototype/renderer');
const seed = JSON.parse(
  require('node:zlib').gunzipSync(fs.readFileSync(path.join(__dirname, 'dev107-save.json.gz'))),
);
const g = C.restore(seed, () => 0.9),
  z = g.zone();
g.s.clock = 120;
g.s.rescued.warlord = true;
g.s.rescued.abyss = true;
g.refreshNPCs();
const views = [
  ['town', 650, 730, 1800, 1100, 1],
  ['market', 550, 700, 1200, 800, 1.15],
  ['north-bridge', 1450, 900, 1200, 850, 1.1],
  ['south-bridge', 1450, 2100, 1200, 850, 1.1],
  ['end', 1450, 3350, 1000, 700, 1.15],
  ['pools', 2790, 2210, 1200, 850, 1.1],
  ['granary', 950, 2840, 1000, 800, 1.3],
];
for (const [id, x, y, w, h, zoom] of views) {
  Object.assign(g.hero, g.safe(x, y));
  const before = JSON.stringify(g.s);
  const c = createCanvas(w, h);
  Renderer.create({
    canvas: c,
    ctx: c.getContext('2d'),
    getGame: () => g,
    platform: { cameraZoom: zoom, cameraAnchor: () => ({ x: w / 2, y: h * 0.54 }) },
    Campaign: C,
    PrototypeVisuals: V,
    PrototypeCombatVisuals: FX,
    now: () => 16000,
    chargePresentation: () => null,
    isPaused: () => false,
  }).draw();
  require('node:assert/strict').equal(JSON.stringify(g.s), before, 'render is state pure');
  sharp(c.toBuffer('image/png'))
    .webp({ quality: 90 })
    .toFile(path.join(__dirname, 'after-' + id + '.webp'));
}

g.s.clock = 500;
Object.assign(g.hero, { x: 650, y: 730 });
const nc = createCanvas(1500, 950);
Renderer.create({
  canvas: nc,
  ctx: nc.getContext('2d'),
  getGame: () => g,
  platform: { cameraZoom: 1.15, cameraAnchor: () => ({ x: 750, y: 510 }) },
  Campaign: C,
  PrototypeVisuals: V,
  PrototypeCombatVisuals: FX,
  now: () => 16000,
  chargePresentation: () => null,
  isPaused: () => false,
}).draw();
sharp(nc.toBuffer('image/png'))
  .webp({ quality: 90 })
  .toFile(path.join(__dirname, 'after-town-night.webp'));

const isolated = createCanvas(512, 420),
  ic = isolated.getContext('2d');
V.draw(
  ic,
  {
    renderKind: 'prop',
    id: 'frontier-grain-silo',
    structure: 'frontier-grain-silo',
    decorative: true,
    r: 70,
  },
  { x: 256, y: 310 },
  3,
);
fs.writeFileSync(path.join(__dirname, 'silo-reference.png'), isolated.toBuffer('image/png'));
const floral = createCanvas(1000, 270),
  fc = floral.getContext('2d');
fc.fillStyle = '#51483d';
fc.fillRect(0, 0, 1000, 270);
for (let j = 0; j < 4; j++) {
  V.draw(
    fc,
    {
      renderKind: 'prop',
      id: 'poppy-' + j,
      structure: 'battlefield-poppies',
      decorative: true,
      r: 0,
      x: 500 + j * 37,
      y: 900 + j * 61,
      poppyForm: j,
    },
    { x: 125 + j * 250, y: 165 },
    3,
  );
  fc.fillStyle = '#e6ddbf';
  fc.font = '17px sans-serif';
  fc.textAlign = 'center';
  fc.fillText(['Loose stems', 'Verge ribbon', 'Crescent', 'Broken patch'][j], 125 + j * 250, 225);
}
fs.writeFileSync(path.join(__dirname, 'poppy-reference.png'), floral.toBuffer('image/png'));

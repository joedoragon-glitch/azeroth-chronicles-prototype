'use strict';
const fs = require('node:fs'),
  assert = require('node:assert/strict'),
  sharp = require('sharp'),
  { createCanvas } = require('@napi-rs/canvas');
const C = require('../../../src/prototype/engine'),
  R = require('../../../src/prototype/rules'),
  V = require('../../../src/prototype/visuals'),
  FX = require('../../../src/prototype/combat-visuals'),
  Renderer = require('../../../src/prototype/renderer');
const g = new C('developer', 'mage', () => 0.9);
g.enter('frontier');
g.s.clock = 120;
const sheet = createCanvas(1800, 1950),
  ctx = sheet.getContext('2d');
ctx.fillStyle = '#292f2f';
ctx.fillRect(0, 0, sheet.width, sheet.height);
const locations = [
  ...R.frontierEdgeLayout.groups.map((p) => [p.name, ...p.to]),
  ['Southwest home', 330, 2450],
  ['Recovery homestead', 700, 2620],
  ['Southern home', 440, 2940],
];
for (let i = 0; i < locations.length; i++) {
  const [name, x, y] = locations[i];
  Object.assign(g.hero, { x, y });
  const before = JSON.stringify(g.s),
    c = createCanvas(900, 540);
  Renderer.create({
    canvas: c,
    ctx: c.getContext('2d'),
    getGame: () => g,
    platform: { cameraZoom: 1, cameraAnchor: () => ({ x: 450, y: 270 }) },
    Campaign: C,
    PrototypeVisuals: V,
    PrototypeCombatVisuals: FX,
    now: () => 16000,
    chargePresentation: () => null,
    isPaused: () => false,
  }).draw();
  assert.equal(JSON.stringify(g.s), before);
  ctx.drawImage(c, (i % 3) * 600, Math.floor(i / 3) * 390 + 30, 600, 360);
  ctx.fillStyle = '#f0e8d4';
  ctx.font = '18px sans-serif';
  ctx.fillText(name, (i % 3) * 600 + 12, Math.floor(i / 3) * 390 + 23);
}
sharp(sheet.toBuffer('image/png'))
  .webp({ quality: 88 })
  .toFile(__dirname + '/frontier-aesthetic-audit.webp')
  .then(() => console.log('PASS 13 native scene views, state unchanged'))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });

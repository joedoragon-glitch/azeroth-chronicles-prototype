'use strict';
const sharp = require('sharp');
const fs = require('node:fs'),
  assert = require('node:assert/strict');
const C = require('../../../src/prototype/engine'),
  V = require('../../../src/prototype/visuals'),
  FX = require('../../../src/prototype/combat-visuals'),
  Renderer = require('../../../src/prototype/renderer'),
  { createCanvas } = require('@napi-rs/canvas');
const g = new C('developer', 'mage', () => 0.9);
for (const [name, zone, x, y] of [
  ['frontier-west', 'frontier', 500, 2600],
  ['frontier-south', 'frontier', 2390, 2890],
  ['abyss-aerie', 'abyss', 1195, 1220],
  ['abyss-hatchery', 'abyss', 860, 750],
]) {
  g.enter(zone);
  g.s.clock = 120;
  Object.assign(g.hero, { x, y });
  const before = JSON.stringify(g.s),
    canvas = createCanvas(1100, 700),
    ctx = canvas.getContext('2d');
  Renderer.create({
    canvas,
    ctx,
    getGame: () => g,
    platform: { cameraZoom: 1.5, cameraAnchor: () => ({ x: 350, y: 280 }) },
    Campaign: C,
    PrototypeVisuals: V,
    PrototypeCombatVisuals: FX,
    now: () => 16000,
    chargePresentation: () => null,
    isPaused: () => false,
  }).draw();
  assert.equal(JSON.stringify(g.s), before);
  sharp(canvas.toBuffer('image/png')).webp({lossless:true}).toFile(__dirname + '/' + name + '.webp').catch(e=>{console.error(e);process.exitCode=1;});
}
console.log('PASS: four native renderer captures, saved state unchanged');

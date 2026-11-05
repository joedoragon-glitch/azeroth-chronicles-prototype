'use strict';
// Focused native production Canvas scenes. No browser/GPU/device claim.
const fs = require('node:fs'),
  assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const C = require('../../src/prototype/engine'),
  V = require('../../src/prototype/visuals');
const FX = require('../../src/prototype/combat-visuals'),
  Renderer = require('../../src/prototype/renderer');
const { rng } = require('./fixtures.cjs');
const g = new C('normal', 'paladin', rng(0x47564103));
g.enter('vale');
g.zone(); // complete native lazy entry/trail-label migrations before freeze
const out = 'test-artifacts/greenwood-environment/scenes';
fs.mkdirSync(out, { recursive: true });
const scenes = [
  ['homestead', 2690, 1230],
  ['treasury', 2120, 1250],
  ['goblin', 350, 2820],
  ['market', 900, 650],
  ['departure', 2880, 280],
  ['watch', 2670, 2220],
  ['ground', 780, 2100],
];
const receipts = [];
for (const [name, x, y] of scenes)
  for (const clock of [120, 500]) {
    Object.assign(g.hero, g.safe(x, y));
    g.s.clock = clock;
    g.updateNight();
    const canvas = createCanvas(852, 393),
      ctx = canvas.getContext('2d');
    const renderer = Renderer.create({
      canvas,
      ctx,
      getGame: () => g,
      platform: { cameraZoom: 1.5, cameraAnchor: (w, h) => ({ x: w * 0.5, y: h * 0.58 }) },
      Campaign: C,
      PrototypeVisuals: V,
      PrototypeCombatVisuals: FX,
      now: () => 16000,
      chargePresentation: () => null,
      isPaused: () => false,
    });
    const before = JSON.stringify(g.snapshot());
    renderer.draw();
    assert.equal(JSON.stringify(g.snapshot()), before, 'render must not mutate settled save');
    const file = name + '-' + (clock === 120 ? 'day' : 'night') + '.png';
    fs.writeFileSync(out + '/' + file, canvas.toBuffer('image/png'));
    receipts.push({
      file,
      viewport: [852, 393],
      zoom: 1.5,
      clock,
      requested: [x, y],
      actual: [g.hero.x, g.hero.y],
      stateUnchanged: true,
    });
  }
fs.writeFileSync(
  out + '/receipt.json',
  JSON.stringify(
    {
      source: require('node:child_process')
        .execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' })
        .trim(),
      qualifier: 'native Canvas procedural production renderer; no browser/GPU/device proof',
      receipts,
    },
    null,
    2,
  ),
);
console.log('PASS 14 production Canvas phone landscape environment frames, save-pure');

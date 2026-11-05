'use strict';
// Bounded native (software-Canvas) visual evidence for PR #814. Real world
// generator/renderer, 150% camera, no gameplay mutations. Not a browser,
// WebGL or iPhone acceptance test.
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  { createCanvas } = require('@napi-rs/canvas'),
  C = require('../../src/prototype/engine'),
  V = require('../../src/prototype/visuals'),
  FX = require('../../src/prototype/combat-visuals'),
  Renderer = require('../../src/prototype/renderer'),
  { rng } = require('./fixtures.cjs');
const root = path.resolve(__dirname, '../..'),
  out = path.join(root, 'test-artifacts/greenwood-watermill'),
  g = new C('normal', 'paladin', rng(0x47564101)),
  cfg = C.rules.greenwoodLayout,
  receipts = [];
fs.mkdirSync(out, { recursive: true });
const views = [
  ['mill-day', cfg.mill, 120],
  ['mill-night', cfg.mill, 500],
  ['race-bridge-day', { x: 1190, y: 1515 }, 120],
  ['race-bridge-night', { x: 1190, y: 1515 }, 500],
  ['headwater-culvert-day', { x: 1100, y: 765 }, 120],
];
for (const [name, target, clock] of views) {
  const originalHero = { x: g.hero.x, y: g.hero.y },
    originalClock = g.s.clock,
    cameraTarget = g.safe(target.x + 65, target.y + 95, 'vale'),
    canvas = createCanvas(852, 393),
    ctx = canvas.getContext('2d');
  Object.assign(g.hero, cameraTarget);
  g.s.clock = clock;
  g.updateNight();
  const before = JSON.stringify(g.snapshot()),
    renderer = Renderer.create({
      canvas,
      ctx,
      getGame: () => g,
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
    }),
    t0 = performance.now();
  renderer.draw();
  renderer.draw();
  const drawMs = Math.round((performance.now()-t0)*100)/100;
  if (before !== JSON.stringify(g.snapshot()))
    throw Error(name + ': rendering unexpectedly modified saved campaign');
  const bytes = canvas.toBuffer('image/png');
  if (bytes.length < 1024) throw Error(name + ': suspiciously empty rendered frame');
  const file = name+'.png';
  fs.writeFileSync(path.join(out, file), bytes);
  receipts.push({
    file, name, clock, width:852, height:393, zoom:1.5,
    hero: cameraTarget, drawMs,
    sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
    sourceSha:process.env.GITHUB_SHA || null,
    rendering:'native software Canvas with procedural fallback; not Pixi/real-device acceptance',
    snapshotUnchanged:true,
  });
  Object.assign(g.hero, originalHero);
  g.s.clock = originalClock;
  g.updateNight();
}
fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({views:receipts},null,2)+'\n');
console.log('PASS 5 focused Greenwood watermill 150% native scene frames, unchanged saved state');

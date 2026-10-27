'use strict';
// Phase 4 RESEARCH ONLY: test one static Canvas decorative family against an
// offscreen-raster reuse hypothesis. Does not register or enable a runtime cache.
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { createCanvas } = require('@napi-rs/canvas');
const Visuals = require('../src/prototype/visuals.js');
const fs = require('node:fs');

const ART = Object.freeze({
  renderKind: 'prop',
  decorative: true,
  structure: 'wildflowers',
  id: 'phase4-measurement-wildflowers',
  x: 845,
  y: 1060,
});
const ART_REVISION = 'current-procedural-visuals';
const TILE = 96;
const ANCHOR = { x: 48, y: 60 };
const N = 90;
const TEST_BUDGET = 2 * 1024 * 1024; // Research-only logical bound, NOT a new runtime budget.
const measured = [];

function native(ctx, point) {
  Visuals.draw(ctx, ART, point, 0, false);
}
function bake(scale) {
  const width = Math.ceil(TILE * scale);
  const tile = createCanvas(width, width);
  const ctx = tile.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  native(ctx, ANCHOR);
  return tile;
}
function bitmap(ctx, tile, point, scale) {
  ctx.drawImage(
    tile, point.x - ANCHOR.x, point.y - ANCHOR.y,
    tile.width / scale, tile.height / scale,
  );
}
function surface(scale) {
  const width = Math.ceil(230 * scale), height = Math.ceil(155 * scale);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  return { canvas, ctx };
}
function pixels(canvas) {
  return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
}
function diff(a, b) {
  assert.equal(a.length, b.length);
  let mismatched = 0, maximumChannelError = 0, totalAbsoluteError = 0;
  for (let i = 0; i < a.length; i += 4) {
    let mismatch = false;
    for (let channel = 0; channel < 4; channel++) {
      const delta = Math.abs(a[i + channel] - b[i + channel]);
      maximumChannelError = Math.max(maximumChannelError, delta);
      totalAbsoluteError += delta;
      if (delta) mismatch = true;
    }
    if (mismatch) mismatched++;
  }
  return { mismatchedPixels: mismatched, maximumChannelError, totalAbsoluteError };
}
function key({ dpr, zoom, phaseX, phaseY, region = 0, structure = 'wildflowers',
  revision = ART_REVISION, palette = 'procedural' }) {
  return JSON.stringify([
    structure, revision, palette, region, dpr, zoom, phaseX, phaseY,
  ]);
}
// A bitmap at one offset, art revision, display density, or quality state
// cannot be silently reused for another. This is a proposed identity CONTRACT,
// not a production cache implementation or proof of hit-rate feasibility.
const identity = { dpr: 1.5, zoom: 1, phaseX: .25, phaseY: .375 };
for (const changed of [
  { ...identity, dpr: 2 },
  { ...identity, zoom: .85 },
  { ...identity, phaseX: .5 },
  { ...identity, phaseY: .125 },
  { ...identity, region: 1 },
  { ...identity, structure: 'sapling' },
  { ...identity, revision: 'material-update' },
  { ...identity, palette: 'changed-palette' },
]) assert.notEqual(key(identity), key(changed), 'proposed raster identity must invalidate');
assert.equal(key(identity), key({ ...identity }), 'same proposal inputs should identify same art');

const before = JSON.stringify(ART);
const renderer = fs.readFileSync(require.resolve('../src/prototype/renderer.js'), 'utf8');
assert.match(renderer, /PrototypeVisuals\.draw\(target, e, q, game\.regionIndex\(\), rescued\)/,
  'normal procedural body fallback must remain live');
assert.doesNotMatch(renderer, /CanvasProceduralArtCache|PrototypeProceduralArtCache/,
  'Phase 4 HOLD must not introduce a running procedural-art cache');

for (const { dpr, zoom } of [
  { dpr: 1, zoom: 1 }, { dpr: 1.5, zoom: 1 },
  { dpr: 2, zoom: 1 }, { dpr: 2, zoom: .85 },
  { dpr: 1.5, zoom: 1.25 },
]) {
  const scale = dpr * zoom;
  const bakedAt = performance.now();
  const tile = bake(scale);
  const bakeMs = performance.now() - bakedAt;
  const retainedBytes = tile.width * tile.height * 4;
  assert(retainedBytes > 0 && retainedBytes <= TEST_BUDGET);
  for (const point of [
    { x: 103, y: 80 }, { x: 103.25, y: 80.375 },
    { x: 103.5, y: 80.75 },
  ]) {
    const live = surface(scale), cached = surface(scale);
    native(live.ctx, point);
    bitmap(cached.ctx, tile, point, scale);
    const nativeBytes = pixels(live.canvas), cachedBytes = pixels(cached.canvas);
    assert(nativeBytes.some(v => v !== 0), 'wildflower benchmark must render visible art');
    const delta = diff(nativeBytes, cachedBytes);
    const time = (mode) => {
      const { ctx } = surface(scale);
      for (let i = 0; i < 8; i++) {
        if (mode === 'native') native(ctx, point);
        else bitmap(ctx, tile, point, scale);
      }
      const start = performance.now();
      for (let i = 0; i < N; i++) {
        ctx.clearRect(0, 0, 230, 155);
        if (mode === 'native') native(ctx, point);
        else bitmap(ctx, tile, point, scale);
      }
      return +(performance.now() - start).toFixed(3);
    };
    measured.push({
      dpr, zoom, point, bakedBytes: retainedBytes,
      bakeMs: +bakeMs.toFixed(3),
      ...delta,
      native90DrawMs: time('native'),
      warmedBitmap90DrawMs: time('bitmap'),
    });
  }
}
assert.equal(JSON.stringify(ART), before, 'art probe may not mutate world/campaign entity');
assert(measured.length === 15);
assert(measured.every(x => Number.isFinite(x.native90DrawMs) &&
  Number.isFinite(x.warmedBitmap90DrawMs)), 'no invalid timing samples');
console.log('CANVAS_PHASE4_PROCEDURAL_RESEARCH_JSON=' + JSON.stringify({
  environment: 'Node / @napi-rs/canvas CPU microbenchmark; not browser frames, input or FPS',
  candidate: 'decorative wildflowers only; current procedural visual canon',
  totalComparisons: measured.length,
  cacheEnabledInProduction: false,
  testOnlyBudgetBytes: TEST_BUDGET,
  existingGroundBudgetUnchangedBytes: 64 * 1024 * 1024,
  caveat: 'One warmed bitmap with new offscreen pixels, not combined live-process memory. A/B is observational; no performance win asserted.',
  observations: measured,
}));
console.log('PASS Phase 4 wildflowers research / pixel-difference, proposed identity, fallback-source and nonmutation guards');

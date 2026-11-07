'use strict';

// Native-pixel differential oracle for the Canvas/Pixi shared occlusion rim.
// Deliberately independent of game state, rendering preferences and save data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { createCanvas } = require('@napi-rs/canvas');

const renderer = fs.readFileSync(path.join(__dirname, '../src/prototype/renderer.js'), 'utf8');
const start = renderer.indexOf('    function drawOcclusionOutlines(entities) {');
const end = renderer.indexOf('    // Shared Canvas/Pixi presentation geometry.', start);
assert(start >= 0 && end > start, 'the real production mask painter is present');
const painter = renderer.slice(start, end);
assert(painter.includes('const [actorLayer, edgeLayer, coverLayer] = layers'));
assert(painter.includes("edge.globalCompositeOperation = 'source-in'"));
assert(!painter.includes('tintLayer'), 'the redundant tint buffer must stay eliminated');
assert(renderer.includes('surfaces: outlineLayers.size * 3'));

const regularRing = [
  [-1.35, 0], [1.35, 0], [0, -1.35], [0, 1.35],
  [-0.95, -0.95], [0.95, -0.95], [-0.95, 0.95], [0.95, 0.95],
];
const compactRing = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-1, -1], [1, -1], [-1, 1], [1, 1],
];
function makeArt(size, variant, cover = false) {
  const canvas = createCanvas(size, size);
  const brush = canvas.getContext('2d');
  const blend = brush.createLinearGradient(0, 0, size, size);
  blend.addColorStop(0, '#d1538d');
  blend.addColorStop(1, '#58dbac');
  brush.fillStyle = blend;
  if (cover) {
    brush.globalAlpha = variant ? 0.66 : 1;
    brush.fillRect(size * 0.31, size * 0.32, size * 0.49, size * 0.39);
    brush.globalAlpha = 1;
    brush.fillStyle = 'rgba(55,80,125,0.38)';
    brush.beginPath();
    brush.ellipse(size * 0.57, size * 0.47, size * 0.22, size * 0.2, 0.33, 0, Math.PI * 2);
    brush.fill();
  } else {
    brush.globalAlpha = variant ? 0.67 : 1;
    brush.beginPath();
    brush.ellipse(size * 0.51, size * 0.46, size * 0.105, size * 0.18, 0.13, 0, Math.PI * 2);
    brush.fill();
    brush.globalAlpha = 1;
    brush.fillStyle = 'rgba(241,218,181,0.58)';
    brush.fillRect(size * 0.46, size * 0.3, size * 0.08, size * 0.11);
  }
  return canvas;
}
function createMask(method, size, actorArt, coverArt, ring, hostile) {
  const layerCount = method === 'old' ? 4 : 3;
  const layers = Array.from({ length: layerCount }, () => createCanvas(size, size));
  const contexts = layers.map((surface) => surface.getContext('2d'));
  const actor = contexts[0];
  const tint = method === 'old' ? contexts[1] : null;
  const edge = contexts[method === 'old' ? 2 : 1];
  const cover = contexts[method === 'old' ? 3 : 2];
  const target = createCanvas(size, size);
  const dest = target.getContext('2d');
  const shade = hostile ? '#d3a69e' : '#b8cfc2';
  function draw() {
    for (const brush of contexts) {
      brush.globalCompositeOperation = 'source-over';
      brush.globalAlpha = 1;
      brush.clearRect(0, 0, size, size);
    }
    actor.drawImage(actorArt, 0, 0);
    if (tint) {
      tint.drawImage(layers[0], 0, 0);
      tint.globalCompositeOperation = 'source-in';
      tint.fillStyle = shade;
      tint.fillRect(0, 0, size, size);
      tint.globalCompositeOperation = 'source-over';
    }
    for (const [dx, dy] of ring)
      edge.drawImage(tint ? layers[1] : layers[0], dx, dy);
    edge.globalCompositeOperation = 'destination-out';
    edge.drawImage(layers[0], 0, 0);
    edge.globalCompositeOperation = 'source-over';
    cover.drawImage(coverArt, 0, 0);
    edge.globalCompositeOperation = 'destination-in';
    edge.drawImage(layers[method === 'old' ? 3 : 2], 0, 0);
    if (!tint) {
      edge.globalCompositeOperation = 'source-in';
      edge.fillStyle = shade;
      edge.fillRect(0, 0, size, size);
    }
    edge.globalCompositeOperation = 'source-over';
    dest.fillStyle = '#0c1913';
    dest.fillRect(0, 0, size, size);
    dest.globalAlpha = 0.46;
    dest.drawImage(layers[method === 'old' ? 2 : 1], 0, 0);
    dest.globalAlpha = 1;
    return target;
  }
  return draw;
}
function compare(oldPixels, newPixels) {
  assert.equal(oldPixels.length, newPixels.length);
  let max = 0, total = 0, differing = 0;
  for (let i = 0; i < oldPixels.length; i++) {
    const delta = Math.abs(oldPixels[i] - newPixels[i]);
    max = Math.max(max, delta);
    total += delta;
    if (delta) differing++;
  }
  return { max, total, differing };
}
const results = [];
for (const size of [256, 384])
  for (const variant of [0, 1])
    for (const ring of [regularRing, compactRing])
      for (const hostile of [false, true]) {
        const actor = makeArt(size, variant);
        const cover = makeArt(size, variant, true);
        const before = createMask('old', size, actor, cover, ring, hostile);
        const after = createMask('new', size, actor, cover, ring, hostile);
        const original = before().getContext('2d').getImageData(0, 0, size, size).data;
        const candidate = after().getContext('2d').getImageData(0, 0, size, size).data;
        const diff = compare(original, candidate);
        assert(diff.max <= 5,
          'visual parity failed for ' + JSON.stringify({ size, variant,
            ring: ring === regularRing ? 'regular' : 'compact', hostile, diff }));
        results.push({ size, variant, hostile, ring: ring === regularRing ? 'regular' : 'compact', ...diff });
      }

// Diagnostic benchmark only: neither speed assertion nor ChromeOS FPS claim.
// Same preallocated canvases, actor art and foreground mask; alternate A/B order.
const size = 256, actor = makeArt(size, 1), cover = makeArt(size, 1, true);
const strategies = {
  old: createMask('old', size, actor, cover, regularRing, true),
  new: createMask('new', size, actor, cover, regularRing, true),
};
for (let i = 0; i < 8; i++) { strategies.old(); strategies.new(); }
const timings = { old: [], new: [] };
for (let i = 0; i < 32; i++)
  for (const method of (i % 2 ? ['new', 'old'] : ['old', 'new'])) {
    const begin = performance.now();
    strategies[method]();
    timings[method].push(performance.now() - begin);
  }
function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  return (ordered[15] + ordered[16]) / 2;
}
const baselineMs = median(timings.old), candidateMs = median(timings.new);
console.log('PASS three-surface occlusion compositor pixel oracle and focused A/B:', JSON.stringify({
  cases: results.length,
  maximumChannelDelta: Math.max(...results.map((r) => r.max)),
  baselineMedianMs: Number(baselineMs.toFixed(3)),
  candidateMedianMs: Number(candidateMs.toFixed(3)),
  candidateVsBaselinePct: Number((100 * (candidateMs / baselineMs - 1)).toFixed(1)),
  note: 'Native canvas microbenchmark; not player FPS or full overlay draw time',
}));

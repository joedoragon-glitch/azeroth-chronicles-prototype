'use strict';
// Phase 3 observational A/B: actual Canvas floor painter and the
// production GroundCache under a reproducible virtual-camera traversal.
// This benchmark does not install, enable, or certify any runtime optimization.
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { createCanvas } = require('@napi-rs/canvas');
const GroundCache = require('../src/prototype/ground-cache.js');
const Visuals = require('../src/prototype/visuals.js');

const SIZE = 3000, WIDTH = 800, HEIGHT = 500, SCALE = 1.5, MARGIN = 256;
const LIMIT = 64 * 1024 * 1024;
const iso = (x, y) => ({ x: (x - y) * .76, y: (x + y) * .27 });
function at(x, y) {
  const p = iso(x, y);
  return { x: WIDTH / 2 - p.x, y: HEIGHT / 2 - p.y };
}
function bounds(width, height, o) {
  const local = (x, y) => ({
    x: ((x - o.x) / .76 + (y - o.y) / .27) / 2,
    y: ((y - o.y) / .27 - (x - o.x) / .76) / 2,
  });
  const corners = [
    local(-160, -100), local(width + 160, -100),
    local(-160, height + 100), local(width + 160, height + 100),
  ];
  return {
    x1: Math.max(0, Math.ceil(Math.min(...corners.map(p => p.x)) / 80) * 80),
    x2: Math.min(SIZE - 1, Math.floor(Math.max(...corners.map(p => p.x)) / 80) * 80),
    y1: Math.max(0, Math.ceil(Math.min(...corners.map(p => p.y)) / 80) * 80),
    y2: Math.min(SIZE - 1, Math.floor(Math.max(...corners.map(p => p.y)) / 80) * 80),
  };
}
function paint(target, origin, width, height) {
  const b = bounds(width, height, origin);
  for (let x = b.x1; x <= b.x2; x += 80) {
    for (let y = b.y1; y <= b.y2; y += 80) {
      const p = iso(x, y);
      p.x += origin.x;
      p.y += origin.y;
      if (p.x < -160 || p.x > width + 160 ||
          p.y < -100 || p.y > height + 100) continue;
      Visuals.floor(target, p, x, y, 0, false, '', false, null);
    }
  }
}
const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  return +sorted[Math.floor((sorted.length - 1) * p)].toFixed(3);
};
function route(type) {
  const points = [];
  if (type === 'straight')
    for (let i = 0; i < 96; i++) points.push([1400 + i * 14, 1500]);
  if (type === 'reversal')
    for (let i = 0; i < 96; i++)
      points.push([1400 + (i <= 48 ? i : 96 - i) * 25, 1500]);
  if (type === 'zigzag')
    for (let i = 0; i < 96; i++)
      points.push([1400 + i * 16, 1400 + Math.sin(i / 7) * 180]);
  return points;
}
function run(mode, type) {
  const world = createCanvas(WIDTH * SCALE, HEIGHT * SCALE);
  const ctx = world.getContext('2d');
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  const cache = new GroundCache({
    margin: MARGIN,
    budget: LIMIT,
    createCanvas: (width, height) => createCanvas(width, height),
  });
  const scene = {};
  const args = origin => ({
    width: WIDTH, height: HEIGHT, origin, scene, revision: 'procedural', paint,
  });
  const samples = [], visibleMissMs = [], idleMs = [];
  let idleBuilds = 0, visibleBuilds = 0, last = null, maxBytes = 0;
  for (const [x, y] of route(type)) {
    const origin = at(x, y);
    const before = cache.status().builds;
    const start = performance.now();
    assert.equal(cache.draw(ctx, args(origin)), true);
    const elapsed = performance.now() - start;
    samples.push(elapsed);
    if (cache.status().builds !== before) {
      visibleBuilds++;
      visibleMissMs.push(elapsed);
    }
    maxBytes = Math.max(maxBytes, cache.status().bytes);
    // Simulate a background-idle window with the SAME cache. These paints run
    // synchronously and are not evidence that mobile browsers have such idle time.
    if (mode === 'idle-recenter' && last && cache.item) {
      const dx = origin.x - cache.item.origin.x;
      const dy = origin.y - cache.item.origin.y;
      const step = { x: origin.x - last.x, y: origin.y - last.y };
      if (Math.max(Math.abs(dx), Math.abs(dy)) >= MARGIN * .55 &&
          Math.max(Math.abs(step.x), Math.abs(step.y)) > 1) {
        const ahead = { x: origin.x + step.x * 5, y: origin.y + step.y * 5 };
        if (Math.abs(ahead.x - origin.x) < MARGIN * .65 &&
            Math.abs(ahead.y - origin.y) < MARGIN * .65) {
          const prior = cache.status().builds;
          const idleStart = performance.now();
          cache.prepare({ ...args(ahead), transform: ctx.getTransform() });
          idleMs.push(performance.now() - idleStart);
          if (cache.status().builds > prior) idleBuilds++;
          maxBytes = Math.max(maxBytes, cache.status().bytes);
        }
      }
    }
    last = origin;
  }
  const st = cache.status();
  assert(maxBytes <= LIMIT, 'candidate may not increase nominal Canvas backing budget');
  assert.equal(st.builds, visibleBuilds + idleBuilds, 'account for every floor paint');
  return {
    scenario: type, mode, frames: samples.length,
    visibleBuilds, idleBuilds, totalBuilds: st.builds,
    foregroundCacheDrawP95Ms: percentile(samples, .95),
    foregroundCacheDrawP99Ms: percentile(samples, .99),
    foregroundCacheDrawMaxMs: +Math.max(...samples).toFixed(3),
    foregroundRebuildCallP95Ms: percentile(visibleMissMs, .95),
    totalRebuildMs: +st.rebuildMs.toFixed(3),
    simulatedIdlePrepareCallMs: +idleMs.reduce((a,b)=>a+b,0).toFixed(3),
    peakLogicalBytes: maxBytes,
  };
}
const results = [];
for (const scenario of ['straight', 'reversal', 'zigzag']) {
  // Warm module/JIT code before taking one paired observational sample.
  run('baseline', scenario);
  results.push(run('baseline', scenario));
  results.push(run('idle-recenter', scenario));
}
for (const s of ['straight', 'reversal', 'zigzag']) {
  const a = results.find(v => v.scenario === s && v.mode === 'baseline');
  const b = results.find(v => v.scenario === s && v.mode === 'idle-recenter');
  assert.equal(a.frames, b.frames);
  assert(a.visibleBuilds >= 1 && b.visibleBuilds >= 1);
  assert.equal(b.peakLogicalBytes <= LIMIT, true);
}
// No speedup assertion: these are cache method timings, not whole-frame times;
// CI runners differ from the owner's browser/device,
// and moving synchronous work off draw() can increase total painting cost.
console.log('CANVAS_PHASE3_BENCHMARK_JSON=' + JSON.stringify({
  environment: {
    kind: 'GitHub CI Node / @napi-rs/canvas (not real target-device browser)',
    painter: 'PrototypeVisuals.floor, Vale outdoor static floor; region=0 and no material overlay',
    viewportCss: [WIDTH, HEIGHT], deviceScaleFactor: SCALE,
    groundBudgetBytes: LIMIT, cacheCount: 1,
  },
  results,
}));
console.log('PASS Canvas lookahead baseline A/B, reverse-route and memory-contract checks');

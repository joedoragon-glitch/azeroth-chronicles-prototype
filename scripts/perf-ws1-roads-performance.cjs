'use strict';
// Paired CPU preparation and software Canvas raster work; never gameplay FPS.
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  { performance } = require('node:perf_hooks'),
  { createCanvas } = require('@napi-rs/canvas'),
  Campaign = require('../src/prototype/engine.js'),
  Visuals = require('../src/prototype/visuals.js'),
  baseline = require('../tests/helpers/perf-ws1-roads-baseline.cjs');
const report = {
  baselineCommit: 'c6ce1af236bddd7ca881903499c4cf5de175f9e2',
  baselineRoadsSha256: crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(__dirname, '../tests/helpers/perf-ws1-roads-baseline.cjs')))
    .digest('hex'),
  measuredAt: new Date().toISOString(),
  sharedWorkerLimit:
    'Timing slot was coordinated with sibling workstreams. Unrelated host/background load is not controlled; earlier baseline suites also experienced background test load. No target-device or total-frame guarantee.',
  node: process.version,
  canvas: require('@napi-rs/canvas/package.json').version,
  candidateVisualsSha256: crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(__dirname, '../src/prototype/visuals.js')))
    .digest('hex'),
  note: 'Single-process alternating paired scenes; software raster including forced readback. Preparation mode uses no-op Canvas methods. Not target-device FPS or total-frame measurements.',
  scenarios: [],
};
const noOp = Object.fromEntries(
  ['save', 'restore', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'fill', 'stroke'].map((key) => [
    key,
    () => {},
  ]),
);
function summary(a) {
  const s = a.slice().sort((a, b) => a - b);
  return {
    n: a.length,
    median: s[Math.floor(s.length / 2)],
    p95: s[Math.floor((s.length - 1) * 0.95)],
    mean: a.reduce((n, x) => n + x, 0) / a.length,
  };
}
for (const [region, data] of Campaign.data.regions.entries()) {
  const c = new Campaign();
  c.enter(data.id);
  const roads = c.zone().roads;
  for (const mode of ['prepare', 'raster']) {
    const canvas = createCanvas(1280, 800),
      ctx = mode === 'prepare' ? noOp : canvas.getContext('2d'),
      iterations = mode === 'prepare' ? 20 : 4;
    const screen = (p) => ({ x: 640 + (p.x - p.y) * 0.38, y: -250 + (p.x + p.y) * 0.135 });
    const draw = (fn) => {
      if (mode === 'raster') ctx.clearRect(0, 0, 1280, 800);
      fn(ctx, roads, screen, region);
      if (mode === 'raster') ctx.getImageData(0, 0, 1280, 800);
    };
    for (let i = 0; i < 8; i++) {
      draw(baseline);
      draw(Visuals.roads);
    }
    const samples = { baseline: [], candidate: [] };
    for (let round = 0; round < 18; round++)
      for (const [key, fn] of round % 2
        ? [
            ['candidate', Visuals.roads],
            ['baseline', baseline],
          ]
        : [
            ['baseline', baseline],
            ['candidate', Visuals.roads],
          ]) {
        const t = performance.now();
        for (let i = 0; i < iterations; i++) draw(fn);
        samples[key].push((performance.now() - t) / iterations);
      }
    const before = summary(samples.baseline),
      after = summary(samples.candidate);
    report.scenarios.push({
      region: data.id,
      mode,
      roadPaths: roads.length,
      roadPoints: roads.reduce((n, p) => n + p.length, 0),
      baselineMs: before,
      candidateMs: after,
      medianReductionPercent: ((before.median - after.median) / before.median) * 100,
      rawMs: samples,
    });
  }
}
const out =
  process.env.PERFORMANCE_OUT ||
  path.join(__dirname, '../docs/evidence/perf-ws1-roads-performance.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify(
    report.scenarios.map((s) => ({
      region: s.region,
      mode: s.mode,
      beforeMs: s.baselineMs.median,
      afterMs: s.candidateMs.median,
      reductionPercent: s.medianReductionPercent,
    })),
    null,
    2,
  ),
);
console.log('Evidence: ' + out);

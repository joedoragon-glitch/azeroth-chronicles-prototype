'use strict';
const assert = require('node:assert/strict');
const { inspect } = require('../scripts/pixi-755-compare.cjs');

// This positive control deliberately slows EVERY draw in otherwise identical
// 1/8/24/48-actor evidence. A guard that always returns GO cannot pass.
const fixture = (ms, head, overrides = {}) => ({
  head, engine: 'Chromium / SwiftShader fixture',
  viewport: { width: 912, height: 600 }, deviceScaleFactor: 1,
  zoom: 1.5, optimized: true, benchmarkVersion: 'pixi-755-steady-v1',
  perfSamples: 96, perfWarmup: 16, errors: [],
  benchmarks: [1, 8, 24, 48].map(count => ({
    count, sampleCount: 96, warmupDraws: 16,
    p50: ms + count * .02, p95: (ms + count * .02) * 1.1,
    bakesDelta: 0, active: true,
  })), ...overrides
});
const base = [fixture(4, 'base'), fixture(4.12, 'base')];
const stable = [fixture(4.09, 'head'), fixture(4.11, 'head')];
const slowed = [fixture(7, 'head'), fixture(7.2, 'head')];
assert.equal(inspect(base, stable).decision, 'GO',
  'small software-runner variation must not fail the acceptance guard');
const bad = inspect(base, slowed);
assert.equal(bad.decision, 'HOLD', 'deliberately slowed CPU fixture must be rejected');
assert(bad.details.every(d => d.p50.decision === 'HOLD' && d.p95.decision === 'HOLD'),
  'the slowed positive control must be detected for all crowd sizes');
assert.throws(() => inspect(base, [fixture(7, 'head', { deviceScaleFactor: 3 }), slowed[1]]),
  /mismatch/, 'DPR mismatch cannot be compared');
assert.throws(() => inspect(base, [fixture(7, 'head', { viewport: { width: 390, height: 844 } }), slowed[1]]),
  /mismatch/, 'portrait and landscape measurements cannot be compared');
assert.throws(() => inspect(base, [fixture(7, 'head', { engine: 'Other Chromium' }), slowed[1]]),
  /mismatch/, 'different browser engines must not be treated as one');
const rebaked = fixture(7, 'head');
rebaked.benchmarks[2].bakesDelta = 1;
assert.throws(() => inspect(base, [rebaked, slowed[1]]), /Invalid steady/,
  'a rerasterizing crowd must not be accepted as steady');
const tooFew = fixture(7, 'head');
tooFew.benchmarks[2].sampleCount = 10;
assert.throws(() => inspect(base, [tooFew, slowed[1]]), /Invalid steady/,
  'small samples must not masquerade as stable percentile evidence');
assert.throws(() => inspect(base, [slowed]), /at least two/,
  'one candidate trial must not count as reproducible performance evidence');
const noisy = inspect([fixture(4,'base'), fixture(8,'base')], stable);
assert.equal(noisy.decision,'HOLD','excess baseline variance must produce HOLD, not false GO');
assert(noisy.problems.some(p => p.includes('dispersion')));
console.log('PASS #755 relative comparator: stable controls, forced slowdown, sample quality, matching environment and noisy-baseline HOLD');

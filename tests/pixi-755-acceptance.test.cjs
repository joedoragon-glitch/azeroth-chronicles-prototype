'use strict';
const assert = require('node:assert/strict');
const { inspect, BENCHMARK_VERSION } = require('../scripts/pixi-755-compare.cjs');

const runner = {
  platform: 'linux', arch: 'x64', node: 'v22', imageOS: 'ubuntu24',
  imageVersion: 'fixture', chromiumMode: 'ANGLE SwiftShader (software WebGL)',
};
const fixture = (ms, head, overrides = {}) => ({
  head, engine: 'Chromium synthetic',
  viewport: { width: 912, height: 600 }, deviceScaleFactor: 1, backingRatio: 1,
  zoom: 1.5, optimized: true, benchmarkVersion: BENCHMARK_VERSION,
  perfSamples: 96, perfWarmup: 16, injectedDelayMs: 0, runner, errors: [],
  benchmarks: [1, 8, 24, 48].map(count => ({
    count, sampleCount: 96, warmupDraws: 16, firstFixtureDrawMs: 10,
    firstFixtureBakes: count, textureSourcesBefore: count * 2,
    textureSourcesAfter: count * 2,
    p50: ms + count * .02, p95: (ms + count * .02) * 1.1,
    bakesDelta: 0, active: true, outline: { surfaces: 4, bytes: 1048576 }, masks: 1,
  })),
  ...overrides,
});
const base = [fixture(4, 'base'), fixture(4.12, 'base')];
const stable = [fixture(4.09, 'head'), fixture(4.11, 'head')];
const slowed = [fixture(7, 'head'), fixture(7.2, 'head')];

// A deliberate, repeatable material slowdown is a failing positive control.
assert.equal(inspect(base, stable).decision, 'GO', 'small runner noise must not fail');
const bad = inspect(base, slowed);
assert.equal(bad.decision, 'HOLD', 'a repeated slow fixture must be rejected');
assert(bad.details.every(d => d.p50.decision === 'HOLD' && d.p95.decision === 'HOLD'),
  'positive control must detect all actor densities');

// The previous PR failed on a single non-reproduced p95 spike in otherwise
// identical code. One outlier is reported, but must not masquerade as a
// replicated regression.
const transient = inspect(base, [fixture(4.08, 'head'), fixture(7.5, 'head')]);
assert.equal(transient.decision, 'GO');
assert(transient.warnings.some(w => w.includes('isolated slow candidate run')));
assert(transient.details.some(d => d.p95.decision === 'WATCH'));

const testInvalid = (sample, regex) =>
  assert.throws(() => inspect(base, [sample, slowed[1]]), regex);
testInvalid(fixture(7, 'head', { deviceScaleFactor: 3 }), /mismatch/);
testInvalid(fixture(7, 'head', { backingRatio: 1.5 }), /mismatch/);
testInvalid(fixture(7, 'head', { viewport: { width: 390, height: 844 } }), /mismatch/);
testInvalid(fixture(7, 'head', { engine: 'Other Chromium' }), /mismatch/);
testInvalid(fixture(7, 'head', { runner: { ...runner, imageVersion: 'other' } }), /mismatch/);
testInvalid(fixture(7, 'head', { injectedDelayMs: 3 }), /Test-injected delay/);
testInvalid(fixture(7, 'head', { benchmarkVersion: 'pixi-755-steady-v1' }), /metadata/);

const invalidRow = (index, change) => {
  const sample = fixture(7, 'head');
  change(sample.benchmarks[index]);
  return sample;
};
testInvalid(invalidRow(2, row => { row.bakesDelta = 1; }), /Invalid steady/);
testInvalid(invalidRow(2, row => { row.sampleCount = 10; }), /Invalid steady/);
testInvalid(invalidRow(2, row => { row.textureSourcesAfter += 1; }), /Invalid steady/);
testInvalid(invalidRow(1, row => { row.outline = 4; }), /Invalid steady/);
testInvalid(invalidRow(1, row => { row.outline.bytes = -1; }), /Invalid steady/);
testInvalid(invalidRow(2, row => { row.active = false; }), /Invalid steady/);
testInvalid(invalidRow(2, row => { row.count = 8; }), /duplicated actor/);
assert.throws(() => inspect(base, [slowed[0]]), /at least two/);
assert.throws(() => inspect(base, [fixture(7, 'base'), slowed[1]]), /Source SHA mismatch/);
assert.throws(() => inspect(base, [fixture(7, 'base'), fixture(7.2, 'base')]), /Source SHA mismatch/);

// Only the one-actor p95 tail is too noisy to use as an unconditional
// gate on SwiftShader. Keep 1-actor p50 and all crowd metrics checked.
const noisyTailA = fixture(4, 'base');
const noisyTailB = fixture(4.05, 'base');
const ordinaryTailA = fixture(4.09, 'head');
const ordinaryTailB = fixture(4.11, 'head');
for (const run of [noisyTailA, noisyTailB, ordinaryTailA, ordinaryTailB])
  run.benchmarks[0].p50 = 1;
noisyTailA.benchmarks[0].p95 = 1.3;
noisyTailB.benchmarks[0].p95 = 4.3;
ordinaryTailA.benchmarks[0].p95 = 1.8;
ordinaryTailB.benchmarks[0].p95 = 2.3;
const noisyTail = inspect([noisyTailA, noisyTailB], [ordinaryTailA, ordinaryTailB]);
assert.equal(noisyTail.decision, 'GO');
assert.equal(noisyTail.details[0].p95.decision, 'WATCH');
assert(noisyTail.warnings.some(w => w.includes('unstable baseline tail')));
// A genuinely huge repeated candidate slowdown still HOLDs even if the
// one-actor baseline tail is noisy; the diagnostic carve-out is not a waiver.
const verySlowTailA = fixture(4.09, 'head');
const verySlowTailB = fixture(4.11, 'head');
for (const run of [verySlowTailA, verySlowTailB]) {
  run.benchmarks[0].p50 = 1;
  run.benchmarks[0].p95 = 25;
}
assert.equal(inspect([noisyTailA, noisyTailB], [verySlowTailA, verySlowTailB]).decision, 'HOLD');

const noisy = inspect([fixture(4, 'base'), fixture(8, 'base')], stable);
assert.equal(noisy.decision, 'HOLD', 'unreliable baseline must remain blocking');
assert(noisy.problems.some(p => p.includes('dispersion')));
console.log('PASS #755: stable/repeated slowdown, single-run WATCH, source/environment integrity, cache stability and invalid-sample guards');

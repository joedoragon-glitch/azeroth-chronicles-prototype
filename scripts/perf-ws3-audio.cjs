'use strict';
const { performance } = require('node:perf_hooks');
const { createAudio, campaign, baseline } = require('../tests/helpers/perf-ws3-audio.cjs');
let checksum = 0;
function measure(work, count) {
  const start = performance.now();
  for (let i = 0; i < count; i++) checksum += work(i);
  return ((performance.now() - start) * 1000) / count;
}
function compare(name, make, iterations = 20000) {
  const before = make(true),
    after = make(false),
    beforeSamples = [],
    afterSamples = [];
  measure(before, 5000);
  measure(after, 5000);
  for (let round = 0; round < 11; round++) {
    if (round % 2) {
      afterSamples.push(measure(after, iterations));
      beforeSamples.push(measure(before, iterations));
    } else {
      beforeSamples.push(measure(before, iterations));
      afterSamples.push(measure(after, iterations));
    }
  }
  const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const b = median(beforeSamples),
    a = median(afterSamples);
  return {
    name,
    iterations,
    rounds: 11,
    baselineMicroseconds: b,
    candidateMicroseconds: a,
    improvementPercent: (100 * (b - a)) / b,
    beforeSamples,
    afterSamples,
  };
}
const results = [];
for (const size of [0, 64, 1024])
  results.push(
    compare('describe-' + size + '-enemies', (baseline) => {
      const a = createAudio(baseline),
        g = campaign(size);
      return () => a.describe(g).engaged;
    }),
  );
results.push(
  compare('unbound-effect-fallback', (baseline) => {
    const a = createAudio(baseline);
    a.context = a.describe(campaign(64));
    return () => (a.playSoundEvent('interface.select') ? 1 : 0);
  }),
);
for (const mode of [
  'steady-production-observation',
  'full-audio-update-64-enemies',
  'full-audio-update-1024-enemies',
])
  results.push(
    compare(mode, (baseline) => {
      const a = createAudio(baseline),
        g = campaign(mode.endsWith('1024-enemies') ? 1024 : 64),
        scene = a.describe(g);
      a.production = true;
      a.recordedCueRules = [];
      a.nextSceneDetail = Infinity;
      const spec = a.productionCue(scene),
        rule = a.environmentCue(scene);
      a.recordedScore = { id: spec.id, voices: [{}, {}] };
      a.productionKey = JSON.stringify([spec.id, spec.stems.map((s) => s.id), spec.bpm, null]);
      a.environmentKey = JSON.stringify([rule.asset, rule.gain, rule.fade]);
      a.environmentVoice = {
        environmentKey: a.environmentKey,
        targetGain: a.environmentGain(rule, scene),
      };
      a.voices.add(a.environmentVoice);
      a.setStemGain = () => {};
      a.cue = a.choose(g);
      a.key = JSON.stringify(a.cue);
      return () => {
        if (mode === 'steady-production-observation') a.updateProduction(scene);
        else a.update(g);
        return a.voices.size;
      };
    }),
  );
console.log(
  JSON.stringify(
    {
      baseline,
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
      kind: 'isolated repeated audio-observation CPU microbenchmark; no device FPS claim',
      checksum,
      results,
    },
    null,
    2,
  ),
);

'use strict';
// Request-routing CPU only: no disk cache, network, audio decode or game simulation.
const { performance } = require('node:perf_hooks');
const { worker, inventory } = require('../tests/helpers/perf-ws4-worker.cjs');
const scope = 'https://example.test/game/';
const rounds = 9,
  iterations = 50000;
const scenarios = {
  registeredStatic: inventory.core
    .filter((file) => !file.endsWith('.html'))
    .map((file) => ({ url: scope + file + '?v=benchmark#fragment', method: 'GET', mode: 'cors' })),
  publicNavigation: [
    '',
    'phone.html',
    'prototype.html',
    'rts.html',
    'legacy.html',
    'tools/audio/index.html',
    'missing/path',
  ].map((file) => ({ url: scope + file + '?launch=benchmark', method: 'GET', mode: 'navigate' })),
};
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const results = {};
for (const [scenario, requests] of Object.entries(scenarios)) {
  const workers = [worker({ baseline: true, routeOnly: true }), worker({ routeOnly: true })];
  for (const w of workers) for (let i = 0; i < 10000; i++) w.route(requests[i % requests.length]);
  for (const w of workers) w.state.urls = 0;
  const samples = [[], []];
  for (let round = 0; round < rounds; round++) {
    for (const index of round % 2 ? [1, 0] : [0, 1]) {
      const w = workers[index],
        start = performance.now();
      for (let i = 0; i < iterations; i++) w.route(requests[i % requests.length]);
      samples[index].push(((performance.now() - start) * 1000) / iterations);
    }
  }
  const baselineUs = median(samples[0]),
    candidateUs = median(samples[1]);
  results[scenario] = {
    requests: iterations * rounds,
    baselineMedianUsPerRequest: baselineUs,
    candidateMedianUsPerRequest: candidateUs,
    reductionPercent: (1 - candidateUs / baselineUs) * 100,
    baselineURLConstructions: workers[0].state.urls,
    candidateURLConstructions: workers[1].state.urls,
    samplesUsPerRequest: { baseline: samples[0], candidate: samples[1] },
  };
}
console.log(
  JSON.stringify(
    {
      baselineCommit: 'c6ce1af236bddd7ca881903499c4cf5de175f9e2',
      runtime: process.version,
      platform: process.platform + '-' + process.arch,
      scope:
        'service-worker synchronous request routing only; VM/Node, excludes disk cache, network and total page loading; not a physical-device FPS result',
      environment:
        process.env.PERF_WS4_RUN_NOTE || 'Environment not recorded; do not assume an idle host.',
      rounds,
      iterations,
      results,
    },
    null,
    2,
  ),
);

'use strict';
// Paired CPU measurements of the unchanged occlusion output, not FPS claims.
const fs = require('node:fs'),
  path = require('node:path'),
  { performance } = require('node:perf_hooks'),
  assert = require('node:assert/strict'),
  Baseline = require('../tests/helpers/perf-ws2-baseline.cjs'),
  Candidate = require('../src/prototype/renderer'),
  { scenes, edgeScenes } = require('../tests/helpers/perf-ws2-scenarios.cjs');
const iterations = Number(process.env.PERF_WS2_ITERATIONS || 500),
  rounds = Number(process.env.PERF_WS2_ROUNDS || 16);
function summarize(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  return {
    n: values.length,
    medianMs: sorted[Math.floor(values.length / 2)],
    p95Ms: sorted[Math.floor((values.length - 1) * 0.95)],
    meanMs: values.reduce((a, b) => a + b, 0) / values.length,
  };
}
function measure(fn, scene) {
  const start = performance.now();
  let count = 0;
  for (let i = 0; i < iterations; i++)
    count += fn(scene.entities, scene.project, scene.height).length;
  return { ms: (performance.now() - start) / iterations, count };
}
function workCounts(fn, scene) {
  let projectCalls = 0,
    heightCalls = 0;
  const pairs = fn(
    scene.entities,
    (e) => {
      projectCalls++;
      return scene.project(e);
    },
    (e) => {
      heightCalls++;
      return scene.height(e);
    },
  );
  return { pairs: pairs.length, projectCalls, heightCalls };
}
const report = {
  baselineCommit: 'c6ce1af236bddd7ca881903499c4cf5de175f9e2',
  measuredAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform + '/' + process.arch,
  iterations,
  rounds,
  scope:
    'Occlusion broad phase only; no browser frame-rate or physical-device claim. Authored campaigns use native visible entity lists and sprite/procedural label heights at 150% camera. Stress fixtures are synthetic.',
  rows: [],
};
for (const scene of [...scenes(), ...edgeScenes()].filter(
  (scene) =>
    !process.env.PERF_WS2_PROFILE_FILTER ||
    new RegExp(process.env.PERF_WS2_PROFILE_FILTER).test(scene.name),
)) {
  const previous = Baseline.occlusionPairs(scene.entities, scene.project, scene.height),
    current = Candidate.occlusionPairs(scene.entities, scene.project, scene.height);
  assert.deepEqual(current, previous, scene.name);
  for (let i = 0; i < 300; i++) {
    Baseline.occlusionPairs(scene.entities, scene.project, scene.height);
    Candidate.occlusionPairs(scene.entities, scene.project, scene.height);
  }
  const old = [],
    updated = [];
  for (let round = 0; round < rounds; round++) {
    let a, b;
    if (round % 2) {
      b = measure(Candidate.occlusionPairs, scene);
      a = measure(Baseline.occlusionPairs, scene);
    } else {
      a = measure(Baseline.occlusionPairs, scene);
      b = measure(Candidate.occlusionPairs, scene);
    }
    assert.equal(a.count, b.count);
    old.push(a.ms);
    updated.push(b.ms);
  }
  const baseline = summarize(old),
    candidate = summarize(updated);
  report.rows.push({
    name: scene.name,
    entities: scene.entities.length,
    baseline,
    candidate,
    medianReductionPercent: 100 * (1 - candidate.medianMs / baseline.medianMs),
    baselineWork: workCounts(Baseline.occlusionPairs, scene),
    candidateWork: workCounts(Candidate.occlusionPairs, scene),
  });
}
const target = path.resolve(process.argv[2] || 'test-results/perf-ws2-occlusion.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify(
    {
      report: target,
      rows: report.rows.map((r) => ({
        name: r.name,
        entities: r.entities,
        beforeMs: r.baseline.medianMs,
        afterMs: r.candidate.medianMs,
        reductionPercent: r.medianReductionPercent,
        projectCalls: [r.baselineWork.projectCalls, r.candidateWork.projectCalls],
        heightCalls: [r.baselineWork.heightCalls, r.candidateWork.heightCalls],
      })),
    },
    null,
    2,
  ),
);

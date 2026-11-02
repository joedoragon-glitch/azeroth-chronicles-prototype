'use strict';
// #755: paired, same-runner regression guard for synchronous composited draw calls.
// This is NOT a measure of GPU completion, monitor-presented FPS or device performance.
const fs = require('node:fs');

const ACTOR_COUNTS = [1, 8, 24, 48];
const BENCHMARK_VERSION = 'pixi-755-steady-v2';

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function environment(run) {
  const runner = run.runner || {};
  return JSON.stringify([
    run.engine, run.viewport, run.deviceScaleFactor, run.zoom,
    run.optimized, run.benchmarkVersion, run.perfSamples, run.perfWarmup,
    runner.platform, runner.arch, runner.node, runner.imageOS,
    runner.imageVersion, runner.chromiumMode,
  ]);
}

function validateRun(run, expectedEnvironment) {
  if (!run || typeof run.head !== 'string' || !run.head.trim())
    throw Error('Missing exact source SHA');
  if (run.benchmarkVersion !== BENCHMARK_VERSION ||
      !Number.isInteger(run.perfSamples) || run.perfSamples < 64 ||
      !Number.isInteger(run.perfWarmup) || run.perfWarmup < 12 ||
      !run.runner || !run.runner.chromiumMode || !run.runner.node ||
      !Number.isFinite(run.deviceScaleFactor))
    throw Error('Missing or incompatible benchmark metadata: ' + run.head);
  if (run.injectedDelayMs !== 0)
    throw Error('Test-injected delay is forbidden in acceptance evidence: ' + run.head);
  if (environment(run) !== expectedEnvironment)
    throw Error('Environment or fixture mismatch: ' + run.head);
  if (!Array.isArray(run.errors) || run.errors.length ||
      !Array.isArray(run.benchmarks) || run.benchmarks.length !== ACTOR_COUNTS.length)
    throw Error('Incomplete/corrupt benchmark: ' + run.head);

  const seen = new Set();
  for (const row of run.benchmarks) {
    if (!ACTOR_COUNTS.includes(row.count) || seen.has(row.count))
      throw Error('Missing or duplicated actor population: ' + run.head);
    seen.add(row.count);
    if (row.sampleCount !== run.perfSamples || row.warmupDraws !== run.perfWarmup ||
        !Number.isFinite(row.p50) || row.p50 <= 0 ||
        !Number.isFinite(row.p95) || row.p95 < row.p50 ||
        !Number.isFinite(row.firstFixtureDrawMs) ||
        !Number.isFinite(row.firstFixtureBakes) || row.firstFixtureBakes < 0 ||
        row.bakesDelta !== 0 || row.active !== true ||
        !Number.isInteger(row.textureSourcesBefore) || row.textureSourcesBefore < 0 ||
        row.textureSourcesAfter !== row.textureSourcesBefore ||
        !row.outline || !Number.isInteger(row.outline.surfaces) ||
        row.outline.surfaces < 0 || !Number.isInteger(row.outline.bytes) ||
        row.outline.bytes < 0 || !Number.isInteger(row.masks) || row.masks < 0)
      throw Error('Invalid steady/cached sample for ' + row.count + ' actors');
  }
}

function inspect(baseline, candidate) {
  if (baseline.length < 2 || candidate.length < 2 ||
      baseline.length !== candidate.length)
    throw Error('Need at least two independent, balanced baseline/candidate runs');

  const all = [...baseline, ...candidate];
  const expectedEnvironment = environment(all[0]);
  for (const run of all) validateRun(run, expectedEnvironment);

  // Two runs of different revisions are necessary. A collection of screenshots
  // from the same checkout must never establish a comparative speed result.
  const sourceSha = baseline[0].head, headSha = candidate[0].head;
  if (sourceSha === headSha || baseline.some(r => r.head !== sourceSha) ||
      candidate.some(r => r.head !== headSha))
    throw Error('Source SHA mismatch: baseline/head runs must each be one distinct revision');

  const details = [], problems = [], warnings = [];
  for (const count of ACTOR_COUNTS) {
    const rows = all.map(run => run.benchmarks.find(row => row.count === count));
    const measures = { count };
    for (const key of ['p50', 'p95']) {
      const base = rows.slice(0, baseline.length).map(row => row[key]);
      const head = rows.slice(baseline.length).map(row => row[key]);
      const baselineMs = median(base), candidateMs = median(head);
      const baselineMadMs = median(base.map(value => Math.abs(value - baselineMs)));
      // Relative material effect or repeated-run baseline noise, whichever is larger.
      // This is a change detector, not an absolute render-rate target.
      const toleranceMs = Math.max(baselineMs * 0.25, 3 * baselineMadMs);
      const boundaryMs = baselineMs + toleranceMs;
      const unreliable = (Math.max(...base) - Math.min(...base)) / baselineMs > 0.60;
      const repeatedRegression = head.every(value => value > boundaryMs);
      const singleRunSpike = head.some(value => value > boundaryMs) && !repeatedRegression;
      // At a one-actor p95 near the timer's noise floor, software-renderer
      // baseline tails can vary severalfold with no source changes. Retain the
      // measurement, but never mistake its unreliable baseline for a demonstrated
      // regression. The single-actor p50 and every crowded metric stay gated.
      const lowLoadTailNoise = unreliable && count === 1 && key === 'p95' && !repeatedRegression;
      const decision = lowLoadTailNoise ? 'WATCH' :
        unreliable ? 'INCONCLUSIVE' :
        repeatedRegression ? 'HOLD' : singleRunSpike ? 'WATCH' : 'GO';

      measures[key] = {
        baselineMs, candidateMs, baselineRunsMs: base, candidateRunsMs: head,
        baselineMadMs, toleranceMs, relativeChangePct: 100 * (candidateMs / baselineMs - 1),
        decision,
      };
      if (lowLoadTailNoise)
        warnings.push('1 actor p95: unstable baseline tail; diagnostic only, no speed certification');
      else if (unreliable)
        problems.push(count + ' actors ' + key + ': baseline dispersion too large to certify');
      else if (repeatedRegression)
        problems.push(count + ' actors ' + key + ': replicated material CPU draw regression');
      else if (singleRunSpike)
        warnings.push(count + ' actors ' + key + ': isolated slow candidate run; no repeated regression');
    }
    details.push(measures);
  }

  return {
    decision: problems.length ? 'HOLD' : 'GO',
    note: 'Relative repeated-run synchronous JS draw-call evidence only; WATCH means one nonreproduced spike, not proven fast or real-device FPS.',
    referenceShas: [sourceSha], candidateShas: [headSha],
    engine: baseline[0].engine, runner: baseline[0].runner,
    viewport: baseline[0].viewport, deviceScaleFactor: baseline[0].deviceScaleFactor,
    zoom: baseline[0].zoom, optimized: baseline[0].optimized,
    perfSamples: baseline[0].perfSamples, perfWarmup: baseline[0].perfWarmup,
    details, problems, warnings,
  };
}

function main(argv) {
  const baseline = [], candidate = [];
  let output = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--baseline') baseline.push(JSON.parse(fs.readFileSync(argv[++i], 'utf8')));
    else if (argv[i] === '--candidate') candidate.push(JSON.parse(fs.readFileSync(argv[++i], 'utf8')));
    else if (argv[i] === '--out') output = argv[++i];
    else throw Error('Unknown argument ' + argv[i]);
  }
  const result = inspect(baseline, candidate);
  if (output) fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
  if (result.decision !== 'GO') process.exitCode = 1;
}

if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(error); process.exitCode = 1; }
}
module.exports = { median, inspect, ACTOR_COUNTS, BENCHMARK_VERSION };

'use strict';
// Bounded current-source audit. Synthetic controller traces and local Node
// timings are not an actual-device FPS measurement.
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  cp = require('node:child_process'),
  assert = require('node:assert/strict'),
  root = path.resolve(__dirname, '../..'),
  baselineRef = process.env.PERF_AUDIT_BASELINE || '706b3f92920ac3b048d7296aa915493223ca49ea',
  Runtime = require('../../src/prototype/runtime'),
  C = require('../../src/prototype/engine'),
  Format = require('../../src/prototype/sprite-format'),
  Persistence = require('../../src/prototype/persistence');
const baseline = { exports: {} };
vm.runInNewContext(
  cp.execFileSync('git', ['show', baselineRef + ':src/prototype/runtime.js'], {
    cwd: root,
    encoding: 'utf8',
  }),
  { module: baseline },
);
const report = {
  baseline: 'dev.111 / aa3843a22741fd14a304a642fba073ad78223b0f',
  limits:
    'Synthetic active-frame traces and local Node timings; no Chromebook or physical-phone FPS claim.',
  controllers: [],
  simulation: [],
};
const BaselineOwner = function () {},
  baselineWorld = vm.runInThisContext(
    '(function(module){' +
      cp.execFileSync('git', ['show', baselineRef + ':src/prototype/world.js'], {
        cwd: root,
        encoding: 'utf8',
      }) +
      ';return module.exports;})',
  )({ exports: {} });
// Use the same realm/Math intrinsics for both timed implementations.
baselineWorld.install(BaselineOwner, {
  D: C.data,
  R: C.rules,
  dungeonIds: C.dungeonIds,
  classes: {},
});
for (const [name, hz, renderMs, preRenderMs] of [
  ['severe', 1, 80, 4],
  ['severe', 3, 80, 4],
  ['reported-style-render-pressure', 7, 77.1, 7.8],
  ['mixed-frame-pressure', 25, 28, 12],
  ['CPU-pressure', 20, 4, 40],
]) {
  const results = {};
  for (const [label, owner] of [
    ['before', baseline.exports],
    ['after', Runtime],
  ]) {
    const r = owner.createResolution();
    r.configure(1.5);
    for (let i = 0; i <= hz * 18; i++) r.observe((i * 1000) / hz, renderMs, 30, preRenderMs);
    results[label] = r.status();
  }
  report.controllers.push({ name, hz, renderMs, preRenderMs, ...results });
}
assert(
  report.controllers.slice(0, 2).every((r) => r.before.ratio === 1.5 && r.after.ratio === 0.75),
);
assert(report.controllers[3].after.ratio < report.controllers[3].before.ratio);
assert.equal(report.controllers[4].after.ratio, 1.5);
const resources = Format.resources(require('../../assets/sprites/manifest.json'));
report.spriteInventory = {
  resources: resources.length,
  allResourceDecodedEstimate: resources.reduce((sum, r) => sum + r.width * r.height * 4, 0),
  budget: Format.LIMITS.decodedBytes,
};
const percentile = (values, p) =>
  [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * p)];
for (const zone of ['frontier', 'crown']) {
  const source = new C('normal', 'mage', () => 0.7);
  source.enter(zone);
  source.s.clock = 500;
  const state = source.snapshot(),
    before = C.restore(state, () => 0.7),
    g = C.restore(state, () => 0.7);
  before.crownMilitaryRoster = BaselineOwner.prototype.crownMilitaryRoster;
  const calls = { blocked: 0, line: 0, route: 0, clearSegment: 0 };
  for (const key of Object.keys(calls)) {
    const original = g[key];
    g[key] = function (...args) {
      calls[key]++;
      return original.apply(this, args);
    };
  }
  for (let i = 0; i < 5; i++) {
    before.tick(1 / 60);
    g.tick(1 / 60);
  }
  for (const key of Object.keys(calls)) calls[key] = 0;
  const times = [],
    oldTimes = [];
  for (let i = 0; i < 60; i++) {
    for (const [owner, values] of i % 2
      ? [
          [g, times],
          [before, oldTimes],
        ]
      : [
          [before, oldTimes],
          [g, times],
        ]) {
      const at = performance.now();
      owner.tick(1 / 60);
      values.push(performance.now() - at);
    }
    assert.deepEqual(g.s, before.s, zone + ' tick ' + i + ' state equivalence');
    assert.deepEqual(g.effects, before.effects, zone + ' tick ' + i + ' effects equivalence');
  }
  for (const owner of [before, g]) {
    const e = owner.zone().enemies.find((e) => e.type === 'mob' && e.home);
    e.home.x += 800;
    e.home.y -= 160;
    owner.crownMilitaryRoster(owner.zone());
    e.neutral = true;
    owner.crownMilitaryRoster(owner.zone());
    owner.zone().enemies = [...owner.zone().enemies].reverse();
    owner.crownMilitaryRoster(owner.zone());
  }
  assert.deepEqual(
    g.s,
    before.s,
    zone + ' changed homes/eligibility/array order remain equivalent',
  );
  report.simulation.push({
    zone,
    condition: 'paired deterministic idle town, night, no hired party',
    ticks: 60,
    before: { medianMs: percentile(oldTimes, 0.5), p95Ms: percentile(oldTimes, 0.95) },
    after: { medianMs: percentile(times, 0.5), p95Ms: percentile(times, 0.95) },
    calls,
    fullStateAndEffectsEqual: true,
    changedHomesEligibilityAndOrderEqual: true,
  });
}
const g = new C('normal', 'mage', () => 0.7);
for (const id of C.data.regions.map((r) => r.id)) {
  g.s.zone = id;
  g.zone();
}
let writes = 0,
  bytes = 0;
const p = Persistence.create({
  storage: {
    setItem(_key, value) {
      writes++;
      bytes += Buffer.byteLength(value);
    },
  },
  Campaign: C,
});
const times = [];
for (let i = 0; i < 12; i++) {
  const at = performance.now();
  assert(p.save(g, { activeMode: 'normal', audio: {} }));
  if (i > 1) times.push(performance.now() - at);
}
report.save = {
  fixture: 'five generated outdoor regions, no player data',
  runs: 12,
  medianMs: percentile(times, 0.5),
  p95Ms: percentile(times, 0.95),
  writesPerSave: writes / 12,
  meanSerializedBytesPerSave: bytes / 12,
  limitation: 'Map-backed storage stub; excludes browser localStorage write latency.',
};
fs.writeFileSync(path.join(__dirname, 'checks.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));

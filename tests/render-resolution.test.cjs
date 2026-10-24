'use strict';
const assert = require('node:assert/strict');
const Runtime = require('../src/prototype/runtime');
const values = new Map();
const storage = { getItem: (k) => values.get(k), setItem: (k, v) => values.set(k, v) };
// All supported drawing targets must retain Auto density, including the
// default Auto FPS controller's pressure fallback and manual 20 FPS.
for (const target of [20, 30, 60]) {
  const density = Runtime.createResolution();
  density.configure(1.5);
  for (let now = 0; now <= 9000; now += 100) density.observe(now, 80, target, 10);
  assert.equal(density.ratio, 0.75, 'Rendering pressure lowers density at ' + target + ' FPS');
  density.configure(1.5);
  assert.equal(density.ratio, 0.75, 'Reapplying the same device ceiling preserves adaptation');
  for (let now = 10000; now <= 100000; now += 50) density.observe(now, 1, target, 10);
  assert.equal(density.ratio, 1.5, 'Sustained headroom restores sharpness at ' + target + ' FPS');
}
for (const target of [0, -1, 10, 120, NaN, Infinity]) {
  const density = Runtime.createResolution();
  density.configure(1.5);
  for (let now = 0; now <= 9000; now += 100)
    assert.equal(density.observe(now, 80, target, 10), false, 'Reject unsupported targets');
  assert.equal(density.ratio, 1.5);
}
const r = Runtime.createResolution(storage);
r.configure(1.501875);
assert.equal(r.ratio, 1.501875);
let changes = 0;
// Replay the reported 7 FPS / ~77 ms rendering bottleneck, not simulation time.
for (let now = 0; now <= 7000; now += 1000 / 7) if (r.observe(now, 77.1, 30)) changes++;
assert.equal(changes, 2);
assert.equal(r.ratio, 0.75);
assert(r.ratio ** 2 / 1.501875 ** 2 < 0.25, 'Slow rendering uses under a quarter of the pixels');
const slowRatio = r.ratio;
r.suspend();
for (let now = 10000; now <= 11000; now += 100) r.observe(now, 1, 30);
assert.equal(r.ratio, slowRatio, 'A pause does not become evidence of fast rendering');
r.suspend();
for (let now = 18000; now <= 22000; now += 50) r.observe(now, 1, 30);
assert(
  r.ratio > slowRatio && r.ratio < 1.501875,
  'Sharpness recovers gradually with sustained headroom',
);
assert(r.select('native'));
assert.equal(r.ratio, 1.501875);
for (let now = 25000; now <= 35000; now += 100) assert(!r.observe(now, 100, 60));
assert.equal(r.ratio, 1.501875, 'Maximum sharpness opts out of adaptation');
assert.equal(Runtime.createResolution(storage).preference, 'native');
assert(!r.select('bad'));
r.select('auto');
r.configure(1);
for (let now = 0; now <= 4000; now += 100) r.observe(now, 8, 30);
assert.equal(r.ratio, 1, 'Fast rendering keeps full quality even when simulation might be slow');
for (const bad of [NaN, Infinity, -1]) r.configure(bad);
assert.equal(r.ratio, 1);
for (let now = 5000; now <= 9000; now += 100) r.observe(now, 80, 30);
assert.equal(r.ratio, 0.75);
r.configure(1.5);
assert.equal(r.ratio, 1.5, 'A changed device ceiling reconfigures the backing store');
// Fixed density never adapts, even under severe rendering pressure.
const manual = Runtime.createResolution(storage);
manual.configure(1.501875);
for (const [setting, expected] of [
  ['100', 1],
  ['80', 0.8],
  ['60', 0.6],
  ['50', 0.5],
]) {
  assert(manual.select(setting));
  assert.equal(manual.ratio, expected);
  assert.equal(manual.preference, setting);
  for (const target of [20, 30, 60])
    for (let i = 0; i <= 100; i++) assert.equal(manual.observe(i * 200, 90, target, 8), false);
  assert.equal(manual.ratio, expected, 'Manual density never adapts: ' + setting);
  const reopened = Runtime.createResolution(storage);
  assert.equal(reopened.preference, setting, 'Persist ' + setting);
  reopened.configure(1.75);
  assert.equal(reopened.ratio, expected, 'Restore after resize: ' + setting);
  const onLowDpi = Runtime.createResolution(storage);
  onLowDpi.configure(1);
  assert.equal(onLowDpi.ratio, expected, 'Restore on a 1x-DPI phone');
  manual.configure(1);
  assert.equal(manual.ratio, expected, 'Optimization does not override manual ratio');
  manual.configure(1.501875);
}
assert(!manual.select('bad'));
assert(manual.select('auto'));
assert.equal(manual.ratio, 1.501875);
assert(manual.select('native'));
assert.equal(manual.ratio, 1.501875);
const isolated = Runtime.createResolution({
  getItem() {
    throw Error('blocked');
  },
  setItem() {
    throw Error('blocked');
  },
});
assert(isolated.select('native'));
let clock = 8;
const sample = Runtime.create(() => clock).record(0, 0, () => {
  clock = 85;
});
assert.equal(sample.preRenderMs, 8);
assert.equal(sample.renderMs, 77);
// Sparse active observations must still permit recovery. Two slow active
// frames remain evidence even when they are more than four seconds apart.
for (const hz of [0.2, 0.5, 1, 2, 3, 7, 30, 60]) {
  const severe = Runtime.createResolution();
  severe.configure(1.5);
  for (let i = 0; i <= Math.ceil(hz * 30); i++) severe.observe((i * 1000) / hz, 80, 30);
  assert.equal(severe.ratio, 0.75, 'sustained ' + hz + ' FPS still lowers density');
}
const mixed = Runtime.createResolution();
mixed.configure(1.5);
for (let i = 0; i <= 200; i++) mixed.observe(i * 40, 28, 30, 12);
assert(mixed.ratio < 1.5, 'mixed frame work reserves time outside the renderer');
const cpu = Runtime.createResolution();
cpu.configure(1.5);
for (let i = 0; i <= 200; i++) cpu.observe(i * 50, 4, 30, 40);
assert.equal(cpu.ratio, 1.5, 'CPU-only pressure does not needlessly blur a cheap renderer');
for (const hz of [0.2, 1, 3, 30, 60]) {
  const spike = Runtime.createResolution();
  spike.configure(1.5);
  for (let i = 0; i <= Math.ceil(hz * 15); i++)
    spike.observe((i * 1000) / hz, i === 1 ? 600 : 4, 30, i === 1 ? 300 : 2);
  assert.equal(spike.ratio, 1.5, 'one loading spike is not sustained pressure at ' + hz + ' Hz');
}
let slowClock = 0;
const slowReport = Runtime.create(() => slowClock);
for (let i = 0; i < 5; i++) {
  slowClock = i * 1200;
  slowReport.record(slowClock, slowClock, () => (slowClock += 1000));
}
assert.equal(slowReport.report().sampledWindowMs, 4800, 'active stalls remain in FPS evidence');
assert.equal(slowReport.report().fps, 0.8);
slowReport.suspend();
slowClock = 100000;
slowReport.record(slowClock, slowClock, () => {});
assert.equal(slowReport.report().sampledWindowMs, 4800, 'suspended time is excluded');

// Exercise the production frame -> observe -> resize -> backing-store path.
// Synthetic draw costs test control behavior, not physical-device performance.
const { shell } = require('./helpers/production-shell.cjs');
for (const [preference, skipping] of [
  ['20', false],
  ['20', true],
  ['auto', false],
  ['auto', true],
]) {
  let clock = 0,
    renderCost = 80,
    tickCount = 0;
  const app = shell('en', 'paladin', { now: () => clock });
  const api = app.scope.Prototype;
  api.fps.select(preference);
  api.frameSkip.select(skipping);
  app.scope.devicePixelRatio = 1.5;
  for (const resize of app.events.resize) resize();
  api.renderer.draw = () => {
    clock += renderCost;
  };
  const tick = api.game.tick;
  api.game.tick = function (dt, input) {
    if (dt > 0) tickCount++;
    return tick.call(this, dt, input);
  };
  for (let now = 0; now <= 15000; now += 100) {
    clock = now;
    app.frame(now);
  }
  assert.equal(api.fps.target, 20, preference + ' reaches or retains the 20 FPS target');
  assert.equal(api.renderResolution.ratio, 0.75, 'Live resize retains the adaptive density');
  assert.equal(
    app.elements.get('world').width,
    Math.round(app.scope.innerWidth * 0.75),
    'The actual backing store uses the reduced density',
  );
  assert.equal(tickCount, 150, 'Resolution changes do not skip simulation ticks');
  assert(Math.abs(api.game.s.time - 15) < 1e-8, 'Simulation cadence is preserved');
  api.fps.select('20');
  renderCost = 1;
  for (let now = 15100; now <= 110000; now += 100) {
    clock = now;
    app.frame(now);
  }
  assert.equal(api.fps.target, 20, 'Manual 20 stays manual through recovery');
  assert.equal(api.renderResolution.ratio, 1.5, 'Live sharpness recovers at 20 FPS');
  assert.equal(app.elements.get('world').width, Math.round(app.scope.innerWidth * 1.5));
}
console.log(
  'PASS adaptive density: 20/30/60 FPS, live resize/recovery, Auto FPS and skip coupling, cadence, fixed preferences and existing guards',
);

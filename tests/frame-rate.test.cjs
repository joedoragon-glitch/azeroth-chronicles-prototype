'use strict';
const assert = require('node:assert/strict');
const { createFrameRate, fpsPreferenceKey } = require('../src/prototype/runtime');

const saved = new Map();
const storage = {
  getItem: (key) => saved.get(key),
  setItem: (key, value) => saved.set(key, value),
};
const fps = createFrameRate(storage);
assert.equal(fps.preference, 'auto');
assert.equal(fps.target, 30, 'New Auto 20–30 starts at 30 FPS');

function simulate(controller, start, count, interval, work = 8) {
  let drawings = 0;
  for (let i = 0; i < count; i++) {
    const now = start + i * interval;
    const draw = controller.shouldDraw(now);
    // Simulation and input still run on every RAF callback, including undrawn ones.
    controller.observe(now, work, draw);
    if (draw) drawings++;
  }
  return drawings;
}
const first = simulate(fps, 0, 180, 1000 / 60);
assert(first >= 85 && first <= 95, 'Default initially caps draws near 30 FPS');
simulate(fps, 3000, 240, 1000 / 60);
assert.equal(fps.target, 30, 'New Auto never promotes to 60, even with excellent headroom');

// A sustained overloaded/low-callback scene must move to 20 FPS.
simulate(fps, 7000, 180, 1000 / 15, 45);
assert.equal(fps.target, 20, 'New Auto falls back to 20 under sustained load');
simulate(fps, 20000, 900, 1000 / 60, 8);
assert.equal(fps.target, 30, 'New Auto cautiously returns to 30 after sustained recovery');
assert.notEqual(fps.target, 60, 'New Auto never attempts 60');

// Preserve previous 30-first -> 60-auto -> 30 fallback behavior as an explicit option.
const oldAuto = createFrameRate();
oldAuto.select('auto60');
assert.equal(oldAuto.target, 30);
simulate(oldAuto, 0, 420, 1000 / 60, 4);
assert.equal(oldAuto.target, 60, 'Old Auto still promotes to 60');
const smooth = simulate(oldAuto, 8000, 180, 1000 / 60);
assert(smooth >= 155, 'Old Auto renders most 60 Hz frames when promoted');
simulate(oldAuto, 12000, 350, 24, 22);
assert.equal(oldAuto.target, 30, 'Old Auto still falls back to 30');

// Regression: very slow callback rates must still demote without 90 samples.
for (const hz of [20, 10, 5, 2, 1]) {
  const old = createFrameRate();
  old.select('auto60');
  simulate(old, 0, 420, 1000 / 60, 4);
  assert.equal(old.target, 60);
  simulate(old, 7000, 60 * hz, 1000 / hz, 800 / hz);
  assert.equal(old.target, 30, 'Legacy Auto demotes at ' + hz + ' Hz');
  simulate(old, 67000, 1800, 1000 / 60, 4);
  assert.equal(old.target, 60, 'Legacy Auto recovers at ' + hz + ' Hz');
  old.select('60');
  simulate(old, 100000, 60 * hz, 1000 / hz, 800 / hz);
  assert.equal(old.target, 60, 'Manual 60 stays selected at ' + hz + ' Hz');

  const lower = createFrameRate();
  simulate(lower, 0, 60 * hz, 1000 / hz, 800 / hz);
  assert.equal(lower.target, 20, 'New Auto demotes at ' + hz + ' Hz');
}

const resumed = createFrameRate();
resumed.select('auto60');
simulate(resumed, 0, 420, 1000 / 60, 4);
resumed.suspend();
simulate(resumed, 120000, 420, 1000 / 60, 4);
assert.equal(resumed.target, 60, 'Suspended time is not slowdown evidence');

assert.equal(fps.select('20'), true);
assert.equal(fps.target, 20);
assert.equal(saved.get(fpsPreferenceKey), '20');
const twenty = simulate(fps, 40000, 900, 1000 / 60, 3);
assert(twenty >= 275 && twenty <= 325, 'Manual 20 draws near 20 FPS on a 60 Hz screen');
assert.equal(fps.target, 20, 'Manual 20 never promotes');
assert.equal(createFrameRate(storage).target, 20, 'Manual 20 survives reload');
fps.select('30');
simulate(fps, 60000, 600, 1000 / 120, 1);
assert.equal(fps.target, 30, 'Manual 30 never promotes');
assert.equal(createFrameRate(storage).target, 30);
fps.select('60');
const ninety = simulate(fps, 70000, 900, 1000 / 90, 6);
assert(ninety >= 575 && ninety <= 620, 'Manual 60 works on 90 Hz');
assert.equal(fps.target, 60);

fps.select('auto60');
assert.equal(fps.preference, 'auto60');
assert.equal(createFrameRate(storage).preference, 'auto60', 'Explicit old Auto survives reload');
fps.select('auto');
assert.equal(fps.target, 30, 'Switching to new Auto starts at 30');
assert.equal(createFrameRate(storage).preference, 'auto');
fps.suspend();
assert.equal(fps.target, 30, 'Suspend does not change the current target');
assert.equal(fps.shouldDraw(90000), true, 'Resume draws immediately');
assert.equal(fps.select('120'), false, 'Unsupported choices are ignored');

// Previously persisted "auto" must now use the new default policy, whereas
// existing manual choices must not be silently overwritten.
saved.set(fpsPreferenceKey, 'auto');
assert.equal(createFrameRate(storage).preference, 'auto');
saved.set(fpsPreferenceKey, '60');
assert.equal(createFrameRate(storage).target, 60);
saved.set(fpsPreferenceKey, 'bogus');
assert.equal(createFrameRate(storage).preference, 'auto', 'Corrupt preferences use new default');
const blocked = createFrameRate({
  getItem() { throw Error('storage unavailable'); },
  setItem() { throw Error('storage unavailable'); },
});
assert.equal(blocked.target, 30);
assert.equal(blocked.select('20'), true, 'Storage failures cannot block the setting');

console.log('PASS new Auto 20–30, preserved Auto 30–60, manual 20/30/60, recovery and persistence');

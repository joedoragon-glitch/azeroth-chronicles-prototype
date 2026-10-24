'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createFrameRate, createFrameSkip } = require('../src/prototype/runtime');

function run(fps, start, durationMs, skipEvery = 0, period = 1000 / 60) {
  let eligible = 0, skipped = 0, draws = 0;
  // Keep samples chronological and use the real FPS eligibility gate.
  for (let i = 0; i < Math.floor(durationMs / period); i++) {
    const now = start + i * period;
    const allowed = fps.shouldDraw(now);
    if (allowed) eligible++;
    const skip = allowed && skipEvery > 0 && eligible % skipEvery === 0;
    fps.observe(now, skip ? 1 : 8, allowed && !skip, skip);
    if (skip) skipped++;
    if (allowed && !skip) draws++;
  }
  return { draws, skipped, eligible };
}

// Synthetic low-cost drawn work isolates the accounting issue. Adaptive skips
// should be a pressure signal even if the remaining frames falsely look cheap.
for (const preference of ['auto', 'auto60']) {
  const fps = createFrameRate();
  if (preference === 'auto60') {
    fps.select('auto60');
    run(fps, 0, 12000);
    assert.equal(fps.target, 60, 'Legacy Auto promotes with real unskipped headroom');
    // Wait out promotion cooldown: controller must not ignore new pressure.
    run(fps, 12000, 7000);
    assert.equal(fps.target, 60);
  }
  const start = preference === 'auto' ? 0 : 19000;
  const pressure = run(fps, start, 9000, 10);
  assert(pressure.skipped > 8);
  assert(pressure.draws > 0);
  assert.equal(fps.target, preference === 'auto' ? 20 : 30,
    preference + ' must lower the target when adaptation repeatedly skips eligible draws');

  // Sparse adaptive skips can leave plenty of drawn samples. They must not
  // trick either Auto mode into prematurely raising the target again.
  const lower = fps.target;
  const secondStart = start + 9000;
  const sparse = run(fps, secondStart, 24000, 20);
  assert(sparse.skipped > 0);
  assert.equal(fps.target, lower,
    preference + ' must NOT promote using a window containing adaptive omissions');
  const recovery = run(fps, secondStart + 24000, 25000);
  assert(recovery.draws > 100);
  assert.equal(fps.target, preference === 'auto' ? 30 : 60,
    preference + ' recovers automatically when drawings are genuinely cheap and unskipped');
}

// A normal FPS limiter omission is NOT an adaptive skip. It must not block
// healthy Auto promotion or be counted as severe rendering pressure.
const control = createFrameRate();
control.select('auto60');
const routine = run(control, 0, 9000, 0);
assert(routine.eligible < 9000 / (1000 / 60), 'FPS limiter is independent');
assert.equal(control.target, 60);

const isolated = createFrameRate();
isolated.select('auto');
for (let i = 0; i < 390; i++) {
  const now = i * (1000 / 60);
  const eligible = isolated.shouldDraw(now);
  isolated.observe(now, 8, eligible, false);
}
assert.equal(isolated.target, 30, 'Default Auto never increases past 30');

// Actual app integration: the adaptive skip decision must be passed separately
// to Auto observations, not mislabeled as an ordinary FPS cap omission.
const app = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
assert(app.includes('fps.observe(now, performance.now() - frameStart, draw, adaptiveSkipped);'),
  'Live frame loop supplies explicit adaptive-skip evidence');
assert(app.includes('frameSkip.shouldSkip(now, fps.target)'));

// Both independent runtime controllers still support manual Off, which must
// not suppress Auto FPS behavior or force false pressure flags.
const off = createFrameSkip({ getItem: () => 'off' });
assert.equal(off.enabled, false);
assert.equal(off.shouldSkip(120, 20), false);
const manual = createFrameRate();
for (const p of ['20', '30', '60']) {
  manual.select(p);
  run(manual, 0, 9000, 10);
  assert.equal(manual.target, Number(p), 'Manual preference ' + p + ' stays fixed');
}
console.log('PASS Auto FPS and adaptive skip coupling: pressure-demotion, clean promotion, limiter separation and manual overrides');

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createFrameSkip, frameSkipPreferenceKey } = require('../src/prototype/runtime');

const saved = new Map();
const storage = { getItem: k => saved.get(k), setItem: (k, v) => saved.set(k, v) };
const fresh = createFrameSkip(storage);
assert.equal(fresh.enabled, true, 'Adaptive frame skip is On by default on new devices');
assert.equal(fresh.shouldSkip(0, 20), false, 'Do not skip before measuring real drawings');
assert.equal(fresh.select('on'), false, 'Only boolean changes are accepted');

for (const target of [20, 30, 60]) {
  const skip = createFrameSkip();
  const period = 1000 / target;
  let skipped = 0, streak = 0, longest = 0, doubled = false;
  for (let i = 0; i < 90; i++) {
    const now = i * period;
    const drop = skip.shouldSkip(now, target);
    if (drop) {
      skipped++;
      streak++;
      doubled ||= streak === 2;
    } else {
      streak = 0;
      skip.observe(now, 90, 25, true);
    }
    longest = Math.max(longest, streak);
  }
  assert(skipped > 0, 'Frame skipping engages under render load at ' + target + ' FPS');
  assert(doubled, 'May skip two consecutive eligible drawings at ' + target + ' FPS');
  assert(longest <= 2, 'Must draw after two consecutive skips at ' + target + ' FPS');
  assert.equal(skip.status().skippedDraws, skipped);
  assert(skip.status().estimatedDrawWorkMs >= 89);
  const count = skip.status().skippedDraws;
  skip.suspend();
  assert.equal(skip.status().drawnSamples, 0);
  assert.equal(skip.status().skippedDraws, count, 'Suspension preserves cumulative skips');
  assert.equal(skip.shouldSkip(100000, target), false, 'Resume without a stale skip');
}

const stale = createFrameSkip();
for (let i = 0; i < 6; i++) stale.observe(i * 200, 90, 25, true);
// Previously a 110ms guard would suppress this skip; it now works even at 5 FPS.
assert.equal(stale.shouldSkip(1200, 20), true, 'Heavy slowdown can still skip a costly draw');
assert.equal(stale.shouldSkip(1400, 20), false,
  'An image 350ms or more old requires the next eligible drawing');
stale.observe(1400, 90, 25, true);
assert.equal(stale.shouldSkip(1600, 20), true, 'Skipping can resume after a real drawing');

const scarce = createFrameSkip();
for (let i = 0; i < 6; i++) scarce.observe(i * 500, 90, 25, true);
assert.equal(scarce.shouldSkip(3000, 20), false,
  'Do not deliberately extend an already 500ms-old image');

const cpu = createFrameSkip();
for (let i = 0; i < 40; i++) {
  const now = i * (1000 / 30);
  assert.equal(cpu.shouldSkip(now, 30), false, 'Do not skip on CPU-only pressure');
  cpu.observe(now, 70, 2, true);
}

const recovery = createFrameSkip();
let recoveredSkips = 0;
for (let i = 0; i < 20; i++) {
  const now = i * (1000 / 30);
  if (recovery.shouldSkip(now, 30)) recoveredSkips++;
  else recovery.observe(now, 80, 25, true);
}
assert(recoveredSkips > 0);
for (let i = 20; i < 110; i++) {
  const now = i * (1000 / 30);
  if (!recovery.shouldSkip(now, 30)) recovery.observe(now, 20, 6, true);
}
assert.equal(recovery.shouldSkip(110 * (1000 / 30), 30), false,
  'Normal rendering resumes automatically when real measured load recovers');

assert.equal(recovery.shouldSkip(Infinity, 30), false);
assert.equal(recovery.shouldSkip(4000, 0), false);
assert.equal(recovery.shouldSkip(4000, NaN), false);

assert.equal(fresh.select(false), true);
assert.equal(saved.get(frameSkipPreferenceKey), 'off');
assert.equal(createFrameSkip(storage).enabled, false, 'Explicit Off survives reload');
assert.equal(fresh.shouldSkip(123, 20), false, 'Off disables skips at every target');
assert.equal(fresh.select(true), true);
assert.equal(saved.get(frameSkipPreferenceKey), 'on');
assert.equal(createFrameSkip(storage).enabled, true, 'Explicit On survives reload');
const blocked = createFrameSkip({
  getItem() { throw Error('blocked'); },
  setItem() { throw Error('blocked'); },
});
assert.equal(blocked.enabled, true, 'Storage failure retains new default');
assert.equal(blocked.select(false), true, 'Storage errors do not block manual Off');

const app = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
const frame = app.slice(app.indexOf('  function frame(now) {'));
const simulation = frame.indexOf('game.tick(dt,');
const effectUpdate = frame.indexOf('renderer.update(frozen ? 0 : dt)');
const drawGate = frame.indexOf('frameSkip.shouldSkip(now, fps.target)');
assert(simulation >= 0 && simulation < drawGate, 'Simulation precedes any adaptive skip');
assert(effectUpdate >= 0 && effectUpdate < drawGate,
  'Combat effects advance before the adaptive drawing decision');
assert(!frame.includes('frameSkip.protect('),
  'Warning, elite-warning, interruption and death events no longer block skipping');
assert(frame.includes('const eligibleDraw = fps.shouldDraw(now);'),
  'Ordinary FPS limiter remains independently in charge of drawing eligibility');
console.log('PASS adaptive frame skip: default On, all FPS targets, two skips, stale-image safeguard, combat continuity, recovery and overrides');

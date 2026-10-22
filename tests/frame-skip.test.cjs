'use strict';
const assert = require('node:assert/strict');
const { createFrameSkip, frameSkipPreferenceKey } = require('../src/prototype/runtime');

const saved = new Map();
const storage = { getItem: k => saved.get(k), setItem: (k, v) => saved.set(k, v) };
const skip = createFrameSkip(storage);
assert.equal(skip.enabled, false, 'The default must not affect existing players');
assert.equal(skip.select('on'), false);
assert.equal(skip.shouldSkip(0, 30), false);
assert.equal(skip.select(true), true);
assert.equal(saved.get(frameSkipPreferenceKey), 'on');

let skipped = 0, previousSkipped = false;
for (let i = 0; i < 80; i++) {
  const now = i * 33.3333;
  const next = skip.shouldSkip(now, 30);
  assert(!(next && previousSkipped), 'Never skip consecutive eligible draws');
  previousSkipped = next;
  if (next) skipped++;
  else skip.observe(now, 48, 18, true);
}
assert(skipped > 0 && skipped <= 37, 'Reduce work without starving drawings');
assert.equal(skip.status().skippedDraws, skipped);
assert(skip.status().estimatedDrawWorkMs > 40);

const beforeCue = skip.status().skippedDraws;
skip.protect(80 * 33.3333);
for (let i = 80; i < 89; i++) {
  const now = i * 33.3333;
  assert.equal(skip.shouldSkip(now, 30), false, 'Warnings protect the image');
  skip.observe(now, 45, 15, true);
}
assert.equal(skip.status().skippedDraws, beforeCue);
for (let i = 89; i < 160; i++) {
  const now = i * 33.3333;
  const drop = skip.shouldSkip(now, 30);
  if (!drop) skip.observe(now, 20, 6, true);
}
assert.equal(skip.shouldSkip(160 * 33.3333, 30), false,
  'Real sustained headroom automatically restores every eligible drawing');
assert.equal(createFrameSkip(storage).enabled, true, 'Stored on this device only');
skip.suspend();
assert.equal(skip.shouldSkip(100000, 30), false, 'Resume without a stale skip');

const cpu = createFrameSkip();
cpu.select(true);
for (let i = 0; i < 40; i++) {
  const now = i * 33.3333;
  assert.equal(cpu.shouldSkip(now, 30), false, 'A cheap renderer cannot help CPU-only load');
  cpu.observe(now, 70, 2, true);
}
const scarce = createFrameSkip();
scarce.select(true);
for (let i = 0; i < 30; i++) {
  const now = i * 150;
  assert.equal(scarce.shouldSkip(now, 30), false, 'Must not sacrifice already-scarce frames');
  scarce.observe(now, 48, 18, true);
}
skip.select(false);
assert.equal(saved.get(frameSkipPreferenceKey), 'off');
assert.equal(skip.shouldSkip(100033, 30), false);
assert.equal(createFrameSkip(storage).enabled, false);
const blocked = createFrameSkip({getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }});
assert.equal(blocked.select(true), true, 'Storage failure must not block the toggle');
assert.equal(blocked.enabled, true);
console.log('PASS adaptive frame skip: opt-in, load, cues, bounded skips, recovery, pause and persistence');

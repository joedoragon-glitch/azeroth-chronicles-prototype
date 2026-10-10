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
assert.equal(fps.target, 30, 'Auto starts at 30 FPS');

function simulate(controller, start, count, interval, work = 8) {
  let drawings = 0;
  for (let i = 0; i < count; i++) {
    const now = start + i * interval;
    const draw = controller.shouldDraw(now);
    // The simulation is called on every animation frame, not only drawn frames.
    controller.observe(now, work, draw);
    if (draw) drawings++;
  }
  return drawings;
}
const first = simulate(fps, 0, 180, 1000 / 60);
assert(first >= 85 && first <= 95, 'Initial 30 FPS draw cap on a 60 Hz display');
assert.equal(fps.target, 30);
simulate(fps, 3000, 240, 1000 / 60);
assert.equal(fps.target, 60, 'Stable headroom permits a trial at 60 FPS');
const smooth = simulate(fps, 7000, 180, 1000 / 60);
assert(smooth >= 155, 'Promoted mode draws most 60 Hz frames');

simulate(fps, 10000, 350, 24, 22);
assert.equal(fps.target, 30, 'Sustained slow frames fall back to 30 FPS');

assert.equal(fps.select('30'), true);
assert.equal(fps.preference, '30');
assert.equal(saved.get(fpsPreferenceKey), '30');
simulate(fps, 30000, 600, 1000 / 120, 1);
assert.equal(fps.target, 30, 'Manual 30 is never promoted');
assert.equal(createFrameRate(storage).target, 30, 'Manual choice survives reload');

fps.select('60');
assert.equal(fps.target, 60);
const ninety = simulate(fps, 0, 900, 1000 / 90, 6);
assert(ninety >= 575 && ninety <= 620, '90 Hz displays average near 60 FPS');
assert.equal(fps.target, 60, 'Manual 60 is never automatically lowered');

fps.select('auto');
assert.equal(fps.target, 30, 'Switching back to Auto starts at 30');
fps.suspend();
assert.equal(fps.target, 30, 'Suspend does not change selected target');
assert.equal(fps.shouldDraw(90000), true, 'Resume draws immediately');
assert.equal(fps.select('120'), false, 'Unsupported choices are ignored');

const blocked = createFrameRate({
  getItem() {
    throw Error('storage unavailable');
  },
  setItem() {
    throw Error('storage unavailable');
  },
});
assert.equal(blocked.target, 30);
assert.equal(blocked.select('60'), true, 'Storage failures cannot block the setting');

console.log('PASS adaptive 30-first FPS, 60 trial, fallback, manual modes and persistence');

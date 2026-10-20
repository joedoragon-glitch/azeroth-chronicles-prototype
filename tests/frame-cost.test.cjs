'use strict';
const assert = require('node:assert/strict');
const Runtime = require('../src/prototype/runtime.js');
let clock = 0;
const runtime = Runtime.create(() => clock);
for (let i = 0; i < 200; i++) {
  const start = i * 50;
  clock = start + 7;
  runtime.record(start, start, () => (clock += 11));
}
const report = runtime.report();
assert.equal(report.sampleFrames, 180);
assert.equal(report.fps, 20);
assert.equal(report.workP95Ms, 18);
assert.equal(report.preRenderP95Ms, 7);
assert.equal(report.renderP95Ms, 11);
runtime.suspend();
clock = 30000;
runtime.record(30000, 30000, () => {});
assert.equal(runtime.report().fps, 20, 'Paused wall time is excluded');
runtime.reset();
assert.equal(runtime.report().preRenderP95Ms, 0);
assert.equal(runtime.report().renderP95Ms, 0);
console.log('PASS bounded pre-render/render costs, active cadence, pause and reset');

'use strict';
const assert = require('node:assert/strict');
const Runtime = require('../src/prototype/runtime');
const p = Runtime.createFrameProfile();
assert.equal(p.report().activeFrames, 0);
for (let i = 0; i < 190; i++) p.record({
  drawn: i % 2 === 0,
  frameWorkMs: 30,
  intervalMs: 60,
  simulationMs: 20,
  companionAIMs: 5,
  enemyAIMs: 7,
  otherSimulationMs: 8,
  audioUpdateMs: 2,
  eventDispatchMs: 1,
  hudMs: 1,
  renderMs: 5,
  otherJsMs: 1,
});
const r = p.report();
assert.equal(r.activeFrames, 180);
assert.equal(r.drawnFrames, 90);
assert.equal(r.stages.simulationMs.meanMs, 20);
assert.equal(r.stages.enemyAIMs.p95Ms, 7);
assert.equal(r.stages.renderMs.samples, 90);
assert(p.describe().includes('Enemy AI'));
p.record({frameWorkMs: NaN});
assert.equal(p.report().activeFrames, 180);
p.reset();
assert.equal(p.report().activeFrames, 0);
console.log('PASS focused frame-stage profiler: bounded samples, categories, draw counts, reset');

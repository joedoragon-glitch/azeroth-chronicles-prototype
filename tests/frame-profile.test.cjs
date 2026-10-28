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
assert.equal(r.callbackFps, 16.7);
assert.equal(r.displayedFps, 8.3);
assert.equal(r.adaptiveSkippedDraws, 0);
assert.equal(r.stages.simulationMs.meanMs, 20);
assert.equal(r.stages.enemyAIMs.p95Ms, 7);
assert.equal(r.stages.renderMs.samples, 90);
assert(p.describe().includes('Enemy AI'));
p.record({frameWorkMs: NaN});
assert.equal(p.report().activeFrames, 180);
p.reset();
assert.equal(p.report().activeFrames, 0);
assert.equal(p.report().stages.pixiMs.samples, 0);
assert.equal(p.report().stages.canvasOverlayMs.samples, 0);
// Pixi world + Canvas combat overlay are measured within the SAME world draw.
p.record({
  drawn: true, frameWorkMs: 18, intervalMs: 17, renderMs: 12,
  pixiMs: 7, canvasOverlayMs: 4,
  pixiAttempted: true, canvasOverlayDrawn: true
});
// A pure Canvas draw is a different sample population, not a Pixi zero.
p.record({
  drawn: true, frameWorkMs: 14, intervalMs: 17, renderMs: 8,
  canvasWorldMs: 7, canvasWorldDrawn: true
});
// Skipped frames never dilute individual draw-stage means.
p.record({
  drawn: false, frameWorkMs: 4, intervalMs: 17, renderMs: 100,
  pixiMs: 100, canvasOverlayMs: 100, canvasWorldMs: 100,
  pixiAttempted: true, canvasOverlayDrawn: true, canvasWorldDrawn: true
});
// During a GPU failure, the same callback can attempt Pixi and finish
// with full Canvas recovery rather than a transparent overlay.
p.record({
  drawn: true, frameWorkMs: 19, intervalMs: 17, renderMs: 15,
  pixiMs: 6, canvasWorldMs: 8,
  pixiAttempted: true, canvasWorldDrawn: true
});
const mixed = p.report();
assert.equal(mixed.drawnFrames, 3);
assert.equal(mixed.stages.renderMs.samples, 3, 'legacy combined timing remains');
assert.equal(mixed.stages.renderMs.meanMs, 11.67);
assert.equal(mixed.stages.pixiMs.samples, 2);
assert.equal(mixed.stages.pixiMs.meanMs, 6.5);
assert.equal(mixed.stages.canvasOverlayMs.samples, 1);
assert.equal(mixed.stages.canvasOverlayMs.meanMs, 4);
assert.equal(mixed.stages.canvasWorldMs.samples, 2);
assert.equal(mixed.stages.canvasWorldMs.meanMs, 7.5);
assert(p.describe().includes('Pixi world'));
assert(p.describe().includes('Canvas combat overlay'));
assert(p.describe().includes('Combined world draw'));
assert(mixed.note.includes('not monitor-presented frames'));
assert(mixed.note.includes('separate p95 values cannot be added'));
assert(!p.describe().includes('Canvas (drawn only)'));
p.reset();
assert.equal(p.report().stages.pixiMs.samples, 0);
// A browser callback gap is not automatically expensive synchronous JS.
// Establish the immediately preceding *normal* callback after the sample reset.
p.record({ frameWorkMs: 19, intervalMs: 17 });
p.record({ frameWorkMs: 5, intervalMs: 205, simulationMs: 3,
  companionAIMs: 2, companionGuidanceMs: 0.4, companionSetupMs: 0.5,
  companionUnitsMs: 1, location: { zone: 'vale', heroX: 700, heroY: 450,
    gridSize: 256, gridX: 2, gridY: 1, nearbyEnemyCount: 4 } });
let slow = p.report().slowdownIncidents;
assert.equal(slow.records.length, 1);
assert.equal(slow.records[0].kind, 'callback-gap');
assert.equal(slow.records[0].location.gridX, 2);
assert.equal(slow.records[0].previous.frameWorkMs, 19);
assert.equal(slow.records[0].current.companionUnitsMs, 1);
p.reset(); // auto graphics tuning must not silently discard prior incidents.
assert.equal(p.report().slowdownIncidents.records.length, 1);
for (let i = 0; i < 24; i++) p.record({
  frameWorkMs: 65, intervalMs: 65, emergencyEntered: i === 0,
});
slow = p.report().slowdownIncidents;
assert.equal(slow.records.length, 16);
assert(slow.dropped >= 9, 'older exceptional callbacks are bounded');
assert(!JSON.stringify(slow).includes('undefined'));
p.clearSlowdowns();
assert.equal(p.report().slowdownIncidents.records.length, 0);
assert.equal(p.report().slowdownIncidents.dropped, 0);
const diagnostics = Runtime.create(()=>100);
assert(diagnostics.describe({measuredLayer:'canvas-combat-overlay'})
  .includes('Canvas combat overlay only'));
console.log('PASS focused frame-stage profiler: bounded windows, split Pixi/Canvas, recovery and legacy combined timings');

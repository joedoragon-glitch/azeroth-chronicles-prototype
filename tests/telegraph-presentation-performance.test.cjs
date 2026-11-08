'use strict';
// #849: per-draw trap reuse, conservative hero-distance gate and exact
// native warning geometry, without touching real trap combat or save data.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const FX = require('../src/prototype/combat-visuals.js');
function sample(trap, hero, shared = true) {
  const canvas = createCanvas(800, 560), ctx = canvas.getContext('2d');
  let trapCalls = 0;
  const game = {
    hero, s: { hazards: [], time: 1 },
    traps() { trapCalls++; return [trap]; },
    zone() { return { enemies: [], props: [] }; },
    attackPatches() { throw Error('traps should not invoke boss attack preparation'); },
  };
  const state = JSON.stringify({ trap, hero, s: game.s });
  const draw = shared ? new Map() : null;
  FX.ground(ctx, (p) => ({ x: p.x, y: p.y }), game, 'fill', 1, draw);
  FX.ground(ctx, (p) => ({ x: p.x, y: p.y }), game, 'underlay-cue', 1, draw);
  assert.equal(JSON.stringify({ trap, hero, s: game.s }), state,
    'visual presentation changed authoritative trap or save state');
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let visible = 0;
  for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) visible++;
  return { trapCalls, visible };
}
const circle = {
  x: 170, y: 210, kind: 'spikes', radius: 24,
  phase: 0.5, warningTime: 1, activeTime: 0.5,
};
assert(sample(circle, { x: 170 + 24 + 39, y: 210 }).visible > 0,
  'trap just inside 40-unit outer buffer must retain its fine warning');
assert.equal(sample(circle, { x: 170 + 24 + 41, y: 210 }).visible, 0,
  'remote trap must do no visual painting');
const jet = {
  x: 620, y: 210, kind: 'jet', length: 840, halfWidth: 17, radius: 24,
  phase: 0.5, warningTime: 1, activeTime: 0.5,
};
const nearLane = sample(jet, { x: 230, y: 210 + 17 + 35 });
assert(nearLane.visible > 0,
  'long jet must be revealed near its lane, even far from its center');
assert.equal(sample(jet, { x: 230, y: 210 + 17 + 45 }).visible, 0,
  'jet warning cannot draw when hero is beyond true edge+buffer');
assert.equal(nearLane.trapCalls, 1,
  'one shared renderer draw may construct trap list only once');
assert.equal(sample(jet, { x: 230, y: 260 }, false).trapCalls, 2,
  'independent nonshared calls retain normal trap refresh semantics');
const directions = FX.circlePoints({ x: 120, y: 130 }, 36);
assert.equal(directions.length, 48);
for (let i = 0; i < directions.length; i++) {
  const a = (i * Math.PI * 2) / directions.length;
  assert.deepEqual(directions[i],
    { x: 120 + Math.cos(a) * 36, y: 130 + Math.sin(a) * 36 },
    'unit-circle lookup changed native warning geometry');
}
console.log('PASS #849 trap proximity, 40-unit true boundary, full jet lane, one-list-per-draw, immutable state and exact circle vertices; native Canvas only');

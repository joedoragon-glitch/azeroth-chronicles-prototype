'use strict';
const assert = require('node:assert/strict');
const HeroArt = require('../src/prototype/hero-presentation.js');

const screen = (point) => ({ x: point.x, y: point.y });
function drawReceipt(receipt, elapsed, options = {}) {
  const originals = JSON.parse(JSON.stringify(receipt));
  const queued = [];
  HeroArt.queue([receipt], (effect, kind, duration) =>
    queued.push({ ...effect, kind, life: duration, max: duration }),
  );
  assert.equal(queued.length, 1, 'hero effect has one presentation receipt');
  const effect = queued[0];
  effect.life = Math.max(0.001, effect.max - elapsed);
  const calls = [];
  const ctx = {
    save() {},
    restore() {},
    beginPath() {},
    closePath() {},
    stroke() {},
    fill() {},
    arc() {},
    moveTo(x, y) { calls.push({ op: 'move', x, y }); },
    lineTo(x, y) { calls.push({ op: 'line', x, y }); },
  };
  HeroArt.draw(ctx, screen, effect, options);
  assert.deepEqual(receipt, originals, 'presentation does not change combat event');
  return { effect, calls };
}
function hasShaftTo(calls, x, y, length = 17) {
  return calls.some((call, index) =>
    call.op === 'line' &&
    Math.abs(call.x - x) < 0.01 &&
    Math.abs(call.y - y) < 0.01 &&
    index > 0 &&
    calls[index - 1].op === 'move' &&
    Math.abs(Math.hypot(x - calls[index - 1].x, y - calls[index - 1].y) - length) < 0.2,
  );
}

// Charged Pinning Volley has already hit every legal target by this receipt.
// Full-distance shafts must appear immediately, not traverse the corridor
// after damage (in either normal or reduced-motion presentation).
const pinning = {
  type: 'chargedArea',
  actor: 'hero',
  class: 'ranger',
  slot: 2,
  effect: 'pinning-volley',
  charged: true,
  shape: 'line',
  x: 120,
  y: 100,
  fromX: 100,
  fromY: 100,
  angle: 0,
  range: 200,
  halfWidth: 20,
};
for (const options of [{}, { reduced: true }, { optimized: true }]) {
  for (const elapsed of [0.001, 0.1]) {
    const { effect, calls } = drawReceipt(pinning, elapsed, options);
    assert.equal(effect.max, 0.2, 'instant corridor cue should be brief');
    for (const y of [88, 100, 112]) {
      assert(
        hasShaftTo(calls, 300, y),
        'Pinning Volley shafts show the complete immediate lane at ' + elapsed,
      );
    }
  }
}

// Normal Arrow Volley is also immediate. Its world-space streak belongs only
// to the release frame; hit glints can persist briefly after the Ranger moves.
const volley = {
  type: 'spell',
  actor: 'hero',
  source: 'hero',
  class: 'ranger',
  slot: 5,
  x: 100,
  y: 100,
  radius: 350,
  contacts: [{ x: 260, y: 120 }],
};
for (const options of [{}, { reduced: true }, { optimized: true }]) {
  const initial = drawReceipt(volley, 0.01, options);
  const afterward = drawReceipt(volley, 0.12, options);
  assert.equal(initial.effect.max, 0.2, 'instant volley tail is short-lived');
  assert(hasShaftTo(initial.calls, 260, 110), 'first release flash shows a real contact path');
  assert(!hasShaftTo(afterward.calls, 260, 110), 'old bow position stops firing visible shafts');
  assert(afterward.calls.length > 0, 'the real contact glint may briefly remain');
}

// This task is visual-only. Planted Paladin cross keeps its authored second
// damage pulse, and the Ranger's actual launched projectiles stay independent.
const paladin = drawReceipt({
  type: 'heroSkillArea',
  actor: 'hero',
  class: 'paladin',
  slot: 1,
  phase: 'launch',
  x: 100,
  y: 100,
  angle: 0,
  reach: 180,
  halfWidth: 16,
}, 0.01);
assert.equal(paladin.effect.stage, 'skill1-cross');
assert.equal(paladin.effect.max, 0.36, 'Paladin fixed cross cue remains unchanged');

console.log('PASS #463 Ranger instant-cast visual timing and fixed Paladin cross');

'use strict';
const assert = require('node:assert/strict'),
  { createCanvas } = require('@napi-rs/canvas');
const R = require('../src/prototype/renderer');
function paint(time, reduced) {
  const c = createCanvas(240, 240),
    ctx = c.getContext('2d');
  ctx.globalAlpha = 0.77;
  ctx.lineWidth = 4;
  ctx.fillStyle = '#123456';
  const entity = { renderKind: 'enemy', type: 'boss', family: 'citadel', form: 'true', hp: 900 };
  const before = JSON.stringify(entity);
  R.drawTrueAura(ctx, entity, { x: 120, y: 190 }, 100, time, reduced);
  assert.equal(JSON.stringify(entity), before, 'aura never owns simulation state');
  assert.equal(ctx.globalAlpha.toFixed(2), '0.77');
  assert.equal(ctx.lineWidth, 4);
  ctx.fillRect(0, 0, 1, 1);
  const restored = ctx.getImageData(0, 0, 1, 1).data;
  assert(
    Math.abs(restored[0] - 0x12) <= 1 && Math.abs(restored[1] - 0x34) <= 1,
    'saved paint style is restored',
  );
  return { png: c.toBuffer('image/png'), pixels: ctx.getImageData(0, 0, 240, 240).data };
}
const a = paint(1, false),
  b = paint(3, false);
assert(!a.png.equals(b.png), 'ordinary motion has a gentle animated phase');
assert(paint(1, true).png.equals(paint(30, true).png), 'reduced motion is genuinely still');
const alpha = (x, y) => a.pixels[(y * 240 + x) * 4 + 3];
assert.equal(alpha(120, 148), 0, 'corona has a transparent centre behind the body');
assert(alpha(160, 148) > 0 && alpha(160, 148) < 70, 'soft edge stays translucent');
assert(alpha(120, 215) < 40, 'only a faint gradient falloff, no solid golden disc under the boss');
console.log(
  'PASS TRUE aura transparency, visible motion, reduced-motion stability, context restoration and state purity',
);

'use strict';
const assert = require('node:assert/strict'),
  GroundCache = require('../src/prototype/ground-cache');
const stores = [];
let painted = 0,
  blits = 0;
const t = { a: 1.5, d: 1.5, b: 0, c: 0, e: 0, f: 0 };
const ctx = { getTransform: () => ({ ...t }), drawImage: () => blits++ };
const cache = new GroundCache({
  createCanvas: (width, height) => {
    const c = { width, height, getContext: () => ({ setTransform() {}, fillRect() {} }) };
    stores.push(c);
    return c;
  },
});
const scene = {},
  args = {
    width: 800,
    height: 500,
    origin: { x: 0, y: 0 },
    scene,
    revision: '1:ready',
    paint: () => painted++,
  };
assert(cache.draw(ctx, args));
assert.equal(painted, 1);
assert(cache.status().bytes <= cache.budget);
assert(cache.draw(ctx, { ...args, origin: { x: 110, y: -100 } }));
assert.equal(painted, 1);
assert.equal(blits, 2);
assert(cache.draw(ctx, { ...args, origin: { x: cache.margin + 1, y: 0 } }));
assert.equal(painted, 2);
assert.equal(stores[0].width, 0);
assert(cache.draw(ctx, { ...args, scene: {} }));
assert.equal(painted, 3);
assert.equal(stores[1].height, 0);
assert(cache.draw(ctx, { ...args, revision: '2:pending' }));
assert.equal(painted, 4);
assert(cache.draw(ctx, { ...args, revision: '2:ready' }));
assert.equal(painted, 5);
t.a = 2;
assert(cache.draw(ctx, args));
assert.equal(painted, 6);
t.a = 64;
assert.equal(cache.draw(ctx, args), false);
assert.equal(cache.status().bytes, 0);
assert.equal(stores.at(-1).width, 0);
t.a = 1;
t.b = 0.1;
assert.equal(cache.draw(ctx, args), false);
t.b = 0;
assert(cache.draw(ctx, args));
cache.clear();
assert.equal(cache.status().bytes, 0);
assert.equal(stores.at(-1).height, 0);
const failed = new GroundCache({
  createCanvas: () => {
    throw Error('unavailable');
  },
});
assert.equal(failed.draw(ctx, args), false);
assert.equal(failed.status().bytes, 0);
const noCanvas = new GroundCache({ createCanvas: () => null });
assert.equal(noCanvas.draw(ctx, args), false);
console.log(
  'PASS ground cache camera coverage, scene/revision/scale invalidation, bounded replacement and fallback',
);

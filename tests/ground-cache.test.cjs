'use strict';
const assert = require('node:assert/strict'),
  GroundCache = require('../src/prototype/ground-cache');
const stores = [];
let painted = 0,
  blits = 0,
  benchmarkClock = 0;
const t = { a: 1.5, d: 1.5, b: 0, c: 0, e: 0, f: 0 };
const ctx = { getTransform: () => ({ ...t }), drawImage: () => blits++ };
const cache = new GroundCache({
  now: () => benchmarkClock,
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
    paint: () => { painted++; benchmarkClock += 2.5; },
  };
assert(cache.draw(ctx, args));
assert.equal(painted, 1);
assert(cache.status().bytes <= cache.budget);
assert.equal(cache.status().rebuildMs, 2.5);
assert.equal(cache.status().lastRebuildMs, 2.5);
assert.equal(cache.status().maxRebuildMs, 2.5);
assert.equal(cache.status().failedBuilds, 0);
assert(cache.draw(ctx, { ...args, origin: { x: 110, y: -100 } }));
assert.equal(painted, 1);
assert.equal(blits, 2);
assert.equal(cache.status().rebuildMs, 2.5, 'cache hits cost no raster build time');
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
assert.equal(cache.status().builds, 6);
assert.equal(cache.status().rebuildMs, 15);
assert.equal(cache.status().maxRebuildMs, 2.5);
t.a = 64;
assert.equal(cache.draw(ctx, args), false);
assert.equal(cache.status().bytes, 0);
assert.equal(cache.status().budgetSkips, 1);
assert.equal(stores.at(-1).width, 0);
t.a = 1;
t.b = 0.1;
assert.equal(cache.draw(ctx, args), false);
assert.equal(cache.status().transformSkips, 1);
t.b = 0;
assert(cache.draw(ctx, args));
cache.clear();
assert.equal(cache.status().bytes, 0);
assert.equal(cache.status().rebuildMs, 17.5, 'clear releases bytes, not history');
assert.equal(stores.at(-1).height, 0);
const failed = new GroundCache({
  createCanvas: () => {
    throw Error('unavailable');
  },
});
assert.equal(failed.draw(ctx, args), false);
assert.equal(failed.status().bytes, 0);
assert.equal(failed.status().failedBuilds, 1);
assert.equal(failed.status().rebuildMs, 0);
const noCanvas = new GroundCache({ createCanvas: () => null });
assert.equal(noCanvas.draw(ctx, args), false);
assert.equal(noCanvas.status().failedBuilds, 1);
const failedPainter = new GroundCache({
  createCanvas: (width, height) => ({
    width, height, getContext: () => ({ setTransform() {}, fillRect() {} }),
  }),
});
assert.equal(failedPainter.draw(ctx, { ...args, paint: () => { throw Error('paint'); } }), false);
assert.equal(failedPainter.status().failedBuilds, 1);
assert.equal(failedPainter.status().rebuildMs, 0);
const invalidClock = new GroundCache({
  now: () => NaN,
  createCanvas: (width, height) => ({
    width, height, getContext: () => ({ setTransform() {}, fillRect() {} }),
  }),
});
assert.equal(invalidClock.draw(ctx, args), true);
assert.equal(invalidClock.status().rebuildMs, 0, 'invalid clock never pollutes telemetry');
console.log(
  'PASS ground cache camera coverage, scene/revision/scale invalidation, bounded replacement and fallback',
);

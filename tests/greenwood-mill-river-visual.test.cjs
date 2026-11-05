'use strict';
// Focused native-art smoke for the Greenwood mill/river integration candidate.
// Not a substitute for in-game phone artistic acceptance or a full browser suite.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { createCanvas } = require('@napi-rs/canvas');
const C = require('../src/prototype/engine.js');
const V = require('../src/prototype/visuals.js');
const landscape = require('../src/prototype/greenwood-landscape.js');
const { rng } = require('../tools/greenwood-layout/fixtures.cjs');

assert.equal(C.rules.greenwoodLayout.version, 2, 'active reconstructed Greenwood');
assert.equal(C.rules.greenwoodLayout.size, 3200);
const g = new C('normal', 'paladin', rng(0x47564103));
const snapshot = JSON.stringify(g.snapshot());
const center = { x: 1210, y: 1420 };
const canvas = createCanvas(1120, 760);
const ctx = canvas.getContext('2d');
const bounds = { width: canvas.width, height: canvas.height };
const screen = ({ x, y }) => ({
  x: 540 + ((x - center.x) - (y - center.y)) * 0.76,
  y: 430 + ((x - center.x) + (y - center.y)) * 0.27,
});

const bank = landscape.riverBanks(1550, 3200);
assert(bank[0] < bank[1], 'natural Greenwood river remains two legal banks');
assert.deepEqual(C.rules.channelBanks(0, 1550), bank, 'visual bank and physical bank agree');
const waters = C.rules.terrain[0][0];
assert.equal(waters.kind, 'rain-pools');
assert(waters.wetland && waters.pools.length === 4, 'one pond, stream, headrace and tailrace');
for (const pool of waters.pools) {
  assert(pool.points.length >= 4 && Number.isFinite(pool.x) && Number.isFinite(pool.y));
}

function paint() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Exercise the real shared native water material path with a frozen clock.
  V.terrain(ctx, screen, 0, 3200, null, bounds, [], 0, true);
  V.draw(ctx, {
    id: 'greenwood-working-mill',
    renderKind: 'prop',
    greenwoodFacility: 'mill',
    structure: 'vale-working-mill',
  }, screen(C.rules.greenwoodLayout.mill), 0);
  V.draw(ctx, {
    id: 'greenwood-mill-sluice',
    renderKind: 'prop',
    greenwoodFacility: 'weir',
    structure: 'mill-sluice',
  }, screen({ x: 1005, y: 1340 }), 0);
  return crypto.createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex');
}
const first = paint();
const second = paint();
assert.equal(first, second, 'same terrain, mill and sluice paint deterministically');
assert(canvas.toBuffer('image/png').byteLength > 9000, 'nonempty painted terrain and mill');

const motion = V.terrainMotionLines(0, screen, bounds, 12);
assert(motion.length > 0 && motion.length <= 320, 'bounded motion overlay');
for (const stroke of motion) {
  assert([stroke.x1, stroke.y1, stroke.x2, stroke.y2, stroke.width].every(Number.isFinite));
  assert(/^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(stroke.color));
}
V.drawLightFixtures(ctx, [{ kind: 'mill-sconce', x: 520, y: 390 }]);
V.atmosphere(ctx, canvas, 0, {
  night: true,
  hero: { x: 650, y: 440 },
  lights: [{ kind: 'mill-sconce', x: 520, y: 390 }],
  optimized: true,
});
assert.equal(JSON.stringify(g.snapshot()), snapshot, 'art and lights never mutate gameplay/save state');
// Verify that source intentionally avoids the known generic 58-unit sawtooth
// motif for Greenwood. Other regions continue using their existing painter.
const source = fs.readFileSync('src/prototype/visuals.js', 'utf8');
assert.match(source, /if \(greenwoodShore\) \{/);
assert.match(source, /ribbon\(-22, '#465a49'\)/);
assert.match(source, /else \\{\\s*for \\(let y = y1; y < y2; y \\+= 58\\)/);
console.log('PASS Greenwood mill/sluice, connected wetland, shared banks, deterministic native artwork and night lamp');

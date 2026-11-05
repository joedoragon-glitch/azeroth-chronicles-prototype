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
const props = g.zone().props;
const mill = props.find((p) => p.id === 'greenwood-working-mill');
const weir = props.find((p) => p.id === 'greenwood-mill-sluice');
assert(mill && weir, 'actual native Vale mill and sluice must be present in a fresh world');
// World entry initializes lazily; capture state only after lawful zone entry.
const saveHash = () => crypto.createHash('sha256').update(JSON.stringify(g.snapshot())).digest('hex');
const snapshot = saveHash();
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
const mouth = C.rules.greenwoodLayout.tailrace.at(-1),
  westBank = C.rules.channelBanks(0, mouth.y)[0];
assert(
  mouth.x > westBank + 12 && mouth.x < westBank + 45,
  'real collision water enters the legal river edge, not its center or dry land',
);
const waters = C.rules.terrain[0][0];
assert.equal(waters.kind, 'rain-pools');
assert(waters.wetland && waters.pools.length === 5,
  'one pond, stream, headrace, tailrace, and northern shallow headwater');
assert.equal(waters.blockingPools.length,4,'only the northern source is walkable');
assert.equal(waters.pools[4].shallow,true);
for (const pool of waters.pools) {
  assert(pool.points.length >= 4 && Number.isFinite(pool.x) && Number.isFinite(pool.y));
}

function paint() {
  ctx.fillStyle = '#536b48';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Exercise the real shared native water material path with a frozen clock.
  V.terrain(ctx, screen, 0, 3200, null, bounds, [], 0, true);
  V.draw(ctx, { ...mill, renderKind: 'prop' }, screen(mill), 0);
  V.draw(ctx, { ...weir, renderKind: 'prop' }, screen(weir), 0);
  return crypto.createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex');
}
const first = paint();
const second = paint();
assert.equal(first, second, 'same terrain, mill and sluice paint deterministically');
assert(canvas.toBuffer('image/png').byteLength > 9000, 'nonempty painted terrain and mill');
const reviewDir = 'test-artifacts/greenwood-mill-river';
fs.mkdirSync(reviewDir, { recursive: true });
fs.writeFileSync(reviewDir + '/native-daylight.png', canvas.toBuffer('image/png'));

const motion = V.terrainMotionLines(0, screen, bounds, 12);
assert(motion.length > 0 && motion.length <= 320, 'bounded motion overlay');
for (const stroke of motion) {
  assert([stroke.x1, stroke.y1, stroke.x2, stroke.y2, stroke.width].every(Number.isFinite));
  assert(/^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(stroke.color));
}
const fixtures = V.lightingFixtures(
  { id: 'greenwood-working-mill', structure: 'vale-working-mill', greenwoodFacility: 'mill' },
  screen(mill), 1, 0,
);
assert.equal(fixtures.length, 1, 'one physical mill fixture');
assert.equal(fixtures[0].fixture, 'glass', 'shared Canvas/Pixi glass contract');
assert.equal(fixtures[0].role, 'mill');
V.drawLightFixtures(ctx, fixtures);
V.atmosphere(ctx, canvas, 0, {
  night: true,
  hero: { x: 650, y: 440 },
  lights: fixtures,
  optimized: true,
});
fs.writeFileSync(reviewDir + '/native-night.png', canvas.toBuffer('image/png'));
assert.equal(saveHash(), snapshot, 'art and lights never mutate gameplay/save state');
// Verify that source intentionally avoids the known generic 58-unit sawtooth
// motif for Greenwood. Other regions continue using their existing painter.
const source = fs.readFileSync('src/prototype/visuals.js', 'utf8');
const nativeSourceSha = crypto.createHash('sha256').update(source).digest('hex');
const documentedSourceSha =
  JSON.parse(fs.readFileSync('docs/evidence/SPRITE_SCOPE_RECONCILIATION.json', 'utf8'))
    .sources['src/prototype/visuals.js'];
console.log('Greenwood artwork provenance SHA256:', nativeSourceSha);
assert.equal(nativeSourceSha, documentedSourceSha, 'reviewed visual source SHA256 must match native Node digest');
assert.match(source, /if \(greenwoodShore\) \{/);
assert.match(source, /ribbon\(-22, '#465a49'\)/);
assert.match(source, /else \{\s*for \(let y = y1; y < y2; y \+= 58\)/);
console.log('PASS Greenwood mill/sluice, connected wetland, shared banks, deterministic native artwork and night lamp');

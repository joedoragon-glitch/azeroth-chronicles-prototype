'use strict';
// Stage 5.4 continuation: concurrent real boss attack geometry, drawn twice
// per frame, must produce identical Canvas pixels whether same-frame world
// polygons are shared or rebuilt. Existing single-family tests cannot prove
// mixed warnings have separate cache entries. NOT a real encounter or FPS test.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Combat = require('../src/prototype/combat-visuals.js');

const game = new Campaign('normal', 'paladin', () => 0.5);
const zone = game.zone();
zone.enemies = []; zone.props = []; zone.buildings = [];
zone.npcs = []; zone.nodes = []; game.s.party = [];
Object.assign(game.hero, { x: 1480, y: 1700, hp: 100000, maxHp: 100000 });
game.line = () => true;
const families = ['thorn', 'citadel', 'cindermaw'];
const enemies = families.map((id, index) => {
  const boss = game.bossEnemy(game.boss(id), 'normal', {
    x: 1370 + 86 * index, y: 1700 + (index % 2) * 30,
  });
  boss.aggro = true;
  zone.enemies.push(boss);
  game.startAttack(boss, game.hero, 0);
  assert(boss.telegraph, 'authored ' + id + ' warning did not start');
  return boss;
});
assert.equal(zone.enemies.length, 3);

function paint(width, height, zoom, reuse) {
  const screen = ({ x, y }) => ({
    x: width / 2 + ((x - 1400) * 0.60 - (y - 1700) * 0.30) * zoom,
    y: height / 2 + ((x - 1400) * 0.19 + (y - 1700) * 0.32) * zoom,
  });
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const cache = reuse ? new Map() : null;
  const snap = JSON.stringify(game.snapshot());
  const original = game.attackPatches;
  let calls = 0;
  try {
    game.attackPatches = function (...args) {
      calls++;
      return original.apply(this, args);
    };
    Combat.ground(ctx, screen, game, 'fill', game.s.time, cache);
    Combat.ground(ctx, screen, game, 'underlay-cue', game.s.time, cache);
  } finally {
    game.attackPatches = original;
  }
  assert.equal(JSON.stringify(game.snapshot()), snap,
    'presentation changed real boss state or persisted campaign values');
  const pixels = Buffer.from(ctx.getImageData(0, 0, width, height).data);
  let visible = 0;
  for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) visible++;
  return { pixels, visible, calls, cacheSize: cache?.size ?? 0 };
}

const stats = [];
for (const [width, height, zoom] of [
  [900, 600, 1], [900, 600, 1.5],
  [393, 852, 1], [393, 852, 1.5],
]) {
  const plain = paint(width, height, zoom, false);
  const reused = paint(width, height, zoom, true);
  assert(plain.visible > 0, 'no native Canvas warning pixels in combined scene');
  assert.equal(plain.calls, 6, 'uncached three bosses require two patch builds each');
  assert.equal(reused.calls, 3, 'shared draw should construct three patch sets once');
  assert.equal(reused.cacheSize, 3, 'each active telegraph requires its own Map entry');
  assert.deepEqual(reused.pixels, plain.pixels,
    'combining real cone/canister/ring warnings changed original fill or outline');
  stats.push({ viewport: width + 'x' + height, zoom,
    patchesBefore: plain.calls, patchesAfter: reused.calls, pixels: reused.visible });
}

// This is a NEW simulation state, requiring a NEW renderer-local Map.
// The other two simultaneous warnings must keep their own entries.
const before = paint(900, 600, 1, true);
enemies[0].telegraph.x += 80;
enemies[0].telegraph.y -= 45;
const afterRaw = paint(900, 600, 1, false);
const afterCached = paint(900, 600, 1, true);
assert.equal(afterCached.calls, 3);
assert.deepEqual(afterCached.pixels, afterRaw.pixels,
  'moving one warning produced stale or cross-contaminated polygon geometry');
assert.notDeepEqual(afterCached.pixels, before.pixels,
  'mutating the authored Thorn cone produced no warning-pixel change');
console.log('STAGE5.4 CONCURRENT native Canvas stress (not device GPU/FPS): ' +
  JSON.stringify(stats));
console.log('PASS three concurrent real boss shapes, two sizes/two zoom levels, ' +
  'byte-identical cached/uncached pixels, new-frame moving-cone fidelity and save purity');

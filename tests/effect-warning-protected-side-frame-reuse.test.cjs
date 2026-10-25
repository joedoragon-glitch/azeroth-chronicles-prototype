'use strict';
// Stage 5.4: The Dark Lord's actual authored sector attack includes a real
// protected-side safe-gap shape. Reuse its expensive geometry only within a
// renderer draw, preserving the original danger AND sanctuary Canvas pixels.
// Native Canvas/source regression; not physical-device FPS or 3D Pixi evidence.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Combat = require('../src/prototype/combat-visuals.js');

const game = new Campaign('developer', 'paladin', () => 0.5);
const zone = game.zone();
zone.enemies = []; zone.props = []; zone.buildings = [];
zone.npcs = []; zone.nodes = []; game.s.party = [];
Object.assign(game.hero, { x: 1480, y: 1700, hp: 100000, maxHp: 100000 });
game.line = () => true;
const boss = game.bossEnemy(game.boss('darklord'), 'normal', { x: 1400, y: 1700 });
boss.aggro = true;
zone.enemies.push(boss);
// Actual fourth authored Dark Lord attack, not an invented stand-in sector.
game.startAttack(boss, game.hero, 3);
const warning = boss.telegraph;
assert(warning && warning.kind === 'sector' && warning.royalTerritory,
  'authored Dark Lord attack #4 did not create the protected-side sector');
assert(Number.isFinite(warning.protectedAngle));

function paint(width, height, zoom, reused) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const screen = ({ x, y }) => ({
    x: width / 2 + ((x - 1400) * 0.60 - (y - 1700) * 0.3) * zoom,
    y: height / 2 + ((x - 1400) * 0.19 + (y - 1700) * 0.32) * zoom,
  });
  const map = reused ? new Map() : null;
  const snapshot = JSON.stringify(game.snapshot());
  const originalPatches = game.attackPatches;
  let calls = 0;
  game.attackPatches = function (...args) {
    calls++;
    return originalPatches.apply(this, args);
  };
  try {
    Combat.ground(ctx, screen, game, 'fill', game.s.time, map);
    Combat.ground(ctx, screen, game, 'underlay-cue', game.s.time, map);
  } finally {
    game.attackPatches = originalPatches;
  }
  assert.equal(JSON.stringify(game.snapshot()), snapshot,
    'painting real danger/safe-gap geometry changed saved gameplay state');
  return { pixels: Buffer.from(ctx.getImageData(0, 0, width, height).data), calls };
}

for (const [width, height, zoom] of [[900, 600, 1], [393, 852, 1.5]]) {
  for (let stage = 0; stage < 2; stage++) {
    if (stage) {
      // New frame after actual mutable telegraph orientation/position.
      warning.x += 29;
      warning.y -= 17;
      warning.angle += 0.25;
      warning.protectedAngle = warning.angle + Math.PI;
    }
    const before = paint(width, height, zoom, false);
    const after = paint(width, height, zoom, true);
    assert(before.calls >= 4, 'original danger/safe-side warning did not recalculate both passes');
    assert.equal(after.calls, 1,
      'both danger sector and protected-side geometry must share one attackPatches invocation per draw');
    assert.deepEqual(after.pixels, before.pixels,
      'protected-side geometry or danger warning pixels changed');
    console.log('STAGE5.4 protected side ' + width + 'x' + height + ' zoom ' + zoom +
      ': attackPatches ' + before.calls + ' -> ' + after.calls +
      ', pixel-identical, moving frame ' + Boolean(stage));
  }
}
console.log('PASS real Dark Lord sanctuary/danger warning geometry reuse, no changed pixels or gameplay');

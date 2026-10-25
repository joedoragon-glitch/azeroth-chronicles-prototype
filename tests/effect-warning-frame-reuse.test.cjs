'use strict';
// Stage 5.3: within-one-draw telegraph geometry reuse. This verifies byte
// equality of actual Canvas pixels against original two-pass rendering and
// counts gameplay-derived patch reconstructions. No timing/FPS claims.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('node:fs');
const path = require('node:path');
const rendererSource = fs.readFileSync(path.resolve(__dirname, '../src/prototype/renderer.js'), 'utf8');
// Full Canvas and optional Pixi transparent Canvas overlay must both use the
// one-draw warning geometry scope, not merely expose an unused API parameter.
assert.equal((rendererSource.match(/new Map\\(\\);\\n      if \\(renderLayer === 'overlay'\\)/g) || []).length, 1,
  'warning shape lifetime must be one renderer draw');
assert.equal(rendererSource.split("PrototypeCombatVisuals.ground(ctx, screen, game, 'fill', now() / 1000, warningFrameShapes);").length - 1, 2,
  'warning fill must reuse frame geometry in Canvas and Pixi overlay');
assert.equal(rendererSource.split("PrototypeCombatVisuals.ground(ctx, screen, game, 'underlay-cue', game.s.time, warningFrameShapes);").length - 1, 2,
  'warning outline must reuse frame geometry in Canvas and Pixi overlay');
const Campaign = require('../src/prototype/engine.js');
const Combat = require('../src/prototype/combat-visuals.js');

const W = 800, H = 520;
const screen = ({ x, y }) => ({
  x: W / 2 + (x - 1400) * 0.60 - (y - 1700) * 0.3,
  y: H / 2 + (x - 1400) * 0.19 + (y - 1700) * 0.32,
});
function measure(game, useCache) {
  let calls = 0;
  const raw = game.attackPatches;
  game.attackPatches = function (...args) {
    calls++;
    return raw.apply(this, args);
  };
  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
  const cache = useCache ? new Map() : null;
  const snapshot = JSON.stringify(game.snapshot());
  Combat.ground(ctx, screen, game, 'fill', game.s.time, cache);
  Combat.ground(ctx, screen, game, 'underlay-cue', game.s.time, cache);
  assert.equal(JSON.stringify(game.snapshot()), snapshot,
    'warning renderer may not change gameplay/save state');
  game.attackPatches = raw;
  return { calls, pixels: Buffer.from(ctx.getImageData(0, 0, W, H).data) };
}
for (const id of ['thorn', 'citadel', 'cindermaw']) {
  const game = new Campaign('developer', 'paladin', () => 0.5);
  const zone = game.zone();
  zone.enemies = []; zone.props = []; zone.buildings = [];
  zone.npcs = []; zone.nodes = []; game.s.party = [];
  Object.assign(game.hero, { x: 1480, y: 1700, hp: 100000, maxHp: 100000 });
  game.line = () => true;
  const boss = game.bossEnemy(game.boss(id), 'normal', { x: 1400, y: 1700 });
  boss.aggro = true; zone.enemies.push(boss);
  game.startAttack(boss, game.hero, 0);
  assert(boss.telegraph, id + ' did not create actual warning geometry');
  const original = measure(game, false);
  const reused = measure(game, true);
  assert(original.calls >= 2, id + ' failed to traverse both original warning passes');
  assert.equal(reused.calls, 1,
    id + ' repeated attackPatches despite per-draw geometry reuse');
  assert.deepEqual(reused.pixels, original.pixels,
    id + ' optimized warning coverage or outline differs from original Canvas pixels');
  // A second frame MUST use a fresh scope: mutated telegraph geometry is
  // never hidden by stale cache contents from an older game tick.
  boss.telegraph.x += 29;
  boss.telegraph.y -= 17;
  const nextOriginal = measure(game, false);
  const nextReused = measure(game, true);
  assert.equal(nextReused.calls, 1);
  assert.deepEqual(nextReused.pixels, nextOriginal.pixels,
    id + ' changed attack position produced stale warnings');
  console.log('STAGE5.3 ' + id + ' attackPatches per fill+cue: ' +
    original.calls + ' -> ' + reused.calls + '; pixels identical, changed-geometry fresh frame identical');
}
console.log('PASS Stage 5.3 one-draw geometry reuse on real cone/canister/ring warnings; ' +
  'same Canvas pixels and campaign snapshots, no unbounded cache or gameplay changes');

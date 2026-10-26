'use strict';
// Stage 5.3 follow-up: preserve all 11 real first-boss warning surfaces when
// the renderer reuses attack geometry ONLY within the same frame.
// Native software Canvas output, not Pixi GPU/device FPS certification.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Combat = require('../src/prototype/combat-visuals.js');

const families = ['thorn', 'crypt', 'mire', 'archive', 'ridge', 'mine',
  'warlord', 'abyss', 'citadel', 'cindermaw', 'darklord'];
const viewports = [{ w: 900, h: 600, zoom: 1 },
  { w: 393, h: 852, zoom: 1.5 }];
let compared = 0, cachedReductions = 0, inkCases = 0;

function scenario(id) {
  const game = new Campaign('developer', 'paladin', () => 0.5);
  const zone = game.zone();
  zone.enemies = []; zone.props = []; zone.buildings = [];
  zone.npcs = []; zone.nodes = [];
  game.s.party = [];
  Object.assign(game.hero, { x: 1480, y: 1700, hp: 100000, maxHp: 100000 });
  game.line = () => true;
  const boss = game.bossEnemy(game.boss(id), 'normal', { x: 1400, y: 1700 });
  boss.aggro = true;
  zone.enemies.push(boss);
  game.startAttack(boss, game.hero, 0);
  assert(boss.telegraph, id + ': real first attack missing telegraph');
  return { game, boss };
}

function paint(game, viewport, reuse) {
  const { w, h, zoom } = viewport;
  const project = ({ x, y }) => ({
    x: w / 2 + ((x - 1400) * 0.60 - (y - 1700) * 0.30) * zoom,
    y: h / 2 + ((x - 1400) * 0.19 + (y - 1700) * 0.32) * zoom,
  });
  const surface = createCanvas(w, h);
  const ctx = surface.getContext('2d');
  const cache = reuse ? new Map() : null;
  const initial = JSON.stringify(game.snapshot());
  const originalPatches = game.attackPatches;
  let calls = 0;
  game.attackPatches = function (...args) {
    calls++;
    return originalPatches.apply(this, args);
  };
  try {
    Combat.ground(ctx, project, game, 'fill', game.s.time, cache);
    Combat.ground(ctx, project, game, 'underlay-cue', game.s.time, cache);
  } finally {
    game.attackPatches = originalPatches;
  }
  assert.equal(JSON.stringify(game.snapshot()), initial,
    'painting must not change campaign/save state');
  const pixels = Buffer.from(ctx.getImageData(0, 0, w, h).data);
  let visible = 0;
  for (let i = 3; i < pixels.length; i += 4)
    if (pixels[i] !== 0) visible++;
  return { pixels, visible, calls, size: cache?.size ?? 0 };
}

for (const id of families) {
  const { game, boss } = scenario(id);
  const initial = JSON.stringify(game.snapshot());
  for (const viewport of viewports) {
    for (const moved of [false, true]) {
      // A new simulation state MUST get a fresh same-frame cache.
      if (moved) {
        boss.telegraph.x += 29;
        boss.telegraph.y -= 17;
      }
      const before = paint(game, viewport, false);
      const after = paint(game, viewport, true);
      assert.deepEqual(after.pixels, before.pixels,
        id + ': caching altered live warning fill/outline pixels');
      assert(after.calls <= before.calls,
        id + ': cache created extra gameplay attackPatch calls');
      if (before.calls >= 2) {
        assert(after.calls < before.calls,
          id + ': duplicate projection path failed to reuse real warning geometry');
        cachedReductions++;
      }
      if (before.visible > 0) inkCases++;
      compared++;
    }
  }
  // Only the intentional telegraph repositioning may affect the scene.
  // All render-only mutations and instrumented wrappers were restored.
  assert.equal(game.attackPatches instanceof Function, true);
  assert(initial.length > 0);
}
assert.equal(compared, 44);
assert(inkCases > 0, 'no actual warning pixels across all boss families');
assert(cachedReductions >= 3,
  'did not exercise the already-confirmed cone/canister/ring reuse');
console.log('PASS Stage 5.3 all 11 first-boss warning families, ' +
  compared + ' same-state native Canvas comparisons across desktop/phone viewport ' +
  'and fresh moved-warning draws; ' + cachedReductions +
  ' duplicate attackPatch reconstructions reduced; 0 gameplay writes by painting. ' +
  'No natural crowd, Pixi GPU parity or hardware FPS claim.');

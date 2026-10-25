'use strict';
// Stage 5.4 deliberate-silence guard. The real Dark Lord's normal opening
// attack has an ANONYMOUS cast bar, not an ordinary ground footprint. A
// renderer or future quality policy must preserve this mechanic, rather than
// manufacturing a false ground warning to satisfy generic pixel counts.
// Headless native Canvas tests; no human salience/device/GPU-FPS claims.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Combat = require('../src/prototype/combat-visuals.js');

const game = new Campaign('normal', 'paladin', () => 0.5);
const zone = game.zone();
zone.enemies = [];
zone.props = [];
zone.buildings = [];
zone.npcs = [];
zone.nodes = [];
game.s.party = [];
Object.assign(game.hero, { x: 1480, y: 1700, hp: 100000, maxHp: 100000 });
game.line = () => true;
const boss = game.bossEnemy(game.boss('darklord'), 'normal', { x: 1400, y: 1700 });
boss.aggro = true;
zone.enemies.push(boss);
assert(game.startAttack(boss, game.hero, 0),
  'authored opening Dark Lord attack did not start');
assert(boss.telegraph?.anonymousCast,
  'the real opening attack no longer uses anonymous cast presentation');
assert(boss.telegraph.total > 0 && boss.telegraph.timer > 0,
  'authored attack has no real cast countdown');
const before = JSON.stringify(game.snapshot());

function draw(width, height, zoom, withWarning, useCache, withCastBar) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const labels = [];
  const originalText = ctx.fillText;
  ctx.fillText = function (value, ...args) {
    labels.push(String(value));
    return originalText.call(this, value, ...args);
  };
  const project = ({ x, y }) => ({
    x: width / 2 + ((x - 1400) * 0.60 - (y - 1700) * 0.30) * zoom,
    y: height / 2 + ((x - 1400) * 0.19 + (y - 1700) * 0.32) * zoom,
  });
  const originalPatches = game.attackPatches;
  const originalWarning = boss.telegraph;
  let patches = 0;
  try {
    game.attackPatches = function (...args) {
      patches++;
      return originalPatches.apply(this, args);
    };
    if (!withWarning) boss.telegraph = null;
    const cache = useCache ? new Map() : null;
    Combat.ground(ctx, project, game, 'fill', game.s.time, cache);
    Combat.ground(ctx, project, game, 'underlay-cue', game.s.time, cache);
    if (withCastBar) Combat.actorCues(ctx, project, game);
    return {
      labels, patches, cacheSize: cache?.size ?? 0,
      pixels: Buffer.from(ctx.getImageData(0, 0, width, height).data),
    };
  } finally {
    boss.telegraph = originalWarning;
    game.attackPatches = originalPatches;
    ctx.fillText = originalText;
  }
}

let cases = 0;
for (const [width, height, zoom] of [
  [900, 600, 1], [900, 600, 1.5],
  [393, 852, 1], [393, 852, 1.5],
]) {
  const noTelegraph = draw(width, height, zoom, false, false, false);
  const uncached = draw(width, height, zoom, true, false, false);
  const cached = draw(width, height, zoom, true, true, false);
  assert.deepEqual(uncached.pixels, noTelegraph.pixels,
    'anonymous cast accidentally created an ordinary danger footprint');
  assert.deepEqual(cached.pixels, noTelegraph.pixels,
    'one-render warning cache created a fake footprint for an anonymous cast');
  assert.equal(uncached.patches, 0,
    'anonymous attack unexpectedly computed ordinary ground collision patches');
  assert.equal(cached.cacheSize, 0,
    'anonymous cast entered visible warning polygon cache');

  const bar = draw(width, height, zoom, true, true, true);
  const withoutBar = draw(width, height, zoom, false, true, true);
  assert(bar.labels.includes('Preparing…'),
    'real anonymous cast timing label was suppressed');
  assert(!bar.labels.some(s => s.includes(boss.telegraph.name)),
    'anonymous attack leaked its concealed title into the cast label');
  assert(!withoutBar.labels.includes('Preparing…'),
    'removing the real telegraph left behind a fabricated cast bar');
  assert.notDeepEqual(bar.pixels, uncached.pixels,
    'essential cast bar is not painted to the screen');

  // The progress bar follows the active timer, not a decorative animation.
  const originalTimer = boss.telegraph.timer;
  try {
    boss.telegraph.timer = originalTimer * 0.5;
    const half = draw(width, height, zoom, true, true, true);
    assert.notDeepEqual(half.pixels, bar.pixels,
      'anonymous cast did not convey progress through its live countdown');
    assert(half.labels.includes('Preparing…'));
  } finally {
    boss.telegraph.timer = originalTimer;
  }
  assert.equal(JSON.stringify(game.snapshot()), before,
    'rendering anonymous cast changed campaign or saved state');
  cases++;
}
assert.equal(cases, 4);
console.log('PASS Dark Lord authored anonymous cast: no invented ground warning, ' +
  'real Preparing… bar progresses with game timer, 4 Canvas viewport/zoom ' +
  'variants, warning-cache and gameplay snapshot unchanged; no Pixi/hardware claim');

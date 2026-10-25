'use strict';
// Stage 5.2 Phase A: synthetic crowd, real attack/cast producers, one shared
// composition, and the actual runtime FPS preference draw gate.
// Native software Canvas only: no claims of natural crowd frequency, phone
// hardware/GPU performance, visual salience or Pixi parity.
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Combat = require('../src/prototype/combat-visuals.js');
const Hero = require('../src/prototype/hero-presentation.js');
const { createFrameRate } = require('../src/prototype/runtime.js');

function scene() {
  const game = new Campaign('developer', 'paladin', () => 0.5);
  const zone = game.zone();
  zone.enemies = [];
  zone.props = [];
  zone.buildings = [];
  zone.npcs = [];
  zone.nodes = [];
  game.s.party = [game.unit('soldier', 1460, 1720)];
  Object.assign(game.hero, {
    x: 1480, y: 1700, hp: 50, maxHp: 1000,
    skills: Array(8).fill(4), cd: Array(8).fill(0), order: null,
  });
  game.s.mercyTime = 0;
  game.line = () => true;

  // Three *real* boss attack producers deliberately coexist here. This is a
  // controlled congestion fixture, NOT a naturally reachable encounter.
  const bosses = ['thorn', 'citadel', 'cindermaw'];
  for (const [i, id] of bosses.entries()) {
    const boss = game.bossEnemy(game.boss(id), 'normal', {
      x: 1420 + i * 68, y: 1680 + (i % 2) * 40,
    });
    boss.aggro = true;
    zone.enemies.push(boss);
    game.startAttack(boss, game.hero, 0);
    assert(boss.telegraph, id + ' did not produce its real warning');
  }
  let target = null;
  for (let i = 0; i < 26; i++) {
    const enemy = game.makeEnemy({
      species: 'goblin', name: 'Crowd status ' + i,
      level: 1, hp: 100000, damage: 0, gold: 0, xp: 0,
    }, {
      x: 1494 + (i % 7) * 14, y: 1685 + Math.floor(i / 7) * 20,
    });
    enemy.weakenUntil = 20;
    enemy.fractureUntil = 20;
    enemy.tauntUntil = 20;
    enemy.slow = 3;
    enemy.testSilenced = true;
    zone.enemies.push(enemy);
    if (i === 0) target = enemy;
  }
  game.mageSilenceActive = (unit) => !!unit.testSilenced;
  game.effects = [];
  assert(game.cast(1, target.id, false), 'real hero cast failed in crowded fixture');
  const events = game.effects.splice(0);
  assert(events.some(e => e.type === 'heroSkillCast'), 'missing natural hero cast receipt');
  const effect = Combat.queue(events, game, []).find(e =>
    e.type === 'heroSkill' && e.stage === 'cast');
  assert(effect, 'no actual hero cast visual was queued');
  return { game, effect, bosses };
}

function imageData(canvas) {
  const c = canvas.getContext('2d');
  return new Uint8ClampedArray(c.getImageData(0, 0, canvas.width, canvas.height).data);
}
function occupied(data) {
  let count = 0;
  for (let i = 3; i < data.length; i += 4)
    if (data[i]) count++;
  return count;
}
function overlapAlpha(a, b) {
  assert.equal(a.length, b.length);
  let n = 0;
  for (let i = 3; i < a.length; i += 4)
    if (a[i] && b[i]) n++;
  return n;
}
function changed(a, b) {
  assert.equal(a.length, b.length);
  let count = 0;
  for (let i = 0; i < a.length; i += 4)
    if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) +
        Math.abs(a[i + 2] - b[i + 2]) + Math.abs(a[i + 3] - b[i + 3]) > 18)
      count++;
  return count;
}
function stats(durations) {
  const a = [...durations].sort((x, y) => x - y);
  return {
    medianMs: +a[Math.floor(a.length / 2)].toFixed(3),
    p95Ms: +a[Math.floor((a.length - 1) * 0.95)].toFixed(3),
  };
}
function paint(ctx, project, game, effect, opts, layer) {
  const { width, height, reduced, optimized } = opts;
  if (layer === 'warning') {
    Combat.ground(ctx, project, game, 'fill', game.s.time);
    Combat.ground(ctx, project, game, 'underlay-cue', game.s.time);
  } else if (layer === 'effect')
    Hero.draw(ctx, project, effect, { width, height, reduced, optimized });
  else if (layer === 'caption')
    Combat.actorCues(ctx, project, game);
  else if (layer === 'status')
    Hero.statuses(ctx, project, game, width, height);
  else throw Error('unknown layer ' + layer);
}
function inspect(fixture, opts) {
  const { game, effect } = fixture;
  const { width, height, zoom } = opts;
  const project = ({ x, y }) => ({
    x: width / 2 + ((x - 1480) * 0.68 - (y - 1700) * 0.3) * zoom,
    y: height / 2 + ((x - 1480) * 0.17 + (y - 1700) * 0.3) * zoom,
  });
  const c = createCanvas(width, height);
  const ctx = c.getContext('2d');
  const render = (...layers) => {
    ctx.clearRect(0, 0, width, height);
    for (const layer of layers) paint(ctx, project, game, effect, opts, layer);
    return imageData(c);
  };
  const warning = render('warning');
  const warningEffect = render('warning', 'effect');
  const warningCaption = render('warning', 'caption');
  const final = render('warning', 'effect', 'caption', 'status');
  const noEffect = render('warning', 'caption', 'status');
  const effectOnly = render('effect');
  const captionsOnly = render('caption');
  const statusesOnly = render('status');
  const output = {
    viewport: width + 'x' + height,
    zoom, reduced: !!opts.reduced, optimized: !!opts.optimized,
    warningPixels: occupied(warning),
    isolatedHeroPixels: occupied(effectOnly),
    warningHeroOverlapPixels: overlapAlpha(warning, effectOnly),
    captionsPixels: occupied(captionsOnly),
    statusPixels: occupied(statusesOnly),
    heroAgainstWarning: changed(warning, warningEffect),
    heroAfterCaptions: changed(noEffect, final),
    captionChanges: changed(warningEffect, render('warning', 'effect', 'caption')),
  };
  // Pixel deltas are checked AFTER warning, captions and statuses have been
  // composited, rather than trusting a painter-call receipt in isolation.
  assert(output.warningPixels > 0, 'crowd produced no warning pixels');
  assert(output.isolatedHeroPixels > 0, 'real hero cue has no isolated pixels');
  assert(output.captionsPixels > 0, 'real bosses produced no cast labels');
  assert(output.statusPixels > 0, '26 status-bearing enemies produced no markers');
  assert(output.heroAgainstWarning > 0, 'warning completely obscures hero cast');
  assert(output.heroAfterCaptions > 0,
    'hero cast has no visible difference after cast captions/status composition');
  return { project, output };
}

const fixture = scene();
const snapshot = JSON.stringify(fixture.game.snapshot());
const viewports = [{ width: 900, height: 600 }, { width: 393, height: 852 }];
const comparisons = [];
for (const viewport of viewports) {
  for (const zoom of [1, 1.5, 1.75]) {
    // At the common 150% zoom, additionally cover each detail/motion
    // combination without constructing a different gameplay scene.
    const variants = zoom === 1.5
      ? [[false, false], [false, true], [true, false], [true, true]]
      : [[false, false]];
    for (const [optimized, reduced] of variants) {
      const opts = { ...viewport, zoom, optimized, reduced };
      comparisons.push(inspect(fixture, opts).output);
    }
  }
}
assert.equal(comparisons.length, 12);
assert(comparisons.some(c => c.warningHeroOverlapPixels > 0),
  'crowd layout never put actual warning pixels behind a real hero effect');
assert.equal(JSON.stringify(fixture.game.snapshot()), snapshot,
  'static layered visual audit mutated gameplay/save data');

// The *real runtime preference controller*, not a claimed equivalent frame
// cadence: simulated steady 60-Hz callbacks for one second. Game/scene held
// fixed intentionally to isolate which drawings the preference permits;
// frame-skipping, time-varying effect lifetime and adaptive Auto transitions
// are covered by separate existing tests.
const fpsMatrix = [];
for (const pref of ['20', '30', '60', 'auto']) {
  const rate = createFrameRate();
  assert(rate.select(pref), 'runtime rejected FPS preference: ' + pref);
  const width = 900, height = 600;
  const canvas = createCanvas(width, height), ctx = canvas.getContext('2d');
  const opts = { width, height, zoom: 1.5, reduced: false, optimized: false };
  const project = inspect(fixture, opts).project;
  const ms = [], draws = [];
  for (let step = 0; step <= 60; step++) {
    const now = step * (1000 / 60);
    const draw = rate.shouldDraw(now);
    if (draw) {
      const begin = performance.now();
      ctx.clearRect(0, 0, width, height);
      for (const layer of ['warning', 'effect', 'caption', 'status'])
        paint(ctx, project, fixture.game, fixture.effect, opts, layer);
      ms.push(performance.now() - begin);
      draws.push(step);
    }
    rate.observe(now, 3, draw, false);
  }
  const expected = pref === 'auto' ? 30 : Number(pref);
  assert.equal(rate.target, expected,
    'manual preference changed or initial default Auto was not 30');
  assert(draws.length >= expected - 1 && draws.length <= expected + 2,
    'draw gate for ' + pref + ' allowed unexpected drawings: ' + draws.length);
  assert(occupied(imageData(canvas)) > 0,
    'combined scene disappeared at preference ' + pref);
  fpsMatrix.push({ preference: pref, target: rate.target,
    callbacks: 61, allowedDraws: draws.length, ...stats(ms) });
}
assert.equal(JSON.stringify(fixture.game.snapshot()), snapshot,
  'FPS comparisons mutated simulation/save state');
console.log('STAGE5.2 CROWD native Canvas only; synthetic stacked real producers, ' +
  'not a natural fight/device benchmark: ' +
  JSON.stringify({ comparisons, fpsMatrix, bosses: fixture.bosses }));
console.log('PASS crowded warning/hero/caption/status compositing at 2 canvas sizes ' +
  'and 3 zoom levels plus detail/motion pairs; native 20/30/60/Auto gate, pure gameplay');

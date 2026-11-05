'use strict';
// PR #809: the game-design handoff's bounded Greenwood lighting contract.
// Test the real Canvas painter and Pixi's GPU command description together.
const assert = require('node:assert/strict');
const Visuals = require('../src/prototype/visuals.js');
const Bridge = require('../tools/webgl-pilot/pixi-scene-bridge.js');

const parseRgba = (s) => {
  const m = /^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/.exec(String(s));
  assert(m, 'invalid color stop: ' + s);
  return m.slice(1).map(Number);
};
const almost = (a, b, description) =>
  assert(Math.abs(a - b) <= 1e-5, description + ': ' + a + ' vs ' + b);

function canvasGrade({ region, darkness, phase = 'night', peace = false, warmth = 0 }) {
  let alpha = 1;
  const drawings = [];
  const makeGradient = () => ({
    stops: [],
    addColorStop(at, rgba) { this.stops.push({ at, rgba }); },
  });
  const ctx = {
    save() {}, restore() {},
    get globalAlpha() { return alpha; },
    set globalAlpha(value) { alpha = value; },
    createLinearGradient: makeGradient,
    createRadialGradient: makeGradient,
    fillRect() { drawings.push({ fill: this.fillStyle, alpha }); },
  };
  Visuals.atmosphere(ctx, { width: 960, height: 540 }, region, {
    night: darkness >= 1,
    peace,
    daylight: { phase, darkness, warmth, progress: peace ? 0.5 : 1 },
    optimized: true, // Keeps mandatory night grade, omits only decorative effects.
    hero: null,
    lights: [],
    dungeon: false,
    room: false,
  });
  return drawings;
}

for (let region = 0; region < 5; region++) {
  for (const darkness of [0.0001, 0.25, 0.5, 0.75, 0.9999, 1]) {
    const native = canvasGrade({ region, darkness })[0];
    const pixi = Bridge.atmosphereLayers({ region, darkness })[0];
    assert.equal(pixi.type, 'night');
    assert.equal(native.fill.stops.length, 2);
    for (let index = 0; index < 2; index++) {
      const canvasStop = parseRgba(native.fill.stops[index].rgba);
      const pixiStop = parseRgba(pixi.colorStops[index].color);
      assert.deepEqual(pixiStop.slice(0, 3), canvasStop.slice(0, 3),
        'Canvas and Pixi RGB must match for region ' + region);
      almost(pixiStop[3], canvasStop[3] * native.alpha,
        'Canvas/Pixi composite alpha region=' + region + ', darkness=' + darkness);
    }
  }
}
// All non-Greenwood regional identities remain exactly as originally authored.
for (const [region, top, bottom] of [
  [1, [12, 32, 44, 0.48], [9, 17, 30, 0.58]],
  [2, [19, 29, 42, 0.5], [9, 17, 30, 0.58]],
  [3, [32, 20, 35, 0.52], [9, 17, 30, 0.58]],
  [4, [27, 19, 43, 0.54], [9, 17, 30, 0.58]],
]) {
  const night = Bridge.atmosphereLayers({ region, darkness: 1 })[0];
  assert.deepEqual(parseRgba(night.colorStops[0].color), top);
  assert.deepEqual(parseRgba(night.colorStops[1].color), bottom);
}
const atNight = Bridge.atmosphereLayers({ region: 0, darkness: 1 });
assert.deepEqual(parseRgba(atNight[0].colorStops[0].color), [39, 47, 67, 0.64]);
assert.deepEqual(parseRgba(atNight[0].colorStops[1].color), [31, 40, 60, 0.64]);

// The familiar olive-green meadow should no longer dominate the cool moonlit grade.
// This is a bounded compositing diagnostic, not a substitute for artistic screenshots.
const mix = (under, over) => under.map((n, i) => n * (1 - over[3]) + over[i] * over[3]);
const oldGrass = mix([80, 114, 72], [11, 25, 42, 0.48]);
const newGrass = mix([80, 114, 72], [39, 47, 67, 0.64]);
assert(Math.abs(newGrass[1] - newGrass[2]) < Math.abs(oldGrass[1] - oldGrass[2]),
  'night grass must lose the prior green dominance');
const newRoad = mix([155, 133, 92], [39, 47, 67, 0.64]);
const luma = ([red, green, blue]) => red * 0.2126 + green * 0.7152 + blue * 0.0722;
assert(luma(newRoad) - luma(newGrass) > 7, 'path must remain readable from grass');

// Intermediate warmth is deliberately subtler in Greenwood; other regions unchanged.
for (let region = 0; region < 5; region++) {
  const c = canvasGrade({ region, darkness: 0.5, phase: 'sunset', warmth: 1 });
  const canvasWarmth = c.find((draw) => draw.fill?.stops?.length === 3);
  assert(canvasWarmth, 'Canvas sunset gradient required');
  const p = Bridge.atmosphereLayers({ region, darkness: 0.5, phase: 'sunset', warmth: 1 })
    .find((layer) => layer.type === 'warmth');
  assert(p, 'Pixi sunset gradient required');
  for (let i = 0; i < 3; i++) {
    const fromCanvas = parseRgba(canvasWarmth.fill.stops[i].rgba);
    const fromPixi = parseRgba(p.colorStops[i].color);
    assert.deepEqual(fromPixi.slice(0, 3), fromCanvas.slice(0, 3));
    almost(fromPixi[3], fromCanvas[3], 'sunset intensity parity');
  }
}
const motes = Visuals.atmosphereMotes({
  width: 960, height: 540, region: 0, darkness: 1, time: 7,
});
assert.equal(motes.length, 14);
assert.deepEqual(motes[0].rgb, [197, 203, 218], 'night pollen is subtle cool silver');
assert.equal(Visuals.atmosphereMotes({
  width: 960, height: 540, region: 0, darkness: 1, time: 7, optimized: true,
}).length, 0);

// At the 30-second phase boundaries, the night grade has no sudden alpha change.
for (const [a, b] of [[0, 0.000001], [0.999999, 1]]) {
  const first = Bridge.atmosphereLayers({ region: 0, darkness: a }).find((l) => l.type === 'night');
  const second = Bridge.atmosphereLayers({ region: 0, darkness: b }).find((l) => l.type === 'night');
  if (!first) assert(a === 0, 'no night layer at daylight endpoint');
  if (first && second)
    almost(parseRgba(first.colorStops[0].color)[3],
      parseRgba(second.colorStops[0].color)[3], 'continuous boundary darkness');
}
console.log('PASS Greenwood day/night Canvas+Pixi grades, sunset, motes, and 4 untouched regions');

\n// Native real-Campaign review frames: preserve the pre-change main artist as
// an actual render reference, not a simulated color swatch or invented art.
if (process.env.CI_BASE_SHA) {
  const fs = require('node:fs');
  const path = require('node:path');
  const cp = require('node:child_process');
  const vm = require('node:vm');
  const { createRequire } = require('node:module');
  const { createCanvas } = require('@napi-rs/canvas');
  const Campaign = require('../src/prototype/engine.js');
  const Renderer = require('../src/prototype/renderer.js');
  const CombatVisuals = require('../src/prototype/combat-visuals.js');
  const source = cp.execFileSync('git', [
    'show', process.env.CI_BASE_SHA + ':src/prototype/visuals.js',
  ], { cwd: path.join(__dirname, '..'), encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  const virtualModule = { exports: {} };
  vm.runInNewContext(source, {
    module: virtualModule,
    require: createRequire(path.join(__dirname, '../src/prototype/visuals.js')),
    performance: { now: () => 16000 },
  }, { filename: 'main-before-greenwood-moonlight.js' });
  const oldVisuals = virtualModule.exports;
  assert.equal(typeof oldVisuals.atmosphere, 'function');
  const output = path.join(__dirname, '..', 'test-artifacts', 'greenwood-809');
  fs.mkdirSync(output, { recursive: true });
  const frames = [], width = 880, height = 560;
  const game = new Campaign('normal', 'paladin', () => 0.73);
  assert(game.enter('vale'));
  const spots = [
    ['millhaven', Campaign.data.towns[0]],
    ['orchard', [780, 2100]],
  ];
  const clocks = [
    ['day', 245], ['sunset', 345], ['night', 480], ['sunrise', 585],
  ];
  const render = (visuals, x, y) => {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const artist = Renderer.create({
      canvas: { width, height }, ctx, getGame: () => game,
      platform: {
        cameraZoom: 1.5,
        cameraAnchor: (w, h) => ({ x: w * 0.56, y: h * 0.52 }),
      },
      Campaign,
      PrototypeVisuals: visuals,
      PrototypeCombatVisuals: CombatVisuals,
      chargePresentation: () => null,
      isPaused: () => false,
      now: () => 16000,
    });
    artist.setOptimizationMode(true); // stable before/after grade comparison
    const state = JSON.stringify(game.s);
    artist.draw();
    assert.equal(JSON.stringify(game.s), state, 'painting must not change game state');
    return canvas.toBuffer('image/png');
  };
  for (const [spot, coord] of spots) {
    assert(coord && coord.length === 2);
    game.hero.x = coord[0]; game.hero.y = coord[1];
    for (const [phase, clock] of clocks) {
      game.s.clock = clock;
      const previous = render(oldVisuals, ...coord);
      const proposed = render(Visuals, ...coord);
      const filename = spot + '-' + phase;
      fs.writeFileSync(path.join(output, filename + '-before.png'), previous);
      fs.writeFileSync(path.join(output, filename + '-candidate.png'), proposed);
      frames.push({ spot, phase, identical: previous.equals(proposed) });
    }
  }
  assert(frames.every((f) => f.phase !== 'day' || f.identical),
    'daylight screenshots must remain pixel-identical');
  assert(frames.every((f) => f.phase === 'day' || !f.identical),
    'sunset/night/sunrise must render a visible grading change');
  fs.writeFileSync(path.join(output, 'review-index.json'),
    JSON.stringify({ contract: 'PR #809; source-native Canvas screenshots at 150%',
      base: process.env.CI_BASE_SHA, generatedFrom: process.env.GITHUB_SHA || 'local',
      optimizedForDeterminism: true,
      artApproval: false, pixiDeviceVerification: false, frames }, null, 2) + '\\n');
  console.log('PASS 16 native aligned before/candidate Greenwood screenshots; review in CI artifact');
}

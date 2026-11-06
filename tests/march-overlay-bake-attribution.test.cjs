'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const pixi = readFileSync(path.join(root, 'src/prototype/pixi-experimental.js'), 'utf8');
const canvas = readFileSync(path.join(root, 'src/prototype/renderer.js'), 'utf8');
const app = readFileSync(path.join(root, 'src/prototype/app.js'), 'utf8');

test('diagnostic-only bake substeps retain exact cropped artwork dimensions and offsets', () => {
  const begin = pixi.indexOf('  function bake(visual, game, density = 1, trace = null) {');
  const end = pixi.indexOf('\n  function create(options) {', begin);
  assert(begin !== -1 && end > begin, 'extract the actual production bake function');
  const baked = vm.runInNewContext(`
    let ticks = 0;
    const measureNow = () => ++ticks;
    const makeCanvas = (width, height) => ({
      width, height,
      getContext: () => ({
        setTransform() {},
        drawImage() {},
        getImageData() {
          const data = new Uint8ClampedArray(width * height * 4);
          data[(10 * width + 10) * 4 + 3] = 255;
          return { data };
        }
      }),
    });
    const requireValue = (value) => { if (!value) throw Error('missing context') };
    const root = {
      Campaign: { rules: { ambientLife: {} } },
      PrototypeVisuals: { draw() {} },
    };
    ${pixi.slice(begin, end)}
    bake;
  `, { Uint8ClampedArray }, { timeout: 2000 });
  const game = { regionIndex: () => 1, s: { rescued: {} } };
  const visual = { structure: 'marsh-artist', family: 'ridge' };
  const without = baked(visual, game, 0.05);
  const row = {};
  const withTrace = baked(visual, game, 0.05, row);
  assert.equal(withTrace.image.width, without.image.width);
  assert.equal(withTrace.image.height, without.image.height);
  assert.equal(withTrace.dx, without.dx);
  assert.equal(withTrace.dy, without.dy);
  assert.equal(withTrace.logicalWidth, without.logicalWidth);
  assert.equal(withTrace.logicalHeight, without.logicalHeight);
  assert.deepEqual(Object.keys(row).sort(), [
    'proceduralAlphaScanMs',
    'proceduralCropMs',
    'proceduralPainterMs',
    'proceduralReadbackMs'
  ].sort());
  for (const value of Object.values(row)) assert(value > 0);
});

test('opt-in overlay phases distinguish ground, nameplates, occlusion and cues', () => {
  for (const phase of [
    'groundAndClear', 'healthPlates', 'nameplates',
    'occlusionCandidates', 'occlusionMasks', 'remainingCombatCues'
  ]) assert(canvas.includes("overlayMark('" + phase + "')"), phase + ' stage missing');
  assert.match(canvas, /const overlayStages = overlaySubpassEnabled \? \{\} : null/);
  assert.match(canvas, /setOverlaySubpassProfiling\(enabled\)/);
  assert.match(canvas, /consumeOverlaySubpassProfile\(\)/);
  assert.match(app, /renderer\.setOverlaySubpassProfiling\(true\)/);
  assert.match(app, /renderer\.setOverlaySubpassProfiling\(false\)/);
  assert.match(app, /if \(overlay && rendererDiagnosticActive\)/);
  assert.match(app, /overlayDraws: \(stages\.overlayDraws \|\| \[\]\)/);
  assert.match(pixi, /bake\(painted, current, backingRatio \* zoom, trace\)/);
});

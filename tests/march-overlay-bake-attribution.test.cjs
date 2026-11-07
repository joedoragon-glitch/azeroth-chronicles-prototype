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
  const begin = pixi.indexOf('  function bake(visual, game, density = 1, trace = null, clock = null) {');
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
  let timestamp = 0;
  const withTrace = baked(visual, game, 0.05, row, () => ++timestamp);
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
  assert.match(canvas, /overlayStages\.occlusionMasksDrawn = stats\.outlineMasks/);
  assert.match(canvas, /overlayStages\.occlusionMaskPixels = stats\.outlineMaskPixels/);
  assert.match(canvas, /overlayStages\.occlusionVisibleEntities = overlayVisible\.length/);
  assert.match(app, /renderer\.setOverlaySubpassProfiling\(true\)/);
  assert.match(app, /renderer\.setOverlaySubpassProfiling\(false\)/);
  assert.match(app, /if \(overlay && rendererDiagnosticActive\)/);
  assert.match(app, /overlayDraws: \(stages\.overlayDraws \|\| \[\]\)/);
  assert.match(pixi, /bake\(painted, current, backingRatio \* zoom, trace, trace \? measureNow : null\)/);
});


test('all-draw overlay ledger preserves typical cost by zone and combat, not only worst frames', () => {
  const start = app.indexOf('  const rendererHistogramBoundsMs = ');
  const end = app.indexOf('  function rendererDiagnosticSnapshot()', start);
  assert(start !== -1 && end > start, 'extract real production capture helpers');
  const helpers = vm.runInNewContext(
    '(function() { ' + app.slice(start, end) +
    '; return { recordOverlaySubpasses, overlaySubpassReport }; })()',
    {}, { timeout: 2000 }
  );
  const capture = { overlaySubpassByActivity: Object.create(null) };
  const draw = {
    groundAndClear: 2, healthPlates: 1, nameplates: 2,
    occlusionCandidates: 3, occlusionMasks: 30,
    remainingCombatCues: 1, totalDrawMs: 40,
    occlusionMasksDrawn: 5, occlusionMaskPixels: 5 * 256 * 256,
    occlusionVisibleEntities: 85,
  };
  // Ordinary 40ms overlay draws are below the global worst-frame cutoff in
  // a session containing 300ms Pixi raster stalls; they still need counting.
  for (let i = 0; i < 12; i++)
    helpers.recordOverlaySubpasses(capture, 'march', false, [draw]);
  helpers.recordOverlaySubpasses(capture, 'march', true, [
    { ...draw, occlusionMasks: 8, occlusionMasksDrawn: 2, occlusionMaskPixels: 2 * 256 * 256 },
  ]);
  // A costly unengaged overlay with zero outline masks is evidence against
  // treating the silhouette compositor as the only possible bottleneck.
  helpers.recordOverlaySubpasses(capture, 'vale', false, [
    { ...draw, occlusionMasks: 3, occlusionMasksDrawn: 0, occlusionMaskPixels: 0 },
  ]);
  helpers.recordOverlaySubpasses(capture, 'march', false, null);
  const report = helpers.overlaySubpassReport(capture);
  const march = report.groups.find((row) => row.zoneAndEngagement === 'march:unengaged');
  const fight = report.groups.find((row) => row.zoneAndEngagement === 'march:engaged');
  const vale = report.groups.find((row) => row.zoneAndEngagement === 'vale:unengaged');
  assert.equal(report.groups.length, 3);
  assert.equal(march.drawnPasses, 12);
  assert.equal(march.incompletePasses, 0);
  assert.equal(march.stages.occlusionMasks.samples, 12);
  assert.equal(march.stages.occlusionMasks.meanMs, 30);
  assert.equal(march.stages.occlusionMasks.p95UpperMs, 33);
  assert.equal(march.stages.totalDrawMs.meanMs, 40);
  assert.equal(march.outlineWork.sampledPasses, 12);
  assert.equal(march.outlineWork.totalMasksDrawn, 60);
  assert.equal(march.outlineWork.totalMaskPixels, 60 * 256 * 256);
  assert.equal(march.outlineWork.meanMasksPerDraw, 5);
  assert.equal(march.outlineWork.maxVisibleEntities, 85);
  assert.equal(march.outlineWork.zeroMaskPasses, 0);
  assert.equal(fight.stages.occlusionMasks.meanMs, 8);
  assert.equal(fight.outlineWork.totalMasksDrawn, 2);
  assert.equal(vale.stages.occlusionMasks.meanMs, 3);
  assert.equal(vale.outlineWork.zeroMaskPasses, 1);
  assert.equal(vale.outlineWork.meanMasksPerDraw, 0);
  assert.match(app, /if \(drawn && stages\.overlayDraws\?\.length\)/);
  assert.match(app, /overlaySubpassSummary: overlaySubpassReport\(capture\)/);
  assert.match(app, /enemyAIMs: Math\.round\(stages\.enemyAIMs/);
  assert.match(app, /companionAIMs: Math\.round\(stages\.companionAIMs/);
});

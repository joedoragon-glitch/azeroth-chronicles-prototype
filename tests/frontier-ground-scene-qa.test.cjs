'use strict';
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const vm = require('node:vm');
const Module = require('node:module');
const path = require('node:path');
const { createCanvas } = require('@napi-rs/canvas');
const sharp = require('sharp');
const Campaign = require('../src/prototype/engine.js');
const Visuals = require('../src/prototype/visuals.js');
const Effects = require('../src/prototype/combat-visuals.js');
const Renderer = require('../src/prototype/renderer.js');

// Visual comparison uses the same game, scenery and camera, swapping only
// the pre-reconciliation floor-renderer source for a controlled baseline.
const root = path.resolve(__dirname, '..');
// Normal CI is independent of old Git history. For an opt-in historical
// side-by-side art review, set FRONTIER_QA_COMPARE=1 in a checkout containing
// the original baseline commit; images are emitted only with QA_SHOW=1.
let Original = null;
if (process.env.FRONTIER_QA_COMPARE === '1') {
  const originalSource = cp.execFileSync(
    'git',
    ['show', 'bc16472828abe30f951aec97ebe649e1dc7710cc:src/prototype/visuals.js'],
    { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
  );
  const sandbox = {
    module: { exports: {} },
    require: Module.createRequire(path.join(root, 'src/prototype/visuals.js')),
  };
  vm.runInNewContext(originalSource, sandbox, {
    filename: 'frontier-pre-reconciliation-visuals.js',
  });
  Original = sandbox.module.exports;
  assert.equal(typeof Original.floor, 'function');
}

const width = 660;
const height = 440;
const scenes = [
  ['Emberwatch', 650, 730, 120],
  ['Burned Hamlet', 1240, 1080, 120],
  ['West regrowth', 770, 2210, 120],
  ['North ravine', 1450, 1100, 120],
  ['Checkpoint', 2600, 1650, 120],
  ['Bastion', 2920, 2970, 490],
];
const image = async (V) => {
  const game = new Campaign('normal', 'paladin', () => 0.9);
  game.enter('frontier');
  const montage = createCanvas(width * 3, height * 2);
  const target = montage.getContext('2d');
  for (const [index, entry] of scenes.entries()) {
    const [name, x, y, clock] = entry;
    Object.assign(game.hero, game.safe(x, y));
    game.s.clock = clock;
    const prior = JSON.stringify(game.s);
    const canvas = createCanvas(width, height);
    const renderer = Renderer.create({
      canvas,
      ctx: canvas.getContext('2d'),
      getGame: () => game,
      platform: {
        cameraZoom: 1.5,
        cameraAnchor: () => ({ x: width / 2, y: height * 0.54 }),
      },
      Campaign,
      PrototypeVisuals: V,
      PrototypeCombatVisuals: Effects,
      now: () => 16000,
      chargePresentation: () => null,
      isPaused: () => false,
    });
    renderer.draw();
    assert.equal(JSON.stringify(game.s), prior, name + ' native render must not mutate game state');
    const left = (index % 3) * width, top = Math.floor(index / 3) * height;
    target.drawImage(canvas, left, top);
    target.fillStyle = 'rgba(21, 22, 21, 0.84)';
    target.fillRect(left, top, width, 26);
    target.font = '15px sans-serif';
    target.fillStyle = '#f3ead9';
    target.fillText(name + (clock > 300 ? ' / night' : ' / day'), left + 12, top + 18);
  }
  return sharp(montage.toBuffer('image/png')).webp({ quality: 76 }).toBuffer();
};
function emit(name, buffer) {
  const value = buffer.toString('base64');
  console.log('FRONTIER_QA_START ' + name + ' ' + value.length);
  for (let i = 0; i < value.length; i += 6000)
    console.log('FRONTIER_QA_CHUNK ' + name + ' ' + String(i / 6000) + ' ' + value.slice(i, i + 6000));
  console.log('FRONTIER_QA_END ' + name);
}
(async () => {
  const before = Original ? await image(Original) : null;
  const after = await image(Visuals);
  const metadata = await sharp(after).metadata();
  assert.equal(metadata.width, width * 3);
  assert.equal(metadata.height, height * 2);
  if (before) assert.notDeepEqual(before, after, 'new lore ground changes native pixels');
  if (process.env.FRONTIER_QA_SHOW === '1') {
    if (before) emit('before', before);
    emit('after', after);
  }
  console.log('PASS six actual Frontier game scenes at 150% zoom, expected render dimensions and no state changes');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

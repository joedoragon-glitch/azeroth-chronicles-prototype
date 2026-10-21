'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  { createCanvas, Image } = require('@napi-rs/canvas');
global.Image = Image;
global.OffscreenCanvas = class {
  constructor(w, h) {
    return createCanvas(w, h);
  }
};
const C = require('../../../../src/prototype/engine.js'),
  V = require('../../../../src/prototype/visuals.js'),
  CV = require('../../../../src/prototype/combat-visuals.js'),
  Renderer = require('../../../../src/prototype/renderer.js'),
  Sprites = require('../../../../src/prototype/sprites.js');
global.document = { createElement: () => createCanvas(2, 2) };
const captures = [];
function capture(g, name, x, y, width = 1280, height = 800, zoom = 1.5) {
  Object.assign(g.hero, g.safe(x, y));
  g.s.clock = 200;
  const canvas = createCanvas(width, height),
    r = Renderer.create({
      canvas,
      ctx: canvas.getContext('2d'),
      getGame: () => g,
      platform: { cameraZoom: zoom, cameraAnchor: () => ({ x: width * 0.5, y: height * 0.5 }) },
      Campaign: C,
      PrototypeVisuals: V,
      PrototypeCombatVisuals: CV,
      PrototypeSprites: Sprites,
      chargePresentation: () => null,
      isPaused: () => false,
      now: () => 16000,
    });
  r.draw();
  const state = JSON.stringify(g.s);
  r.draw();
  assert.equal(JSON.stringify(g.s), state, 'render purity');
  fs.writeFileSync(path.join(__dirname, name + '.png'), canvas.toBuffer('image/png'));
  captures.push({ name, width, height, zoom });
}
(async () => {
  Sprites.installManifest(require('../../../../assets/sprites/manifest.json'));
  await Sprites.warm(Object.keys(require('../../../../assets/sprites/manifest.json').sprites));
  const g = new C('normal', 'paladin', () => 0.37);
  g.enter('supply-highlands');
  capture(g, 'treasury-overview', 390, 470, 2200, 1250);
  capture(g, 'receiving-and-hearth', 280, 360);
  capture(g, 'accounts-and-defense', 640, 420);
  capture(g, 'private-and-rider-quarters', 440, 700);
  capture(g, 'treasury-phone', 620, 520, 430, 900);
  const canvas = createCanvas(1000, 420),
    ctx = canvas.getContext('2d'),
    states = [];
  ctx.fillStyle = '#dedac5';
  ctx.fillRect(0, 0, 1000, 420);
  for (const [i, structure] of [
    'crown-coin-vault',
    'treasury-audit-counter',
    'ridge-hearth',
    'ridge-study',
    'rider-tack-rack',
    'direwolf-kennel',
  ].entries()) {
    const e = { ...g.zone().props.find((p) => p.structure === structure), renderKind: 'prop' };
    states.push(e);
    V.draw(ctx, e, { x: 85 + (i % 3) * 330, y: 150 + Math.floor(i / 3) * 200 }, 2);
    ctx.fillStyle = '#344b38';
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(structure, 85 + (i % 3) * 330, 190 + Math.floor(i / 3) * 200);
  }
  fs.writeFileSync(
    path.join(__dirname, 'treasury-procedural-families.png'),
    canvas.toBuffer('image/png'),
  );
  fs.writeFileSync(path.join(__dirname, 'scene-state.json'), JSON.stringify(g.snapshot()) + '\n');
  fs.writeFileSync(
    path.join(__dirname, 'exact-states.json'),
    JSON.stringify(states, null, 2) + '\n',
  );
  fs.writeFileSync(
    path.join(__dirname, 'native-review.json'),
    JSON.stringify(
      {
        captures,
        renderStatePure: true,
        proceduralProps: g
          .zone()
          .props.every((e) => Sprites.definitionFor({ ...e, renderKind: 'prop' }, 2) === null),
      },
      null,
      2,
    ) + '\n',
  );
  console.log('PASS five 150% Treasury scenes, procedural props and state purity');
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

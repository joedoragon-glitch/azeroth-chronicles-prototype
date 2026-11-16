'use strict';

// #893: procedural body artwork must not bake a second contact shadow.
// Renderer.groundPresentation owns one shared world-space treatment in Canvas/Pixi.
// This test observes the actual native painter, not a source-text substring.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Visuals = require('../src/prototype/visuals.js');
const Renderer = require('../src/prototype/renderer.js');

function paintedGroundOvals(entity, region = 0) {
  const canvas = createCanvas(480, 340);
  const native = canvas.getContext('2d');
  let pathEllipse = null;
  const ovals = [];
  const ctx = new Proxy(native, {
    get(target, prop) {
      if (prop === 'beginPath')
        return (...args) => {
          pathEllipse = null;
          return target.beginPath(...args);
        };
      if (prop === 'ellipse')
        return (...args) => {
          pathEllipse = { x: args[0], y: args[1], rx: args[2], ry: args[3] };
          return target.ellipse(...args);
        };
      if (prop === 'fill')
        return (...args) => {
          // Obsolete shade() embedded exactly this ground-darkening oval at
          // local (0, 10), including within an already-grounded boss/pet body.
          if (
            target.fillStyle === '#07110d' &&
            pathEllipse &&
            pathEllipse.x === 0 &&
            pathEllipse.y === 10
          )
            ovals.push({ ...pathEllipse, opacity: target.globalAlpha });
          return target.fill(...args);
        };
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
  // A positive control proves the interception actually sees a native fill.
  ctx.save();
  ctx.fillStyle = '#07110d';
  ctx.globalAlpha = 0.24;
  ctx.beginPath();
  ctx.ellipse(0, 10, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  assert.equal(ovals.length, 1, 'native ground-oval tracing is operational');
  ovals.length = 0;
  Visuals.draw(ctx, entity, { x: 240, y: 230 }, region, false);
  return { ovals, pixels: native.getImageData(0, 0, 480, 340).data };
}

for (const [name, entity, region] of [
  ['ordinary Thornfang', { id: 'shadow-thorn', renderKind: 'enemy', type: 'boss', family: 'thorn', form: 'normal' }, 0],
  ['TRUE Thornfang', { id: 'shadow-thorn-true', renderKind: 'enemy', type: 'boss', family: 'thorn', form: 'true' }, 0],
  ['Cindermaw', { id: 'shadow-cindermaw', renderKind: 'enemy', type: 'boss', family: 'cindermaw', form: 'normal' }, 3],
  ['TRUE Cindermaw', { id: 'shadow-cindermaw-true', renderKind: 'enemy', type: 'boss', family: 'cindermaw', form: 'true' }, 3],
  ['Citadel pet', { id: 'shadow-pet-citadel', renderKind: 'ally', type: 'pet', petFamily: 'citadel' }, 4],
  ['Thorn pet', { id: 'shadow-pet-thorn', renderKind: 'ally', type: 'pet', petFamily: 'thorn' }, 0],
  ['Barracks landscape paint', { id: 'shadow-barracks', renderKind: 'building', kind: 'barracks', progress: 4, full: false }, 0],
]) {
  const { ovals, pixels } = paintedGroundOvals(entity, region);
  assert.deepEqual(ovals, [], name + ' must not bake an extra world contact shadow into the body');
  assert(pixels.some((value, index) => index % 4 === 3 && value > 0), name + ' actual procedural body still paints');
}

// The actual stronghold prop is a decorative 'wolf-den', not the landmark
// whose id is simply 'wolf-den'. Both need the same authored den body.
// Before #893 continuation the prop produced zero pixels and could make
// Pixi's procedural preparation fail (Canvas silently painted only a shadow).
const wolfDen = {
  id: 'stronghold-wolf-packhold-prop-0',
  renderKind: 'prop',
  structure: 'wolf-den',
  decorative: true,
  stronghold: 'wolf-packhold',
  strongholdDefenseStyle: 'ruin',
  x: 235,
  y: 970,
  r: 0,
};
const wolfSaved = JSON.stringify(wolfDen);
const wolfCanvas = createCanvas(576, 576);
Visuals.draw(wolfCanvas.getContext('2d'), wolfDen, { x: 288, y: 460 }, 2, false);
assert.equal(JSON.stringify(wolfDen), wolfSaved, 'decorative prop paint must not mutate saved object');
const wolfData = wolfCanvas.getContext('2d').getImageData(0, 0, 576, 576).data;
let wolfPainted = 0;
for (let i = 3; i < wolfData.length; i += 4) if (wolfData[i] > 16) wolfPainted++;
assert(wolfPainted > 500, 'the native stronghold wolf-den prop renders its canonical den body');

let darkness = 0;
let dungeon = false;
const game = {
  zoneId: 'vale',
  s: { rescued: {}, throneClaimed: false, statistics: { deaths: 0 } },
  isDungeon: () => dungeon,
  daylightPhase: () => ({ darkness }),
  regionIndex: () => 0,
};
const painter = Renderer.create({
  canvas: { width: 912, height: 420 },
  ctx: {},
  getGame: () => game,
  platform: { cameraZoom: 1.5 },
  chargePresentation: () => null,
  isPaused: () => false,
  Campaign: { rules: { ambientLife: {}, harbors: {} } },
  PrototypeVisuals: Visuals,
  PrototypeSprites: { definitionFor: () => null },
  PrototypeCombatVisuals: {},
});
const ground = (renderKind, overrides = {}) =>
  painter.groundPresentation(painter.presentEntity({
    id: 'ground-check',
    x: 200,
    y: 200,
    ...overrides,
  }, renderKind));
const heroDay = ground('hero');
assert.deepEqual([heroDay.rx, heroDay.ry, heroDay.shadowOpacity], [18, 5.5, 1]);
assert.equal(ground('enemy', { type: 'boss', family: 'thorn' }).rx, 31);
assert.equal(ground('ally', { type: 'pet', petFamily: 'citadel' }).rx, 18);
// A true post contact must not inherit the 22×6 ordinary prop puddle.
// #893 original game screenshot: Marches' roadside lantern casts an
// oversized dark oval several times broader than its visible base.
for (const [structure, rx, ry] of [
  ['roadside-lantern', 7, 2.5],
  ['grave-lamp', 9, 3],
  ['banner', 8, 3],
  ['crown-banner', 8, 3],
  ['royal-flight-standard', 8, 3],
  ['tax-post', 8, 3],
  ['inspection-marker', 8, 3],
  ['checkpoint-standard', 8, 3],
]) {
  const contact = ground('prop', { structure });
  assert.deepEqual([contact.rx, contact.ry, contact.shadowOpacity], [rx, ry, 1],
    structure + ' measured narrow-foot shadow');
}
assert.deepEqual([ground('prop', { structure: 'rope-coil' }).rx,
  ground('prop', { structure: 'rope-coil' }).ry], [22, 6],
  'ordinary coil and structures retain their original grounding policy');
const scaledPost = ground('prop', { structure: 'checkpoint-standard', visualScale: 1.3 });
assert.equal(scaledPost.rx, 10.4, 'narrow post still respects original visualScale');
assert.equal(ground('prop', { greenwoodWall: true }).shadowOpacity, 0);
assert.equal(ground('prop', { greenwoodField: true }).shadowOpacity, 0);
assert.equal(ground('prop', { greenwoodFacility: 'thorn-work' }).shadowOpacity, 0);
assert.equal(ground('prop', { structure: 'wildflowers' }).shadowOpacity, 5 / 16);
darkness = 0.5;
assert.equal(ground('hero').shadowOpacity, 10 / 16, 'twilight uses bounded quantized opacity');
darkness = 1;
assert.equal(ground('hero').shadowOpacity, 4 / 16, 'full nighttime has subdued contact treatment');
assert.equal(ground('prop', { structure: 'roadside-lantern' }).shadowOpacity, 4 / 16,
  'narrow lamp retains the same night attenuation as regular geometry');
assert.equal(ground('prop', { structure: 'wildflowers' }).shadowOpacity, 1 / 16);
dungeon = true;
assert.equal(ground('hero').shadowOpacity, 1, 'existing dungeon illumination policy is unchanged');
assert.equal(ground('prop', { greenwoodField: true }).shadowOpacity, 0);

console.log('PASS #893 actual procedural bosses/pets have no embedded contact shadow; Canvas/Pixi shared shadow dimensions, exclusions and day/twilight/night policy remain intact');

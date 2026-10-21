'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const { createCanvas, Image } = require('@napi-rs/canvas');
global.Image = Image;
const Sprites = require('../../../src/prototype/sprites.js');
global.OffscreenCanvas = class {
  constructor(w, h) {
    return createCanvas(w, h);
  }
};
const C = require('../../../src/prototype/engine.js'),
  V = require('../../../src/prototype/visuals.js'),
  CV = require('../../../src/prototype/combat-visuals.js'),
  Renderer = require('../../../src/prototype/renderer.js');
global.document = { createElement: () => createCanvas(2, 2) };
const captures = [];
const out = __dirname;
const game = new C('developer', 'paladin', () => 0.37);
game.s.zone = 'highlands';
game.zone();
game.s.clock = 200;
game.s.rescued.ridge = true;
game.s.rescued.mine = true;
game.refreshNPCs();
game.hero.hp = game.hero.maxHp = 100000;
function capture(name, x, y, width = 1280, height = 800, zoom = 1.5, night = false) {
  Object.assign(game.hero, game.safe(x, y));
  game.s.clock = night ? 700 : 200;
  const canvas = createCanvas(width, height),
    ctx = canvas.getContext('2d');
  const r = Renderer.create({
    canvas,
    ctx,
    getGame: () => game,
    platform: { cameraZoom: zoom, cameraAnchor: () => ({ x: width * 0.5, y: height * 0.48 }) },
    Campaign: C,
    PrototypeVisuals: V,
    PrototypeCombatVisuals: CV,
    PrototypeSprites: Sprites,
    chargePresentation: () => null,
    isPaused: () => false,
    now: () => 16000,
  });
  r.setGroundCache?.(false);
  r.draw();
  const before = JSON.stringify(game.s);
  r.draw();
  assert.equal(JSON.stringify(game.s), before, 'render state purity ' + name);
  if (name === 'woodland-phone')
    assert(r.metrics().outlineMasks > 0, 'foreground tree actor outlines');
  captures.push({ name, width, height, zoom, night, outlineMasks: r.metrics().outlineMasks });
  fs.writeFileSync(path.join(out, name + '.png'), canvas.toBuffer('image/png'));
}
function isolatedReferences() {
  const z = game.zone(),
    states = [];
  for (const species of ['oak', 'maple', 'hickory', 'birch', 'beech', 'tulip', 'spruce']) {
    const e = z.props.find((p) => p.highlandsNature === 'tree' && p.treeSpecies === species);
    if (e) states.push({ label: species, entity: { ...e, renderKind: 'prop' } });
  }
  for (const kind of ['fern', 'laurel', 'fallen-log']) {
    const e = z.props.find((p) => p.highlandsNature === kind);
    if (e) states.push({ label: kind, entity: { ...e, renderKind: 'prop' } });
  }
  for (const structure of [
    'appalachian-silver-workings',
    'appalachian-copper-workings',
    'appalachian-ore-washer',
  ]) {
    const e = z.props.find((p) => p.structure === structure);
    if (e)
      states.push({
        label: structure.replace('appalachian-', ''),
        entity: { ...e, renderKind: 'prop' },
      });
  }
  for (const e of z.nodes)
    states.push({ label: e.storageStyle, entity: { ...e, renderKind: 'node' } });
  const canvas = createCanvas(1260, 660),
    ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e5e0ca';
  ctx.fillRect(0, 0, 1260, 660);
  states.forEach(({ label, entity }, i) => {
    const x = 90 + (i % 7) * 180,
      y = 170 + Math.floor(i / 7) * 220;
    V.draw(ctx, entity, { x, y }, 2);
    ctx.fillStyle = '#344b38';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 30);
  });
  fs.writeFileSync(path.join(out, 'isolated-families.png'), canvas.toBuffer('image/png'));
  fs.writeFileSync(path.join(out, 'isolated-states.json'), JSON.stringify(states, null, 2) + '\n');
}
function faunaReferences() {
  const z = game.zone(),
    wild = z.enemies.filter(
      (e) => e.species === 'wolf' && !e.crownTroop && !e.mountedCrownRider && e.type !== 'boss',
    ),
    hash = (value) => {
      let n = 2166136261;
      for (const c of String(value)) n = Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0;
      return n;
    },
    states = [];
  for (let i = 0; i < 3; i++) {
    const e = wild.find((e) => hash(e.id) % 3 === i);
    assert(e, 'wild coat variant');
    states.push({
      label: ['brown forest wolf', 'buff forest wolf', 'rust forest wolf'][i],
      entity: { ...e, renderKind: 'enemy' },
    });
  }
  for (const ranged of [false, true]) {
    const e = z.enemies.find((e) => e.mountedCrownRider && !!e.ranged === ranged);
    assert(e);
    states.push({
      label: ranged ? 'Crown mounted Ranger' : 'Crown mounted Soldier',
      entity: { ...e, renderKind: 'enemy' },
    });
  }
  const canvas = createCanvas(1400, 360),
    ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d8d8bc';
  ctx.fillRect(0, 0, 1400, 360);
  states.forEach(({ label, entity }, i) => {
    V.draw(ctx, entity, { x: 140 + i * 280, y: 245 }, 2);
    ctx.fillStyle = '#344b38';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 140 + i * 280, 310);
  });
  fs.writeFileSync(path.join(out, 'fauna-families.png'), canvas.toBuffer('image/png'));
  fs.writeFileSync(path.join(out, 'fauna-states.json'), JSON.stringify(states, null, 2) + '\n');
}
async function main() {
  Sprites.installManifest(require('../../../assets/sprites/manifest.json'));
  await Sprites.warm(Object.keys(require('../../../assets/sprites/manifest.json').sprites));
  capture('overview', 1700, 1700, 1800, 1050, 0.31);
  capture('stonecross', 750, 2180);
  capture('northern-workings', 800, 430);
  capture('outpost', 2550, 510);
  capture('shore', 500, 1900);
  capture('woodland', 1120, 1660);
  capture('mine-approach', 2850, 2780);
  capture('stonecross-night', 750, 2180, 1280, 800, 1.5, true);
  capture('woodland-phone', 1120, 1660, 430, 900);
  for (const n of game.zone().nodes) {
    capture('search-' + n.tributeId, n.x, n.y + 100);
    game.locateTribute(n);
    capture('found-' + n.tributeId, n.x, n.y + 100);
  }
  isolatedReferences();
  faunaReferences();
  capture('forest-wolf-territory', 480, 1010);
  capture('treasury-approach', 1920, 430);
  capture('ridge-watch', 2850, 1170);
  capture('ogre-hearth', 940, 3010);
  capture('signal-keep', 3000, 2030);
  capture('caravan', 3100, 500);
  capture('north-bridge', 1610, 950);
  capture('haul-crossing', 1890, 2300);
  capture('shore-phone', 425, 1900, 430, 900);

  fs.writeFileSync(
    path.join(out, 'native-review.json'),
    JSON.stringify({ captures, sprites: Sprites.status(), statePure: true }, null, 2) + '\n',
  );
  console.log('PASS twenty-six native captures, native foliage outlines and render-state purity');
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

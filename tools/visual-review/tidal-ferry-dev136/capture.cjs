'use strict';
const fs = require('fs'),
  vm = require('vm'),
  path = require('path'),
  { createCanvas, Image } = require('@napi-rs/canvas');
const root = path.resolve(__dirname, '../../..');
class FileImage extends Image {
  set src(v) {
    super.src = typeof v === 'string' ? fs.readFileSync(path.resolve(root, v)) : v;
  }
}
global.Image = FileImage;
global.OffscreenCanvas = (w, h) => createCanvas(w, h);
const C = require(root + '/src/prototype/engine'),
  S = require(root + '/src/prototype/sprites'),
  Materials = require(root + '/src/prototype/materials');
const sandbox = { PrototypeRules: C.rules, performance: { now: () => 16000 } };
vm.runInNewContext(fs.readFileSync(root + '/src/prototype/visuals.js', 'utf8'), sandbox);
(async () => {
  const manifest = require(root + '/assets/sprites/manifest.json');
  if (process.env.FERRY_CANDIDATE) {
    const file = path.resolve(root, process.env.FERRY_CANDIDATE),
      record = JSON.parse(fs.readFileSync(file)),
      pipeline = require(root + '/scripts/sprite-pipeline.cjs');
    manifest.sprites[record.key] = {
      ...pipeline.entryFor(record),
      src: './assets/sprites/transport-ferry-' + record.output.hash + '.webp',
    };
  }
  if (!S.installManifest(manifest)) throw Error('Manifest rejected');
  await S.warm(Object.keys(manifest.sprites), { variants: true, clips: true });
  const mats = new Materials({ Image: FileImage, createCanvas });
  mats.install(require(root + '/assets/materials/manifest.json'));
  await Promise.all(Object.keys(mats.entries).map((k) => mats.ensure(k)));
  global.document = { createElement: () => createCanvas(1, 1) };
  for (const [name, zone, x, y, night, zoom, w, h] of [
    ['shore-day', 'march', 1840, 2740, false, 1.5, 1280, 800],
    ['shore-night', 'march', 1840, 2740, true, 1.5, 1280, 800],
    ['phone-day', 'march', 1810, 2850, false, 1.5, 375, 800],
    ['phone-night', 'march', 1810, 2850, true, 1.5, 800, 375],
    ['highlands-day', 'highlands', 425, 1900, false, 1.5, 1280, 800],
    ['highlands-night', 'highlands', 425, 1900, true, 1.5, 1280, 800],
  ]) {
    const g = new C('normal', 'mage', () => 0.73);
    g.enter(zone);
    const ferry = g.zone().npcs.find((n) => n.harbor);
    if (S.definitionFor({ ...ferry, renderKind: 'npc' }, g.regionIndex())?.key !== 'transport:ferry')
      throw Error('Ferry raster not selected');
    g.s.clock = night ? 500 : 190;
    if (night) g.updateNight();
    g.s.mercyTime = 0;
    g.s.party = [];
    Object.assign(g.hero, g.safe(x, y));
    const c = createCanvas(w, h),
      ctx = c.getContext('2d'),
      platform = require(root + '/src/prototype/platform').init({
        location: { search: '?experience=' + (w < 900 ? 'phone' : 'desktop') },
        localStorage: { getItem: () => null },
        document: { body: { getAttribute: () => null, setAttribute: () => {} } },
      });
    platform.selectCameraZoom(zoom);
    if (zoom < 1) Object.defineProperty(platform, 'cameraZoom', { value: zoom });
    const r = require(root + '/src/prototype/renderer').create({
      canvas: { width: w, height: h },
      ctx,
      getGame: () => g,
      platform,
      Campaign: C,
      PrototypeVisuals: sandbox.PrototypeVisuals,
      PrototypeCombatVisuals: require(root + '/src/prototype/combat-visuals'),
      PrototypeSprites: S,
      PrototypeMaterials: mats,
      now: () => 16000,
      chargePresentation: () => null,
      isPaused: () => false,
    });
    const before = JSON.stringify(g.s);
    r.draw();
    if (JSON.stringify(g.s) !== before) throw Error('render mutated state');
    fs.writeFileSync(path.join(__dirname, name + '.webp'), c.toBuffer('image/webp'));
    if (S.status().failed) throw Error('Sprite decode failed');
    console.log('Rendered ' + name);
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

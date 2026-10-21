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
  S.installManifest(manifest);
  await S.warm(Object.keys(manifest.sprites), { variants: true, clips: true });
  const mats = new Materials({ Image: FileImage, createCanvas });
  mats.install(require(root + '/assets/materials/manifest.json'));
  await Promise.all(Object.keys(mats.entries).map((k) => mats.ensure(k)));
  global.document = { createElement: () => createCanvas(1, 1) };
  for (const [name, x, y, night, zoom, w, h] of [
    ['shore-day', 1840, 2630, false, 1.15, 1500, 900],
    ['shore-night', 1840, 2630, true, 1.15, 1500, 900],
    ['marches-coast-overview', 1700, 1770, false, 0.58, 1700, 1100],
    ['archive-west-bank', 560, 2340, false, 1.15, 1200, 800],
    ['fisher-lagoon', 1120, 560, false, 1.15, 1200, 800],
    ['watchhouse-estuary', 2550, 1680, false, 1.15, 1200, 800],
    ['treasury-northeast', 2580, 550, false, 1.15, 1200, 800],
    ['shore-phone-night', 1840, 2630, true, 1.5, 390, 844],
    ['shore-phone-landscape', 1840, 2630, true, 1.5, 844, 390],
  ]) {
    const g = new C('normal', 'mage', () => 0.73);
    g.enter('march');
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
    console.log('Rendered ' + name);
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

'use strict';
const fs = require('node:fs'),
  vm = require('node:vm'),
  path = require('node:path');
const root = path.resolve(__dirname, '../../..'),
  out = __dirname;
const { createCanvas, Image } = require(root + '/node_modules/@napi-rs/canvas');
class FileImage extends Image {
  set src(value) {
    super.src = typeof value === 'string' ? fs.readFileSync(path.resolve(root, value)) : value;
  }
}
global.Image = FileImage;
global.OffscreenCanvas = function (w, h) {
  return createCanvas(w, h);
};
const C = require(root + '/src/prototype/engine'),
  R = C.rules,
  S = require(root + '/src/prototype/sprites'),
  Materials = require(root + '/src/prototype/materials');
const sandbox = { PrototypeRules: R, performance: { now: () => 16000 } };
vm.runInNewContext(fs.readFileSync(root + '/src/prototype/visuals.js', 'utf8'), sandbox);
const V = sandbox.PrototypeVisuals;
(async () => {
  const manifest = require(root + '/assets/sprites/manifest.json');
  S.installManifest(manifest);
  await S.warm(Object.keys(manifest.sprites), { variants: true, clips: true });
  const mats = new Materials({ Image: FileImage, createCanvas });
  mats.install(require(root + '/assets/materials/manifest.json'));
  await Promise.all(Object.keys(mats.entries).map((k) => mats.ensure(k)));
  global.document = { createElement: () => createCanvas(1, 1) };
  for (const [name, zone, x, y] of [['native-valley', 'vale', 650, 650]]) {
    const g = new C('normal', 'mage', () => 0.9);
    g.enter(zone);
    g.s.clock = 190;
    g.s.expeditionRank = 6;
    g.s.mercyTime = 0;
    g.hero.order = null;
    g.hero.name = 'Mayra';
    Object.assign(g.hero, g.safe(x, y));
    g.s.party = ['citadel', 'ridge', 'warlord'].map((f) => g.unit('pet', x, y, f));
    g.s.party.forEach((u, i) => {
      const [dx, dy] = [
        [-85, 85],
        [85, -85],
        [155, 155],
      ][i];
      Object.assign(u, g.safe(x + dx, y + dy));
    });
    const width = 1600,
      height = 950,
      ratio = 1.3,
      c = createCanvas(width * ratio, height * ratio),
      ctx = c.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const platform = require(root + '/src/prototype/platform').init({
      location: { search: '?experience=desktop' },
      localStorage: { getItem: () => null },
      document: { body: { getAttribute: () => null, setAttribute: () => {} } },
    });
    platform.selectCameraZoom(1.75);
    const renderer = require(root + '/src/prototype/renderer').create({
      canvas: { width, height },
      ctx,
      getGame: () => g,
      platform,
      Campaign: C,
      PrototypeVisuals: V,
      PrototypeCombatVisuals: require(root + '/src/prototype/combat-visuals'),
      PrototypeSprites: S,
      PrototypeMaterials: mats,
      now: () => 16000,
      chargePresentation: () => null,
      isPaused: () => false,
    });
    const before = JSON.stringify(g.s);
    renderer.draw();
    if (JSON.stringify(g.s) !== before) throw Error('Renderer changed state');
    fs.writeFileSync(out + '/' + name + '.png', c.toBuffer('image/png'));
    console.log(name, renderer.screen(g.hero));
  }
  console.log('Native renderer complete', S.status().decodedBytes, mats.status().decodedBytes);
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

'use strict';
// Source-native interior composition review, never an automated playthrough.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto'),
  zlib = require('node:zlib'),
  sharp = require('sharp'),
  { createCanvas, Image } = require('@napi-rs/canvas');
global.Image = Image;
global.OffscreenCanvas = class {
  constructor(w, h) {
    return createCanvas(w, h);
  }
};
global.document = { createElement: () => createCanvas(2, 2) };
const C = require('../../src/prototype/engine'),
  V = require('../../src/prototype/visuals'),
  FX = require('../../src/prototype/combat-visuals'),
  Renderer = require('../../src/prototype/renderer'),
  Sprites = require('../../src/prototype/sprites'),
  { rng } = require('./fixtures.cjs');
const out = path.resolve(process.argv[process.argv.indexOf('--out') + 1]);
assert(process.argv.includes('--out'), 'explicit evidence output required');
fs.mkdirSync(out, { recursive: true });
(async () => {
  Sprites.installManifest(require('../../assets/sprites/manifest.json'));
  await Sprites.warm(Object.keys(require('../../assets/sprites/manifest.json').sprites));
  const receipts = [],
    saves = [];
  for (const id of ['supply-vale', 'crypt', 'side-vale-cellars']) {
    const g = new C('normal', 'paladin', rng(0x47564101));
    g.enter(id);
    saves.push([id, g.snapshot()]);
    const size = g.zoneSize(),
      center = size / 2;
    const views =
      id === 'crypt'
        ? [
            ['whole', 750, 750, 3400, 1750],
            ['work', 1050, 500, 1280, 800],
            ['defense', 1070, 1160, 1280, 800],
            ['phone', 1070, 1160, 393, 852],
          ]
        : [
            ['whole', center, center, 2400, 1300],
            ['work', id === 'supply-vale' ? 680 : 430, id === 'supply-vale' ? 450 : 260, 1280, 800],
            ['home', id === 'supply-vale' ? 260 : 700, 740, 1280, 800],
            ['phone', center, center, 393, 852],
          ];
    for (const [name, x, y, width, height] of views) {
      Object.assign(g.hero, g.safe(x, y));
      g.s.clock = 120;
      const canvas = createCanvas(width, height),
        renderer = Renderer.create({
          canvas,
          ctx: canvas.getContext('2d'),
          getGame: () => g,
          platform: { cameraZoom: 1.5, cameraAnchor: () => ({ x: width / 2, y: height / 2 }) },
          Campaign: C,
          PrototypeVisuals: V,
          PrototypeCombatVisuals: FX,
          PrototypeSprites: Sprites,
          chargePresentation: () => null,
          isPaused: () => false,
          now: () => 16000,
        });
      renderer.draw();
      const before = JSON.stringify(g.snapshot());
      renderer.draw();
      assert.equal(JSON.stringify(g.snapshot()), before, 'render must be read-only');
      const file = id + '-' + name + '.webp';
      await sharp(canvas.toBuffer('image/png')).webp({ quality: 90 }).toFile(path.join(out, file));
      receipts.push({
        id,
        file,
        name,
        width,
        height,
        zoom: 1.5,
        hero: { x: g.hero.x, y: g.hero.y },
        renderStateUnchanged: true,
      });
    }
  }
  const states = [];
  const sheet = createCanvas(1500, 680),
    sc = sheet.getContext('2d');
  sc.fillStyle = '#e0dccb';
  sc.fillRect(0, 0, 1500, 680);
  const seen = new Set();
  for (const [, s] of saves)
    for (const p of s.zones[s.zone].props)
      if (p.greenwoodInteriorAsset && !seen.has(p.greenwoodInteriorAsset)) {
        seen.add(p.greenwoodInteriorAsset);
        const index = states.length,
          x = 120 + (index % 6) * 250,
          y = 160 + Math.floor(index / 6) * 220;
        const e = { ...p, renderKind: 'prop' };
        V.draw(sc, e, { x, y }, 0);
        sc.font = '15px sans-serif';
        sc.fillStyle = '#364638';
        sc.textAlign = 'center';
        sc.fillText(p.structure, x, y + 55);
        states.push(e);
      }
  await sharp(sheet.toBuffer('image/png'))
    .webp({ quality: 92 })
    .toFile(path.join(out, 'procedural-furniture.webp'));
  fs.writeFileSync(
    path.join(out, 'exact-furniture-states.json'),
    JSON.stringify(states, null, 2) + '\n',
  );
  const sources = Object.fromEntries(
    ['engine', 'world', 'rules', 'visuals', 'sprites', 'greenwood-interiors']
      .filter((n) => fs.existsSync('src/prototype/' + n + '.js'))
      .map((n) => [
        n,
        crypto
          .createHash('sha256')
          .update(fs.readFileSync('src/prototype/' + n + '.js'))
          .digest('hex'),
      ]),
  );
  fs.writeFileSync(
    path.join(out, 'receipt.json'),
    JSON.stringify(
      {
        layer:
          'Production renderer on software Canvas, retained registered assets and procedural fallbacks; no browser/device/FPS or owner acceptance claim',
        sources,
        receipts,
      },
      null,
      2,
    ) + '\n',
  );
  const savePath = path.join(out, 'synthetic-interiors-v4.json.gz');
  if (process.argv.includes('--save-fixtures')) {
    assert(!fs.existsSync(savePath), 'never overwrite preserved inputs');
    fs.writeFileSync(savePath, zlib.gzipSync(JSON.stringify({ synthetic: true, sources, saves })));
  }
  console.log('PASS ' + receipts.length + ' read-only source-native interior views at 150%');
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

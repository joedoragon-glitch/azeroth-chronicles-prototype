'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..'),
  C = require(root + '/src/prototype/engine'),
  V = require(root + '/src/prototype/visuals'),
  FX = require(root + '/src/prototype/combat-visuals'),
  Renderer = require(root + '/src/prototype/renderer');
const sharp = require(root + '/node_modules/sharp');
const { createCanvas, loadImage } = require(root + '/node_modules/@napi-rs/canvas');
const g = new C('developer', 'mage', () => 0.9);
g.enter('frontier');
g.s.clock = 120;
const z = g.zone();
const captures = [
  ['channel-north', 1455, 110],
  ['channel-south', 1455, 3310],
  ['civic-fountain', 1820, 1210],
  ['recovering-woodland', 620, 2090],
];
for (const [name, x, y] of captures) {
  Object.assign(g.hero, { x, y });
  const before = JSON.stringify(g.s),
    canvas = createCanvas(1100, 700),
    ctx = canvas.getContext('2d');
  const r = Renderer.create({
    canvas,
    ctx,
    getGame: () => g,
    platform: { cameraZoom: 1.5, cameraAnchor: () => ({ x: 350, y: 280 }) },
    Campaign: C,
    PrototypeVisuals: V,
    PrototypeCombatVisuals: FX,
    now: () => 16000,
    chargePresentation: () => null,
    isPaused: () => false,
  });
  r.draw();
  assert.equal(JSON.stringify(g.s), before, 'capture is read only');
  fs.writeFileSync(__dirname + '/' + name + '.png', canvas.toBuffer('image/png'));
}
(async () => {
  const canvas = createCanvas(1000, 380),
    ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4b4941';
  ctx.fillRect(0, 0, 1000, 380);
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(170 + i * 330, 235);
    ctx.scale(2.5, 2.5);
    if (i === 2) {
      const manifest = require(root + '/assets/sprites/manifest.json').sprites[
        'prop:dead-tree:frontier'
      ];
      const image = await loadImage(root + '/' + manifest.src);
      ctx.drawImage(image, -96, -144, 192, 192);
      V.frontierTreeShoots(
        ctx,
        { id: 'raster-tree', renderKind: 'prop', structure: 'dead-tree' },
        { x: 0, y: 0 },
        3,
        true,
      );
    } else
      V.draw(
        ctx,
        {
          id: 'detail-' + i,
          renderKind: 'prop',
          decorative: true,
          structure: i ? 'dead-tree' : 'frontier-civic-fountain',
        },
        { x: 0, y: 0 },
        3,
      );
    ctx.restore();
    ctx.font = '17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#efe9d3';
    ctx.fillText(
      ['Civic fountain', 'Recovering wild tree', 'Retained raster with new shoots'][i],
      170 + i * 330,
      335,
    );
  }
  fs.writeFileSync(__dirname + '/frontier-details.png', canvas.toBuffer('image/png'));
  for (let i = 0; i < 3; i++)
    await sharp(__dirname + '/frontier-details.png')
      .extract({ left: i * 330, top: 0, width: 330, height: 380 })
      .webp({ lossless: true })
      .toFile(
        __dirname +
          '/' +
          ['fountain-body', 'wild-tree-body', 'raster-tree-shoots-body'][i] +
          '.webp',
      );
  for (const name of [...captures.map((c) => c[0]), 'frontier-details']) {
    await sharp(__dirname + '/' + name + '.png')
      .webp({ lossless: true })
      .toFile(__dirname + '/' + name + '.webp');
    fs.unlinkSync(__dirname + '/' + name + '.png');
  }
  console.log(
    'PASS native canvas: both channel boundaries, fountain context, regrowing woodland, retained raster overlay; campaign state unchanged',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

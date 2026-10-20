'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const root = path.resolve(__dirname, '../../..'),
  { createCanvas } = require(root + '/node_modules/@napi-rs/canvas');
const src = fs.readFileSync(root + '/src/prototype/visuals.js', 'utf8');
const before = "softRect(side * 10 - 2, -7.5, 4, 2.5, '#967bb6', 0.7);";
const bows = `
        for (const direction of [-1, 1]) {
          shaped(direction < 0 ? '#8870ac' : '#ac8bca', () => {
            ctx.moveTo(side * 10, -6.3);
            ctx.bezierCurveTo(side * 10 + direction * 7, -13, side * 10 + direction * 7, -3, side * 10, -6.3);
          });
          line([[side * 10 + direction, -6.4], [side * 10 + direction * 4, -7.5]], '#ddc2eb', 0.55);
          shaped('#a38ac3', () => {
            ctx.moveTo(side * 10 + direction * 0.8, -5.8);
            ctx.lineTo(side * 10 + direction * 3, -1.1);
            ctx.lineTo(side * 10 + direction * 1.4, -1.7);
            ctx.lineTo(side * 10 + direction * 0.6, -0.5);
            ctx.lineTo(side * 10 - direction * 0.3, -5.6);
          });
        }
        oval(side * 10, -6.3, 1.45, 1.6, '#79588f');
        oval(side * 10 - 0.3, -6.8, 0.55, 0.6, '#d9b9e8');`;
if (!src.includes(before)) throw Error('Tie source changed');
function load(source) {
  const c = { PrototypeRules: require(root + '/src/prototype/rules.js') };
  vm.runInNewContext(source, c);
  return c.PrototypeVisuals;
}
const versions = [load(src), load(src.replace(before, bows))];
const canvas = createCanvas(1080, 740),
  ctx = canvas.getContext('2d');
ctx.fillStyle = '#262d34';
ctx.fillRect(0, 0, 1080, 740);
ctx.font = '20px sans-serif';
ctx.textAlign = 'center';
ctx.fillStyle = '#e3e5dd';
ctx.fillText('Mage braid ties · Bow preview', 540, 35);
for (let crowned = 0; crowned < 2; crowned++)
  for (let version = 0; version < 2; version++) {
    const x = 270 + version * 540,
      y = 260 + crowned * 340;
    ctx.fillStyle = '#34414a';
    ctx.fillRect(x - 245, y - 220, 490, 300);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(3.15, 3.15);
    versions[version].draw(
      ctx,
      { id: 'mage-bow-preview', renderKind: 'hero', class: 'mage', crowned: !!crowned },
      { x: 0, y: 0 },
      3,
    );
    ctx.restore();
    ctx.fillStyle = '#e3e5dd';
    ctx.font = '16px sans-serif';
    ctx.fillText(
      (version ? 'Violet bows' : 'Current ties') + (crowned ? ' · Crowned' : ' · Regular'),
      x,
      y + 63,
    );
  }
fs.writeFileSync(__dirname + '/mage-bows-preview.png', canvas.toBuffer('image/png'));
fs.writeFileSync(
  __dirname + '/mage-bows-candidate.json',
  JSON.stringify(
    {
      status: 'Preview only; owner selection pending. Runtime Mage source is unchanged.',
      before,
      replacement: bows,
      source: 'src/prototype/visuals.js::mageHead',
      date: '2026-10-20',
    },
    null,
    2,
  ) + '\n',
);

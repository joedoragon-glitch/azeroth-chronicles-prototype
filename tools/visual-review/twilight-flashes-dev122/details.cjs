'use strict';
const fs = require('node:fs'),
  vm = require('node:vm'),
  { createCanvas } = require('@napi-rs/canvas');
const src = fs.readFileSync('src/prototype/visuals.js', 'utf8');
const detail = vm.runInNewContext(
  src.slice(src.indexOf('  function groundDetail('), src.indexOf('  function floor(')) +
    ';groundDetail',
);
const c = createCanvas(540, 220),
  ctx = c.getContext('2d');
ctx.fillStyle = '#294b36';
ctx.fillRect(0, 0, c.width, c.height);
ctx.fillStyle = '#ecf1e7';
ctx.font = '15px sans-serif';
ctx.fillText('Greenwood dandelions · enlarged procedural detail', 18, 26);
ctx.save();
ctx.scale(5, 5);
for (let i = 0; i < 4; i++) {
  const seed = [2048, 2050, 2051, 2053][i],
    dx = (seed % 35) - 17,
    dy = ((seed >>> 5) % 15) + 12;
  detail(ctx, { x: 15 + i * 25 - dx, y: 28 - dy }, seed, 0, false, '', []);
}
ctx.restore();
fs.writeFileSync(__dirname + '/captures/dandelion-detail.png', c.toBuffer('image/png'));

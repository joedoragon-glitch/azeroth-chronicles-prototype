'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const root = path.resolve(__dirname, '../../..');
const C = require(root + '/src/prototype/engine'),
  V = require(root + '/src/prototype/visuals');
const { draw, options } = require('./designs.cjs');
const g = new C('developer', 'mage', () => 0.8),
  z = g.zone();
const sourceState = JSON.stringify(g.s);
const dim = { width: 1440, height: 790 };
function text(ctx, s, x, y, size = 18, color = '#e0d7b6', bold = false) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? '600' : '400'} ${size}px sans-serif`;
  ctx.fillText(s, x, y);
}
function grass(ctx, x, y, w, h) {
  ctx.fillStyle = '#34543e';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#71835a';
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    const a = x + 18 + ((i * 73) % (w - 40)),
      b = y + 20 + ((i * 47) % (h - 40));
    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.lineTo(a + 2, b - 6);
    ctx.moveTo(a + 5, b);
    ctx.lineTo(a + 4, b - 8);
    ctx.stroke();
  }
}
function paintCurrent(ctx, item, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const e = z.npcs.find((n) => n.id === item.entity);
  assert(e, item.id);
  V.draw(
    ctx,
    { ...e, renderKind: 'npc', visualScale: V.featureScale({ ...e, renderKind: 'npc' }) },
    { x: 0, y: 0 },
    0,
  );
  ctx.restore();
}
const stats = [];
for (const item of options) {
  const canvas = createCanvas(dim.width, dim.height),
    ctx = canvas.getContext('2d');
  ctx.fillStyle = '#142a25';
  ctx.fillRect(0, 0, dim.width, dim.height);
  text(ctx, item.name, 30, 43, 29, '#efda9f', true);
  text(ctx, 'PROCEDURAL OPTIONS  /  PREVIEW ONLY  /  A · B · C', 30, 72, 13, '#9db6a0');
  for (let i = 0; i < 3; i++) {
    const left = 24 + i * 472,
      mid = left + 224;
    ctx.fillStyle = '#203a30';
    ctx.beginPath();
    ctx.roundRect(left, 92, 448, 666, 13);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(left + 12, 104, 424, 330, 9);
    ctx.clip();
    grass(ctx, left + 12, 104, 424, 330);
    draw(ctx, item.id, i, mid, 356, 2.45);
    ctx.restore();
    text(
      ctx,
      String.fromCharCode(65 + i) + '  ' + item.choices[i][0],
      left + 20,
      469,
      23,
      '#efda9f',
      true,
    );
    // Short fixed descriptions wrap at ordinary word boundaries.
    let line = '',
      row = 499;
    for (const word of item.choices[i][1].split(' ')) {
      if (ctx.measureText(line + word).width > 393) {
        text(ctx, line.trim(), left + 20, row, 16, '#bdd0bb');
        line = '';
        row += 22;
      }
      line += word + ' ';
    }
    text(ctx, line.trim(), left + 20, row, 16, '#bdd0bb');
    text(ctx, 'PROCEDURAL SIZE COMPARISON', left + 20, 548, 11, '#97af96', true);
    ctx.save();
    ctx.beginPath();
    ctx.rect(left + 12, 556, 424, 164);
    ctx.clip();
    grass(ctx, left + 12, 556, 424, 164);
    paintCurrent(ctx, item, left + 105, 680, 1.4);
    // One fixed scale per category; never resize individual alternatives to fill cells.
    draw(ctx, item.id, i, left + 306, 680, 1.2);
    ctx.restore();
    text(ctx, 'Current', left + 77, 742, 13, '#b1c2ac');
    text(ctx, 'Option ' + String.fromCharCode(65 + i), left + 271, 742, 13, '#b1c2ac');
    const isolated = createCanvas(540, 540),
      ic = isolated.getContext('2d');
    draw(ic, item.id, i, 270, 439, 3.6);
    const name = `${item.id}-${String.fromCharCode(65 + i)}.png`;
    fs.writeFileSync(path.join(__dirname, name), isolated.toBuffer('image/png'));
    stats.push({
      id: item.id,
      variant: String.fromCharCode(65 + i),
      reference: name,
      bytes: fs.statSync(path.join(__dirname, name)).size,
    });
  }
  fs.writeFileSync(path.join(__dirname, item.id + '-options.png'), canvas.toBuffer('image/png'));
}
// Current native drawings, for the bounded audit and repeatable comparisons.
const auditItems = z.npcs.filter(
  (n) => !n.id.startsWith('thorn-trailhead') && !n.id.includes('thorn-local'),
);
const audit = createCanvas(1200, Math.ceil(auditItems.length / 5) * 220),
  ac = audit.getContext('2d');
ac.fillStyle = '#294b36';
ac.fillRect(0, 0, audit.width, audit.height);
auditItems.forEach((e, i) => {
  const x = (i % 5) * 240 + 120,
    y = Math.floor(i / 5) * 220 + 150;
  ac.save();
  ac.translate(x, y);
  ac.scale(1.8, 1.8);
  V.draw(
    ac,
    { ...e, renderKind: 'npc', visualScale: V.featureScale({ ...e, renderKind: 'npc' }) },
    { x: 0, y: 0 },
    0,
  );
  ac.restore();
  text(ac, e.name.slice(0, 30), x - 108, y + 47, 12, '#e1d4ac');
});
fs.writeFileSync(path.join(__dirname, 'current-landmarks.png'), audit.toBuffer('image/png'));
assert.equal(JSON.stringify(g.s), sourceState, 'preview rendering cannot change campaign state');
assert.equal(stats.length, 18);
fs.writeFileSync(
  path.join(__dirname, 'render-checks.json'),
  JSON.stringify(
    {
      previewOnly: true,
      runtimeImports: 0,
      campaignStatePure: true,
      base: '0f5bf0212dacab5c1551e3ae36915a0bfbf8ca4a',
      options: stats,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'Rendered 18 procedural alternatives, six choice sheets, current landmark audit; campaign state unchanged.',
);

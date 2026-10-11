'use strict';
// Historical render oracle, extracted verbatim from visuals.js at
// c6ce1af236bddd7ca881903499c4cf5de175f9e2. Never update to match candidate.
const R = require('../../src/prototype/rules.js');
function roads(ctx, paths, screen, region = 0, materials = null) {
  const barrier = R.barriers[region],
    palettes = [
      { shoulder: '#564834', base: '#8e7758', inner: '#9c8664', seam: '#6f604c' },
      { shoulder: '#4b5043', base: '#756e57', inner: '#8e8367', seam: '#5a6354' },
      { shoulder: '#4e4d46', base: '#87857a', inner: '#a29f8e', seam: '#6e6d66' },
      { shoulder: '#51443e', base: '#7c6c61', inner: '#8c7c6d', seam: '#625750' },
      { shoulder: '#3f3d45', base: '#66636e', inner: '#827d89', seam: '#55525d' },
    ],
    road = palettes[region] || palettes[0];
  const onBridge = (p) =>
      p.x >= barrier.bounds[0] - 12 &&
      p.x <= barrier.bounds[1] + 12 &&
      barrier.gaps.some(([lo, hi]) => p.y >= lo && p.y <= hi),
    stone = region >= 2;
  const poly = (points, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach((q, j) => {
      const p = screen(q);
      j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    if (color === road.inner)
      materials?.paint(
        ctx,
        'terrain:road:' + ['vale', 'march', 'highlands', 'frontier', 'crown'][region],
        screen,
        points,
      );
  };
  const disk = (q, r, color) =>
    poly(
      Array.from({ length: 16 }, (_, j) => {
        const a = (j * Math.PI) / 8;
        return { x: q.x + Math.cos(a) * r, y: q.y + Math.sin(a) * r };
      }),
      color,
    );
  const segment = (a, b, w, color) => {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (!d) return;
    const dx = (-(b.y - a.y) / d) * w,
      dy = ((b.x - a.x) / d) * w;
    poly(
      [
        { x: a.x + dx, y: a.y + dy },
        { x: b.x + dx, y: b.y + dy },
        { x: b.x - dx, y: b.y - dy },
        { x: a.x - dx, y: a.y - dy },
      ],
      color,
    );
  };
  const stroke = (a, b, color, width = 1) => {
    a = screen(a);
    b = screen(b);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  const edges = [],
    seen = new Set(),
    nodes = new Map();
  for (const path of paths) {
    for (const q of path) nodes.set(q.x + ':' + q.y, q);
    for (let j = 1; j < path.length; j++) {
      const a = path[j - 1],
        b = path[j],
        key = [a.x + ':' + a.y, b.x + ':' + b.y].sort().join('/');
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([a, b]);
      }
    }
  }
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const [w, color] of [
    [35, road.shoulder],
    [29, road.base],
    [23, road.inner],
  ]) {
    for (const [a, b] of edges) segment(a, b, w, color);
    for (const q of nodes.values()) disk(q, w, color);
  }
  const details = new Set();
  for (const [a, b] of edges) {
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (!length) continue;
    const ux = (b.x - a.x) / length,
      uy = (b.y - a.y) / length,
      nx = -uy,
      ny = ux,
      spacing = region === 4 ? 56 : region === 2 ? 64 : 48,
      anchor = a.x * ux + a.y * uy,
      first = Math.ceil(anchor / spacing) * spacing - anchor;
    if (region === 0 || region === 1 || region === 3)
      for (const side of [-1, 1])
        stroke(
          { x: a.x + nx * side * 12, y: a.y + ny * side * 12 },
          { x: b.x + nx * side * 12, y: b.y + ny * side * 12 },
          road.seam + (region === 3 ? '99' : '44'),
          region === 3 ? 1.8 : 1,
        );
    for (let t = first; t < length; t += spacing) {
      const p = { x: a.x + ux * t, y: a.y + uy * t },
        key = Math.round(p.x) + ':' + Math.round(p.y);
      if (details.has(key)) continue;
      details.add(key);
      const bridge = onBridge(p);
      if (bridge) {
        stroke(
          { x: p.x + nx * 26, y: p.y + ny * 26 },
          { x: p.x - nx * 26, y: p.y - ny * 26 },
          stone ? '#716e61' : '#705338',
          1,
        );
        continue;
      }
      if (region === 4) {
        stroke(
          { x: p.x + nx * 26, y: p.y + ny * 26 },
          { x: p.x - nx * 26, y: p.y - ny * 26 },
          road.seam,
          1,
        );
        const q = {
          x: a.x + ux * Math.min(length, t + spacing),
          y: a.y + uy * Math.min(length, t + spacing),
        };
        stroke(p, q, road.seam, 0.8);
      } else if (region === 2) {
        for (const side of [-1, 1])
          stroke(
            { x: p.x + nx * side * 23, y: p.y + ny * side * 23 },
            { x: p.x + nx * side * 5 + ux * 7, y: p.y + ny * side * 5 + uy * 7 },
            road.seam,
            0.9,
          );
      } else {
        const off = (Math.round(p.x + p.y) % 17) - 8,
          q = { x: p.x + nx * off, y: p.y + ny * off };
        stroke(
          q,
          { x: q.x + ux * (region === 1 ? 8 : 4), y: q.y + uy * (region === 1 ? 8 : 4) },
          region === 1 ? '#b7af8b66' : region === 3 ? '#403b3666' : '#c7b18a77',
          region === 1 ? 1.4 : 1.2,
        );
      }
    }
  }
  ctx.restore();
}
module.exports = roads;

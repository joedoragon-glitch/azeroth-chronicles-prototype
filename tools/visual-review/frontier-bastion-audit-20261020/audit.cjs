'use strict';
const fs = require('node:fs'),
  path = require('node:path');
const root = path.resolve(__dirname, '../../..'),
  C = require(root + '/src/prototype/engine'),
  R = require(root + '/src/prototype/rules'),
  { createCanvas } = require(root + '/node_modules/@napi-rs/canvas');
const g = new C('developer', 'mage', () => 0.9);
g.enter('frontier');
const f = g.zone();
g.enter('abyss');
const a = g.zone();
const natural = new Set([
  'dead-tree',
  'burned-log',
  'dry-scrub',
  'ash-patch',
  'black-rock',
  'battlefield-poppies',
  'pioneer-grasses',
  'regrowth-birch',
  'pioneer-brush',
  'regrowth-willow',
  'mossy-basalt',
  'garden',
]);
function isNature(p) {
  return natural.has(p.structure) || (!p.structure && ['🌲', '🌳', '🪨'].includes(p.icon));
}
const structures = f.props.filter((p) => !isNature(p));
const group = (p) =>
  p.frontierDistrict || p.stronghold || p.regionalDistrict || p.id.replace(/-\d+$/, '');
const groups = {};
for (const p of structures) {
  const k = group(p);
  (groups[k] ??= []).push(p);
}
const summary = Object.entries(groups).map(([id, ps]) => ({
  id,
  count: ps.length,
  center: [
    Math.round(ps.reduce((s, p) => s + p.x, 0) / ps.length),
    Math.round(ps.reduce((s, p) => s + p.y, 0) / ps.length),
  ],
  blocking: ps.filter((p) => !p.decorative).length,
}));
const bins = Array.from({ length: 4 }, () => Array(4).fill(0));
for (const p of structures)
  bins[Math.min(3, Math.floor(p.y / 850))][Math.min(3, Math.floor(p.x / 850))]++;
function drawFrontier(z, file, title, subtitle) {
  const c = createCanvas(1200, 1280),
    x = c.getContext('2d'),
    offX = 80,
    offY = 100,
    k = 1040 / 3400;
  const at = (p) => [offX + p.x * k, offY + p.y * k];
  x.fillStyle = '#263438';
  x.fillRect(0, 0, 1200, 1280);
  x.fillStyle = '#f0e7d5';
  x.font = 'bold 25px sans-serif';
  x.fillText(title, 30, 35);
  x.font = '16px sans-serif';
  x.fillText(subtitle, 30, 65);
  x.fillStyle = '#41483e';
  x.fillRect(offX, offY, 1040, 1040);
  for (let i = 0; i <= 4; i++) {
    x.strokeStyle = '#697064';
    x.lineWidth = 0.6;
    x.beginPath();
    x.moveTo(offX + i * 260, offY);
    x.lineTo(offX + i * 260, offY + 1040);
    x.moveTo(offX, offY + i * 260);
    x.lineTo(offX + 1040, offY + i * 260);
    x.stroke();
  }
  const barrier = R.barriers[3];
  x.fillStyle = '#567c85';
  for (let y = 0; y < 3400; y += 10) {
    const [l, r] = R.channelBanks(3, y);
    x.fillRect(offX + l * k, offY + y * k, (r - l) * k, 11 * k);
  }
  for (const [l, h] of barrier.gaps) {
    x.fillStyle = '#a99770';
    x.fillRect(offX + 1370 * k, offY + l * k, 170 * k, (h - l) * k);
  }
  for (const t of R.terrain[3]) {
    x.fillStyle = t.kind === 'ravine' ? '#536b77' : t.kind === 'fountain' ? '#8cb3b8' : '#777a72';
    if (t.r) {
      x.beginPath();
      x.arc(offX + t.x * k, offY + t.y * k, t.r * k, 0, Math.PI * 2);
      x.fill();
    } else {
      for (let y = t.y1; y < t.y2; y += 10)
        if (!(t.gaps || []).some(([l, h]) => y >= l && y <= h))
          x.fillRect(offX + t.x1 * k, offY + y * k, (t.x2 - t.x1) * k, 10 * k + 1);
    }
  }
  x.strokeStyle = '#baab82';
  x.lineWidth = 3;
  for (const road of z.roads) {
    x.beginPath();
    road.forEach((p, j) => {
      const [xx, yy] = at(p);
      j ? x.lineTo(xx, yy) : x.moveTo(xx, yy);
    });
    x.stroke();
  }
  for (const p of z.props) {
    const [xx, yy] = at(p);
    x.fillStyle = isNature(p) ? '#70836b' : p.proposedMove ? '#e6c76c' : '#db9a69';
    if (isNature(p)) {
      x.beginPath();
      x.arc(xx, yy, 2.6, 0, Math.PI * 2);
      x.fill();
    } else {
      x.fillRect(xx - 3.2, yy - 3.2, 6.4, 6.4);
    }
  }
  for (const n of z.npcs) {
    const [xx, yy] = at(n);
    x.fillStyle = '#c8e2e8';
    x.beginPath();
    x.arc(xx, yy, 4.5, 0, Math.PI * 2);
    x.fill();
  }
  const labels = [
    ['Emberwatch', 450, 500],
    ['Burned Hamlet', 1300, 1000],
    ['North bridge', 1450, 750],
    ['South bridge', 1450, 2160],
    ['Ruined Shrine', 1050, 1850],
    ['Checkpoint', 2600, 1650],
    ['Abyss Bastion', 3000, 2700],
    ['Dragon roost', 3100, 500],
    ...(z.proposedLabels || []),
  ];
  x.font = '14px sans-serif';
  for (const [name, px, py] of labels) {
    const [xx, yy] = at({ x: px, y: py });
    const width = x.measureText(name).width;
    x.fillStyle = '#263438dc';
    x.fillRect(xx - width / 2 - 4, yy + 10, width + 8, 20);
    x.fillStyle = '#f4e9d5';
    x.fillText(name, xx - width / 2, yy + 25);
  }
  x.fillStyle = '#e0d4bd';
  x.font = '17px sans-serif';
  x.fillText(
    'Orange: structures / walls / equipment   •   Green: nature   •   Cream: roads',
    80,
    1190,
  );
  x.fillText(
    'Exact generated positions; decorative props may overlap visually without blocking movement.',
    80,
    1220,
  );
  fs.writeFileSync(__dirname + '/' + file, c.toBuffer('image/png'));
}
drawFrontier(
  f,
  'frontier-current.png',
  'Frontier · current spatial audit',
  '3400 × 3400 world units · natural scenery and authored assets shown separately',
);
const arch = R.dungeonArchitecture.abyss;
const gates = arch.partitions.map((w) => ({
  id: w.id,
  gaps: w.gaps.map(([l, h]) => ({ raw: h - l, actor15: h - l - 30, actor25: h - l - 50 })),
}));
const evidence = {
  seed: 'Developer mode fixed combat RNG 0.9; authored current geometry.',
  frontier: {
    size: 3400,
    props: f.props.length,
    nature: f.props.filter(isNature).length,
    structures: structures.length,
    structureBins850: bins,
    groups: summary,
  },
  abyss: {
    size: 1500,
    decorative: a.props.filter((p) => p.decorative).length,
    blockingProps: a.props.filter((p) => !p.decorative).length,
    occupants: a.enemies.length,
    gates,
  },
};
fs.writeFileSync(__dirname + '/audit.json', JSON.stringify(evidence, null, 2) + '\n');
if (require.main === module) console.log(JSON.stringify(evidence));
module.exports = { g, f, a, R, isNature, group, drawFrontier, evidence, createCanvas };

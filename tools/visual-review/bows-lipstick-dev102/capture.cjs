'use strict';
const fs = require('node:fs'),
  path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { createCanvas } = require(root + '/node_modules/@napi-rs/canvas');
const V = require(root + '/src/prototype/visuals');
const subjects = [
  ['Mage', { renderKind: 'hero', class: 'mage' }],
  ['Crowned Mage (scarf retained)', { renderKind: 'hero', class: 'mage', crowned: true }],
  ...[
    ['thorn', 'Mira', 'teacher'],
    ['mire', 'Sela', 'teacher'],
    ['archive', 'Neri', 'alchemist'],
    ['mine', 'Dara', 'smith'],
    ['warlord', 'Lyss', 'teacher'],
    ['cindermaw', 'Vera', 'smith'],
  ].map(([family, name, kind]) => [name, { renderKind: 'npc', family, kind }]),
  ['Marshal Veyra', { renderKind: 'enemy', type: 'boss', family: 'citadel' }],
  ['TRUE Marshal Veyra', { renderKind: 'enemy', type: 'boss', family: 'citadel', form: 'true' }],
];
const canvas = createCanvas(1200, 1200),
  ctx = canvas.getContext('2d');
ctx.fillStyle = '#303b40';
ctx.fillRect(0, 0, 1200, 1200);
for (let i = 0; i < subjects.length; i++) {
  const [name, entity] = subjects[i],
    x = (i % 4) * 300,
    y = Math.floor(i / 4) * 400;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 6, y + 6, 288, 388);
  ctx.clip();
  ctx.fillStyle = '#3d4b50';
  ctx.fillRect(x + 6, y + 6, 288, 388);
  for (const [scale, dx, dy] of [
    [i > 7 ? 2.3 : 3, 120, 260],
    [1.5, 250, 350],
  ]) {
    ctx.save();
    ctx.translate(x + dx, y + dy);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.rect(-1000, -1000, 2000, 2000);
    V.draw(ctx, { id: 'review-' + i, ...entity }, { x: 0, y: 0 }, 3);
    ctx.restore();
  }
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#eee5d3';
  ctx.textAlign = 'center';
  ctx.fillText(name, x + 150, y + 28);
  ctx.font = '12px sans-serif';
  ctx.fillText('Detail / native camera 1.5×', x + 150, y + 377);
  ctx.restore();
}
fs.writeFileSync(__dirname + '/character-review.png', canvas.toBuffer('image/png'));
// Check the actual shared captive/mobile and appointed paths with the same painter.
const variants = createCanvas(1080, 300),
  vc = variants.getContext('2d');
vc.fillStyle = '#3d4b50';
vc.fillRect(0, 0, 1080, 300);
for (let i = 2; i < 8; i++) {
  const [name, entity] = subjects[i];
  vc.save();
  vc.translate((i - 2) * 180 + 90, 220);
  vc.scale(2.5, 2.5);
  V.draw(
    vc,
    {
      ...entity,
      id: 'captive-' + i,
      kind: 'cage',
      presentation: 'workstation',
      workKind: entity.kind,
    },
    { x: 0, y: 0 },
    3,
    false,
  );
  vc.restore();
  vc.font = '14px sans-serif';
  vc.fillStyle = '#eee5d3';
  vc.textAlign = 'center';
  vc.fillText(name + ' · captive', (i - 2) * 180 + 90, 270);
}
fs.writeFileSync(__dirname + '/captive-review.png', variants.toBuffer('image/png'));
// Actual renderer context: authored rescued Neri service position in Reedport.
const C = require(root + '/src/prototype/engine'),
  FX = require(root + '/src/prototype/combat-visuals'),
  Renderer = require(root + '/src/prototype/renderer'),
  assert = require('node:assert/strict');
const g = new C('developer', 'mage', () => 0.9);
g.enter('march');
g.s.rescued.archive = true;
g.refreshNPCs();
g.s.clock = 120;
const neri = g.zone().npcs.find((n) => n.id === 'service-archive');
Object.assign(g.hero, { x: neri.x + 65, y: neri.y + 35 });
const scene = createCanvas(1000, 650),
  before = JSON.stringify(g.s);
Renderer.create({
  canvas: scene,
  ctx: scene.getContext('2d'),
  getGame: () => g,
  platform: { cameraZoom: 1.5, cameraAnchor: () => ({ x: 420, y: 320 }) },
  Campaign: C,
  PrototypeVisuals: V,
  PrototypeCombatVisuals: FX,
  now: () => 16000,
  chargePresentation: () => null,
  isPaused: () => false,
}).draw();
assert.equal(JSON.stringify(g.s), before, 'render is read only');
fs.writeFileSync(__dirname + '/mage-neri-town.png', scene.toBuffer('image/png'));

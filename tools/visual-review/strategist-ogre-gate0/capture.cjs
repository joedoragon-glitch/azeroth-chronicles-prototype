'use strict';
// Nonproduction Gate 0 visual evidence using the actual Campaign, Canvas
// renderer and procedural artist. It is a diagnostic scene, NOT a playable
// Strategist save and NOT evidence that its attacks/controls are integrated.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../../../src/prototype/engine.js');
const Visuals = require('../../../src/prototype/visuals.js');
const Effects = require('../../../src/prototype/combat-visuals.js');
const Renderer = require('../../../src/prototype/renderer.js');
const output = process.env.STRATEGIST_CAPTURE_DIR ||
  path.join(process.cwd(), 'test-artifacts', 'strategist-ogre-gate0');
fs.mkdirSync(output, { recursive: true });
const evidence = [];
function write(name, canvas) {
  const bytes = canvas.toBuffer('image/png');
  const file = path.join(output, name);
  fs.writeFileSync(file, bytes);
  evidence.push({ name, sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    width: canvas.width, height: canvas.height });
}
// Isolated 1:1 and close-up comparisons are painted by the exact game artist.
const sheet = createCanvas(1050, 480), ctx = sheet.getContext('2d');
ctx.fillStyle = '#354e40'; ctx.fillRect(0, 0, sheet.width, sheet.height);
const lineup = [
  ['Strategist — native', { renderKind: 'hero', class: 'strategist' }, 1],
  ['Strategist — close', { renderKind: 'hero', class: 'strategist' }, 3],
  ['Existing Ogre', { renderKind: 'enemy', type: 'mob', species: 'ogre' }, 3],
  ['Soldier', { renderKind: 'ally', type: 'soldier' }, 3],
  ['Archer', { renderKind: 'ally', type: 'archer' }, 3],
];
lineup.forEach(([label, entity, scale], i) => {
  const x = 108 + i * 208;
  ctx.save(); ctx.translate(x, 280); ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(19,31,24,.38)';
  ctx.beginPath(); ctx.ellipse(0, 16 / scale, 23, 7, 0, 0, Math.PI * 2); ctx.fill();
  Visuals.draw(ctx, { ...entity, id: 'gate0-' + i }, { x: 0, y: 0 }, 0);
  ctx.restore();
  ctx.fillStyle = '#eee1be'; ctx.font = '16px sans-serif';
  ctx.textAlign = 'center'; ctx.fillText(label, x, 399);
});
write('01-real-procedural-lineup.png', sheet);
// A large, independently rasterized vector close-up makes the actual facial
// anatomy, joints, boots and clothing legible on a phone. NOT pixel-stretched
// concept art: paint the existing procedural function at eightfold scale.
const portrait = createCanvas(1050, 1050), detail = portrait.getContext('2d');
detail.fillStyle = '#354e40';
detail.fillRect(0, 0, portrait.width, portrait.height);
detail.save();
detail.translate(525, 800);
detail.scale(8, 8);
detail.fillStyle = 'rgba(19,31,24,.38)';
detail.beginPath();
detail.ellipse(0, 17, 26, 7, 0, 0, Math.PI * 2);
detail.fill();
Visuals.draw(detail, { id: 'gate0-editorial-proportions', renderKind: 'hero',
  class: 'strategist' }, { x: 0, y: 0 }, 0);
detail.restore();
detail.fillStyle = '#eee1be';
detail.textAlign = 'center';
detail.font = '28px sans-serif';
detail.fillText('Ogre Strategist — actual procedural drawing, 8×', 525, 65);
detail.font = '19px sans-serif';
detail.fillText('Proportion review · no gameplay, sprite or anatomy replacement', 525, 1021);
write('05-strategist-8x-anatomy-review.png', portrait);

// This scene uses the real native Greenwood map, objects, projection and
// renderer. A diagnostic class override only changes what the painter sees;
// the class is intentionally *not* admitted or saved at Gate 0.
const game = new Campaign('developer', 'mage', () => 0.9);
game.enter('vale');
game.s.clock = 120;
Object.assign(game.hero, { x: 1470, y: 1700, class: 'strategist',
  name: 'Strategist (visual preview)', hp: 10000, maxHp: 10000 });
assert.equal(game.s.party.length, 2, 'actual Soldier and Archer from native campaign');
// Stagger allies on the same real map: do not cover the Ogre's face or kit.
game.s.party[0].x = 1340; game.s.party[0].y = 1710;
game.s.party[1].x = 1530; game.s.party[1].y = 1800;
const foe = game.makeEnemy(
  { species: 'ogre', name: 'Ogre (visual comparison)', level: 1,
    hp: 3000, damage: 10, gold: 0, xp: 0 },
  { x: 1730, y: 1740 },
);
game.zone().enemies = [foe]; // A staged comparison, not a Greenwood spawn claim.
for (const [label, zoom, dx, dy] of [
  ['02-greenwood-native-zoom.png', 1, 0, 0],
  ['03-greenwood-150-percent.png', 1.5, 0, 0],
  ['04-greenwood-moved-position.png', 1.5, 40, 15],
]) {
  const canvas = createCanvas(1000, 650);
  game.hero.x = 1470 + dx; game.hero.y = 1700 + dy;
  const before = JSON.stringify(game.s);
  Renderer.create({
    canvas, ctx: canvas.getContext('2d'), getGame: () => game,
    platform: { cameraZoom: zoom, cameraAnchor: () => ({ x: 490, y: 330 }) },
    Campaign, PrototypeVisuals: Visuals, PrototypeCombatVisuals: Effects,
    now: () => 16000, chargePresentation: () => null, isPaused: () => false,
  }).draw();
  assert.equal(JSON.stringify(game.s), before, 'native renderer must not mutate gameplay');
  write(label, canvas);
}
fs.writeFileSync(path.join(output, 'evidence.json'), JSON.stringify({
  source: 'Actual PrototypeVisuals and PrototypeRenderer on native Campaign',
  scenario: 'Native Greenwood; diagnostic Ogre visual-only override; staged comparison foe',
  boundaries: 'Not an admitted class, not a successful attack animation, no Pixi/device proof',
  screenshots: evidence,
}, null, 2) + '\n');
console.log('PASS Gate 0 ' + evidence.length + ' real renderer captures in ' + output);

'use strict';
const path = require('node:path'),
  fs = require('node:fs');
const root = path.resolve(__dirname, '..'),
  C = require('../src/prototype/engine'),
  V = require('../src/prototype/visuals'),
  CV = require('../src/prototype/combat-visuals'),
  R = require('../src/prototype/renderer'),
  { createCanvas } = require('@napi-rs/canvas');
const dir = path.join(root, 'tools/sprites/design-handoffs/references/thorn-mobile');
fs.mkdirSync(dir, { recursive: true });
const c = new C('normal', 'paladin', () => 0.5),
  e = c.zone().enemies.find((e) => e.family === 'thorn');
c.zone().enemies = [e];
c.s.party = [];
c.s.mercyTime = 10;
c.s.clock = 120;
for (let i = 0; i < 340; i++) {
  c.s.time += 0.1;
  c.updateEnemies(0.1);
}
const n = c.thornCaptive();
Object.assign(c.hero, c.safe(n.x + 35, n.y + 40));
for (const [width, height] of [
  [1280, 800],
  [375, 800],
]) {
  const canvas = createCanvas(width, height),
    ctx = canvas.getContext('2d'),
    r = R.create({
      getGame: () => c,
      canvas,
      ctx,
      platform: { cameraZoom: 1.5, cameraAnchor: () => ({ x: width * 0.5, y: height * 0.43 }) },
      Campaign: C,
      PrototypeVisuals: V,
      PrototypeCombatVisuals: CV,
      now: () => 16000,
      chargePresentation: () => null,
      isPaused: () => false,
    });
  r.draw();
  r.draw();
  fs.writeFileSync(path.join(dir, 'patrol-' + width + '.png'), canvas.toBuffer('image/png'));
}
const canvas = createCanvas(300, 300),
  ctx = canvas.getContext('2d');
ctx.fillStyle = '#22382e';
ctx.fillRect(0, 0, 300, 300);
ctx.save();
ctx.translate(150, 190);
ctx.scale(3, 3);
V.draw(ctx, { ...n, renderKind: 'npc' }, { x: 0, y: 0 }, 0, false);
ctx.restore();
fs.writeFileSync(path.join(dir, 'mira-procedural.png'), canvas.toBuffer('image/png'));
console.log('PASS native gameplay and isolated Mira reference captured from actual340-tick patrol');

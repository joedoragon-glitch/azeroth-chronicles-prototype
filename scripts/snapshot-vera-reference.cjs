'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const C = require('../src/prototype/engine'),
  V = require('../src/prototype/visuals'),
  CV = require('../src/prototype/combat-visuals'),
  Renderer = require('../src/prototype/renderer'),
  { createCanvas } = require('@napi-rs/canvas');
const dir = path.join(__dirname, '../tools/sprites/design-handoffs/references/vera-mobile');
fs.mkdirSync(dir, { recursive: true });
const c = new C('normal', 'mage', () => 0.6);
c.enter('crown');
c.s.party = [];
c.s.mercyTime = 1e6;
c.s.clock = 200;
const e = c.zone().enemies.find((u) => u.family === 'cindermaw'),
  n = c.veraCaptive();
c.zone().enemies = c.zone().enemies.filter((u) => u === e || n.escortGuardIds.includes(u.id));
for (let i = 0; i < 750; i++) {
  c.s.time += 0.1;
  c.updateEnemies(0.1);
}
assert(Math.hypot(e.x - e.home.x, e.y - e.home.y) > 500);
Object.assign(c.hero, c.safe(n.x - 90, n.y + 170));
function capture(stage) {
  for (const [width, height] of [
    [1280, 800],
    [375, 800],
  ]) {
    const canvas = createCanvas(width, height),
      ctx = canvas.getContext('2d'),
      r = Renderer.create({
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
    const before = JSON.stringify(c.s);
    r.draw();
    r.draw();
    assert.equal(JSON.stringify(c.s), before);
    fs.writeFileSync(path.join(dir, stage + '-' + width + '.png'), canvas.toBuffer('image/png'));
  }
}
capture('inspection');
Object.assign(c.hero, c.safe(e.x + 50, e.y));
c.s.mercyTime = 0;
c.engage(e, true, false);
const g = c.zone().enemies.find((u) => u.veraEscort);
Object.assign(g, c.safe(n.x + 30, n.y));
c.engage(g, true, false);
c.updateVeraFieldwork(0.01);
assert(g.veraEquipment);
c.damage(g, 30);
const low = g.veraEquipment.remaining;
c.s.time += 4;
c.updateVeraFieldwork(4);
assert(g.veraEquipment.remaining > low);
capture('repair');
const canvas = createCanvas(320, 320),
  ctx = canvas.getContext('2d');
ctx.fillStyle = '#22382e';
ctx.fillRect(0, 0, 320, 320);
ctx.save();
ctx.translate(120, 200);
ctx.scale(2.5, 2.5);
V.draw(ctx, { ...n, renderKind: 'npc' }, { x: 0, y: 0 }, 0, false);
ctx.restore();
fs.writeFileSync(path.join(dir, 'vera-forge-procedural.png'), canvas.toBuffer('image/png'));
console.log('PASS actual75s remote inspection, bounded repair and pure1280/375renderer captures');

'use strict';
const path = require('node:path'),
  fs = require('node:fs');
const root = path.resolve(__dirname, '..'),
  C = require('../src/prototype/engine'),
  V = require('../src/prototype/visuals'),
  CV = require('../src/prototype/combat-visuals'),
  R = require('../src/prototype/renderer'),
  { createCanvas } = require('@napi-rs/canvas');
const dir = path.join(root, 'tools/sprites/design-handoffs/references/garun');
fs.mkdirSync(dir, { recursive: true });
const c = new C('normal', 'paladin', () => 0.9);
c.enter('mine');
const e = c.zone().enemies.find((e) => e.type === 'boss' && e.family === 'mine');
c.zone().enemies = [e];
c.s.party = [];
c.s.clock = 200;
c.hero.hp = c.hero.maxHp = 100000;
Object.assign(c.hero, c.safe(910, 1100));
c.startAttack(e, c.hero, 1);
function capture(stage) {
  for (const [width, height] of [
    [1280, 800],
    [375, 800],
  ]) {
    const canvas = createCanvas(width, height),
      ctx = canvas.getContext('2d'),
      text = [];
    const fill = ctx.fillText.bind(ctx);
    ctx.fillText = (value, ...args) => {
      text.push(String(value));
      fill(value, ...args);
    };
    const r = R.create({
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
    const assert = require('node:assert/strict');
    assert(text.includes(stage === 'planned' ? 'PLANNED' : 'BLOCKED'), stage + ' actual label');
    if (stage === 'built') assert(text.includes('CORE EXPOSED'));
    fs.writeFileSync(path.join(dir, stage + '-' + width + '.png'), canvas.toBuffer('image/png'));
  }
}
capture('planned');
while (e.telegraph?.index === 1) {
  c.resolveAttack(e);
  e.telegraph = e.sequence.shift() || null;
}
const supports = c.zone().props.filter((p) => p.garunTemporary);
require('node:assert/strict')(supports.length > 0 && supports.length <= 2);
e.sequence = [];
c.startAttack(e, c.hero, 3);
c.resolveAttack(e);
for (let i = 0; i < 80 && e.motion; i++) c.advanceMotion(e, 0.1);
Object.assign(c.hero, c.safe(e.x + 30, e.y + 30));
capture('built');
console.log(
  'PASS actual Garun previews, finished supports and charge-termination core cue at1280/375',
);

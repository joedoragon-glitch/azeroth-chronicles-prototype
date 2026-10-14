'use strict';
const path = require('node:path'),
  fs = require('node:fs');
const root = path.resolve(__dirname, '..'),
  C = require('../src/prototype/engine'),
  V = require('../src/prototype/visuals'),
  CV = require('../src/prototype/combat-visuals'),
  R = require('../src/prototype/renderer'),
  { createCanvas } = require('@napi-rs/canvas');
const dir = path.join(root, 'tools/sprites/design-handoffs/references/aviation');
fs.mkdirSync(dir, { recursive: true });
const c = new C('normal', 'mage', () => 0.9);
c.enter('abyss');
c.s.party = [];
c.s.clock = 200;
const e = c.bossEnemy(c.boss('abyss'), 'normal', { x: 1150, y: 1120 });
c.zone().enemies = [e];
c.hero.hp = c.hero.maxHp = 100000;
Object.assign(c.hero, c.safe(980, 1040));
c.hero.immune = 100;
c.startAttack(e, c.hero, 2);
function capture(stage) {
  for (const [width, height] of [
    [1280, 800],
    [375, 800],
  ]) {
    const canvas = createCanvas(width, height),
      ctx = canvas.getContext('2d'),
      text = [],
      fill = ctx.fillText.bind(ctx);
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
    if (stage === 'warning')
      require('node:assert/strict')(text.some((t) => t.includes('Lazy Eight')));
    fs.writeFileSync(path.join(dir, stage + '-' + width + '.png'), canvas.toBuffer('image/png'));
  }
}
capture('warning');
const before = { x: e.x, y: e.y };
c.resolveAttack(e);
e.telegraph = null;
for (let i = 0; i < 8 && e.motion; i++) c.advanceMotion(e, 0.02);
require('node:assert/strict')(
  e.motion && Math.hypot(e.x - before.x, e.y - before.y) > 0 && !c.blocked(e.x, e.y, 'abyss', 15),
);
capture('flight');
console.log('PASS native actual Lazy Eight warning and midflight frames1280/375');

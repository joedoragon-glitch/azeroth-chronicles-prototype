'use strict';
const path = require('node:path'),
  fs = require('node:fs'),
  assert = require('node:assert/strict');
const C = require('../src/prototype/engine'),
  V = require('../src/prototype/visuals'),
  CV = require('../src/prototype/combat-visuals'),
  R = require('../src/prototype/renderer'),
  { createCanvas } = require('@napi-rs/canvas');
const dir = path.join(__dirname, '../tools/sprites/design-handoffs/references/cinder-ministry');
fs.mkdirSync(dir, { recursive: true });
const c = new C('normal', 'mage', () => 0.9);
c.enter('crown');
c.s.party = [];
c.s.clock = 200;
c.s.mercyTime = 0;
const e = c.zone().enemies.find((e) => e.family === 'cindermaw');
c.hero.hp = c.hero.maxHp = 1e6;
c.hero.immune = 1e6;
Object.assign(c.hero, c.safe(e.x + 70, e.y));
c.engage(e, true, false);
e.cd = e.summonCd = 1e6;
function capture(stage) {
  for (const [width, height] of [
    [1280, 800],
    [375, 800],
  ]) {
    const canvas = createCanvas(width, height),
      ctx = canvas.getContext('2d'),
      labels = [],
      fill = ctx.fillText.bind(ctx);
    ctx.fillText = (value, x, y, ...args) => {
      labels.push({ text: String(value), x, y });
      fill(value, x, y, ...args);
    };
    const renderer = R.create({
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
    renderer.draw();
    renderer.draw();
    if (stage === 'cordon')
      assert(
        labels.some(
          (t) => t.text === 'NEXT OPENING' && t.x >= 0 && t.x <= width && t.y > 0 && t.y < height,
        ),
        'actual next-opening caption stays inside viewport',
      );
    if (stage === 'seals')
      assert(
        labels.some((t) => t.text.includes('3/7')),
        'actual third seal readable progression',
      );
    fs.writeFileSync(path.join(dir, stage + '-' + width + '.png'), canvas.toBuffer('image/png'));
  }
}
e.telegraph = c.buildBossAttack(e, 0, c.hero).first;
c.resolveAttack(e);
e.telegraph = null;
c.s.time += 0.9;
c.advanceCinderCordon(e, 0.9);
capture('cordon');
c.cancelEncounter(e);
const attack = c.buildBossAttack(e, 3, c.hero);
e.telegraph = attack.sequence[1];
capture('seals');
console.log(
  'PASS actual ministry contraction/next-opening and third-of-seven seal source captures1280/375',
);

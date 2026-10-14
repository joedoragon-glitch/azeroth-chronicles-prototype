'use strict';
const path = require('node:path'),
  fs = require('node:fs');
const root = path.resolve(__dirname, '..'),
  C = require('../src/prototype/engine'),
  V = require('../src/prototype/visuals'),
  CV = require('../src/prototype/combat-visuals'),
  R = require('../src/prototype/renderer'),
  { createCanvas } = require('@napi-rs/canvas');
const dir = path.join(root, 'tools/sprites/design-handoffs/references/cinder-support');
fs.mkdirSync(dir, { recursive: true });
const c = new C('normal', 'mage', () => 0.9);
c.enter('crown');
c.s.party = [];
c.s.clock = 200;
const e = c.zone().enemies.find((e) => e.family === 'cindermaw');
c.hero.hp = c.hero.maxHp = 1000000;
c.hero.immune = 1000000;
Object.assign(c.hero, c.safe(e.x + 70, e.y));
c.engage(e, true, false);
e.cd = e.summonCd = 1e6;
c._tacticalRogueNext = new Map([[e.id, 1e6]]);
require('node:assert/strict')(c.tacticalRogueMove(e, c.hero, true));
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
    if (stage === 'warning') {
      require('node:assert/strict')(text.includes('Preparing…'));
      require('node:assert/strict')(
        !text.some((t) => t.includes('Broodscreen') || t.includes('SIGNATURE')),
      );
    }
    fs.writeFileSync(path.join(dir, stage + '-' + width + '.png'), canvas.toBuffer('image/png'));
  }
}
capture('warning');
c.resolveAttack(e);
e.telegraph = null;
const ids = [...c._tacticalCinderResponses.keys()];
for (let n = 0; n < 320; n++) {
  c.s.time += 0.05;
  c.updateEnemies(0.05);
  if (ids.every((id) => c._tacticalCinderResponses.get(id)?.joined)) break;
}
require('node:assert/strict').equal(
  ids.filter((id) => c._tacticalCinderResponses.get(id)?.joined).length,
  6,
);
capture('arrivals');
console.log('PASS native actual anonymous warning and six physical arrivals1280/375');

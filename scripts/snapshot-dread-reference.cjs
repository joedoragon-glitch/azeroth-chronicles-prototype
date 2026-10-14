'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  { createCanvas } = require('@napi-rs/canvas');
const C = require('../src/prototype/engine'),
  V = require('../src/prototype/visuals'),
  CV = require('../src/prototype/combat-visuals'),
  Renderer = require('../src/prototype/renderer');
const dir = path.join(__dirname, '../tools/sprites/design-handoffs/references/dread-agriculture');
fs.mkdirSync(dir, { recursive: true });
function capture(c, stage) {
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
for (let index = 0; index < 7; index++) {
  const c = new C('normal', 'mage', () => 0.6);
  c.enter('supply-crown');
  c.s.party = [];
  c.s.clock = 200;
  const e = c.zone().enemies.find((u) => u.captainProfile === 'supply-crown');
  c.zone().enemies = [e];
  Object.assign(c.hero, c.safe(e.x + 80, e.y), { hp: 1e6, maxHp: 1e6, immune: 1e6 });
  c.engage(e, true, false);
  c._tacticalRogueNext = new Map([[e.id, 1e6]]);
  if (index === 5) c.summonCaptainAdds(e);
  const built = c.buildDreadAttack(e, c.hero, index);
  assert(built);
  e.telegraph = built.first;
  e.sequence = built.sequence;
  capture(c, 'warning-' + index);
  c.resolveAttack(e);
  e.telegraph = null;
  if (index === 2) capture(c, 'ensiling-vapor');
  if (index === 4) {
    c.updateCinderRegularState(e, 1.2);
    capture(c, 'contracting-closure');
  }
  if (index === 5) capture(c, 'fed-brood');
}
console.log('PASS20 source renderer agriculture references, native1280/375, 150%zoom, state-pure');

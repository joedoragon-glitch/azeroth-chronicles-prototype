'use strict';
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const C = require('../src/prototype/engine');
const Art = require('../src/prototype/enemy-vfx-art');
const Fx = require('../src/prototype/combat-visuals');
const g = new C('normal', 'paladin', () => 0.9),
  before = JSON.stringify(g.snapshot());
const screen = (p) => ({ x: 80 + (p.x - p.y) * 0.6, y: 85 + (p.x + p.y) * 0.25 });
let frames = 0;
for (const boss of C.data.bosses)
  for (const slot of [1, 2]) {
    const def = C.rules.petCompanions[boss.id][slot === 1 ? 'first' : 'second'];
    const event = {
      type: 'petSkill',
      petFamily: boss.id,
      source: 'pet-fixture',
      skill: def.name,
      slot,
      ...def,
      x: 65,
      y: 0,
      fromX: 0,
      fromY: 0,
      stage: 'impact',
      hits: 1,
    };
    const queued = Fx.queue([event], g, []).find((f) => f.type === 'petSkill');
    const expected = def.shape === 'line' ? 0.3 : slot === 2 ? 0.85 : 0.65;
    assert(
      queued && queued.max === expected && queued.priority >= 4,
      'pet contact remains visible without long-lived full-line afterimages',
    );
    for (const stage of ['release', 'impact', 'windup'])
      for (const options of [{}, { reduced: true, optimized: true }]) {
        const canvas = createCanvas(320, 190),
          ctx = canvas.getContext('2d');
        const state = ctx.getTransform();
        assert(Art.petSkill(ctx, screen, { ...queued, stage, life: queued.max * 0.65 }, options));
        const data = ctx.getImageData(0, 0, 320, 190).data;
        assert(
          data.some((v, i) => i % 4 === 3 && v > 0),
          boss.id + ' ' + slot + ' ' + stage + ' paints visible pixels',
        );
        assert.equal(ctx.globalAlpha, 1);
        assert.deepEqual(ctx.getTransform(), state, 'drawing restores canvas state');
        frames++;
      }
  }
for (const family of ['crypt', 'archive', 'abyss']) {
  const canvas = createCanvas(120, 120),
    ctx = canvas.getContext('2d');
  assert(
    Art.petProjectile(ctx, (p) => p, {
      x: 60,
      y: 60,
      dx: 1,
      dy: 0,
      petFamily: family,
      petSkillSlot: 1,
    }),
  );
  assert(ctx.getImageData(0, 0, 120, 120).data.some((v, i) => i % 4 === 3 && v > 0));
}
const crowd = Array.from({ length: 100 }, () => ({
  type: 'petSkill',
  stage: 'release',
  slot: 2,
  petFamily: 'crypt',
}));
assert(Fx.queue(crowd, g, []).length <= 40, 'pet cues retain existing bounded effect budget');
assert.equal(JSON.stringify(g.snapshot()), before, 'all pet presentation is read-only');
console.log(
  'PASS all 22 pet skills / ' +
    frames +
    ' rendered release, impact and charge frames, reduced/optimized cues, ranged trails, canvas state and bounded queue',
);

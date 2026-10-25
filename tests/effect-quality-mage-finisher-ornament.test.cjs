'use strict';
// Stage 5.6: review an already-existing nonsemantic presentation reduction.
// A real Mage combo finisher has a clipped cone wash + advancing arc, with
// separate outward streaks/sparks (7 ordinary / 3 optimized / 0 reduced motion).
// This is a test-only optical/command comparison, NOT authorization to remove
// every enemy/pet/hero effect, or a new graphics tier / device-FPS claim.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Hero = require('../src/prototype/hero-presentation.js');
const Combat = require('../src/prototype/combat-visuals.js');

const game = new Campaign('developer', 'mage', () => 0.5);
const z = game.zone();
z.enemies = [];
z.props = []; z.nodes = []; z.npcs = []; z.buildings = [];
game.s.party = [];
game.line = () => true;
Object.assign(game.hero, { x: 560, y: 740, hp: 1000, maxHp: 1000 });
const enemy = game.makeEnemy({
  species: 'goblin', name: 'Finisher source witness',
  level: 1, hp: 100000, damage: 0, gold: 0, xp: 0,
}, { x: 640, y: 740 });
z.enemies.push(enemy);
game.effects = [];
// Use the native committed combo-finisher producer; its authored definition
// chooses sector width/range and logs the real visual receipt.
game.basicComboFinisher(enemy, { x: game.hero.x, y: game.hero.y },
  0, 'hero', 'mage', false);
const receipts = game.effects.splice(0);
const original = receipts.find(e => e.type === 'basicComboFinisher' && e.class === 'mage');
assert(original && original.shape === 'cone' &&
  original.range > 0 && original.halfAngle > 0,
'actual Mage native finisher did not produce a cone receipt');
const queued = Combat.queue(receipts, game, []);
const f = queued.find(e => e.type === 'basicComboFinisher');
assert(f && f.max > 0 && f.life > 0,
  'native Mage finisher was not admitted to the real effects queue');
const snapshot = JSON.stringify(game.snapshot());
const project = ({ x, y }) => ({
  x: 320 + (x - 560) * 0.68 - (y - 740) * 0.30,
  y: 320 + (x - 560) * 0.16 + (y - 740) * 0.31,
});
function paint(opts, lifeFraction, w = 800, h = 600) {
  const can = createCanvas(w, h), ctx = can.getContext('2d');
  const cue = { ...f, life: f.max * lifeFraction };
  let clips = 0, strokes = 0;
  const originalClip = ctx.clip, originalStroke = ctx.stroke;
  ctx.clip = function (...args) { clips++; return originalClip.apply(this, args); };
  ctx.stroke = function (...args) { strokes++; return originalStroke.apply(this, args); };
  const ok = Hero.basicFinisher(ctx, project, cue, opts);
  assert.equal(ok, true, 'real Mage finisher was not handled by specialized art');
  const pix = Buffer.from(ctx.getImageData(0, 0, w, h).data);
  let ink = 0;
  for (let i = 3; i < pix.length; i += 4) if (pix[i]) ink++;
  return { pix, ink, clips, strokes };
}
function compare(a, b) {
  let shared = 0, altered = 0;
  for (let i = 0; i < a.pix.length; i += 4) {
    if (a.pix[i + 3] && b.pix[i + 3]) shared++;
    if (a.pix[i] !== b.pix[i] || a.pix[i + 1] !== b.pix[i + 1] ||
        a.pix[i + 2] !== b.pix[i + 2] || a.pix[i + 3] !== b.pix[i + 3]) altered++;
  }
  return { shared, altered };
}
const stats = [];
for (const life of [0.9, 0.55, 0.2]) {
  const normal = paint({ reduced: false, optimized: false }, life);
  const optimized = paint({ reduced: false, optimized: true }, life);
  const reduced = paint({ reduced: true, optimized: false }, life);
  const both = paint({ reduced: true, optimized: true }, life);
  for (const s of [normal, optimized, reduced, both]) {
    assert.equal(s.clips, 1, 'core attack-sector clipping was removed');
    assert(s.ink > 0, 'Mage combo identity disappeared in an existing mode');
    assert(s.strokes >= 2, 'two mandatory leading arc strokes disappeared');
  }
  assert(normal.strokes > optimized.strokes,
    'optimized flag should reduce existing outer spark/streak draw calls');
  assert(optimized.strokes > reduced.strokes,
    'reduced-motion should omit sparks while retaining two leading arcs');
  assert.deepEqual(both.pix, reduced.pix,
    'when reduced-motion is on, optimized must not secretly add spark ornament');
  const diff = compare(normal, optimized);
  assert(diff.altered > 0 && diff.shared > 0,
    'optimized art must remove detail without eliminating shared attack identity');
  const motionDiff = compare(normal, reduced);
  assert(motionDiff.altered > 0 && motionDiff.shared > 0,
    'reduced motion must preserve shared visible fan/arc art');
  stats.push({ lifeFraction: life, normalInk: normal.ink,
    optimizedInk: optimized.ink, reducedInk: reduced.ink,
    normalStrokeCalls: normal.strokes, optimizedStrokeCalls: optimized.strokes,
    reducedStrokeCalls: reduced.strokes, sharedNormalOptimized: diff.shared,
    optimizedChangedPixels: diff.altered });
}
assert.equal(JSON.stringify(game.snapshot()), snapshot,
  'native drawing or option toggles modified campaign saved state');
console.log('PASS Stage 5.6 real Mage combo finisher split: always-present ' +
  'clipped cone/advancing arc, fewer existing optimized sparks/streaks, ' +
  'reduced-motion spark omission with core retained, 3 time samples; ' +
  'same gameplay snapshot. ' + JSON.stringify(stats) +
  '. An existing ornament candidate, not a new graphics selector, ' +
  'verified arbitrary impact suppressions, Pixi composed parity or device FPS.');

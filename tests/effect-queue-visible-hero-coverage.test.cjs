'use strict';
// Stage 5.6: admission policy must agree with real HeroPresentation cast pixels.
// 48 actual class/slot/charge receipts, then SYNTHETIC priority-5 overflow.
// Never infer a cast is visible from its name alone; 15 normal forms are
// deliberately blank. No release, hardware FPS or combined #464 test claim.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const HeroArt = require('../src/prototype/hero-presentation.js');
const Combat = require('../src/prototype/combat-visuals.js');

const surface = createCanvas(800, 600), ctx = surface.getContext('2d');
const project = ({ x, y }) => ({
  x: 340 + (x - 600) * 0.68 - (y - 900) * 0.3,
  y: 300 + (x - 600) * 0.17 + (y - 900) * 0.3,
});
const high = Array.from({ length: 60 }, (_, i) => ({
  type: 'petSkill', slot: 2, stage: 'impact', petFamily: 'thorn',
  source: 'synthetic-high-' + i, actor: 'pet',
  fromX: 580, fromY: 900, x: 620 + i, y: 900,
}));
function actualCast(cls, slot, charged, mode) {
  const game = new Campaign(mode, cls, () => 0.9);
  const z = game.zone();
  z.props = []; z.buildings = []; z.npcs = []; z.nodes = [];
  Object.assign(game.hero, {
    x: 600, y: 900, hp: 50, maxHp: 1000,
    skills: Array(8).fill(4), cd: Array(8).fill(0), order: null,
  });
  game.s.mercyTime = 0;
  const target = game.makeEnemy({
    species: 'goblin', name: 'Real overload classification target',
    level: 1, hp: 100000, damage: 0, gold: 0, xp: 0,
  }, { x: 670, y: 900 });
  z.enemies = [target];
  game.s.party = [game.unit('soldier', 580, 930)];
  if (cls === 'mage' && slot === 3 && !charged)
    target.rangedAim = { remaining: 0.4, max: 0.4, targetId: 'hero' };
  game.effects = [];
  assert(game.cast(slot, target.id, charged),
    'natural hero cast was not admitted: ' + [mode, cls, slot, charged]);
  const receipts = game.effects.splice(0).filter(e => e.type === 'heroSkillCast');
  assert.equal(receipts.length, 1, 'expected one successful cast receipt');
  const cast = Combat.queue(receipts, game, []).find(f =>
    f.type === 'heroSkill' && f.stage === 'cast');
  assert(cast, 'real hero cast was not queued');
  ctx.clearRect(0, 0, surface.width, surface.height);
  HeroArt.draw(ctx, project, cast, {
    width: surface.width, height: surface.height,
    reduced: false, optimized: false,
  });
  const pixels = ctx.getImageData(0, 0, surface.width, surface.height).data;
  let ink = 0;
  for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) ink++;
  return { game, receipts, ink };
}
const silentlyBlank = [];
const visible = [];
let cases = 0;
function verify(cls, slot, charged, mode) {
  const { game, receipts, ink } = actualCast(cls, slot, charged, mode);
  const before = JSON.stringify(game.snapshot());
  const admitted = Combat.queue([...receipts, ...high], game, []);
  assert.equal(admitted.length, 40,
    'unmodified 40 transient ceiling for ' + [cls, slot, charged]);
  const hero = admitted.find(f =>
    f.type === 'heroSkill' && f.stage === 'cast' &&
    f.class === cls && f.slot === slot && !!f.charged === charged);
  const isVisible = ink > 0;
  assert.equal(!!hero, isVisible,
    'Stage 5.5 overflow reservation disagrees with actual native Canvas ' +
    'cast pixels for ' + [cls, slot, charged, mode] + ' ink=' + ink);
  assert.deepEqual(admitted.filter(f => f.type === 'petSkill')
    .map(f => f.source), high.slice(isVisible ? -39 : -40).map(f => f.source),
  'synthetic tier-5 receipts did not keep their old eviction order');
  assert.equal(JSON.stringify(game.snapshot()), before,
    'presentation admission altered campaign/save state');
  if (isVisible) visible.push([cls, slot, charged, mode].join('/'));
  else silentlyBlank.push([cls, slot, charged, mode].join('/'));
  cases++;
}
for (const cls of ['paladin', 'mage', 'ranger'])
  for (let slot = 1; slot <= 8; slot++)
    for (const charged of [false, true]) verify(cls, slot, charged, 'developer');
// Explicit normal-player check: the two previously omitted visibly painted
// Paladin normal casts must be covered with no developer recorder enabled.
for (const slot of [3, 4]) verify('paladin', slot, false, 'normal');
assert.equal(cases, 50);
assert.equal(visible.length, 35, '48-form reference: 33 visible plus 2 Normal-mode rechecks');
assert.equal(silentlyBlank.length, 15,
  '15 normal cast stages must remain unreserved and intentionally blank');
console.log('PASS Stage 5.6 real hero cast Canvas-to-overflow admission, 48 forms ' +
  'plus Normal-mode Paladin 3/4, visible=35, silent=15, stable 40 effect cap ' +
  'and exact priority-5 eviction, no campaign writes. Synthetic load only; ' +
  'no hardware, whole-game or future quality-tier assertion.');

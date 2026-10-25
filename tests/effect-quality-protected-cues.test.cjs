'use strict';
// Stage 5.2 Phase B: baseline protection of direct-state danger/status cues
// from transient queue pressure. The graphics-quality tiers do not exist yet.
// Synthetic hit spam does NOT establish natural encounter frequency,
// physical-device readability, or a reserved hero slot against high-priority FX.
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const Campaign = require('../src/prototype/engine.js');
const Combat = require('../src/prototype/combat-visuals.js');
const Hero = require('../src/prototype/hero-presentation.js');

const WIDTH = 900, HEIGHT = 600;
const game = new Campaign('normal', 'paladin', () => 0.5);
const zone = game.zone();
zone.enemies = [];
zone.props = [];
zone.buildings = [];
zone.npcs = [];
zone.nodes = [];
game.s.party = [game.unit('soldier', 1460, 1720)];
Object.assign(game.hero, {
  x: 1480, y: 1700, hp: 50, maxHp: 1000,
  skills: Array(8).fill(4), cd: Array(8).fill(0), order: null,
});
game.s.mercyTime = 0;
game.line = () => true;

// A real boss producer owns the telegraph geometry; the queue does not.
const boss = game.bossEnemy(game.boss('thorn'), 'normal', { x: 1420, y: 1680 });
boss.aggro = true;
zone.enemies.push(boss);
game.startAttack(boss, game.hero, 0);
assert(boss.telegraph, 'real boss did not create a warning');

// Real target/status state and successful hero cast, not fabricated hero FX.
const target = game.makeEnemy({
  species: 'goblin', name: 'Visible control target',
  level: 1, hp: 100000, damage: 0, gold: 0, xp: 0,
}, { x: 1494, y: 1690 });
target.tauntUntil = 20;
target.fractureUntil = 20;
target.weakenUntil = 20;
target.slow = 3;
target.testSilenced = true;
zone.enemies.push(target);
game.mageSilenceActive = (unit) => !!unit.testSilenced;
game.s.heroTarget = target.id;
game.effects = [];
assert(game.cast(1, target.id, false), 'natural hero cast failed');

// A deliberate recovery receipt and 100 synthetic low-priority hits make
// the queue's already-existing priority rule testable without changing it.
game.event('heal', {
  x: game.hero.x, y: game.hero.y,
  target: 'hero', actor: 'hero', resource: 'health',
});
const events = game.effects.splice(0);
assert(events.some(e => e.type === 'heroSkillCast'),
  'real cast produced no event receipt');
assert(events.some(e => e.type === 'heal'),
  'controlled recovery receipt missing');
const snapshot = JSON.stringify(game.snapshot());
const screen = ({ x, y }) => ({
  x: WIDTH / 2 + (x - 1480) * 0.68 - (y - 1700) * 0.3,
  y: HEIGHT / 2 + (x - 1480) * 0.17 + (y - 1700) * 0.3,
});
function image(layer) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  if (layer === 'warning') {
    Combat.ground(ctx, screen, game, 'fill', game.s.time);
    Combat.ground(ctx, screen, game, 'underlay-cue', game.s.time);
  } else if (layer === 'status') {
    Hero.statuses(ctx, screen, game, WIDTH, HEIGHT);
  } else throw Error('unknown layer');
  const pixels = Buffer.from(ctx.getImageData(0, 0, WIDTH, HEIGHT).data);
  let alphaPixels = 0;
  for (let i = 3; i < pixels.length; i += 4)
    if (pixels[i]) alphaPixels++;
  assert(alphaPixels > 0, layer + ' has no actual Canvas pixels');
  return { pixels, alphaPixels };
}
const warningBefore = image('warning');
const statusBefore = image('status');
for (let i = 0; i < 100; i++)
  events.push({ type: 'hit', x: 1460 + i, y: 1680 + i });
const retained = Combat.queue(events, game, []);
assert.equal(retained.length, 40, 'transient queue budget changed');
assert(retained.some(f => f.type === 'heroSkill' && f.stage === 'cast'),
  'real essential hero cast lost to low-priority hit spam');
assert(retained.some(f => f.type === 'heal'),
  'recovery feedback lost to low-priority hit spam');
assert(retained.filter(f => f.type === 'impact').length < 100,
  'synthetic low-priority hit spam was not bounded');

// Direct-state danger geometry and status composition remain byte-identical
// even when a separate transient queue is saturated. This does NOT say the
// eventual quality-mode renderer will automatically preserve these paths.
assert.deepEqual(image('warning').pixels, warningBefore.pixels,
  'transient pressure changed active boss warning pixels');
assert.deepEqual(image('status').pixels, statusBefore.pixels,
  'transient pressure changed active status pixels');
assert.equal(JSON.stringify(game.snapshot()), snapshot,
  'presentation-only queue pressure mutated gameplay/save state');

console.log('PASS Stage 5.2 protected-cue baseline: real boss warnings ' +
  warningBefore.alphaPixels + ' px, five active target statuses ' +
  statusBefore.alphaPixels + ' px; real hero cast and recovery survive ' +
  '100 synthetic low-priority hits within 40 transient slots; ' +
  'normal-mode save and direct-state Canvas pixels unchanged. ' +
  'No claims of high-priority reserved slots, tier rollout or hardware FPS.');

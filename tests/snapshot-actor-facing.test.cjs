'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Painter = require('../src/prototype/renderer.js');

// The horizontal screen axis is x-y in this world's isometric projection.
const east = { x: 150, y: 100 }, west = { x: 50, y: 100 },
  north = { x: 100, y: 50 }, south = { x: 100, y: 150 },
  actor = { x: 100, y: 100 };
assert.equal(Painter.bodyFacingSide(actor, east), 1);
assert.equal(Painter.bodyFacingSide(actor, west), -1);
assert.equal(Painter.bodyFacingSide(actor, north), 1);
assert.equal(Painter.bodyFacingSide(actor, south), -1);
assert.equal(Painter.bodyFacingSide(actor, { x: 100, y: 100 }, -1), -1,
  'stationary actors retain their last visible heading');
assert.equal(Painter.bodyFacingSide(actor, { x: 106, y: 100 }, -1), -1,
  'small jitter cannot jitter-flip the creature during its cast');
assert.equal(Painter.bodyFacingSide(actor, { x: 111, y: 100 }, -1), 1);
assert.equal(Painter.bodyFacingSide(actor, { x: Infinity, y: 1 }, -1), -1,
  'invalid historic/missing aim coordinates cannot corrupt facing');
assert.equal(Painter.bodyFacingSide(actor, null, -1), -1);

const source = fs.readFileSync(path.join(__dirname, '../src/prototype/renderer.js'), 'utf8');
assert(source.includes('const actorFacingMemory = new WeakMap()'),
  'turns must be held in transient renderer memory, not saved campaign fields');
assert(source.includes('game.selectedHeroTarget?.()'), 'hero faces a selected combat target');
assert(source.includes('game._tacticalPartyTargets?.get(e.id)'),
  'companions use real combat target assignment');
assert(source.includes('e.telegraph?.targetId || e.rangedAim?.targetId'),
  'Mirelings and other ranged monsters use actual pending aim, not spawn orientation');
assert(source.includes('target.translate(2 * q.x, 0)') && source.includes('target.scale(-1, 1)'),
  'only the sprite body is mirrored around its foot anchor');
assert(source.indexOf('groundMarker(e, p);') < source.indexOf('sprite(\n            e.kind'),
  'ground markers are drawn outside actor-local mirroring');
assert(source.includes('if (facing < 0) target.restore()'),
  'canvas transform cannot leak into labels, cast bars, or next actors');

// Explicit family matrix: a mirrored snout or weapon must face its actual
// projected attack direction regardless of whether the body is procedural,
// a PNG sprite, a rider on a direwolf or a much larger boss silhouette.
const families = [
  ...['paladin', 'mage', 'ranger'].map((name) => 'hero:' + name),
  ...['soldier', 'archer'].map((name) => 'ally:' + name),
  ...['goblin', 'skeleton', 'mireling', 'reedbeast', 'wolf', 'ogre',
    'orc', 'archer', 'ashbeast', 'crownguard'].map((name) => 'enemy:' + name),
  'enemy:crown-direwolf-lance-rider',
  'enemy:crown-direwolf-archer',
  ...require('../src/prototype/data.js').bosses.map((boss) => 'boss:' + boss.id),
];
for (const family of families) {
  for (const [target, side] of [[east, 1], [west, -1], [north, 1], [south, -1]]) {
    assert.equal(Painter.bodyFacingSide(actor, target), side,
      family + ' profile faces the real isometric target, not a static east pose');
  }
}
// Mounted riders inherit both target-facing projections from the same renderer
// used by ordinary monsters. Exercise native Mine units, not just named labels.
const Campaign = require('../src/prototype/engine.js');
for (const mode of ['normal', 'nightmare']) {
  const game = new Campaign(mode, 'paladin', () => 0.9);
  game.enter('mine');
  const riders = game.zone().enemies.filter((e) => e.mountedCrownRider && e.hp > 0);
  assert(riders.some((e) => e.ranged) && riders.some((e) => !e.ranged),
    mode + ': both native mounted archer and lancer profiles exist');
  for (const rider of riders) {
    const toRight = { x: rider.x + 80, y: rider.y };
    const toLeft = { x: rider.x - 80, y: rider.y };
    assert.equal(Painter.bodyFacingSide(rider, toRight, -1), 1,
      mode + ': ' + rider.name + ' faces projected-right target');
    assert.equal(Painter.bodyFacingSide(rider, toLeft, 1), -1,
      mode + ': ' + rider.name + ' mirrors toward projected-left target');
    assert.equal(Painter.bodyFacingSide(rider, null, -1), -1,
      mode + ': stationary rider keeps previous direction');
  }
}
assert(source.includes("add(z.enemies, 'enemy')") &&
  source.includes('entities.push(presentEntity(e, renderKind))') &&
  source.includes('const facing = paintedFacing(e)') &&
  source.includes('PrototypeVisuals.draw(target, e, q, game.regionIndex(), rescued)'),
  'native mounted enemies pass through the shared combat-facing sprite transform');

const visualSource = fs.readFileSync(path.join(__dirname, '../src/prototype/visuals.js'), 'utf8');
const spriteSource = fs.readFileSync(path.join(__dirname, '../src/prototype/sprites.js'), 'utf8');
assert(visualSource.includes("case 'mireling':") && visualSource.includes("crocodile('#687a61')"),
  'Mireling procedural mouth is a forward-facing crocodilian snout');
assert(visualSource.includes('crownDirewolfRider(!!e.ranged)'),
  'the mounted wolf-rider body participates in enemy-facing rules');
assert(spriteSource.includes('paint(ctx, entry, frame, img, p, scale)') &&
  !spriteSource.includes('root.PrototypeVisuals?.actorFacing?.(e)'),
  'registered sprites get exactly the shared renderer transform, never a second reversal');
assert(!visualSource.includes('const actorFacingHistory = new WeakMap()'),
  'procedural art does not apply a duplicate profile reversal');

console.log('PASS facing intent/orientation for all actor families, isometric axes, and render isolation');

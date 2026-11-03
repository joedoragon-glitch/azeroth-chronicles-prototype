'use strict';
const assert = require('node:assert/strict');
const R = require('../src/prototype/renderer.js');
const boss = {
  type: 'boss',
  family: 'warlord',
  aggro: true,
  hp: 100,
  ashCloud: { x: 25, y: 40, expires: 16 },
};
const game = { s: { time: 10 }, zone: () => ({ enemies: [boss] }) };
const project = (p) => ({ x: p.x * 1.52, y: p.y * 0.54 });
assert.deepEqual(R.ashCloudPresentation(game, project, 2), [
  { x: 38, y: 21.6, rx: 273.6, ry: 131.328, lineWidth: 5 },
]);
for (const change of [{ hp: 0 }, { aggro: false }, { ashCloud: { x: 25, y: 40, expires: 10 } }]) {
  const old = { ...boss };
  Object.assign(boss, change);
  assert.deepEqual(R.ashCloudPresentation(game, project, 2), []);
  Object.assign(boss, old);
}
boss.family = 'ridge';
boss.ledgerMarkedId = 'hero';
boss.ledgerMarkUntil = 11;
assert(R.ledgerMarked(game, { renderKind: 'hero', id: 'different' }));
assert(!R.ledgerMarked(game, { renderKind: 'ally', id: 'different' }));
boss.ledgerMarkedId = 'ally-7';
assert(R.ledgerMarked(game, { renderKind: 'ally', id: 'ally-7' }));
assert(!R.ledgerMarked(game, { renderKind: 'enemy', id: 'ally-7' }));
game.s.time = 11;
assert(!R.ledgerMarked(game, { renderKind: 'ally', id: 'ally-7' }));
game.zone = () => ({ enemies: [] });
assert.deepEqual(R.ashCloudPresentation(game, project, 2), []);
assert(!R.ledgerMarked(game, { renderKind: 'hero' }));
console.log('PASS #748 critical fields: shared geometry, target identity, expiry and zone cleanup');
// Decomposed retained wildlife must paint the same authored animals and homes.
const { createCanvas } = require('@napi-rs/canvas');
const V = require('../src/prototype/visuals.js');
const C = require('../src/prototype/engine.js');
for (const structure of Object.keys(C.rules.ambientLife)) {
  const e = { id: 'parity-' + structure, structure, renderKind: 'prop', decorative: true };
  if (structure === 'mire-nests')
    Object.assign(e, { id: structure, kind: 'landmark', renderKind: 'npc', structure: undefined });
  for (const time of [0, 7]) {
    e.ambientTime = time;
    const original = createCanvas(320, 240),
      split = createCanvas(320, 240);
    const a = original.getContext('2d'),
      b = split.getContext('2d'),
      parts = [];
    V.draw(a, e, { x: 160, y: 140 });
    V.draw(b, e, { x: 160, y: 140 }, 0, false, { mode: 'static', onPart: (p) => parts.push(p) });
    assert(parts.length >= 2, structure + ' exposes individual original animals');
    for (const part of parts) {
      const motion = V.ambientAnimalPose(e, part.index, time);
      b.save();
      b.translate(160 + part.x + motion.x, 140 + part.y + motion.y);
      b.scale(motion.facing, 1);
      b.translate(-160 - part.x, -140 - part.y);
      V.draw(b, e, { x: 160, y: 140 }, 0, false, { mode: 'part', index: part.index });
      b.restore();
    }
    const left = a.getImageData(0, 0, 320, 240).data,
      right = b.getImageData(0, 0, 320, 240).data;
    let difference = 0;
    for (let i = 0; i < left.length; i++) difference += Math.abs(left[i] - right[i]);
    assert(
      difference < 1000,
      structure + ' preserves source geometry, palette and separate home: ' + difference,
    );
  }
}
console.log(
  'PASS all five wildlife families retain canonical pixels at two times with independent parts',
);

// The original Canvas actor presentation point includes identity-phase breathing.
// Pixi must use that point for raster and procedural bodies and actor attachments,
// while ground markers stay at the unmodified world anchor. Rendering may not
// repair idle motion by rebaking a procedural body every frame.
const pixiSource = require('node:fs').readFileSync(
  require.resolve('../src/prototype/pixi-experimental.js'), 'utf8',
);
const actorFrame = pixiSource.split('function actorFrame() {')[1]?.split('// #708:')[0];
assert(actorFrame, 'Pixi original actor submission exists');
assert(
  actorFrame.includes('const bodyPoint = canvasRenderer.visualPositionFor?.(visual) || point;'),
  'Pixi actor body must use Canvas live presentation position',
);
assert(
  actorFrame.includes('x: point.x,\n                y: point.y,\n                scale: zoom'),
  'Foot shadows and ground markers remain at original world coordinates',
);
assert(
  actorFrame.includes('{ x: bodyPoint.x / zoom, y: bodyPoint.y / zoom }') &&
  actorFrame.includes('bodyPoint.x + b.dx * zoom') &&
  actorFrame.includes('y: bodyPoint.y + b.dy * zoom') &&
  actorFrame.includes('x: source.bodyPoint.x'),
  'Raster and procedural art, plus character-specific details, must follow idle motion',
);
assert(
  !actorFrame.includes('revision + \'idle\'') && !actorFrame.includes('revision + time'),
  'Idle motion must not trigger procedural rebaking',
);
console.log('PASS Pixi uses Canvas idle/active body position while world feet and cached art stay fixed');

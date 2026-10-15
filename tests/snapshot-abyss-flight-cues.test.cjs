'use strict';
const assert = require('node:assert/strict');
const Renderer = require('../src/prototype/renderer.js');
const Campaign = require('../src/prototype/engine.js');

function paint(entity) {
  const calls = [];
  const ctx = new Proxy({}, {
    get(target, key) {
      return key in target ? target[key] : (...args) => calls.push({ key, args });
    },
    set(target, key, value) { target[key] = value; return true; },
  });
  const before = JSON.stringify(entity);
  const drawn = Renderer.drawAbyssFlightCues(ctx, entity,
    { x: entity.x, y: entity.y }, (point) => ({ x: point.x, y: point.y }));
  assert.equal(JSON.stringify(entity), before, 'flight cues never mutate combat or saves');
  return { drawn, calls };
}

for (const name of ['lazy-eight', 'high-yo-yo', 'wingover', 'go-around']) {
  const enemy = {
    renderKind: 'enemy', family: 'abyss', type: 'boss', hp: 100,
    x: 500, y: 500,
    motion: {
      ...(name !== 'lazy-eight' ? { aerial: name } : {}),
      flightPath: [{ x: 650, y: 550 }],
      target: { x: 650, y: 550 },
      speed: 350, life: 2,
    },
  };
  const painted = paint(enemy);
  assert(painted.drawn, name + ' cues tied to genuine active motion');
  assert.equal(painted.calls.filter((c) => c.key === 'stroke').length, 3,
    'exactly two banking strokes plus one local flight streak');
  assert.equal(painted.calls.filter((c) => c.key === 'fill').length, 0,
    'no false damage ground marks');
  assert.equal(painted.calls[0].key, 'save');
  assert.equal(painted.calls.at(-1).key, 'restore');
  assert.equal(paint({ ...enemy, motion: null }).drawn, false);
  assert.equal(paint({ ...enemy, family: 'darklord' }).drawn, false);
  assert.equal(paint({ ...enemy, hp: 0 }).drawn, false);
  assert.equal(paint({
    ...enemy, motion: { flightPath: [{ x: 500, y: 500 }] },
  }).drawn, false, 'no fake speedlines at zero real movement');
}

const c = new Campaign('normal', 'paladin', () => 0.9);
assert(c.enter('abyss'));
const b = c.bossEnemy(c.boss('abyss'), 'normal', { x: 1080, y: 1020 });
c.zone().enemies = [b];
Object.assign(c.hero, { x: 1200, y: 1100 });
const attack = c.buildBossAttack(b, 2, c.hero).first;
assert(attack.flightPath?.length, 'original Lazy Eight has bounded real waypoints');
b.telegraph = attack;
c.resolveAttack(b);
assert(b.motion && b.motion.flightPath?.length,
  'Lazy Eight actually uses the moving-flight presentation state');
assert(paint({ ...b, renderKind: 'enemy' }).drawn,
  'live Lazy Eight connects to the flight cue without new mechanics');
assert(Campaign.restore(c.snapshot()), 'existing version 4 save unchanged');
console.log('PASS four flight cue identities and live Lazy Eight, no false hitboxes or save mutation');

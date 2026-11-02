'use strict';
// Native overlay owns a bounded, transient Dodge label even when Pixi draws the world.
const assert = require('node:assert/strict');
const Renderer = require('../src/prototype/renderer.js');
let now = 1000;
const game = {
  zoneId: 'vale',
  hero: { id: 'hero', hp: 100, x: 100, y: 100 },
  s: { statistics: { deaths: 0 }, party: [] },
  zone() { return { enemies: [{ id: 'foe', hp: 100, x: 120, y: 120 }] }; },
};
const renderer = Renderer.create({
  canvas: { width: 400, height: 300 }, ctx: {}, getGame: () => game,
  platform: { cameraZoom: 1, cameraAnchor: () => ({ x: 200, y: 150 }) },
  chargePresentation: () => null, isPaused: () => false,
  Campaign: {}, PrototypeVisuals: {},
  PrototypeCombatVisuals: { queue(_events, _game, current) { return current; } },
  PrototypeGroundCache: null, PrototypeEnemyVfxArt: null,
  renderLayer: 'overlay', now: () => now,
});
function avoid(target = 'foe') {
  renderer.queue([{ type: 'skillEvaded', target,
    zone: game.zoneId, deaths: game.s.statistics.deaths }]);
}
avoid();
assert.equal(renderer.metrics().dodgeCues, 1);
renderer.queue([{ type: 'criticalExecutionRelease', source: 'hero',
  zone: game.zoneId, deaths: game.s.statistics.deaths }]);
assert.equal(renderer.metrics().dodgeCues, 1, 'critical cue is independent');
now += 450;
renderer.update(0);
assert.equal(renderer.metrics().dodgeCues, 1, 'skipped paint preserves pending cue');
avoid();
assert.equal(renderer.metrics().dodgeCues, 1, 'same target refreshes');
for (let i = 0; i < 12; i++) avoid('enemy-' + i);
assert(renderer.metrics().dodgeCues <= 8, 'crowd cap is enforced');
now += 1500;
renderer.update(0);
assert.equal(renderer.metrics().dodgeCues, 0, 'unpainted cues expire by wall clock');
avoid();
game.zoneId = 'march';
renderer.queue([]);
assert.equal(renderer.metrics().dodgeCues, 0, 'zone transitions clear pending labels');
console.log('PASS skill evasion overlay duplicate, frame skip, bound and scene reset');

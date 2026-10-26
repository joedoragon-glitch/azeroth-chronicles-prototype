'use strict';
// Skipped and off-screen critical indicators must have bounded lifetime.
const assert = require('node:assert/strict');
const Renderer = require('../src/prototype/renderer.js');
let now = 1000;
const game = {
  zoneId: 'vale',
  hero: { id: 'hero', hp: 100, x: 100, y: 100 },
  s: { statistics: { deaths: 0 }, party: [] },
  zone() { return { enemies: [] }; },
};
const renderer = Renderer.create({
  canvas: { width: 400, height: 300 },
  ctx: {}, getGame: () => game,
  platform: { cameraZoom: 1, cameraAnchor: () => ({ x: 200, y: 150 }) },
  chargePresentation: () => null,
  isPaused: () => false,
  Campaign: {}, PrototypeVisuals: {},
  PrototypeCombatVisuals: { queue(_events, _game, existing) { return existing; } },
  PrototypeGroundCache: null, PrototypeEnemyVfxArt: null,
  renderLayer: 'overlay', now: () => now,
});
const release = (source) => renderer.queue([{
  type: 'criticalExecutionRelease', source,
  zone: game.zoneId, deaths: game.s.statistics.deaths,
}]);
release('hero');
assert.equal(renderer.metrics().criticalCues, 1);
now += 1000;
renderer.update(0);
assert.equal(renderer.metrics().criticalCues, 1, 'short skip preserves undrawn cue');
now += 800;
renderer.update(0);
assert.equal(renderer.metrics().criticalCues, 0, 'stale off-screen cue expires unseen');
release('hero');
now += 1500;
renderer.update(0);
assert.equal(renderer.metrics().criticalCues, 1);
release('hero');
assert.equal(renderer.metrics().criticalCues, 1, 'same actor refreshes a single cue');
for (let i = 0; i < 15; i++) release('enemy-' + i);
assert.equal(renderer.metrics().criticalCues, 10, 'independent crowd cue cap');
game.zoneId = 'march';
renderer.queue([]);
assert.equal(renderer.metrics().criticalCues, 0, 'scene transitions clear cues');
console.log('PASS bounded critical indicator off-screen lifetime, refresh, crowd and reset');

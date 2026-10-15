'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');
const Visuals = require('../src/prototype/visuals.js');

// Working roads, but deliberately not an illuminated wilderness grid.
const expected = { vale: 3, march: 4, highlands: 4, frontier: 4, crown: 6 };
for (const mode of ['normal', 'nightmare']) {
  for (const [zoneId, count] of Object.entries(expected)) {
    const game = new Campaign(mode, 'paladin', () => 0.9);
    game.enter(zoneId);
    const z = game.zone();
    const lights = z.props.filter((p) => p.id.startsWith('public-lantern-'));
    assert(!z.props.some((p) => p.roadLamp ||
      String(p.id).startsWith('night-road-lamp-')),
    'superseded street posts must not duplicate the civic lights');
    assert.equal(lights.length, count, zoneId + ': appropriate sparse street lighting');
    assert.equal(new Set(lights.map((p) => p.id)).size, count);
    assert(lights.every((p) =>
      p.decorative && p.r === 0 &&
      p.structure === 'roadside-lantern' &&
      !game.blocked(p.x, p.y, zoneId, 10, true) &&
      game.distanceToRoad(z, p) >= 38 &&
      game.distanceToRoad(z, p) <= 145),
    zoneId + ': lanterns are safe visible road shoulders');
    const positions = lights.map((p) => [p.id, p.x, p.y]);
    game.zone();
    assert.deepEqual(z.props.filter((p) => p.id.startsWith('public-lantern-'))
      .map((p) => [p.id, p.x, p.y]), positions,
    zoneId + ': repeated reads must be idempotent');

    const old = game.snapshot(), zone = old.zones[zoneId],
      victim = zone.enemies.find((e) => e.hp > 0);
    if (victim) { victim.hp = 0; victim.deathPaid = true; }
    zone.props = zone.props.filter((p) => !p.id.startsWith('public-lantern-'));
    delete zone.roadsideLanternVersion;
    // Unpublished dev.51 draft snapshots may contain the second light set.
    zone.props.push({ id: 'night-road-lamp-' + zoneId + '-0', x: 500, y: 500,
      r: 0, decorative: true, roadLamp: true, structure: 'street-lantern' });
    zone.roadLampVersion = 1;
    const revived = Campaign.restore(old);
    revived.enter(zoneId);
    assert(!revived.zone().props.some((p) => p.roadLamp ||
      String(p.id).startsWith('night-road-lamp-')),
    'restoring an unpublished dev.51 save discards old duplicate street posts');
    assert.equal(revived.zone().props.filter((p) =>
      p.id.startsWith('public-lantern-')).length, count,
    'older v4 zones receive civic lights exactly once');
    if (victim) assert.equal(revived.zone().enemies.find((e) =>
      e.id === victim.id).hp, 0, 'street lamps cannot revive defeated enemies');
    assert.equal(revived.hero.gold, game.hero.gold);
    assert.equal(revived.hero.xp, game.hero.xp);
  }
}
const ctx = {
  save() {}, restore() {}, translate() {}, scale() {}, beginPath() {},
  moveTo() {}, lineTo() {}, closePath() {}, ellipse() {}, arc() {},
  fill() { this.fills++; }, stroke() { this.strokes++; },
  fills: 0, strokes: 0,
};
Visuals.draw(ctx, { renderKind: 'prop', structure: 'roadside-lantern',
  id: 'lamppost', decorative: true, r: 0 }, { x: 100, y: 130 }, 4);
assert(ctx.fills >= 5 && ctx.strokes >= 5,
  'street fixture has an actual detailed silhouette');
const renderer = fs.readFileSync(path.join(__dirname, '../src/prototype/renderer.js'), 'utf8');
assert(/const nightSources = !nightNow\s*\? \[\]/.test(renderer),
  'road lamps only illuminate nighttime');
assert(/lanterns\.test\(structure\)\s*\? 'lantern'/.test(renderer),
  'street lamp structure is captured by the existing night light owner');
console.log('PASS 21 sparse night-only civic road lanterns, road clearance, saves and appearance');

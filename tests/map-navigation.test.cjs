'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
for (const region of C.data.regions) {
  const g = new C('normal', 'ranger', () => 0.73);
  g.enter(region.id);
  g.zone();
  const before = g.snapshot(),
    sites = g.mapDestinations(),
    ids = sites.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, 'map destinations are not duplicated');
  assert(
    !sites.some((n) => n.kind === 'boss' && n.family === 'thorn'),
    'tracking clues preserve Thornfang search',
  );
  const town = sites.find((n) => n.kind === 'rest' && n.id === 'rest');
  assert.equal(town.name, region.town);
  for (const target of sites.filter(
    (n) =>
      n.kind === 'rest' ||
      n.kind === 'transport' ||
      n.kind === 'dungeon' ||
      n.sideDungeon ||
      n.id.startsWith('bridge-'),
  )) {
    const route = g.navigationTarget(target);
    assert(route, region.id + ' route to ' + target.name);
    const p = route.point,
      anchor = target.servicePoint || target;
    assert(!g.blocked(p.x, p.y), 'actual approach is walkable');
    assert(
      Math.hypot(p.x - anchor.x, p.y - anchor.y) < 115,
      'route arrives within interaction range',
    );
  }
  assert.deepEqual(g.snapshot(), before, 'map queries do not alter saved campaign facts');
  const saved = JSON.parse(JSON.stringify(before));
  delete saved.zones[region.id].environmentCoherenceVersion;
  const old = C.restore(saved);
  old.zone();
  assert(
    old.navigationTarget(old.mapDestinations().find((n) => n.id === 'rest')),
    'historical region retains usable current frontage',
  );
  Object.assign(old.hero, town.servicePoint || town);
  assert.equal(old.interactionDistance(town), 0, 'rest frontage is an actual interaction location');
}
console.log(
  'PASS all five regional maps: current towns, roads/bridges, travel/entrance routes, interaction frontages, clues, state purity and old-save migration',
);

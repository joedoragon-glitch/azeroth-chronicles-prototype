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
  // Both authored ferry boats float outside their docks. Navigate must find
  // the existing walkable boarding edge, not an offshore tile or a teleport.
  const harbor = C.rules.harbors?.[region.id];
  if (harbor) {
    const ferry = sites.find(
      (n) =>
        n.kind === 'transport' &&
        n.harbor === true &&
        Math.hypot(n.x - harbor.boat.x, n.y - harbor.boat.y) < 1,
    );
    assert(ferry, region.id + ' retains its authored ferry vehicle');
    const choice = g.navigationTarget(ferry);
    assert(choice, region.id + ' real ferry is reachable on the Map');
    const p = choice.point, dock = harbor.dock;
    assert(
      p.x > dock.x1 + 15 &&
        p.x < dock.x2 - 15 &&
        p.y > dock.y1 + 15 &&
        p.y < dock.y2 - 15,
      region.id + ' boarding approach stays inside its existing physical dock',
    );
    assert(
      Math.hypot(p.x - ferry.x, p.y - ferry.y) + 20 < 115,
      region.id + ' boarding stays within unchanged NPC interaction distance after arrival',
    );
    assert.equal(g.blocked(p.x, p.y, g.zoneId, 15), false);
    assert.deepEqual(choice.path.at(-1), p, 'routing ends at the tested dock frontage');
    assert(Math.hypot(g.hero.x - p.x, g.hero.y - p.y) > 50, 'the route is not a teleport');
    assert(
      choice.path.every((point, i) => g.clearSegment(i ? choice.path[i - 1] : g.hero, point)),
      region.id + ' route segments preserve real swept collision',
    );
  }
  assert.deepEqual(g.snapshot(), before, 'map queries do not alter saved campaign facts');
  const saved = JSON.parse(JSON.stringify(before));
  delete saved.zones[region.id].environmentCoherenceVersion;
  if (harbor) delete saved.zones[region.id].harborVersion;
  const restored = C.restore(saved);
  restored.zone();
  assert(
    restored.navigationTarget(restored.mapDestinations().find((n) => n.id === 'rest')),
    'historical region retains usable current frontage',
  );
  if (harbor) {
    const oldFerry = restored.mapDestinations().find(
      (n) => n.kind === 'transport' && n.harbor && Math.hypot(n.x - harbor.boat.x, n.y - harbor.boat.y) < 1,
    );
    assert(oldFerry && restored.navigationTarget(oldFerry),
      region.id + ' historical save retains a reachable real ferry dock');
  }
  Object.assign(restored.hero, town.servicePoint || town);
  assert.equal(restored.interactionDistance(town), 0, 'rest frontage is an actual interaction location');
}
console.log(
  'PASS all five regional maps: current towns, roads/bridges, travel/entrance routes, interaction frontages, clues, state purity and old-save migration',
);

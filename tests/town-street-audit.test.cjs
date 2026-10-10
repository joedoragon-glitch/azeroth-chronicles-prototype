'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
let routes = 0;
let inspected = 0;

for (const region of Campaign.data.regions) {
  const game = new Campaign();
  game.enter(region.id);
  const zone = game.zone();
  const i = game.regionIndex();
  const town = { x: Campaign.data.towns[i][0], y: Campaign.data.towns[i][1] };
  const hamlet = { x: Campaign.data.minors[i][0], y: Campaign.data.minors[i][1] };
  assert.equal(zone.settlementLayoutVersion, 4, region.id + ' new parcel plan');
  assert.equal(zone.roadVersion, 16, region.id + ' connected roads');
  assert.equal(zone.streetClearanceVersion, 2, region.id + ' full street audit');
  assert(zone.roads.length >= 4, region.id + ' real road links');

  const junctions = [town];
  for (const road of zone.roads) {
    assert(road.length > 1, region.id + ' has no empty streets');
    assert(junctions.some((point) => distance(point, road[0]) < 1),
      region.id + ' road must join the connected network: ' + JSON.stringify(road[0]));
    for (let j = 1; j < road.length; j++) {
      assert(game.clearSegment(road[j - 1], road[j], 15),
        region.id + ' road crosses collision geometry');
    }
    junctions.push(...road);
    routes++;
  }
  assert(zone.roads.some((road) => distance(road.at(-1), hamlet) < 2),
    region.id + ' hamlet must be connected to town');
  // Every authored village, named landmark, monster habitation and
  // occupying district needs a legible accessible street/approach.
  const R = Campaign.rules;
  const access = (id, x, y, limit = 260) => {
    const actual = game.distanceToRoad(zone, { x, y });
    assert(actual <= limit,
      region.id + ' ' + id + ' lacks road access (' + Math.round(actual) + ')');
  };
  access('main dungeon', Campaign.data.entrances[i][0], Campaign.data.entrances[i][1]);
  for (const [id, , x, y] of R.sites[i]) {
    if (/^bridge-/.test(id)) continue;
    access(id, x, y);
  }
  for (const hold of R.creatureStrongholds.filter((h) => h.region === region.id)) {
    if (hold.center) access(hold.id, hold.center[0], hold.center[1]);
    else if (hold.site) {
      const site = R.sites[i].find(([id]) => id === hold.site);
      if (site) access(hold.id, site[2], site[3]);
    }
  }
  for (const habitat of R.worldLifePlans[i].habitats)
    access(habitat.id, habitat.center[0], habitat.center[1]);
  for (const district of region.id === 'frontier'
    ? R.frontierDistricts
    : region.id === 'crown'
      ? R.crownDistricts
      : [])
    access(district.id, district.center[0], district.center[1]);
  if (region.id === 'highlands')
    for (const district of R.ironrootLife) {
      const x = district.props.reduce((sum, p) => sum + p[0], 0) / district.props.length;
      const y = district.props.reduce((sum, p) => sum + p[1], 0) / district.props.length;
      access('livelihood:' + district.id, x, y);
    }
  for (const prop of zone.props) {
    if (prop.roadTrace) continue; // Only explicitly flat road ruts / surface repairs may remain.
    const required = game.roadSetback(prop);
    const actual = game.distanceToRoad(zone, prop);
    assert(actual + 0.01 >= required,
      region.id + ' road obstruction ' + prop.id + ' (' + (prop.structure || prop.icon) +
      ') at ' + Math.round(actual) + ' vs setback ' + required);
    inspected++;
  }
  for (const [id, settlementCenter, setback] of [
    ['rest', town, 190], ['minor', hamlet, 180],
    ['board', town, 95], ['supplier', town, 92], ['recruiter', town, 92],
  ]) {
    const npc = zone.npcs.find((n) => n.id === id);
    if (!npc) continue;
    assert(game.distanceToRoad(zone, npc) + .01 >= setback,
      region.id + ' ' + id + ' must stand beside a street, not in it');
    assert(distance(npc, settlementCenter) < 460,
      region.id + ' ' + id + ' must remain in its neighborhood');
  }
  const migrated = game.snapshot();
  const oldZone = migrated.zones[region.id];
  oldZone.roadVersion = 0;
  oldZone.settlementLayoutVersion = 3;
  oldZone.streetClearanceVersion = 0;
  const rest = oldZone.npcs.find((n) => n.id === 'rest');
  Object.assign(rest, town);
  oldZone.props.push({
    id: 'historical-cart-' + region.id, x: town.x + 10, y: town.y + 10,
    r: 0, decorative: true, structure: 'cart',
  });
  oldZone.buildings.push({
    id: 'historical-barracks-' + region.id,
    kind: 'barracks', x: town.x, y: town.y, progress: 4, full: true,
  });
  const originalGold = migrated.hero.gold;
  const restored = Campaign.restore(migrated);
  const restoredZone = restored.zone();
  assert.equal(restored.hero.gold, originalGold, region.id + ' save currency');
  assert.equal(restoredZone.roadVersion, 16);
  assert.equal(restoredZone.settlementLayoutVersion, 4);
  assert.equal(restoredZone.streetClearanceVersion, 2);
  const oldCart = restoredZone.props.find((p) => p.id === 'historical-cart-' + region.id);
  assert(oldCart, region.id + ' old scenery was preserved');
  assert(restored.distanceToRoad(restoredZone, oldCart) >= restored.roadSetback(oldCart),
    region.id + ' historical clutter moved off road');
  const priorBarracks = restoredZone.buildings.find(
    (b) => b.id === 'historical-barracks-' + region.id,
  );
  assert(priorBarracks && priorBarracks.progress === 4 && priorBarracks.full,
    region.id + ' old barracks preserve construction/upgrades');
  assert(restored.distanceToRoad(restoredZone, priorBarracks) >= 175,
    region.id + ' historical barracks moved off the street');
  assert(restored.distanceToRoad(restoredZone, restoredZone.npcs.find((n) => n.id === 'rest'))  >= 190,
    region.id + ' restored refuge not on the central avenue');
}
const construction = new Campaign();
assert(construction.build(), 'a new barracks finds a viable plot away from Millhaven roads');
assert(construction.distanceToRoad(construction.zone(), construction.zone().buildings[0]) >= 175,
  'new construction cannot obstruct a planned road');
console.log('PASS ' + Campaign.data.regions.length + ' settlement street plans, ' +
  routes + ' connected routes, ' + inspected + ' roadside props and historical save migration');

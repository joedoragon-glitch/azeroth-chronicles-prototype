'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const selectedRegion = process.argv.find((a) => a.startsWith('--region='))?.slice(9);
const regions = Campaign.data.regions.filter((r) => !selectedRegion || r.id === selectedRegion);
assert(regions.length, 'unknown region selection');
let routes = 0;
let inspected = 0;

for (const region of regions) {
  const game = new Campaign();
  game.enter(region.id);
  const zone = game.zone();
  const i = game.regionIndex();
  const town = { x: Campaign.data.towns[i][0], y: Campaign.data.towns[i][1] };
  const hamlet = { x: Campaign.data.minors[i][0], y: Campaign.data.minors[i][1] };
  assert.equal(zone.settlementLayoutVersion, 4, region.id + ' new parcel plan');
  assert.equal(zone.roadVersion, 17, region.id + ' connected roads');
  assert.equal(zone.streetClearanceVersion, 3, region.id + ' full street audit');
  assert(zone.roads.length >= 4, region.id + ' real road links');
  if (region.id === 'highlands') {
    assert.equal(
      zone.highlandsQuarryRoadVersion,
      1,
      'quarry hamlet street and refuge repair is versioned',
    );
    assert.equal(
      zone.roads.filter(
        (road) =>
          road.some((p) => distance(p, { x: 2520, y: 650 }) < 1) &&
          distance(road.at(-1), hamlet) < 1,
      ).length,
      1,
      'exactly one authentic quarry hamlet road spur, including old v4 saves',
    );
  }
  if (region.id === 'march') {
    assert.equal(zone.marchTownRoadVersion, 1, 'Reedport road repair is versioned');
    assert.equal(
      zone.marchCoastalRoadClearanceVersion,
      1,
      'old and new coastal scenery keeps full roadway setback',
    );
    assert.equal(
      zone.roads.filter(
        (road) =>
          road.some((p) => distance(p, town) < 1) &&
          road.some((p) => distance(p, { x: 350, y: 1370 }) < 1),
      ).length,
      1,
      'exactly one real Reedport-to-coastal-road leg, never a duplicate',
    );
  }

  // Bridges can connect earlier spurs from either end. Validate the completed
  // geometric network, including segment-interior joins, independently of order.
  const touches = (point, path) =>
    path.some((p, j) => j && game.distanceToSegment(point, path[j - 1], p) < 1);
  const connected = new Set(
    zone.roads.map((road, j) => (touches(town, road) ? j : -1)).filter((j) => j >= 0),
  );
  for (let grew = true; grew; ) {
    grew = false;
    zone.roads.forEach((road, j) => {
      if (connected.has(j)) return;
      if (
        [...connected].some(
          (k) =>
            road.some((p) => touches(p, zone.roads[k])) ||
            zone.roads[k].some((p) => touches(p, road)),
        )
      ) {
        connected.add(j);
        grew = true;
      }
    });
  }
  assert.equal(
    connected.size,
    zone.roads.length,
    region.id + ' every road belongs to the town-connected network',
  );
  for (const road of zone.roads) {
    assert(road.length > 1, region.id + ' has no empty streets');
    for (let j = 1; j < road.length; j++) {
      assert(
        game.clearSegment(road[j - 1], road[j], 15),
        region.id + ' road crosses collision geometry',
      );
    }
    routes++;
  }
  assert(
    zone.roads.some((road) => distance(road.at(-1), hamlet) < 2),
    region.id + ' hamlet must be connected to town',
  );
  // Every authored village, named landmark, monster habitation and
  // occupying district needs a legible accessible street/approach.
  const R = Campaign.rules;
  const access = (id, x, y, limit = 260) => {
    const actual = game.distanceToRoad(zone, { x, y });
    assert(
      actual <= limit,
      region.id + ' ' + id + ' lacks road access (' + Math.round(actual) + ')',
    );
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
  if (region.id === 'march') {
    const failures = zone.props
      .filter((p) => !p.roadTrace && game.distanceToRoad(zone, p) + 0.01 < game.roadSetback(p))
      .map((p) => [
        p.id,
        p.structure,
        Math.round(game.distanceToRoad(zone, p)),
        game.roadSetback(p),
      ]);
    if (failures.length)
      console.error('MARCH STRICT ROAD OBSTRUCTIONS', JSON.stringify(failures.slice(0, 40)));
  }
  // Report *all* violations together. Fail closed, with the same geometric
  // threshold, but avoid correcting one wall per six-minute CI cycle.
  const obstructions = [];
  for (const prop of zone.props) {
    if (prop.roadTrace) continue; // Only explicitly flat road ruts / surface repairs may remain.
    const required = game.roadSetback(prop);
    const actual = game.distanceToRoad(zone, prop);
    if (actual + 0.01 < required)
      obstructions.push({
        id: prop.id,
        structure: prop.structure || prop.icon,
        x: Math.round(prop.x),
        y: Math.round(prop.y),
        actual: Math.round(actual),
        required,
      });
    inspected++;
  }
  assert.equal(
    obstructions.length,
    0,
    region.id +
      ' road obstructions (' +
      obstructions.length +
      '): ' +
      JSON.stringify(obstructions.slice(0, 100)),
  );
  for (const [id, settlementCenter, setback] of [
    ['rest', town, 190],
    ['minor', hamlet, 180],
    ['board', town, 95],
    ['supplier', town, 92],
    ['recruiter', town, 92],
  ]) {
    const npc = zone.npcs.find((n) => n.id === id);
    if (!npc) continue;
    assert(
      game.distanceToRoad(zone, npc) + 0.01 >= setback,
      region.id + ' ' + id + ' must stand beside a street, not in it',
    );
    // The historical 2700-unit Greenwood onboarding intentionally placed
    // Orchard Hamlet's service refuge away from its nominal old town marker.
    // Do not require the rejected 3200 authored-parcel neighborhood on this
    // restored legacy map. Keep the strict assertion for every other region.
    if (!(region.id === 'vale' && region.size === 2700 && id === 'minor'))
      assert(
        distance(npc, settlementCenter) < 460,
        region.id + ' ' + id + ' must remain in its neighborhood',
      );
    if (id === 'rest' || id === 'minor') {
      const size = region.size;
      assert(
        Math.min(npc.x, npc.y, size - npc.x, size - npc.y) >= 115,
        region.id + ' refuge artwork must fit within its world boundary',
      );
    }
  }
  // Reproduce pre-fix scene-composition service positions in an otherwise
  // current v4 save. Repair must survive native NPC refresh and two reloads.
  if (['highlands', 'frontier', 'crown'].includes(region.id)) {
    const historical = game.snapshot(),
      old = historical.zones[region.id];
    delete old.finalStreetClearanceVersion;
    const refuge = old.npcs.find((n) => n.id === 'rest');
    Object.assign(refuge, town);
    const priorGold = historical.hero.gold;
    const repaired = Campaign.restore(historical),
      fixed = repaired.zone();
    repaired.refreshNPCs();
    assert.equal(repaired.hero.gold, priorGold);
    assert.equal(fixed.finalStreetClearanceVersion, 1, region.id + ' final clearance completed');
    for (const [id, setback] of [
      ['rest', 190],
      ['minor', 180],
      ['board', 95],
      ['supplier', 92],
      ['recruiter', 92],
    ]) {
      const n = fixed.npcs.find((n) => n.id === id);
      assert(
        n && repaired.distanceToRoad(fixed, n) + 0.01 >= setback,
        region.id + ' refreshed service stays off the road: ' + id,
      );
    }
    const positions = fixed.npcs.map((n) => [n.id, n.x, n.y, n.servicePoint]);
    const again = Campaign.restore(repaired.snapshot());
    again.refreshNPCs();
    assert.deepEqual(
      again.zone().npcs.map((n) => [n.id, n.x, n.y, n.servicePoint]),
      positions,
      region.id + ' second restore retains exact service positions',
    );
  }
  const migrated = game.snapshot();
  const oldZone = migrated.zones[region.id];
  oldZone.roadVersion = 0;
  oldZone.settlementLayoutVersion = 3;
  oldZone.streetClearanceVersion = 0;
  const rest = oldZone.npcs.find((n) => n.id === 'rest');
  Object.assign(rest, town);
  oldZone.props.push({
    id: 'historical-cart-' + region.id,
    x: town.x + 10,
    y: town.y + 10,
    r: 0,
    decorative: true,
    structure: 'cart',
  });
  oldZone.buildings.push({
    id: 'historical-barracks-' + region.id,
    kind: 'barracks',
    x: town.x,
    y: town.y,
    progress: 4,
    queue: 0,
    queueType: null,
    full: true,
    upgradeProgress: 4,
    upgradePaid: true,
  });
  const originalGold = migrated.hero.gold;
  const restored = Campaign.restore(migrated);
  const restoredZone = restored.zone();
  assert.equal(restored.hero.gold, originalGold, region.id + ' save currency');
  assert.equal(restoredZone.roadVersion, 17);
  assert.equal(restoredZone.settlementLayoutVersion, 4);
  assert.equal(restoredZone.streetClearanceVersion, 3);
  const oldCart = restoredZone.props.find((p) => p.id === 'historical-cart-' + region.id);
  assert(oldCart, region.id + ' old scenery was preserved');
  assert(
    restored.distanceToRoad(restoredZone, oldCart) >= restored.roadSetback(oldCart),
    region.id + ' historical clutter moved off road',
  );
  const priorBarracks = restoredZone.buildings.find(
    (b) => b.id === 'historical-barracks-' + region.id,
  );
  assert(
    priorBarracks && priorBarracks.progress === 4 && priorBarracks.full,
    region.id + ' old barracks preserve construction/upgrades',
  );
  assert(
    restored.distanceToRoad(restoredZone, priorBarracks) >= 175,
    region.id + ' historical barracks moved off the street',
  );
  assert(
    restored.distanceToRoad(
      restoredZone,
      restoredZone.npcs.find((n) => n.id === 'rest'),
    ) >= 190,
    region.id + ' restored refuge not on the central avenue',
  );
}
const construction = new Campaign();
assert(construction.build(), 'a new barracks finds a viable plot away from Millhaven roads');
assert(
  construction.distanceToRoad(construction.zone(), construction.zone().buildings[0]) >= 175,
  'new construction cannot obstruct a planned road',
);
console.log(
  'PASS ' +
    regions.length +
    ' settlement street plans, ' +
    routes +
    ' connected routes, ' +
    inspected +
    ' roadside props and historical save migration',
);

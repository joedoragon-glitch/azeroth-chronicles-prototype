'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

// Roads serve the square rather than passing through homes, stalls, walls or refuse.
const failures = [];
for (const [i, region] of Campaign.data.regions.entries()) {
  try {
  const game = new Campaign();
  game.enter(region.id);
  const zone = game.zone(),
    center = { x: Campaign.data.towns[i][0], y: Campaign.data.towns[i][1] },
    hamlet = { x: Campaign.data.minors[i][0], y: Campaign.data.minors[i][1] };
  assert.equal(zone.settlementLayoutVersion, 4, region.id + ' has migrated settlement lots');
  assert.equal(zone.roadsideClearanceVersion, 1, region.id + ' has had a street audit');
  console.log('TOWN_STREETS',region.id,JSON.stringify({roadCount:zone.roads.length,ends:zone.roads.map(p=>p.at(-1)),minor:hamlet,major:center,buildings:zone.props.filter(p=>p.roadBlocker).length}));
  assert(zone.roads.length >= 3, region.id + ' has purposeful regional roads');
  assert(
    zone.roads.some((p) => {
      const last = p.at(-1);
      const gap = Math.hypot(last.x - hamlet.x, last.y - hamlet.y);
      return gap >= 100 && gap <= 190;
    }),
    region.id + ' connects its outlying settlement',
  );
  const homes = zone.props.filter((p) => p.roadBlocker);
  assert(homes.length >= 12, region.id + ' retains established housing');
  const roadIntrusions = homes
    .filter((p) => game.nearestRoad(p, zone).distance < game.roadFootprint(p))
    .map((p) => ({
      id: p.id, structure: p.structure, x: p.x, y: p.y,
      distance: Math.round(game.nearestRoad(p, zone).distance),
      clearance: game.roadFootprint(p),
    }));
  assert.deepEqual(roadIntrusions, [], region.id + ' settlement buildings occupy road space');
  const strayProps = zone.props
    .filter((p) => p.decorative && p.structure && !p.roadTrace)
    .filter((p) => game.nearestRoad(p, zone).distance < game.roadFootprint(p))
    .map((p) => p.id + ':' + p.structure);
  assert.deepEqual(strayProps, [], region.id + ' roadside props occupy road space');
  const refuge = zone.npcs.find((n) => n.id === 'rest'),
    smallerRefuge = zone.npcs.find((n) => n.id === 'minor');
  assert(refuge && smallerRefuge, region.id + ' retains both refuge services');
  assert(
    Math.hypot(refuge.x - center.x, refuge.y - center.y) > 105,
    region.id + ' civic street center is not inside a refuge house',
  );
  for (const p of [refuge, smallerRefuge])
    assert(
      game.nearestRoad(p, zone).distance >= game.roadFootprint(p),
      region.id + ' refuge frontage sits beside the road',
    );
  const square = zone.roads[0][0];
  assert(Math.hypot(square.x - center.x, square.y - center.y) < 1);

  // A saved version-3 settlement retains its identifiers and campaign data
  // while picking up the latest street plan and cleaned placement.
  const state = game.snapshot();
  state.zones[region.id].settlementLayoutVersion = 3;
  state.zones[region.id].roadVersion = 10;
  delete state.zones[region.id].roadsideClearanceVersion;
  const restored = Campaign.restore(state),
    migrated = restored.zone();
  assert.equal(migrated.settlementLayoutVersion, 4);
  assert.equal(migrated.roadsideClearanceVersion, 1);
  assert.deepEqual(
    migrated.props.filter((p) => p.roadBlocker).map((p) => p.id),
    homes.map((p) => p.id),
    region.id + ' keeps stable house IDs through migration',
  );
  } catch (error) {
    failures.push(region.id + ': ' + error.message);
    console.error('FAIL_TOWN_STREETS', region.id, error.stack);
  }
}
assert.deepEqual(failures, [], 'five-region town street audit');
console.log('PASS five town street plans, visual clearances and saved layout migrations');

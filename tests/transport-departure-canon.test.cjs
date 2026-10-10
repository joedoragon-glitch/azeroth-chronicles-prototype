'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const original = { vale: [2450, 650], highlands: [3100, 500], frontier: [3100, 500] };
const oldTownStands = { vale: [135, 540], highlands: [590, 1420], frontier: [145, 260] };
const expectedRoad = { vale: 11, highlands: 11, frontier: 12 };
for (const [region, coords] of Object.entries(original)) {
  const c = new C();
  c.enter(region);
  const z = c.zone();
  const outgoing = z.npcs.find((n) => n.id === 'outbound' && n.kind === 'transport');
  assert(outgoing, region + ' outbound transport exists');
  assert(distance(outgoing, { x: coords[0], y: coords[1] }) < 75, region + ' retains original departure');
  assert(distance(outgoing, { x: oldTownStands[region][0], y: oldTownStands[region][1] }) > 500,
    region + ' must not be moved to the settlement approach');
  const i = c.regionIndex();
  const town = { x: C.data.towns[i][0], y: C.data.towns[i][1] };
  assert(c.route(town, outgoing).length, region + ' town can reach original distant departure');
  assert(z.roads.some((road) => distance(road.at(-1), outgoing) < 75),
    region + ' separate route ends at the outbound transport');
  assert.equal(z.roadVersion, expectedRoad[region]);
  assert.equal(z.destinationLayoutVersion, 4);
  assert.equal(z.aestheticVersion, 5);
  assert.equal(z.worldLifeVersion, 2);
  assert.equal(z.travelSafetyVersion, 2);
  const old = c.snapshot();
  const priorEnemies = old.zones[region].enemies.length;
  const priorProps = z.props.length;
  const historical = old.zones[region];
  const prior = oldTownStands[region];
  Object.assign(historical.npcs.find((n) => n.id === 'outbound'), { x: prior[0], y: prior[1] });
  historical.destinationLayoutVersion = 3;
  historical.roadVersion = region === 'frontier' ? 11 : 10;
  historical.aestheticVersion = 4;
  historical.worldLifeVersion = 1;
  historical.travelSafetyVersion = 1;
  if (region === 'highlands') historical.ironrootLifeVersion = 1;
  if (region === 'frontier') historical.frontierLayoutVersion = 3;
  // Old saves keep quest and permanent defeat facts; this is geometry/presentation only.
  old.hero.gold = 832;
  const dead = historical.enemies.find((e) => e.type !== 'boss' && e.hp > 0);
  if (dead) dead.hp = 0;
  const restored = C.restore(old);
  restored.enter(region);
  const migrated = restored.zone();
  const departure = migrated.npcs.find((n) => n.id === 'outbound');
  assert(distance(departure, { x: coords[0], y: coords[1] }) < 75, region + ' old-save NPC migration');
  assert(migrated.roads.some((road) => distance(road.at(-1), departure) < 75),
    region + ' old-save road migration');
  assert.equal(migrated.enemies.length, priorEnemies, region + ' must preserve all enemy IDs');
  if (dead) assert.equal(migrated.enemies.find((e) => e.id === dead.id).hp, 0,
    region + ' does not revive defeated residents');
  assert.equal(restored.hero.gold, 832, 'travel migration cannot change crowns');
  assert(migrated.props.length > 0 && priorProps > 0, region + ' retains original scenery');
  if (region === 'highlands') {
    assert.equal(migrated.ironrootLifeVersion, 2);
    assert(migrated.props.some((p) => p.ironrootDistrict === 'caravan' &&
      p.structure === 'caravan-loading-bay'), 'original Highlands caravan facilities restored');
    const boat = migrated.npcs.find((n) => n.id === 'return');
    assert(boat.harbor && distance(boat, C.rules.harbors.highlands.boat) < 10,
      'inbound ferry remains at its original dock');
  }
  if (region === 'frontier') {
    assert.equal(migrated.frontierLayoutVersion, 4);
    const inbound = migrated.npcs.find((n) => n.id === 'return');
    assert(distance(inbound, C.rules.travelArrivalStands.frontier) < 75,
      'incoming civilian caravan remains on Emberwatch rear approach');
  }
  const after = JSON.stringify(restored.snapshot());
  restored.zone();
  assert.equal(JSON.stringify(restored.snapshot()), after, region + ' migration is idempotent');
}
const march = new C();
march.enter('march');
assert(distance(march.zone().npcs.find((n) => n.id === 'outbound'),
  C.rules.harbors.march.boat) < 10, 'Marches outbound ferry remains at its pier');
console.log('PASS original distant outbound stands, road scenery, inbound harbors and v4 save migration');

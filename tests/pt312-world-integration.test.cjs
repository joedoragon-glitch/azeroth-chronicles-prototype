'use strict';
// Authored only. Full runtime/native acceptance is explicitly deferred.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const R = C.rules;
for (const region of C.data.regions) {
  const g = new C('normal', 'paladin', () => 0.73);
  g.enter(region.id);
  const z = g.zone(), i = g.regionIndex();
  assert.equal(z.environmentCoherenceVersion, 1);
  assert(z.props.length <= 400, region.id + ' retains v4 prop budget');
  assert.equal(z.roadVersion, 17);
  for (const bridge of z.bridgeApproaches) {
    assert(g.clearSegment(bridge.west, bridge.east, 25), region.id + ' full usable crossing');
    assert(g.distanceToRoad(z, bridge.west) < 30);
    assert(g.distanceToRoad(z, bridge.east) < 30);
    assert(g.route(bridge.west, bridge.east).length, 'both banks are connected');
    for (const bank of [bridge.west, bridge.east])
      assert(g.route({ x: C.data.towns[i][0], y: C.data.towns[i][1] }, bank).length,
        region.id + ' settlement network reaches each bank');
  }
  for (const n of z.npcs.filter((n) => n.treasury)) {
    assert(g.distanceToRoad(z, n) >= 190, region.id + ' full Treasury frontage off carriageway');
    assert(g.route(g.hero, n).length, 'actual entrance remains usable');
  }
  const raw = g.snapshot(), saved = raw.zones[region.id],
    actors = saved.enemies.map((e) => [e.id, e.hp, e.deathPaid]),
    tribute = saved.nodes.map((n) => [n.id, n.amount]);
  delete saved.environmentCoherenceVersion;
  saved.roadVersion = 16;
  const restored = C.restore(raw), rz = restored.zone();
  assert.deepEqual(rz.enemies.map((e) => [e.id, e.hp, e.deathPaid]), actors,
    region.id + ' road/bank migration preserves actors, wounds and deaths');
  assert.deepEqual(rz.nodes.map((n) => [n.id, n.amount]), tribute, 'no tribute reset');
  const once = JSON.stringify(restored.snapshot());
  restored.zone();
  assert.equal(JSON.stringify(restored.snapshot()), once, 'migration is idempotent');
}
// PT-013: the Highlands ravine cannot be bypassed around either map-edge endpoint.
{
  const g = new C(); g.enter('highlands');
  const i = g.regionIndex();
  for (const y of [56, C.data.regions[i].size - 56]) {
    const [lo, hi] = R.channelBanks(i, y);
    assert(g.blocked((lo + hi) / 2, y, g.zoneId, 0), 'continuous mountain channel at map border');
  }
}
// PT-016/017: selective migration retains every native guardian/trap and side resident.
for (const id of [...C.dungeonIds, ...R.supplyRooms.map((r) => r.id), ...R.sideDungeons.map((r) => r.id)]) {
  const g = new C(); g.enter(id);
  const z = g.zone(), raw = g.snapshot(),
    ids = z.enemies.map((e) => e.id), trapCount = g.traps().length;
  delete raw.zones[id].interiorCoherenceVersion;
  const restored = C.restore(raw);
  assert.deepEqual(restored.zone().enemies.map((e) => e.id), ids, id + ' no deletions or replacement guards');
  assert.equal(restored.traps().length, trapCount, id + ' no trap reduction');
  const exit = restored.zone().npcs.find((n) => n.kind === 'exit');
  for (const n of restored.zone().npcs.filter((n) => n.kind === 'cage' || n.kind === 'bundle'))
    assert(restored.route(exit, n).length, id + ' captive/cache still accessible');
}
console.log('PASS PT312 world/interior acceptance');

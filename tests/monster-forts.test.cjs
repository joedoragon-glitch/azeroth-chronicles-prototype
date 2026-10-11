'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

assert.equal(R.creatureStrongholds.length, 13, 'retain all thirteen existing territorial holds');

for (const region of Campaign.data.regions) {
  const c = new Campaign();
  c.enter(region.id);
  const z = c.zone();
  const originalCount = z.enemies.length;
  const originalIds = z.enemies.map((e) => e.id).sort();
  const plans = R.creatureStrongholds.filter((h) => h.region === region.id);
  assert(plans.length >= 2, region.id + ' retains more than one ordinary-monster home');

  for (const hold of plans) {
    const center = c.creatureStrongholdCenter(z, hold);
    assert(center, hold.id + ' has an authored location');
    assert(!c.blocked(center.x, center.y, region.id, 15), hold.id + ' center is navigable');
    assert(c.route(c.hero, center).length, hold.id + ' can be reached from the regional arrival');
    const walls = z.props.filter((p) => p.stronghold === hold.id && p.r > 0);
    const furnishings = z.props.filter((p) => p.stronghold === hold.id && !p.r);
    assert(walls.length >= 3, hold.id + ' has a recognizable defensive perimeter');
    assert(furnishings.length >= 5, hold.id + ' retains lived-in furnishing');
    for (const wall of walls)
      for (const road of z.roads)
        for (let j = 1; j < road.length; j++)
          assert(
            c.distanceToSegment(wall, road[j - 1], road[j]) >= 85,
            hold.id + ' must not barricade an authored road',
          );

    const residents = z.enemies.filter((e) => e.stronghold === hold.id);
    if (hold.night) {
      assert.equal(residents.length, 0, hold.id + ' is vacant in daylight');
      continue;
    }
    assert.equal(residents.length, hold.guardCount, hold.id + ' reuses its existing garrison');
    for (const enemy of residents) {
      assert.equal(enemy.species, hold.species, hold.id + ' preserves native species');
      assert(enemy.strongholdResident, hold.id + ' marks its living residents');
      assert(enemy.hp > 0, 'newly created fort residents are alive');
      assert(distance(enemy.home, center) <= 165, hold.id + ' keeps guards within its perimeter');
      assert(
        !c.blocked(enemy.home.x, enemy.home.y, region.id, 15),
        hold.id + ' resident home is walkable',
      );
      assert(c.route(center, enemy.home).length, hold.id + ' garrison is reachable inside the fort');
    }
  }

  assert.equal(z.enemies.length, originalCount, 'fort audit does not summon a new population');
  assert.deepEqual(z.enemies.map((e) => e.id).sort(), originalIds);
  const saved = c.snapshot();
  const restored = Campaign.restore(saved);
  assert.deepEqual(
    restored.zone().enemies.map((e) => e.id).sort(),
    originalIds,
    region.id + ' save/restore retains enemy identities',
  );
  assert.equal(restored.zone().enemies.length, originalCount);
  console.log('PASS ' + region.id + ' territorial layout, garrison, access and save identity');
}

const raiderHold = R.creatureStrongholds.find((h) => h.id === 'raider-drill-redoubt');
assert.deepEqual(raiderHold.center, [3050, 950], 'Raider fort moves south of original dragon roost');
assert(
  distance({ x: raiderHold.center[0], y: raiderHold.center[1] }, { x: 3100, y: 500 }) > 400,
  'outbound dragon roost and Raider garrison retain separate safe spaces',
);
{
  const c = new Campaign();
  c.enter('frontier');
  const snapshot = c.snapshot();
  const z = snapshot.zones.frontier;
  z.creatureStrongholdsVersion = 6;
  const resident = z.enemies.find((e) => e.stronghold === 'raider-drill-redoubt');
  const originalId = resident.id;
  const originalReward = resident.gold;
  resident.home = { x: 3060, y: 640 };
  resident.hp = 0;
  const saved = Campaign.restore(snapshot);
  const migrated = saved.zone();
  const newHome = migrated.enemies.find((e) => e.id === originalId);
  assert.equal(migrated.creatureStrongholdsVersion, 7);
  assert.equal(newHome.hp, 0, 'migrating Raider fort does not revive dead residents');
  assert.equal(newHome.gold, originalReward);
  assert(
    distance(newHome.home, { x: 3050, y: 950 }) <= 165,
    'existing Raider garrison reanchors with its fort',
  );
}

const wolfSite = R.sites[2].find((s) => s[0] === 'wolf-den');
assert.deepEqual(wolfSite.slice(2), [340, 1020], 'Wolf home leaves the caravan arrival buffer');
{
  const c = new Campaign();
  c.enter('highlands');
  const old = c.snapshot();
  const z = old.zones.highlands;
  z.creatureStrongholdsVersion = 6;
  const marker = z.npcs.find((n) => n.id === 'wolf-den');
  Object.assign(marker, { x: 520, y: 1250 });
  const resident = z.enemies.find((e) => e.stronghold === 'wolf-packhold');
  const id = resident.id;
  resident.hp = 0;
  const formerGold = resident.gold;
  const formerXp = resident.xp;
  const loaded = Campaign.restore(old);
  const live = loaded.zone();
  assert.equal(live.creatureStrongholdsVersion, 7);
  assert.equal(live.npcs.find((n) => n.id === 'wolf-den').x, 340);
  assert.equal(live.npcs.find((n) => n.id === 'wolf-den').y, 1020);
  const moved = live.enemies.find((e) => e.id === id);
  assert.equal(moved.hp, 0, 'old defeated Wolf stays defeated');
  assert.equal(moved.gold, formerGold);
  assert.equal(moved.xp, formerXp);
  assert(distance(moved.home, { x: 340, y: 1020 }) < 165);
  assert.deepEqual(
    Campaign.restore(loaded.snapshot()).snapshot(),
    loaded.snapshot(),
    'Wolf relocation is an idempotent v4 world migration',
  );
}
{
  const c = new Campaign();
  c.enter('crown');
  const old = c.snapshot();
  const z = old.zones.crown;
  z.creatureStrongholdsVersion = 7;
  const resident = z.enemies.find((e) => e.stronghold === 'ashbeast-roost-hold');
  const id = resident.id;
  resident.hp = 0;
  const originalCount = z.enemies.length;
  const loaded = Campaign.restore(old);
  const live = loaded.zone();
  const hold = R.creatureStrongholds.find((h) => h.id === 'ashbeast-roost-hold');
  assert.equal(live.creatureStrongholdsVersion, 8);
  assert.deepEqual(hold.center, [1580, 3260]);
  assert(!loaded.blocked(hold.center[0], hold.center[1], 'crown', 15));
  assert.equal(live.enemies.length, originalCount);
  assert.equal(live.enemies.find((e) => e.id === id).hp, 0);
  assert.deepEqual(
    Campaign.restore(loaded.snapshot()).snapshot(),
    loaded.snapshot(),
    'Crown relocation is an idempotent v4 world migration',
  );
}
console.log('PASS previously visited Wolf/Crown saves retain deaths, XP/crowns, IDs and location');

for (const [region, kind] of [
  ['march', 'wraith'],
  ['frontier', 'stalker'],
]) {
  const c = new Campaign();
  c.enter(region);
  const z = c.zone();
  const originalCount = z.enemies.length;
  const hold = R.creatureStrongholds.find((h) => h.region === region && h.nightSpecies === kind);
  c.night = () => true;
  c.updateNight();
  const nightGarrison = z.enemies.filter((e) => e.nightOnly && e.stronghold === hold.id);
  assert.equal(nightGarrison.length, 4, region + ' retains its four existing night enemies');
  assert.equal(z.enemies.length, originalCount + 4);
  for (const enemy of nightGarrison) {
    assert.equal(enemy.species, kind);
    assert(!c.blocked(enemy.home.x, enemy.home.y, region, 15));
  }
  c.night = () => false;
  c.updateNight();
  assert.equal(z.enemies.length, originalCount, 'daybreak restores ordinary population');
}
console.log('PASS night strongholds, authored spawn quotas and daylight cleanup');

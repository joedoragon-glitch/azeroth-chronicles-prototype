'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');
const legacyLayouts = require('./fixtures/pr313-old-scenery-layouts.json').regions;

let housesChecked = 0;
let inspectedRegions = 0;
for (const region of Campaign.data.regions) {
  const game = new Campaign('normal', 'paladin', () => 0.9);
  game.enter(region.id);
  const zone = game.zone();
  const houses = zone.props.filter((prop) =>
    prop.roadBlocker && /house|cottage|workshop|boathouse|smithy|forgehouse/.test(prop.structure || ''));
  assert.equal(houses.length, 13, region.id + ': original town/hamlet houses preserved');
  assert.equal(zone.townVisualClearanceVersion, 3, 'town reflow migrates existing layout once');
  assert.equal(zone.landmarkRoadShoulderVersion, 4, 'named marker reflow migrates once');
  housesChecked += houses.length;
  inspectedRegions++;
  for (let i = 0; i < houses.length; i++) {
    const a = houses[i];
    assert(game.distanceToRoad(zone, a) >= game.roadSetback(a),
      region.id + ': house on carriageway: ' + a.id);
    for (let j = i + 1; j < houses.length; j++) {
      const b = houses[j];
      const dx = 0.76 * (a.x - a.y - b.x + b.y);
      const dy = 0.27 * (a.x + a.y - b.x - b.y);
      assert(Math.abs(dx) >= 145 || Math.abs(dy) >= 104,
        region.id + ': projected roofs overlap: ' + a.id + ' ' + b.id);
    }
  }
  for (const n of zone.npcs.filter((n) =>
    n.kind === 'landmark' && !n.internalSite &&
    !/^(bridge-|crossing-|thorn-trailhead-)/.test(n.id)))
    assert(game.distanceToRoad(zone, n) >= 92,
      region.id + ': named road marker still on carriageway: ' + n.id);
  // Verify future rescued specialists, even if they were never rescued in this
  // save, can enter without overlapping the rearranged house frontage.
  for (const b of Campaign.data.bosses.filter((b) => b.region === region.id && b.captive))
    game.s.rescued[b.id] = true;
  game.refreshNPCs();
  for (const n of zone.npcs.filter((n) => n.id.startsWith('service-')))
    for (const house of houses)
      assert(Math.hypot(house.x - n.x, house.y - n.y) >= 165,
        region.id + ': rescued specialist obscured by house ' + house.id);
  const positions = houses.map((h) => [h.id, h.x, h.y]);
  const markers = zone.npcs.filter((n) => n.kind === 'landmark').map((n) => [n.id, n.x, n.y]);
  game.zone();
  assert.deepEqual(houses.map((h) => [h.id, h.x, h.y]), positions,
    region.id + ': repeated region reads move the houses');
  assert.deepEqual(zone.npcs.filter((n) => n.kind === 'landmark').map((n) => [n.id, n.x, n.y]),
    markers, region.id + ': repeated region reads move landmarks');
  // Restore actual dev.70 positions that the final bridge/road pass crowded.
  game.checkQuests(); // Settle the deliberately granted rescue flags first.
  const raw = game.snapshot(), oldZone = raw.zones[region.id], legacy = legacyLayouts[region.id];
  for (const point of legacy.props) {
    const prop = oldZone.props.find(p => p.id === point.id);
    if (prop) Object.assign(prop, point);
  }
  for (const point of legacy.markers) {
    const marker = oldZone.npcs.find(n => n.id === point.id);
    if (marker) Object.assign(marker, point);
  }
  for (const key of ['townVisualClearanceVersion','landmarkRoadShoulderVersion','strongholdCourtyardSpacingVersion'])
    oldZone[key] = legacy[key];
  const fallen = oldZone.enemies.find(e => e.stronghold && e.hp > 0);
  if (fallen) { fallen.hp = 0; fallen.deathPaid = true; }
  raw.hero.gold = 837;
  const facts = oldZone.enemies.map(e => [e.id,e.hp,e.deathPaid]);
  const input = JSON.stringify(raw), restored = Campaign.restore(raw), migrated = restored.zone();
  assert.equal(JSON.stringify(raw), input, 'migration cannot mutate the historical input');
  assert.equal(restored.hero.gold,837);
  assert.deepEqual(migrated.enemies.map(e => [e.id,e.hp,e.deathPaid]),facts,
    region.id + ': scenery repair preserves identities, wounds and defeated residents');
  for (const hold of Campaign.rules.creatureStrongholds.filter(h => h.region === region.id)) {
    const props = migrated.props.filter(p => p.stronghold === hold.id && p.decorative);
    for (let i=0;i<props.length;i++) for (let j=i+1;j<props.length;j++)
      assert(Math.hypot(props[i].x-props[j].x,props[i].y-props[j].y)>=90,
        hold.id + ': legacy courtyard spacing repaired');
  }
  for (const n of migrated.npcs.filter(n => n.kind === 'landmark' && !n.internalSite &&
      !/^(bridge-|crossing-|thorn-trailhead-)/.test(n.id)))
    assert(restored.distanceToRoad(migrated,n)>=92,'legacy marker clears final road');
  const settled=JSON.stringify(restored.snapshot());
  restored.zone();
  assert.equal(JSON.stringify(restored.snapshot()),settled,'final scenery repair is idempotent');
}
const rendererSource = fs.readFileSync(path.join(__dirname, '../src/prototype/renderer.js'), 'utf8');
assert(rendererSource.includes('claimedLabels'), 'screen-space label collisions are checked');
assert(rendererSource.includes('labelPriority'), 'important NPCs outrank scenery labels');
assert(rendererSource.includes('labelSlots.get(e)'), 'rendering actually uses reserved label positions');
console.log('PASS ' + inspectedRegions + ' regions / ' + housesChecked +
  ' houses: roof, road, rescued NPC and nameplate allocation contracts');

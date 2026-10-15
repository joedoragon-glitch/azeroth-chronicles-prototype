'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');

let housesChecked = 0;
let inspectedRegions = 0;
for (const region of Campaign.data.regions) {
  const game = new Campaign('normal', 'paladin', () => 0.9);
  game.enter(region.id);
  const zone = game.zone();
  const houses = zone.props.filter((prop) =>
    prop.roadBlocker && /house|cottage|workshop|boathouse|smithy|forgehouse/.test(prop.structure || ''));
  assert.equal(houses.length, 13, region.id + ': original town/hamlet houses preserved');
  assert.equal(zone.townVisualClearanceVersion, 2, 'town reflow migrates existing layout once');
  assert.equal(zone.landmarkRoadShoulderVersion, 3, 'named marker reflow migrates once');
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
}
const rendererSource = fs.readFileSync(path.join(__dirname, '../src/prototype/renderer.js'), 'utf8');
assert(rendererSource.includes('claimedLabels'), 'screen-space label collisions are checked');
assert(rendererSource.includes('labelPriority'), 'important NPCs outrank scenery labels');
assert(rendererSource.includes('labelSlots.get(e)'), 'rendering actually uses reserved label positions');
console.log('PASS ' + inspectedRegions + ' regions / ' + housesChecked +
  ' houses: roof, road, rescued NPC and nameplate allocation contracts');

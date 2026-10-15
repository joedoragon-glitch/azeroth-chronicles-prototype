'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');

// A handful of public road lamps, not a continent-wide row of torches.
const expected = { vale: 2, march: 3, highlands: 2, frontier: 4, crown: 4 };
for (const [id, target] of Object.entries(expected)) {
  const game = new Campaign('normal', 'paladin', () => 0.9);
  game.enter(id);
  const zone = game.zone(), lamps = zone.props.filter(p => p.roadLamp);
  assert.equal(lamps.length, target, id + ' limited authored road lights');
  assert.equal(zone.roadLampVersion, 1, 'lamp positions versioned for historical layouts');
  assert(lamps.every(p => p.structure === 'street-lantern' && p.decorative && p.r === 0));
  assert(lamps.every(p => !game.blocked(p.x, p.y, id, 15, true)),
    id + ': lamps never occupy collision terrain');
  assert(lamps.every(p => game.distanceToRoad(zone, p) >= 60 &&
    game.distanceToRoad(zone, p) <= 175), id + ': street lights really belong beside streets');
  assert.equal(new Set(lamps.map(p => p.id)).size, target);
  const before = JSON.stringify(lamps);
  game.zone();
  assert.equal(JSON.stringify(zone.props.filter(p => p.roadLamp)), before,
    id + ': unchanged on repeated reads');
  const original = game.snapshot(), killed = original.zones[id].enemies.find(e => e.hp > 0);
  if (killed) { killed.hp = 0; killed.deathPaid = true; }
  original.zones[id].props = original.zones[id].props.filter(p => !p.roadLamp);
  delete original.zones[id].roadLampVersion;
  const revived = Campaign.restore(original);
  revived.enter(id);
  assert.equal(revived.zone().props.filter(p => p.roadLamp).length, target);
  assert.equal(revived.zone().enemies.find(e => e.id === killed?.id)?.hp, killed?.hp,
    id + ': new lamps do not resurrect saved monster deaths');
  assert.equal(revived.hero.gold, game.hero.gold);
}
const visuals = fs.readFileSync(path.join(__dirname,'../src/prototype/visuals.js'),'utf8');
const renderer = fs.readFileSync(path.join(__dirname,'../src/prototype/renderer.js'),'utf8');
assert(visuals.includes("case 'street-lantern':"), 'street lights are actually illustrated');
assert(renderer.includes('const nightSources = !nightNow ? []'),
  'during daylight the road posts do not emit light');
assert(renderer.includes('const lanterns = ') && renderer.includes('(?:lantern|grave-lamp)'),
  'street-lantern registers as an existing night-only light source');
console.log('PASS 15 actual region road lamps: safe, sparse, illustrated, night-only, save-stable');

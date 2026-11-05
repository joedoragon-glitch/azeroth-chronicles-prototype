'use strict';
// Focused native Greenwood integration assertions. Browser appearance and
// actual phone performance remain separate acceptance gates.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Landscape = require('../src/prototype/greenwood-landscape.js');

const rng = () => 0.73;
const g = new Campaign('normal', 'paladin', rng);
const z = g.zone(), cfg = Campaign.rules.greenwoodLayout;
assert.equal(cfg.version, 2);
assert.equal(z.greenwoodTradeExitVersion, 1, 'trade rendering migration is idempotent');
assert.equal(z.greenwoodGoblinShelterVersion, 1);
assert.equal(z.greenwoodPublicLightingVersion, 1);
assert.equal(z.roads[0].at(-1).x, cfg.anchors.wagon.x,
  'merchant transport remains the last actual cartway navigation point');
const prepared = Landscape.prepareRoadPaint(z.roads, z.footpaths, z.greenwoodRoadKinds);
assert(prepared.wide[0].points.at(-1).x >= 3190 * cfg.scale,
  'rendered cartway reaches the eastern border without modifying blocked navigation');
assert.equal(z.greenwoodRoutes.length, 17, 'established roads are preserved');
const shelters = z.props.filter((p) => p.greenwoodGoblinShelter);
assert.equal(shelters.length, 2, 'two substantial shelters use approved native lean-to art');
assert(shelters.every((p) => p.structure === 'lean-to'),
  'no new sprite family is needed for the goblin domestic redraw');
const walls = z.props.filter((p) => p.stronghold === 'goblin-road-fort' && p.greenwoodWall);
assert(walls.length >= 6);
const allEnds = walls.flatMap((p) => [p.greenwoodWall.a, p.greenwoodWall.b]);
assert(allEnds.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));
const center = cfg.anchors.goblin;
assert(Math.max(...allEnds.map((p) => p.y - center.y)) > 240 * cfg.scale,
  'goblin perimeter expanded as connected actual segments');
assert(z.greenwoodPublicLightingAudit.length >= 5,
  'populated locations were assessed rather than duplicating existing street lights');
const placedLights = z.props.filter((p) => p.greenwoodPublicLight);
assert.equal(placedLights.length, z.greenwoodPublicLightingAudit.filter((x) => x.placed).length);
for (const mini of z.minis || [])
  assert(mini.trapPosts.length <= 2 && mini.trapPosts.every((p) =>
    p.index >= 100 && p.index <= 200),
    'native outdoor field traps satisfy persisted save constraints');
const original = g.snapshot();
const once = Campaign.restore(original, rng).zone();
const lampIds = (zone) => zone.props.filter((p) => p.greenwoodPublicLight).map((p) => p.id);
assert.deepEqual(lampIds(once), lampIds(z), 'existing v4 lamp placements do not duplicate');
assert.deepEqual(once.roads, z.roads, 'restored navigation roads remain intact');
assert.equal(once.props.filter((p) => p.greenwoodGoblinShelter).length, 2,
  'restored goblin shelters remain stable');
console.log('PASS Greenwood visual-only merchant exit, proportional shelters, public lamps, native trap bounds and v4 restore');

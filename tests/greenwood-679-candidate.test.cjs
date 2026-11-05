'use strict';
// #679/#680: narrow native contract, not a game-wide certification suite.
const assert = require('node:assert/strict');
const { rng } = require('../tools/greenwood-layout/fixtures.cjs');
const C = require('../src/prototype/engine.js');
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const enemyPositions = (z) => z.enemies.map((e) => [
  e.id, e.family, e.type, e.x, e.y, e.home?.x, e.home?.y,
]);
const expected = {
  'greenwood-refinement-millhaven-poultry': 'poultry-yard',
  'greenwood-refinement-millhaven-flowers': 'wildflowers',
  'greenwood-refinement-hamlet-pen': 'animal-pen',
  'greenwood-refinement-orchard-flowers': 'wildflowers',
  'greenwood-refinement-pond-reeds-west': 'reeds',
  'greenwood-refinement-pond-reeds-east': 'reeds',
  'greenwood-refinement-den-thorn-bed': 'thorn-bed',
};
assert.equal(C.rules.greenwoodLayout.sceneVersion, 5);
assert.equal(C.data.regions[0].enemy_count, 32);
assert.equal(C.rules.thornPatrol.startLeg, 7);
assert.equal(C.rules.thornPatrol.direction, -1);
assert.equal(C.rules.thornPatrol.route.length, 8);
assert.equal(C.rules.thornPatrol.speed, 82);
assert.equal(C.rules.thornPatrol.westernWoodlandGuide.length, 9);
for (const seed of [0x47564101, 0x47564102, 0x47564103, 0x47564104]) {
  const g = new C('normal', 'paladin', rng(seed)), z = g.zone();
  assert.equal(z.greenwoodRedesignScene, 5);
  assert.equal(z.greenwoodRefinementVersion, 1, 'overlay applied once');
  // #806: a distinct, dry wolf-scaled home—not another lake or a new Treasury.
  assert.equal(z.greenwoodHomesteadVersion, 1);
  assert(z.greenwoodHomesteadAudit?.constructed, 'lodge and shelter have a safe legal plot');
  assert(!C.rules.terrain[0].some((t) => t.kind === 'water' &&
    Math.hypot(t.x - 2720, t.y - 1320) < 20), 'eastern water collision removed');
  assert(!g.blocked(2720, 1320, 'vale', 8, true), 'former water is dry traversable terrain');
  const home = z.props.filter((p) => p.id.startsWith('greenwood-thorn-homestead-'));
  assert(home.some((p) => p.greenwoodFacility === 'thorn-lodge' &&
    p.roadBlocker && p.r > 40), 'wolf-scale lodge is physical');

  const wolfLodge = home.find((p) => p.greenwoodFacility === 'thorn-lodge');
  const glass = require('../src/prototype/visuals.js').lightingFixtures(
    wolfLodge, { x: 0, y: 0 }, 1, 0);
  assert.equal(glass.length, 1, 'one actual mounted home lantern, not a fake glow sticker');
  assert.deepEqual([glass[0].x, glass[0].y], [54, -41],
    'night lighting source stays physically attached to the drawn porch lantern');
  assert.equal(glass[0].lit, true);
  assert(home.some((p) => p.greenwoodFacility === 'thorn-rest-bay' && p.roadBlocker),
    'outdoor rest shelter is physical');
  for (const p of home) {
    assert(!g.blocked(p.x, p.y, 'vale', 0, true), 'homestead built on solid dry terrain');
    assert(g.distanceToRoad(z, p) > 35, 'homestead does not overlap the cart road');
  }
  assert(z.props.some((p) => p.structure === 'pasture-sheep') ||
    z.props.some((p) => p.structure === 'feed-trough'),
    'existing farm livelihood remains separate from wolf dwelling');

  assert.equal(g.zoneSize(), 3200);
  assert.equal(z.enemies.filter((e) => e.type === 'mob' && !e.summon).length, 32,
    'no ordinary monster count changes');
  assert.equal(z.nodes.reduce((n, p) => n + p.amount, 0), 640,
    'original source quantity unchanged');
  for (const [id, structure] of Object.entries(expected)) {
    const matches = z.props.filter((p) => p.id === id);
    assert.equal(matches.length, 1, 'one authored stable prop: ' + id);
    const p = matches[0];
    assert.equal(p.structure, structure);
    assert.equal(p.r, 0, 'new prop does not become a collision obstacle: ' + id);
    assert.equal(p.decorative, true, 'new prop remains presentation-only: ' + id);
    assert.equal(p.roadBlocker, undefined, 'no path blocker: ' + id);
    assert(!g.blocked(p.x, p.y, 'vale', 0, true), 'dry land: ' + id);
    assert(g.distanceToRoad(z, p) > 40, 'clear of roads: ' + id);
    assert(!z.buildings.some((b) => dist(p, b) < 85), 'clear of paid camp: ' + id);
    assert(!z.npcs.some((n) => dist(p, n.servicePoint || n) < 60), 'clear of service: ' + id);
  }
  assert(z.greenwoodSceneAudit.every((x) => !x.essential || x.placed),
    'no authored essential clearance lost');
  const input = g.snapshot(), serialized = JSON.stringify(input);
  const restored = C.restore(input, rng(seed));
  assert.equal(JSON.stringify(input), serialized, 'restore must not mutate submitted save');
  assert.equal(restored.zone().props.filter((p) => expected[p.id]).length,
    Object.keys(expected).length, 'no duplicate art on reload');
  assert.deepEqual(enemyPositions(restored.zone()), enemyPositions(z),
    'reload retains every saved monster ID, coordinate and home without relocation');
  // Simulate a release-5 save and preserve a player-owned custom prop.
  const old = JSON.parse(serialized), oldZone = old.zones.vale;
  // Recreate a legitimate old scene-5 save that predates the overlay.
  delete oldZone.greenwoodRefinementVersion;
  // Reconstruct the legitimate last-release snapshot before this dry homestead.
  delete oldZone.greenwoodHomesteadVersion;
  delete oldZone.greenwoodHomesteadAudit;
  oldZone.props = oldZone.props.filter((p) => !p.id.startsWith('greenwood-thorn-homestead-'));

  delete oldZone.greenwoodRefinementAudit;
  oldZone.props = oldZone.props.filter((p) => !expected[p.id]);
  oldZone.props.push({ id: 'player-custom-greenwood-679', structure: 'barrel',
    playerOwned: true, x: 2900, y: 3100, r: 0, decorative: true });
  const oldInput = JSON.stringify(old), migrated = C.restore(old, rng(seed));
  assert.equal(JSON.stringify(old), oldInput);
  const newProps = migrated.zone().props;
  assert(migrated.zone().greenwoodHomesteadAudit?.constructed,
    'old scene-5 save receives the homestead without resetting the region');
  assert.equal(migrated.zone().props.filter((p) =>
    p.id === 'greenwood-thorn-homestead-lodge').length, 1,
  'old save gets exactly one wolf lodge');

  for (const id of Object.keys(expected))
    assert.equal(newProps.filter((p) => p.id === id).length, 1,
      'old scene-5 save gains a single additive candidate: ' + id);
  assert(newProps.some((p) => p.id === 'player-custom-greenwood-679' && p.playerOwned),
    'owned objects survive the scenery regeneration');
  assert.equal(migrated.zone().enemies.filter((e) => e.type === 'mob' && !e.summon).length, 32);
  assert.deepEqual(enemyPositions(migrated.zone()), enemyPositions(oldZone),
    'scene-5 cosmetic migration cannot change existing monster placements');
  assert.equal(migrated.zone().nodes.reduce((n, p) => n + p.amount, 0), 640);
}
console.log('PASS #679 authored micro-scenes, owned props, source preservation and four seeded v4 saves');
// The observed, complete patrol path is recorded; waypoint-only coverage is
// insufficient to claim the Goblin/frontier corridor or Mira escort is safe.
const g = new C('normal', 'paladin', rng(0x47564101));
g.xp(120);
const e = g.zone().enemies.find((e) => e.family === 'thorn' && e.type === 'boss');
const mira = g.thornCaptive();
assert(e && mira && mira.id === 'cage-thorn');
const order = [], visited = [], path = [];
let prevLeg = null, maxGap = 0, minMillhaven = Infinity, homecoming = false;
let midGuideSnapshot = null, minHamlet = Infinity, minMill = Infinity, minOrchard = Infinity;
let closestTownPoint = null;
for (let step = 0; step < 18000; step++) {
  const before = { x: e.x, y: e.y }, beforeMira = { x: mira.x, y: mira.y };
  g.s.time += 0.1;
  g.updateThornPatrol(e, 0.1);
  g.updateThornCaptive(0.1);
  const leg = e.thornLeg;
  if (leg !== prevLeg && Number.isInteger(leg)) {
    order.push(leg);
    visited.push({ leg, x: e.x, y: e.y, second: Math.round(g.s.time) });
    if (prevLeg === 0 && leg === 7) homecoming = true;
    prevLeg = leg;
  }
  if (step % 20 === 0) path.push([Math.round(e.x), Math.round(e.y)]);
  maxGap = Math.max(maxGap, dist(e, mira));
  const toTown = dist(e, { x: 650, y: 600 });
  if (toTown < minMillhaven) {
    minMillhaven = toTown;
    closestTownPoint = { x: Math.round(e.x), y: Math.round(e.y),
      leg: e.thornLeg, guideStep: e.thornGuideStep, second: Math.round(g.s.time) };
  }
  if (leg === 1 && e.thornGuideStep >= 0) {
    minHamlet = Math.min(minHamlet, dist(e, { x: 550, y: 1750 }));
    minMill = Math.min(minMill, dist(e, { x: 1200, y: 1400 }));
    minOrchard = Math.min(minOrchard, dist(e, { x: 780, y: 2100 }));
    if (!midGuideSnapshot && e.thornGuideStep === 3)
      midGuideSnapshot = g.snapshot();
  }
  assert(dist(before, e) <= C.rules.thornPatrol.speed * 0.1 + 0.1, 'no boss teleport');
  assert(dist(beforeMira, mira) <= C.rules.thornPatrol.captiveSpeed * 0.1 + 0.1, 'no Mira teleport');
  if (homecoming) break;
}
console.log('GREENWOOD_679_PATROL_OBSERVATION ' + JSON.stringify({
  order, visited, homecoming,
  maxCaptiveGap: Math.round(maxGap), minMillhaven: Math.round(minMillhaven),
  closestTownPoint,
  minHamlet: Math.round(minHamlet), minMill: Math.round(minMill),
  minOrchard: Math.round(minOrchard),
  sampledPath: path.filter((_, i) => i % 5 === 0),
}));
assert.deepEqual(order, [7, 6, 5, 4, 3, 2, 1, 0, 7],
  'complete den-to-den southern-first route with stable saved indices');
assert(homecoming);
assert(maxGap <= C.rules.thornPatrol.waitForCaptive + 25, 'captive travels with the scout');
assert(minMillhaven > 360, 'patrol does not enter Millhaven');
assert(minHamlet > 300 && minMill > 250 && minOrchard > 260,
  'woodland leg avoids the settled hamlet, mill and cultivated orchard');
assert(midGuideSnapshot, 'a full circuit actually traverses the hidden woodland guide');
const saved = C.restore(midGuideSnapshot, rng(0x47564101));
const savedScout = saved.zone().enemies.find((u) => u.id === e.id);
assert.equal(savedScout.thornLeg, 1);
assert.equal(savedScout.thornGuideStep, 3, 'mid-leg guide index survives v4 restore');
assert(Math.hypot(savedScout.x - midGuideSnapshot.zones.vale.enemies.find((u) => u.id === e.id).x,
  savedScout.y - midGuideSnapshot.zones.vale.enemies.find((u) => u.id === e.id).y) < 1,
  'restoring an active guide cannot teleport Thornfang');
const legacy = structuredClone(midGuideSnapshot);
delete legacy.zones.vale.enemies.find((u) => u.id === e.id).thornGuideStep;
const restoredOld = C.restore(legacy, rng(0x47564101));
const oldScout = restoredOld.zone().enemies.find((u) => u.id === e.id);
const beforeOld = { x: oldScout.x, y: oldScout.y };
restoredOld.s.time += 0.1;
restoredOld.updateThornPatrol(oldScout, 0.1);
assert.equal(oldScout.thornGuideStep, -1,
  'pre-guide in-flight save finishes its old waypoint without a reverse detour');
assert(dist(oldScout, beforeOld) <= C.rules.thornPatrol.speed * 0.1 + 0.1);
console.log('PASS #679 eight-leg complete scout loop, protected farm/town corridor and old/new saved mid-leg behavior');


// #806 scoped draft-art review capture. Remove the temporary base64 log after
// inspecting the native source draw: it is not a general runtime regression.
if (process.env.CI && process.env.GITHUB_HEAD_REF === 'feat/greenwood-thornfang-homestead-20261105') {
  const cp = require('node:child_process');
  const fs = require('node:fs');
  const path = require('node:path');
  const out = path.join(process.env.RUNNER_TEMP || '/tmp', 'thornfang-homestead-review');
  cp.execFileSync(process.execPath, [
    path.resolve(__dirname, '../tools/greenwood-layout/capture.cjs'),
    '--landscape', '--size', '3200', '--home-only', '--out', out,
  ], { stdio: 'pipe', timeout: 120000 });
  for (const file of [
    'native-3200-thorn-homestead-1280x800-day.webp',
    'native-3200-thorn-homestead-852x393-night.webp',
  ]) {
    const bytes = fs.readFileSync(path.join(out, file));
    console.log('THORNFANG_NATIVE_WEBP_BASE64 ' + file + ' ' + bytes.toString('base64'));
  }
}

'use strict';
// Dormant native source→physical trip→one-use deposit acceptance.
// Regional geography and source truth are real. Worker admission, threats,
// and Lab placement are explicitly isolated fixtures pending B3 and L4.
const test = require('node:test');
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Materials = require('../src/prototype/strategist-materials.js');
const Sources = require('../src/prototype/strategist-lab-sources.js');
const Navigation = require('../src/prototype/strategist-lab-navigation.js');
const FieldLabs = require('../src/prototype/strategist-field-labs.js');
const R = Campaign.rules, sourceBridge = Sources.create(Materials, R);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const regions = ['vale', 'march', 'highlands', 'frontier', 'crown'];
const config = FieldLabs.install(Campaign, {
  materials: Materials, navigation: Navigation.adapter(), rules: R,
  // The B3 reserve location and actual off-zone combat owner are NOT supplied
  // here. A test-only start-location receipt makes this L2 route proof possible.
  authenticatedLocation: (_g, worker) => worker.testRegion
    ? { zoneId: worker.testRegion, point: { x: worker.x, y: worker.y } } : null,
  safeFromThreat: () => true,
  verifySource: sourceBridge.verifySource,
});
assert.equal(config.readyForTrips, true);

function findSite(g, region, minDistance = 50) {
  const zone = g.s.zones[region], entries = [];
  for (const p of zone.props || []) {
    const material = Materials.propMaterial(p, g.s.time);
    if (p.id && material && Number.isFinite(p.x) && Number.isFinite(p.y))
      entries.push({ p, material });
  }
  // Prefer real natural timber. Other authentic objects remain available
  // where the region does not offer a nearby safe timber approach.
  entries.sort((a, b) =>
    (a.material === 'wood' ? -1 : 0) - (b.material === 'wood' ? -1 : 0));
  const offsets = [[150,0],[-150,0],[0,150],[0,-150],
    [110,110],[-110,110],[110,-110],[-110,-110]];
  let trials = 0;
  for (const { p, material } of entries) {
    for (const [dx,dy] of offsets) {
      if (++trials > 700) return null; // Bounded test search.
      const station = { x: p.x + dx, y: p.y + dy };
      if (g.blocked(station.x, station.y, region, 15)) continue;
      const token = Navigation.budget();
      let outbound = null;
      const source = Materials.forGather(g, material, {
        lab: { zone: region, id: 'test-field-lab' }, worker: station,
        zone, rules: R, range: 280, authorize: () => true,
        route: (from, point, z) =>
          (outbound = Navigation.routeToSource(g, z.id, from, point, token)),
        passable: (from, to, z) => Navigation.passable(g, z.id, from, to, token),
      });
      if (!source || !outbound?.length || !zone.props.includes(source.source) ||
          distance(station, outbound.at(-1)) < minDistance ||
          !sourceBridge.verifySource(g, region, material,
            source.id, source.point, outbound.at(-1))) continue;
      const back = Navigation.route(g, region, outbound.at(-1), station);
      if (!back.length || distance(back.at(-1), station) > 0.01) continue;
      return { region, zone, station, source, outbound, material, trials };
    }
  }
  return null;
}
function setup(region = 'vale', minDistance = 50) {
  const g = new Campaign('normal', 'paladin', () => 0.57);
  g.s.zone = region;
  g.zone(); // Native authored geography, no painted/fake source.
  const site = findSite(g, region, minDistance);
  assert.ok(site, region + ': cannot locate a genuine prop and physical round trip');
  // Construct the native companion while a registered class still owns its
  // talent profile. The Strategist admission below is test-process-only.
  const worker = g.unit('soldier', site.station.x, site.station.y);
  g.hero.class = 'strategist'; // Test process only: no class registration.
  g.hero.gold = 5000;
  g.s.strategistAcidBottles = 0;
  const z = g.s.zones[region];
  const lab = {
    id: 'strategist-lab-' + g.s.nextId++, kind: 'strategist-field-lab',
    name: 'Field Lab', zoneId: region,
    x: site.station.x, y: site.station.y,
    progress: 4, workSeconds: 20, windmill: false, processSeconds: 0,
  };
  z.buildings.push({
    id: 'barracks-' + g.s.nextId++, kind: 'barracks',
    x: lab.x + 200, y: lab.y, progress: 0,
  }, lab);
  worker.active = false;
  worker.testRegion = region; // Explicit fixture, never an old-v4 location guess.
  g.s.party.push(worker);
  assert.equal(g.trainFieldLabWorker(worker.id), true);
  assert.equal(g.assignFieldLabWorker(region, region, worker.id, site.material), true);
  return { g, worker, lab, site, bank: g.fieldLabNetwork(),
    job: g.fieldLabNetwork().jobs[worker.id] };
}
function step(g) { g.s.time += 0.1; g.advanceFieldLabEconomy(0.1); }
function reach(g, predicate, cap = 900) {
  for (let i = 0; i < cap; i++) {
    step(g);
    if (predicate()) return true;
  }
  return false;
}
test('five genuine native region sources each complete real outward, sample, return and finite deposit', () => {
  for (const region of regions) {
    const { g, worker, lab, bank, job, site } = setup(region);
    let outward = false, sampling = false, returning = false;
    const completed = reach(g, () => {
      if (job.phase === 'outbound' &&
          distance(job.position, site.station) > 3) outward = true;
      if (job.phase === 'sampling') sampling = true;
      if (job.phase === 'return') returning = true;
      return bank.samples[site.material] > 0;
    });
    assert.ok(completed, region + ': real source trip failed at phase ' +
      job.phase + ', source ' + site.source.id);
    assert.ok(outward && sampling && returning, region + ': incomplete physical phases');
    assert.equal(bank.samples[site.material], 1, region + ': one real carried sample');
    assert.ok(distance(worker, lab) <= 24, region + ': only deliver at Lab');
    assert.equal(job.carries, false, region + ': sample receipt consumed once');
    assert.equal(g.s.strategistAcidBottles, 0, region + ': no free Acid production');
  }
});
test('authentic source disappears during sampling: worker returns empty before another job', () => {
  const { g, worker, lab, bank, job, site } = setup('vale');
  assert.ok(reach(g, () => job.phase === 'sampling'), 'must walk to real source');
  const source = site.zone.props.find(p => p.id === job.sourceId);
  assert.ok(source, 'sample is an actual placed native prop');
  const atSource = { x: worker.x, y: worker.y };
  source.destroyed = true; // Native authoring state revokes this genuine source.
  assert.ok(reach(g, () => job.phase === 'station' && job.blocked),
    'revoked source cancels pending sample');
  assert.equal(bank.samples[site.material], 0);
  assert.equal(job.sourceId, null);
  assert.equal(job.carries, false);
  assert.ok(distance(atSource, lab) > 24, 'cancellation was remote, not instant return');
  assert.ok(reach(g, () => job.phase === 'idle' &&
    distance(job.position, lab) <= 24), 'worker physically travels back');
  assert.equal(bank.samples[site.material], 0, 'revocation did not mint stock');
});
test('dynamic blocked outgoing leg pauses without teleport, then recovers through native route', () => {
  const { g, lab, job, site, bank, worker } = setup('vale', 95);
  assert.ok(reach(g, () => job.phase === 'outbound'), 'real source selected');
  const end = job.path[job.waypoint] || job.path.at(-1);
  const remaining = distance(job.position, end);
  assert.ok(remaining > 38, 'outbound leg has room for actual obstruction');
  const ratio = 40 / remaining;
  const barrier = {
    x: job.position.x + (end.x - job.position.x) * ratio,
    y: job.position.y + (end.y - job.position.y) * ratio,
  };
  const nativeBlocked = g.blocked.bind(g);
  let obstructed = true;
  g.blocked = function(x, y, zoneId, radius, ...rest) {
    return (obstructed && zoneId === 'vale' &&
      distance({ x, y }, barrier) < 8 + radius) ||
      nativeBlocked(x, y, zoneId, radius, ...rest);
  };
  assert.ok(reach(g, () => job.blocked, 25), 'actual movement meets new obstacle');
  const stopped = { x: worker.x, y: worker.y };
  for (let i = 0; i < 10; i++) step(g);
  assert.deepEqual({ x: worker.x, y: worker.y }, stopped,
    'blocked path cannot move through obstacle or teleport');
  assert.equal(bank.samples[site.material], 0);
  obstructed = false; // Native geometry is open again.
  assert.ok(reach(g, () => bank.samples[site.material] > 0),
    'bounded path retry resumes authentic trip and deposits after returning');
  assert.ok(distance(worker, lab) <= 24, 'no remote stock credit');
  assert.equal(bank.samples[site.material], 1);
});

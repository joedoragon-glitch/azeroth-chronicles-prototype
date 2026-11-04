'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const M = require('../src/prototype/strategist-materials.js');
const Sources = require('../src/prototype/strategist-lab-sources.js');
const Nav = require('../src/prototype/strategist-lab-navigation.js');
const R = Campaign.rules;
const bridge = Sources.create(M, R);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

test('gathering records a real authored source and invalidates extinction, removal and substitution', () => {
  const game = new Campaign('normal', 'paladin', () => 0.5);
  const brazier = { id: 'authored-test-brazier', structure: 'warm-brazier',
    x: 150, y: 130, r: 0, lit: true, decorative: true };
  const z = { id: 'vale', props: [brazier], buildings: [] };
  game.s.zones.vale = z;
  const worker = { x: 100, y: 130 };
  const source = M.forGather(game, 'fire', {
    zone: z, worker, lab: { zone: 'vale', id: 'strategist-lab-1' },
    rules: R, range: 100, authorize: () => true,
    route: (_from, point) => [point],
    passable: () => true,
  });
  assert.equal(source?.id, brazier.id);
  assert.equal(bridge.verifySource(game, 'vale', 'fire', source.id, source.point,
    { x: source.point.x - 15, y: source.point.y }), true);
  assert.equal(bridge.verifySource(game, 'vale', 'fire', source.id, source.point,
    { x: source.point.x - 25, y: source.point.y }), false,
    'a worker cannot collect while outside the actual sample reach');
  brazier.lit = false;
  assert.equal(bridge.verifySource(game, 'vale', 'fire', source.id, source.point), false);
  brazier.lit = true;
  z.props.splice(0, 1); // Even a stale spatial index cannot confer ownership.
  assert.equal(bridge.verifySource(game, 'vale', 'fire', source.id, source.point), false);
  z.props.push({ ...brazier, id: 'replacement-brazier' });
  assert.equal(bridge.verifySource(game, 'vale', 'fire', source.id, source.point), false);
  M.invalidate(game, 'vale');
  assert.equal(bridge.verifySource(game, 'vale', 'fire', source.id, source.point), false);
  assert.equal(bridge.verifySource(game, 'vale', 'water', source.id, source.point), false);
});

test('gather-only sampling uses a solid source perimeter and keeps combat source identity', () => {
  const game = new Campaign('normal', 'paladin', () => 0.5);
  const rock = { id: 'test-natural-boulder', structure: 'boulder',
    x: 400, y: 400, r: 45, decorative: false };
  const z = { id: 'vale', props: [rock], buildings: [] };
  game.s.zones.vale = z;
  const worker = { x: 300, y: 400 };
  const source = M.forGather(game, 'mineral', {
    zone: z, worker, lab: { zone: 'vale', id: 'strategist-lab-2' },
    rules: R, range: 130, authorize: () => true,
    route: (_from, point) => [point],
    passable: () => true,
  });
  assert.equal(source?.id, rock.id);
  assert.equal(dist(source.point, rock), 45,
    'material contact uses a real authored outer edge, never the blocked center');
  assert.equal(bridge.verifySource(game, 'vale', 'mineral', source.id, source.point), true);
  rock.x += 32; // A source cannot move away without invalidating its receipt.
  assert.equal(bridge.verifySource(game, 'vale', 'mineral', source.id, source.point), false);
  M.invalidate(game, 'vale');
  assert.equal(bridge.verifySource(game, 'vale', 'mineral', source.id, source.point), false);
});

test('all five native regions offer at least one genuine source with physical outward and return route', () => {
  const g = new Campaign('normal', 'paladin', () => 0.57);
  const home = g.zoneId;
  const attempts = [];
  for (const id of ['vale', 'march', 'highlands', 'frontier', 'crown']) {
    g.s.zone = id;
    const zone = g.zone(); // Native authored region generation.
    g.s.zone = home;
    const found = [];
    for (const p of zone.props || []) {
      const material = M.propMaterial(p, g.s.time);
      if (material && p.id && Number.isFinite(p.x) && Number.isFinite(p.y))
        found.push({ p, material });
      if (found.length >= 90) break;
    }
    let success = null;
    const offsets = [[105,0],[-105,0],[0,105],[0,-105],[160,0],[0,160],[-160,0],[0,-160]];
    for (const {p, material} of found) {
      if (success) break;
      for (const [dx, dy] of offsets) {
        const at = { x: p.x + dx, y: p.y + dy };
        if (g.blocked(at.x, at.y, id, 15)) continue;
        const token = Nav.budget();
        let approved = null;
        const sample = M.forGather(g, material, {
          lab: { zone: id, id: 'test-only-lab' }, worker: at,
          zone, rules: R, range: 230, authorize: () => true,
          route: (from, point, region) => {
            approved = Nav.routeToSource(g, region.id, from, point, token);
            return approved;
          },
          passable: (from, to, region) => Nav.passable(g, region.id, from, to, token),
        });
        if (!sample || !approved?.length) continue;
        const point = approved.at(-1);
        if (!bridge.verifySource(g, id, material, sample.id, sample.point, point))
          continue;
        const returnPath = Nav.route(g, id, point, at);
        if (!returnPath.length || dist(returnPath.at(-1), at) > 0.01)
          continue;
        let last = at, traversable = true;
        for (const waypoint of approved) {
          if (!Nav.passable(g, id, last, waypoint)) traversable = false;
          last = waypoint;
        }
        for (const waypoint of returnPath) {
          if (!Nav.passable(g, id, last, waypoint)) traversable = false;
          last = waypoint;
        }
        if (!traversable) continue;
        success = { id, material, source: sample.id, outward: approved.length,
          back: returnPath.length, tested: token.tested, expanded: token.expanded };
        break;
      }
    }
    attempts.push({ region: id, found: found.length, success });
    assert.ok(success, id + ': no real source plus physical round-trip; ' +
      JSON.stringify(attempts));
    assert.equal(g.zoneId, home, 'remote zone search never mutates the hero');
  }
  assert.equal(attempts.length, 5);
});


test('region-authored stable source survives moved art, while old Field Lab receipts fail closed', () => {
  const g = new Campaign('normal', 'paladin', () => 0.5);
  const authoredRules = {
    ...R,
    environmentalSources: { vale: {
      'millhaven-water-physical-anchor': { material: 'water', requires: 'containsWater' },
      'millhaven-furnace-physical-anchor': { material: 'fire', requires: 'activeHeat' },
    } },
  };
  const bridge = Sources.create(M, authoredRules);
  const p = {
    id: 'millhaven-old-render-prop', x: 120, y: 130, r: 0,
    structure: 'illustrated-well-art', materialSourceKey: 'millhaven-water-physical-anchor',
    containsWater: true,
  };
  const z = { id: 'vale', props: [p], buildings: [] };
  g.s.zones.vale = z;
  const start = { x: 80, y: 130 };
  const request = (position = start) => M.forGather(g, 'water', {
    zone: z, worker: position, lab: { zone: 'vale', id: 'test-lab' },
    rules: authoredRules, range: 200, authorize: () => true,
    route: (_from, point) => [point], passable: () => true,
  });
  let chosen = request();
  assert.equal(chosen?.id, p.id, 'genuine authored water uses the semantic key');
  assert.equal(bridge.verifySource(g, 'vale', 'water', chosen.id, chosen.point,
    chosen.point), true);
  assert.equal(Sources.create(M, R).verifySource(g, 'vale', 'water',
    chosen.id, chosen.point, chosen.point), false,
    'old/foreign rules cannot borrow a new resource declaration');
  p.containsWater = false;
  assert.equal(bridge.verifySource(g, 'vale', 'water', chosen.id, chosen.point), false);
  p.containsWater = true;
  z.props[0] = { ...p, id: 'millhaven-new-render-prop', x: 170, y: 130,
    structure: 'updated-well-model' };
  assert.equal(bridge.verifySource(g, 'vale', 'water', chosen.id, chosen.point), false,
    'an in-flight job cannot silently accept a different native prop');
  assert.equal(request(), null,
    'unannounced same-length replacement is denied rather than reusing old source');
  assert.equal(g.noteEnvironmentalSourcesChanged(z), true);
  assert.ok(z.environmentSourceRevision >= 1, 'world emits a source revision');
  assert.equal(Object.prototype.propertyIsEnumerable.call(z,
    'environmentSourceRevision'), false, 'source revision is runtime-only, not v4 data');
  assert.equal(JSON.stringify(z).includes('environmentSourceRevision'), false);
  chosen = request();
  assert.equal(chosen?.id, 'millhaven-new-render-prop',
    'new asset recovers the same stable source after native change notification');
  assert.equal(bridge.verifySource(g, 'vale', 'water', chosen.id, chosen.point), true);
  z.props[0].x = 890;
  g.noteEnvironmentalSourcesChanged(z);
  assert.equal(bridge.verifySource(g, 'vale', 'water', chosen.id, chosen.point), false,
    'moved source invalidates old sampling receipt');
  assert.equal(request(), null, 'old location cannot mint nearby water');
  assert.equal(request({ x: 850, y: 130 })?.id, z.props[0].id,
    'worker can find the material at its new real location');
  z.props[0] = { id: 'millhaven-furnace-painted', x: 160, y: 130,
    structure: 'new-furnace-art', materialSourceKey: 'millhaven-furnace-physical-anchor',
    heatActive: false };
  g.noteEnvironmentalSourcesChanged(z);
  assert.equal(M.forGather(g, 'fire', {
    zone: z, worker: start, lab: { zone: 'vale' }, rules: authoredRules,
    range: 200, authorize: () => true,
    route: (_from, point) => [point], passable: () => true,
  }), null, 'furnace illustration is not operational Fire');
  z.props[0].heatActive = true;
  g.noteEnvironmentalSourcesChanged(z);
  const realFire = M.forGather(g, 'fire', {
    zone: z, worker: start, lab: { zone: 'vale' }, rules: authoredRules,
    range: 200, authorize: () => true,
    route: (_from, point) => [point], passable: () => true,
  });
  assert.equal(realFire?.id, 'millhaven-furnace-painted');
  assert.equal(bridge.verifySource(g, 'vale', 'fire', realFire.id, realFire.point),
    true, 'native Lab receipt uses the same zone-scoped classification as combat');
  z.props[0].heatActive = false;
  assert.equal(bridge.verifySource(g, 'vale', 'fire', realFire.id, realFire.point),
    false, 'stale operational state cannot mint Fire stock');
});

test('native world change notifications remain event-only and leave saves unchanged', () => {
  const g = new Campaign('normal', 'paladin', () => 0.57);
  const z = g.zone();
  const existing = z.environmentSourceRevision;
  assert.equal(g.noteEnvironmentalSourcesChanged(z), true);
  const expected = Number.isSafeInteger(existing) && existing >= 0
    && existing < Number.MAX_SAFE_INTEGER ? existing + 1 : 1;
  assert.equal(z.environmentSourceRevision, expected);
  assert.equal(Object.keys(z).includes('environmentSourceRevision'), false);
  assert.equal(JSON.stringify(z).includes('environmentSourceRevision'), false);
  assert.equal(g.noteEnvironmentalSourcesChanged(null), false);
});

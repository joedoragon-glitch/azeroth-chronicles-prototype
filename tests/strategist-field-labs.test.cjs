'use strict';
// Focused dormant domain checks only. The real #770 material/remote route adapter,
// live v4 persistence, combat danger, browser and device acceptance are NOT mocked
// into claims of integrated gameplay.
const assert = require('node:assert/strict');
const test = require('node:test');
const fieldLabs = require('../src/prototype/strategist-field-labs.js');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
let scans = 0, routes = 0;
const navigation = {
  route(g, zoneId, a, b) {
    routes++;
    if (g.blockRoutes) return [];
    return [{ x: b.x, y: b.y }];
  },
  passable(g, zoneId, a, b) {
    return !g.blockRoutes && (zoneId === 'vale' || zoneId === 'march') &&
      a.x >= 0 && b.x >= 0 && a.y >= 0 && b.y >= 0;
  },
};
const materials = {
  forGather(g, material, options) {
    scans++;
    if (!options.authorize(g, options.lab, options.worker)) return null;
    const source = options.zone?.props?.find((p) =>
      p.material === material && p.authoritative === true && p.active !== false);
    if (!source || distance(source, options.worker) > options.range) return null;
    const path = options.route(options.worker, source, options.zone);
    if (!path.length || !options.passable(options.worker, path[0], options.zone))
      return null;
    return { id: source.id, point: { x: source.x, y: source.y }, material };
  },
};
class Campaign {
  constructor(kind = 'strategist', complete = true) {
    this.s = {
      mode: 'normal', zone: 'vale', nextId: 1, time: 0, rescued: {},
      strategistAcidBottles: 0, party: [],
      zones: {
        vale: { id: 'vale', props: [], buildings: complete ? [{
          id: 'barracks-1', kind: 'barracks', x: 10, y: 10, progress: 0,
        }] : [] },
        march: { id: 'march', props: [], buildings: [{
          id: 'barracks-2', kind: 'barracks', x: 10, y: 10, progress: 4,
        }] },
        highlands: { id: 'highlands', props: [], buildings: [] },
        frontier: { id: 'frontier', props: [], buildings: [] },
        crown: { id: 'crown', props: [], buildings: [] },
      },
    };
    this.hero = { class: kind, gold: 250, x: 0, y: 0 };
    this.blockRoutes = false;
    this.unsafe = false;
  }
  isDungeon() { return false; }
  blocked() { return false; }
  route(a, b) { return [{ x: b.x, y: b.y }]; }
  spend(n) {
    if (n < 0 || this.hero.gold < n) return false;
    this.hero.gold -= n; return true;
  }
  petDefinition(family) { return family === 'treasurer' ? { name: 'Treasurer' } : null; }
  isCharmedCompanion(u) {
    return !!u.charmOrigin && !!this.s.charmCaptures?.[u.id] &&
      JSON.stringify(u.charmOrigin) === JSON.stringify(this.s.charmCaptures[u.id]);
  }
}
fieldLabs.install(Campaign, {
  materials, navigation,
  rules: { terrain: [] },
  safeFromThreat(g) { return !g.unsafe; },
  authenticatedLocation(g, worker) {
    return worker.knownZone
      ? { zoneId: worker.knownZone, point: { x: worker.x, y: worker.y } }
      : null;
  },
  verifySource(g, zoneId, material, id, point) {
    return !!g.s.zones[zoneId]?.props?.some((p) => p.id === id &&
      p.authoritative === true && p.material === material &&
      p.active !== false && distance(p, point) < 0.01);
  },
  neriRescued(g) { return g.s.rescued.neri === true; },
});
const addReserve = (g, id = 'ally-1', type = 'soldier') => {
  const u = {
    id, type, x: 100, y: 100, hp: 100, active: false, order: null,
    knownZone: 'vale',
  };
  g.s.party.push(u);
  return u;
};
function build(g, zone = 'vale', point = { x: 200, y: 100 }) {
  g.s.zone = zone;
  const lab = g.buildFieldLab(zone, point);
  assert.ok(lab);
  lab.progress = 4;
  lab.workSeconds = 20;
  return lab;
}
function run(g, seconds) {
  for (let i = 0; i < Math.round(seconds * 10); i++) {
    g.s.time = Math.round((g.s.time + 0.1) * 100000) / 100000;
    g.advanceFieldLabEconomy(0.1);
  }
}

test('old four classes cannot create network, build, train or spend crowns', () => {
  for (const kind of ['paladin', 'mage', 'ranger', 'rogue']) {
    const g = new Campaign(kind), u = addReserve(g);
    const before = g.hero.gold;
    assert.equal(g.buildFieldLab('vale', { x: 200, y: 100 }), false);
    assert.equal(g.trainFieldLabWorker(u.id), false);
    assert.equal(g.fieldLabNetwork(), null);
    assert.equal(g.hero.gold, before);
    assert.equal(g.s.strategistLabEconomy, undefined);
    assert.equal(g.s.zones.vale.buildings.length, 1);
  }
});
test('authentic unfinished Barracks permits one separate Lab per outdoor region', () => {
  const g = new Campaign();
  assert.equal(g.buildFieldLab('highlands', { x: 200, y: 100 }), false);
  const lab = g.buildFieldLab('vale', { x: 200, y: 100 });
  assert.equal(lab.kind, 'strategist-field-lab');
  assert.equal(lab.progress, 0);
  assert.equal(g.buildFieldLab('vale', { x: 300, y: 100 }), false);
  assert.equal(g.fieldLabs().length, 1);
  assert.equal(g.s.zones.vale.buildings[0].progress, 0);
  run(g, 21);
  assert.equal(lab.progress, 4);
  assert.equal(g.s.zones.vale.buildings.length, 2);
  const balance = g.hero.gold;
  assert.equal(g.buildFieldLab('vale', { x: 300, y: 100 }), false);
  assert.equal(g.hero.gold, balance);
});
test('placement/payment failures are atomic and do not create fake Labs', () => {
  const g = new Campaign('strategist', false);
  assert.equal(g.buildFieldLab('vale', { x: 200, y: 100 }), false);
  assert.equal(g.fieldLabNetwork(), null);
  g.s.zones.vale.buildings.push({ id: 'barracks-old', kind: 'barracks', progress: 1 });
  g.blocked = () => true;
  assert.equal(g.buildFieldLab('vale', { x: 200, y: 100 }), false);
  g.blocked = () => false; g.hero.gold = 2;
  assert.equal(g.buildFieldLab('vale', { x: 200, y: 100 }), false);
  assert.equal(g.s.zones.vale.buildings.length, 1);
});
test('one-time training persists and reserves require verified location', () => {
  const g = new Campaign(), lab = build(g), u = addReserve(g);
  assert.equal(g.trainFieldLabWorker(u.id), true);
  const paid = g.hero.gold;
  assert.equal(g.trainFieldLabWorker(u.id), true);
  assert.equal(g.hero.gold, paid);
  delete u.knownZone;
  assert.equal(g.assignFieldLabWorker('vale', 'vale', u.id, 'wood'), false);
  u.knownZone = 'march';
  assert.equal(g.assignFieldLabWorker('vale', 'vale', u.id, 'wood'), false);
  u.knownZone = 'vale';
  assert.equal(g.assignFieldLabWorker('vale', 'vale', u.id, 'wood'), true);
  assert.equal(u.active, false);
  assert.equal(u.order.type, 'strategist-field-lab');
  assert.equal(g.assignFieldLabWorker('vale', 'vale', u.id, 'water'), false);
  assert.equal(g.unassignFieldLabWorker('vale', u.id), true);
  assert.equal(g.fieldLabNetwork().jobs[u.id], undefined);
  assert.equal(u.fieldLabTrained, true);
  assert.equal(g.assignFieldLabWorker('vale', 'vale', u.id, 'water'), true);
});
test('active or busy companions, forged Charm, missing pets cannot be used', () => {
  const g = new Campaign(); build(g);
  const active = addReserve(g, 'active'); active.active = true;
  const busy = addReserve(g, 'busy'); busy.expeditionId = 'mission';
  const forged = addReserve(g, 'fake', 'goblin'); forged.charmOrigin = { id: 'fake' };
  const fakePet = addReserve(g, 'pet', 'pet'); fakePet.petFamily = 'unknown';
  for (const u of [active, busy, forged, fakePet]) {
    assert.equal(g.trainFieldLabWorker(u.id), u === active); // training is permanent, not assignment
    assert.equal(g.assignFieldLabWorker('vale', 'vale', u.id, 'wood'), false);
  }
});
test('genuine source trip traverses waypoints, returns, and adds one finite sample', () => {
  const g = new Campaign(); build(g);
  const u = addReserve(g);
  g.s.zones.vale.props.push({
    id: 'tree-1', material: 'wood', authoritative: true, active: true,
    x: 390, y: 100,
  });
  assert.equal(g.trainFieldLabWorker(u.id), true);
  assert.equal(g.assignFieldLabWorker('vale', 'vale', u.id, 'wood'), true);
  // Station is 100 world units away: at 90 units/s it cannot be reached in 1s.
  run(g, 2);
  assert.notEqual(g.fieldLabNetwork().jobs[u.id].phase, 'station');
  const start = { x: u.x, y: u.y };
  run(g, 12);
  assert.notDeepEqual({ x: u.x, y: u.y }, start);
  assert.ok(g.fieldLabNetwork().samples.wood +
    g.fieldLabNetwork().products.woodEssence > 0);
  assert.equal(g.s.strategistAcidBottles, 0);
});
test('blocked routes, missing source and vanished source never mint inventory', () => {
  const g = new Campaign(); build(g);
  const u = addReserve(g); g.trainFieldLabWorker(u.id);
  g.blockRoutes = true;
  assert.equal(g.assignFieldLabWorker('vale', 'vale', u.id, 'mineral'), false);
  g.blockRoutes = false;
  assert.equal(g.assignFieldLabWorker('vale', 'vale', u.id, 'mineral'), true);
  run(g, 20);
  assert.equal(g.fieldLabStockCount(), 0);
  g.s.zones.vale.props.push({
    id: 'rock', material: 'mineral', authoritative: true, active: true, x: 390, y: 100,
  });
  run(g, 1);
  g.s.zones.vale.props[0].active = false;
  run(g, 20);
  assert.equal(g.fieldLabStockCount(), 0);
});
test('no worker/windmill/input never creates Acid; only canonical stock changes', () => {
  const g = new Campaign(); build(g);
  assert.equal(g.upgradeFieldLabWindmill('vale', 'vale'), true);
  const balance = g.hero.gold;
  assert.equal(g.upgradeFieldLabWindmill('vale', 'vale'), false);
  assert.equal(g.hero.gold, balance);
  const bank = g.fieldLabNetwork();
  bank.samples.water = 3; bank.samples.wood = 3;
  run(g, 40);
  assert.equal(g.s.strategistAcidBottles, 0);
  const u = addReserve(g); g.trainFieldLabWorker(u.id);
  g.assignFieldLabWorker('vale', 'vale', u.id, 'mineral');
  run(g, 12);
  assert.ok(g.s.strategistAcidBottles > 0);
  assert.equal(g.s.fieldLabAcid, undefined);
  assert.ok(bank.samples.water < 3 && bank.samples.wood < 3);
});
test('remote production positive but slower, without offline catch-up or successor management', () => {
  const local = new Campaign(), remote = new Campaign();
  for (const g of [local, remote]) {
    build(g);
    const worker = addReserve(g); g.trainFieldLabWorker(worker.id);
    g.assignFieldLabWorker('vale', 'vale', worker.id, 'fire');
    const bank = g.fieldLabNetwork();
    bank.samples.fire = 20;
  }
  remote.s.zone = 'march'; // travel is independently authorized, not the worker.
  run(local, 18); run(remote, 18);
  assert.ok(local.fieldLabNetwork().products.fireElixir > 0);
  assert.ok(remote.fieldLabNetwork().products.fireElixir > 0);
  assert.ok(remote.fieldLabNetwork().products.fireElixir <
    local.fieldLabNetwork().products.fireElixir);
  const before = remote.fieldLabStockCount();
  remote.s.time += 900; // Restored after a long pause; no tick => no work.
  assert.equal(remote.fieldLabStockCount(), before);
  remote.hero.class = 'paladin'; // Lawful Succession keeps staffed production.
  assert.equal(remote.upgradeFieldLabWindmill('march', 'vale'), false);
  const prior = remote.fieldLabNetwork().products.fireElixir;
  run(remote, 15);
  assert.ok(remote.fieldLabNetwork().products.fireElixir > prior);
});
test('source route planning is event-gated, never per-frame for a crowded network', () => {
  scans = 0; routes = 0;
  const g = new Campaign(); build(g);
  for (let i = 0; i < 10; i++) {
    const u = addReserve(g, 'ally-' + i); u.x += i * 2;
    g.trainFieldLabWorker(u.id);
  }
  const lab = g.fieldLab('vale');
  g.fieldLabNetwork().alchemyRank = 3;
  for (let i = 0; i < 4; i++)
    assert.equal(g.assignFieldLabWorker('vale', 'vale', 'ally-' + i, 'water'), true);
  run(g, 2);
  assert.ok(scans <= 4, 'each of four workers may plan once, at most one per tick');
  const after = scans;
  run(g, 2);
  assert.equal(scans, after, 'no per-frame replanning before the next scheduled retry');
  assert.ok(lab);
});
test('Advanced Alchemy is a separate paid Neri service; windmill is not gated', () => {
  const g = new Campaign(); build(g);
  assert.equal(g.upgradeFieldLabWindmill('vale', 'vale'), true);
  assert.equal(g.learnAdvancedLabAlchemy('vale'), false);
  g.s.rescued.neri = true;
  assert.equal(g.learnAdvancedLabAlchemy('vale'), true);
  assert.equal(g.fieldLabWorkerLimit(), 2);
  assert.equal(g.fieldLabStorageLimit(), 48);
  assert.equal(g.s.heroSkills, undefined);
});

test('ordinary danger stalls vulnerable worker movement and output', () => {
  const g = new Campaign(); build(g);
  const u = addReserve(g);
  g.s.zones.vale.props.push({
    id: 'tree', material: 'wood', authoritative: true, active: true, x: 390, y: 100,
  });
  g.trainFieldLabWorker(u.id);
  g.assignFieldLabWorker('vale', 'vale', u.id, 'wood');
  run(g, 2);
  const before = { x: u.x, y: u.y }, count = g.fieldLabStockCount();
  g.unsafe = true;
  run(g, 10);
  assert.deepEqual({ x: u.x, y: u.y }, before);
  assert.equal(g.fieldLabStockCount(), count);
  g.unsafe = false;
  run(g, 15);
  assert.ok(g.fieldLabStockCount() > count);
});
test('processing refuses unsafe stock and never goes negative', () => {
  const g = new Campaign(); build(g);
  const u = addReserve(g);
  g.trainFieldLabWorker(u.id);
  g.assignFieldLabWorker('vale', 'vale', u.id, 'water');
  const bank = g.fieldLabNetwork();
  bank.samples.water = 1;
  run(g, 20);
  assert.equal(bank.products.waterReagent, 1);
  assert.equal(bank.samples.water, 0);
  run(g, 20);
  assert.equal(bank.products.waterReagent, 1);
  bank.samples.water = -1;
  run(g, 20);
  assert.equal(bank.products.waterReagent, 1);
});

test('town scenery Barracks IDs do not qualify as player-placed buildings', () => {
  const g = new Campaign('strategist', false);
  g.s.zones.vale.buildings.push({
    id: 'crown-field-barracks', kind: 'barracks', x: 50, y: 50, progress: 4,
  });
  assert.equal(g.buildFieldLab('vale', { x: 200, y: 100 }), false);
});
test('Acid priority preserves raw surplus; manual reagent priority remains finite', () => {
  const g = new Campaign(); build(g);
  const u = addReserve(g);
  g.trainFieldLabWorker(u.id);
  g.assignFieldLabWorker('vale', 'vale', u.id, 'wood');
  const bank = g.fieldLabNetwork();
  g.upgradeFieldLabWindmill('vale', 'vale');
  bank.samples.wood = 4;
  run(g, 20);
  assert.equal(bank.samples.wood, 4);
  assert.equal(bank.products.woodEssence, 0);
  assert.equal(g.s.strategistAcidBottles, 0);
  assert.equal(g.setFieldLabProductionPriority('vale', 'vale', 'reagents'), true);
  run(g, 7);
  assert.ok(bank.products.woodEssence >= 1);
  assert.ok(bank.samples.wood < 4);
  assert.equal(g.setFieldLabProductionPriority('vale', 'vale', 'acid'), true);
  assert.equal(g.setFieldLabProductionPriority('vale', 'vale', 'free-power'), false);
});

'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const C = require('../../../src/prototype/engine.js'),
  H = require('../../../src/prototype/highlands.js');
const fixture = require('./dev137-save.json'),
  control = require('./dev137-control-enemies.json');
const report = { fresh: [], migration: null, scouting: null };
const stable = (z) =>
  JSON.stringify({
    props: z.props.map((p) => [p.id, p.x, p.y, p.structure]),
    npcs: z.npcs.map((n) => [n.id, n.x, n.y]).sort(),
    nodes: z.nodes,
    homes: z.enemies.map((e) => [e.id, e.home]),
  });
function navigation(g) {
  const z = g.zone(),
    origin = C.rules.harbors.highlands.arrival;
  assert(!g.blocked(origin.x, origin.y));
  let roads = 0,
    doors = 0;
  for (const r of z.roads)
    for (let i = 1; i < r.length; i++) {
      assert(g.clearSegment(r[i - 1], r[i]), 'road clearance');
      roads++;
    }
  for (const n of z.npcs.filter((n) => !n.internalSite && n.id !== 'return')) {
    const p = n.servicePoint || n;
    assert(!g.blocked(p.x, p.y), 'NPC ' + n.id);
    const route = g.route(origin, p);
    assert(route.length, 'route ' + n.id);
    let a = origin;
    for (const b of route) {
      assert(g.clearSegment(a, b), 'route edge ' + n.id);
      a = b;
    }
    doors++;
  }
  for (const n of z.nodes) {
    assert(!g.blocked(n.x, n.y), 'node ' + n.id);
    assert(g.route(origin, n).length, 'node route ' + n.id);
  }
  assert(
    Math.hypot(C.rules.harbors.highlands.boat.x - 390, C.rules.harbors.highlands.boat.y - 1955) <
      115,
    'boarding from shore',
  );
  return { roads, doors };
}
for (const seed of [7, 39, 89, 319]) {
  let s = seed;
  const g = new C('developer', 'paladin', () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  });
  g.s.zone = 'highlands';
  const z = g.zone();
  assert.equal(z.nodes.length, 4);
  assert.equal(g.hiddenTributeNodes().length, 4, 'all fresh Highlands tribute needs investigation');
  assert.equal(g.visibleResourceNodes().length, 0);
  assert.deepEqual(
    z.nodes.map((n) => n.site),
    ['ore', 'bridge-north', 'bridge-south', 'lookout'],
  );
  assert(
    !z.npcs.some((n) => n.id.startsWith('highlands-tribute-site-')),
    'reuse actual named places',
  );
  for (const n of z.nodes) {
    assert(n.hidden && n.concealedTribute);
    assert(z.npcs.some((p) => p.id === n.site && p.name === n.siteName));
    g.discover(n.site);
    assert(!g.tributeKnown(n), 'visiting the named marker alone does not locate the reserve');
  }
  assert.deepEqual(
    [z.minis.find((m) => m.id === 'field-ridge').x, z.minis.find((m) => m.id === 'field-ridge').y],
    [2850, 1170],
  );
  const stats = navigation(g);
  assert(z.props.length <= 512);
  assert(z.props.filter((p) => p.highlandsNature === 'tree').length > 70);
  assert(
    new Set(z.props.filter((p) => p.highlandsNature === 'tree').map((p) => p.treeSpecies)).size >=
      5,
  );
  assert(
    z.props.filter((p) => p.highlandsNature === 'tree' && p.treeSpecies === 'spruce').length <
      z.props.filter((p) => p.highlandsNature === 'tree').length * 0.2,
  );
  assert.deepEqual(z.enemies.find((e) => e.family === 'ridge' && e.type === 'boss').home, {
    x: 2850,
    y: 1170,
  });
  const saved = g.snapshot(),
    h = C.restore(saved);
  assert.equal(stable(h.zone()), stable(z), 'same-version save stays spatially stable');
  report.fresh.push({
    seed,
    props: z.props.length,
    trees: z.props.filter((p) => p.highlandsNature === 'tree').length,
    ...stats,
  });
}
{
  const before = JSON.parse(JSON.stringify(fixture)),
    g = C.restore(before),
    z = g.zone(),
    old = fixture.zones.highlands;
  const ids = new Set(z.props.map((p) => p.id));
  assert(
    old.props.every((p) => ids.has(p.id)),
    'retain authored and nature IDs',
  );
  assert.equal(g.hero.gold, fixture.hero.gold);
  assert.deepEqual(g.s.rescued, fixture.rescued);
  assert.deepEqual(g.s.normal, fixture.normal);
  assert.equal(z.enemies.find((e) => e.id === old.enemies[0].id).hp, 0, 'dead patrol stays dead');
  for (const n of old.nodes) {
    const after = z.nodes.find((p) => p.id === n.id);
    assert(after, 'node ID');
    assert.equal(after.amount, n.amount, 'fractional remaining balance');
  }
  assert.equal(g.s.gathered.highlands, fixture.gathered.highlands);
  assert.deepEqual(
    new Set(z.enemies.map((e) => e.id)),
    new Set(old.enemies.map((e) => e.id)),
    'enemy IDs/count',
  );
  for (const e of control) {
    const after = z.enemies.find((p) => p.id === e.id);
    assert.equal(after.maxHp, e.maxHp, 'maxHp vs dev137 restore');
    assert.equal(after.damage, e.damage, 'damage vs dev137 restore');
    assert.equal(after.gold, e.gold, 'reward vs dev137 restore');
    assert.equal(after.species, e.species, 'species');
  }
  assert(g.tributeKnown(z.nodes[0]), 'partially recovered legacy shipment stays discovered');
  assert.deepEqual(
    [z.minis.find((m) => m.id === 'field-ridge').x, z.minis.find((m) => m.id === 'field-ridge').y],
    [2850, 1170],
    'legacy encounter metadata follows the relocated watch',
  );
  const once = stable(z);
  g.zone();
  assert.equal(stable(z), once);
  const h = C.restore(g.snapshot());
  assert.equal(stable(h.zone()), once, 'historical then current restore idempotent');
  report.migration = {
    preservedProps: old.props.length,
    preservedEnemies: old.enemies.length,
    gold: g.hero.gold,
    tributeRemaining: z.nodes.reduce((s, n) => s + n.amount, 0),
    ...navigation(g),
  };
}
{
  const g = C.restore(fixture),
    z = g.zone();
  g.s.expeditionRank = 2;
  const n = g.hiddenTributeNodes()[0];
  assert(n);
  Object.assign(g.hero, g.safe(n.x - 300, n.y - 100));
  g.s.party = [g.unit('soldier', g.hero.x + 30, g.hero.y)];
  const u = g.s.party[0];
  u.active = true;
  assert(!g.scoutTribute(n.id), 'a supply post cannot organize a Highlands search');
  assert.equal(u.order, null);
  const b = {
    id: 'highlands-test-barracks',
    kind: 'barracks',
    x: g.hero.x,
    y: g.hero.y,
    progress: 4,
    queue: 0,
    queueType: null,
    theme: 'highlands',
    name: 'Barracks',
    icon: '🏰',
    full: false,
    upgradeProgress: 0,
    upgradePaid: false,
  };
  z.buildings.push(b);
  assert(g.scoutTribute(n.id, b.id));
  assert.equal(u.order.id, n.id, 'search the selected named site');
  assert(!g.tributeKnown(n), 'dispatch does not reveal');
  assert(u.order.scouting);
  const h = C.restore(g.snapshot());
  assert(h.s.party[0].order.scouting, 'search survives reload');
  assert(!h.tributeKnown(h.zone().nodes.find((p) => p.id === n.id)));
  g.recallParty();
  assert(!g.tributeKnown(n), 'Recall does not reveal');
  u.order = { type: 'gather', id: n.id, scouting: true };
  g.s.recallActive = false;
  Object.assign(u, g.safe(n.x - 20, n.y));
  Object.assign(g.hero, g.safe(n.x - 90, n.y));
  for (const e of z.enemies) e.hp = 0;
  for (let i = 0; i < 10 && !g.tributeKnown(n); i++) g.updateParty(0.1);
  assert(g.tributeKnown(n), 'physical arrival locates cache');
  const amount = n.amount;
  g.updateParty(0.1);
  assert(n.amount <= amount);
  report.scouting = {
    hiddenOnDispatch: true,
    savedSearch: true,
    recallPreservesConcealment: true,
    physicalArrival: true,
  };
}
{
  const g = new C('developer', 'paladin', () => 0.37);
  g.s.zone = 'highlands';
  const z = g.zone();
  g.s.expeditionRank = 2;
  let menu;
  const api = require('../../../src/prototype/menus.js').create({
    getGame: () => g,
    Campaign: C,
    D: C.data,
    action: (label, run, detail, disabled) => ({ label, run, detail, disabled }),
    openMenu: (title, description, actions, back) => {
      menu = { title, description, actions, back };
    },
    closeMenu: () => {},
  });
  const supply = z.npcs.find((n) => n.kind === 'supplier');
  Object.assign(g.hero, { x: supply.x, y: supply.y });
  g.s.party = [
    g.unit('soldier', supply.x, supply.y),
    g.unit('soldier', supply.x + 30, supply.y),
    g.unit('archer', supply.x - 30, supply.y),
  ];
  g.s.party[0].carry = 12.5;
  g.s.party[1].carry = 3.25;
  g.s.party[1].active = false;
  g.s.party[2].carry = 4.25;
  g.s.party[2].hp = 0;
  const wallet = g.hero.gold;
  api.supplier(supply);
  assert(
    g.s.party.every((u) => u.carry === 0),
    'Town Supplies still unloads active, resting and fallen companions',
  );
  assert.equal(g.hero.gold - wallet, 20, 'cargo is credited exactly once');
  const gather = menu.actions.find((a) => a.label === 'Gather resources');
  assert(gather && !gather.disabled);
  const before = JSON.stringify({
    discovered: g.s.discovered,
    party: g.s.party,
    gold: g.hero.gold,
  });
  gather.run();
  assert.equal(menu.title, 'Hidden Highlands tribute');
  assert(menu.description.includes('Crag Tyrant'));
  assert(!menu.description.includes('Ridge Tyrant'));
  assert(menu.description.includes('No one in town knows'));
  assert(menu.description.includes('completed Barracks'));
  assert.equal(
    JSON.stringify({ discovered: g.s.discovered, party: g.s.party, gold: g.hero.gold }),
    before,
    'Supplies explanation does not search, reveal or pay',
  );
  report.townSupply = {
    credits: 'Crag Tyrant',
    explainsBarracks: true,
    noRemoteSearch: true,
    allCompanyCargoDelivered: 20,
  };
}
fs.writeFileSync(path.join(__dirname, 'checks.json'), JSON.stringify(report, null, 2) + '\n');
console.log(
  'PASS four-seed navigation, real dev137 migration, identities/balances/deaths, idempotence, physical scouting/Recall/reload',
);

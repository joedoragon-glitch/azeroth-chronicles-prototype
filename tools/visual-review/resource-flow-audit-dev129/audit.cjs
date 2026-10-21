'use strict';
const C = require('../../../src/prototype/engine'),
  fs = require('node:fs'),
  path = require('node:path');
const result = {
  baseline: 'dev.129',
  scope:
    'Audit only; deterministic cleared-route timing isolates travel friction. Not live danger/kill-time balance.',
  sites: [],
  trips: [],
  cases: {},
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function world(region = 'vale') {
  const g = new C('normal', 'mage', () => 0.73);
  g.enter(region);
  g.s.expeditionRank = 2;
  g.s.mercyTime = 0;
  return g;
}
for (const r of C.data.regions) {
  const g = world(r.id),
    z = g.zone();
  result.sites.push({
    region: r.id,
    total: z.nodes.reduce((s, n) => s + n.amount, 0),
    known: g.visibleResourceNodes().length,
    hidden: g.hiddenTributeNodes().length,
    nodes: z.nodes.map((n) => ({
      id: n.id,
      site: n.siteName,
      amount: n.amount,
      hidden: n.hidden,
      x: n.x,
      y: n.y,
    })),
  });
}
for (const [region, count] of [...C.data.regions.map((r) => [r.id, 1]), ['vale', 2]]) {
  const g = world(region),
    z = g.zone(),
    node = g.visibleResourceNodes()[0];
  z.enemies = [];
  z.nodes = [node];
  g.s.party = Array.from({ length: count }, () => g.unit('soldier', g.hero.x, g.hero.y));
  const initial = node.amount,
    gold = g.hero.gold,
    start = g.s.time;
  let previous = gold,
    firstPayout = null,
    lastPayout = null,
    harvestFinished = null,
    deposits = 0,
    harvestSeconds = 0,
    maxCarry = 0;
  g.gather(node.id);
  for (let i = 0; i < 6000; i++) {
    const prior = node.amount;
    g.s.time += 0.1;
    g.updateParty(0.1);
    if (node.amount < prior) harvestSeconds += 0.1;
    maxCarry = Math.max(maxCarry, ...g.s.party.map((u) => u.carry));
    if (!harvestFinished && node.amount <= 0) harvestFinished = g.s.time - start;
    if (g.hero.gold > previous) {
      deposits++;
      previous = g.hero.gold;
      lastPayout = g.s.time - start;
      if (firstPayout === null) firstPayout = lastPayout;
    }
    if (g.s.party.every((u) => !u.order)) break;
  }
  result.trips.push({
    region,
    troops: count,
    site: node.siteName,
    amount: initial,
    paid: g.hero.gold - gold,
    firstPayout,
    lastPayout,
    harvestFinished,
    jobEnded: g.s.party.every((u) => !u.order),
    totalSeconds: g.s.time - start,
    harvestSeconds,
    deposits,
    maxCarry,
    remaining: node.amount,
    residualCarry: g.s.party.reduce((s, u) => s + u.carry, 0),
    finalSourceDistance: Math.min(...g.s.party.map((u) => dist(u, node))),
  });
}
{
  const g = world(),
    z = g.zone(),
    nodes = g.visibleResourceNodes();
  g.s.party = Array.from({ length: 3 }, () => g.unit('soldier', g.hero.x, g.hero.y));
  result.cases.assignment = {
    accepted: g.gather(nodes[0].id),
    eligible: 3,
    assigned: g.s.party.filter((u) => u.order?.type === 'gather').length,
  };
  g.s.party[0].carry = 35;
  for (const n of z.nodes) n.amount = 0;
  g.recallParty();
  const purse = g.hero.gold;
  g.s.time++;
  g.updateParty(0.1);
  result.cases.exhaustedRecall = {
    carry: g.s.party[0].carry,
    order: g.s.party[0].order,
    purseChange: g.hero.gold - purse,
    redispatchAccepted: g.gather(nodes[0].id),
    feedback: g.messages.at(-1),
  };
  const saved = C.restore(g.snapshot(), () => 0.73);
  result.cases.exhaustedReload = { carry: saved.s.party[0].carry, order: saved.s.party[0].order };
}
{
  const g = world(),
    z = g.zone(),
    n = g.visibleResourceNodes()[0];
  z.enemies = [];
  const u = g.unit('soldier', g.hero.x, g.hero.y);
  g.s.party = [u];
  u.carry = 12;
  u.order = { type: 'deposit', id: n.id, group: n.resourceGroup };
  g.enter('crypt');
  result.cases.travel = { carry: u.carry, order: u.order, region: g.zoneId };
}
{
  // Controlled open terrain: demonstrate a stalled delivery and feedback content.
  const g = world(),
    z = g.zone();
  z.props = [];
  z.buildings = [];
  z.npcs = [];
  g.zone = () => z;
  g.blocked = (x, y, zone, r = 15) => x < 40 + r || y < 40 + r || x > 2745 - r || y > 2745 - r;
  const n = { id: 'audit-job', x: 650, y: 1000, amount: 0, resourceGroup: 'audit' };
  z.nodes = [n];
  const u = g.unit('soldier', 600, 1000);
  g.s.party = [u];
  Object.assign(g.hero, { x: 550, y: 1000 });
  u.carry = 35;
  u.order = { type: 'deposit', id: n.id, group: n.resourceGroup };
  const town = C.data.towns[0];
  z.enemies = [
    g.makeEnemy(
      { species: 'orc', level: 1, hp: 1000, damage: 0, gold: 0, xp: 0 },
      { x: town[0], y: town[1] },
    ),
  ];
  const purse = g.hero.gold;
  for (let i = 0; i < 200; i++) {
    g.s.time += 0.1;
    g.updateParty(0.1);
  }
  result.cases.noSafeDeposit = {
    deposit: g.depositSite(u),
    order: u.order?.type,
    carry: u.carry,
    purseChange: g.hero.gold - purse,
    notice: g.noticeHistory?.slice(-3),
  };
}
fs.writeFileSync(path.join(__dirname, 'result.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ trips: result.trips, cases: result.cases }, null, 2));

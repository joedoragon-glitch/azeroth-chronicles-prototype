'use strict';
// Diagnostic audit PR #585: run this existing original regression unchanged against the dev.215 baseline.
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine'),
  Menus = require('../src/prototype/menus');
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function world(id = 'vale') {
  const g = new C('normal', 'mage', () => 0.73);
  g.enter(id);
  g.s.expeditionRank = 2;
  g.s.mercyTime = 0;
  return g;
}
function open() {
  const g = world(),
    z = g.zone();
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) z[key] = [];
  g.zone = () => z;
  g.blocked = (x, y, zone, r = 15) => x < 40 + r || y < 40 + r || x > 2745 - r || y > 2745 - r;
  const u = g.unit('soldier', 600, 1000);
  g.s.party = [u];
  Object.assign(g.hero, { x: 550, y: 1000 });
  z.nodes = [{ id: 'job', x: 650, y: 1000, amount: 170, kind: 'resource', resourceGroup: 'audit' }];
  return { g, z, u, n: z.nodes[0] };
}
{
  const g = world(),
    n = g.visibleResourceNodes()[0];
  g.s.party = Array.from({ length: 3 }, () => g.unit('soldier', g.hero.x, g.hero.y));
  assert(g.gather(n.id));
  assert(g.s.party.every((u) => u.order?.id === n.id));
  assert.equal(g.s.gatheringTarget.id, n.id);
  g.recallParty();
  assert.equal(g.s.gatheringTarget.id, n.id, 'Recall preserves escort waypoint');
  const h = C.restore(g.snapshot(), () => 0.73);
  assert.equal(h.s.gatheringTarget.id, n.id, 'waypoint survives save after Recall');
  g.enter('crypt');
  assert.equal(g.s.gatheringTarget, null);
}
{
  const { g, z, u, n } = open();
  const e = g.makeEnemy(
    { species: 'orc', level: 1, hp: 1000, damage: 10, gold: 0, xp: 0 },
    { x: 680, y: 1000 },
  );
  z.enemies = [e];
  g.engage(e); // A real hostile encounter is the precondition for defensive combat.
  g.gather(n.id);
  const amount = n.amount,
    hp = e.hp;
  g.s.time += 0.1;
  g.updateParty(0.1);
  assert.equal(n.amount, amount, 'combat pauses harvest');
  assert(e.hp < hp || g._companionCharges?.has(u.id),
    'normal skills/attacks engage: ' + JSON.stringify({
      enemyAggro: e.aggro, enemyHp: e.hp, originalHp: hp,
      enemyPosition: [e.x, e.y], unitPosition: [u.x, u.y],
      unitCd: u.cd, unitOrder: u.order?.type, unitType: u.type,
      reach: g.companionCombatReach(u), line: g.line(u, e),
      targetable: g.tacticalDirectTargetable(e),
      tacticalTarget: g._tacticalPartyTargets?.get(u.id) || null,
    }));
  assert.equal(u.order.id, n.id);
  assert.equal(g.s.gatheringTarget.id, n.id);
  // Critical wounds must retreat immediately and keep the assignment/cargo.
  u.hp = u.maxHp * 0.1;
  u.carry = 27;
  g.clearCompanionJudgment(u);
  const before = { x: u.x, y: u.y };
  g.s.time += 0.1;
  g.updateParty(0.1);
  assert(g.companionRetreating(u));
  assert(dist(u, before) > 0);
  assert.equal(u.carry, 27);
  assert.equal(u.order.id, n.id);
  e.hp = 0;
  u.hp = u.maxHp;
  g.s.time += 0.5;
  const old = n.amount;
  Object.assign(u, n);
  g.updateParty(0.1);
  assert(n.amount < old, 'harvest resumes after combat');
}
{
  const { g, z, u, n } = open();
  z.npcs = [
    { id: 'a', kind: 'rest', x: 600, y: 1150 },
    { id: 'b', kind: 'rest', x: 1200, y: 1000 },
  ];
  u.order = { type: 'deposit', id: n.id, group: n.resourceGroup };
  u.carry = 120;
  assert.equal(g.depositSite(u).id, 'a');
  u.hp = u.maxHp * 0.1;
  z.enemies = [
    g.makeEnemy(
      { species: 'orc', level: 1, hp: 1000, damage: 10, gold: 0, xp: 0 },
      { x: 670, y: 1000 },
    ),
  ];
  g.s.time += 0.1;
  g.updateParty(0.1);
  assert(g.companionRetreating(u));
  z.enemies = [];
  g.s.time += 3;
  assert.equal(g.depositSite(u).id, 'b', 'withdrawal tries another delivery destination');
  assert.equal(u.carry, 120);
}
{
  const { g, z, u, n } = open();
  z.npcs = [{ id: 'rest', kind: 'rest', x: 1700, y: 1000 }];
  u.order = { type: 'deposit', id: n.id };
  u.carry = 120;
  z.enemies = [
    g.makeEnemy(
      { species: 'orc', level: 1, hp: 1000, damage: 0, gold: 0, xp: 0 },
      { x: 1050, y: 1000 },
    ),
  ];
  const destination = g.depositSite(u);
  assert(destination, 'reachable delivery is attempted despite enemy awareness');
  assert(g.companionRoute(u, destination).length);
}
for (const [i, r] of C.data.regions.entries()) {
  const g = world(r.id);
  assert.equal(g.gatheringCapacity(), 120 + i * 30);
}
for (const count of [1, 2]) {
  const g = world(),
    z = g.zone(),
    n = g.visibleResourceNodes()[0];
  z.enemies = [];
  z.nodes = [n];
  g.s.party = Array.from({ length: count }, () => g.unit('soldier', g.hero.x, g.hero.y));
  const gold = g.hero.gold;
  g.gather(n.id);
  for (let i = 0; i < 1800 && g.s.party.some((u) => u.order); i++) {
    g.s.time += 0.05;
    g.updateParty(0.05);
  }
  assert.equal(n.amount, 0);
  assert.equal(g.hero.gold - gold, 170);
  assert.equal(g.s.tributeRemainder, 0);
  assert(g.s.party.every((u) => u.carry === 0 && !u.order));
  assert.equal(g.s.gatheringTarget, null);
}
{
  const g = world('crown'),
    z = g.zone(),
    n = g.visibleResourceNodes()[0];
  z.enemies = [];
  z.nodes = [n];
  const u = g.unit('soldier', 1275.1702992430364, 2257.7568986144306),
    next = { x: 1288.357386918423, y: 2280.164436972128 };
  g.s.party = [u];
  u.order = { type: 'gather', id: n.id, journey: { returning: true, points: [next] } };
  assert(!g.clearSegment(u, next, 15));
  assert(g.clearSegment(u, next, g.actorRadius(u)));
  const before = dist(u, next);
  g.returnFromDelivery(u, [u], 0.05);
  assert(dist(u, next) < before, 'Crown reverse segment uses actual body');
  // Two-load native Crown journey exercises the previously looping return.
  Object.assign(u, { x: g.hero.x, y: g.hero.y, carry: 0, order: null });
  g.clearGatheringIntent(u);
  n.amount = 480;
  const gold = g.hero.gold;
  g.gather(n.id);
  let reverse = false;
  for (let i = 0; i < 4000 && u.order; i++) {
    g.s.time += 0.05;
    g.updateParty(0.05);
    reverse ||= !!u.order?.journey?.returning;
  }
  assert(reverse);
  assert.equal(n.amount, 0);
  assert.equal(g.hero.gold - gold, 480);
  assert.equal(u.order, null);
  assert(dist(u, n) > 130, 'final delivery does not return to exhausted source');
}
{
  const g = world(),
    z = g.zone(),
    supplier = z.npcs.find((n) => n.kind === 'supplier');
  g.s.party = Array.from({ length: 3 }, () => g.unit('soldier', 2000, 2000));
  g.s.party[0].carry = 35;
  g.s.party[1].carry = 0.6;
  g.s.party[1].active = false;
  g.s.party[2].carry = 0.4;
  g.s.party[2].hp = 0;
  const before = g.s.party.map((u) => ({ hp: u.hp, active: u.active, x: u.x, y: u.y }));
  Object.assign(g.hero, supplier);
  const gold = g.hero.gold;
  assert(g.interact(supplier));
  assert.equal(g.hero.gold - gold, 36);
  assert(g.s.party.every((u) => !u.carry));
  assert.deepEqual(
    g.s.party.map((u) => ({ hp: u.hp, active: u.active, x: u.x, y: u.y })),
    before,
  );
  assert(g.interact(supplier));
  assert.equal(g.hero.gold - gold, 36, 'repeat interaction never duplicates');
  assert.equal(g.unloadCompanyTribute({ ...supplier }), null, 'forged NPC rejected');
  g.s.party[0].carry = 0.3;
  assert.equal(g.unloadCompanyTribute(supplier), 0);
  const h = C.restore(g.snapshot(), () => 0.73);
  assert(Math.abs(h.s.tributeRemainder - 0.3) < 1e-8);
  h.s.party[0].carry = 0.7;
  const native = h.zone().npcs.find((n) => n.kind === 'supplier');
  Object.assign(h.hero, native);
  assert.equal(h.unloadCompanyTribute(native), 1);
  const old = g.snapshot();
  delete old.tributeRemainder;
  delete old.gatheringTarget;
  assert.equal(C.restore(old, () => 0.73).s.tributeRemainder, 0);
  old.tributeRemainder = 1;
  assert.throws(() => C.restore(old, () => 0.73));
}
{
  const g = world(),
    n = g.zone().npcs.find((n) => n.kind === 'supplier');
  Object.assign(g.hero, n);
  g.s.party = [g.unit('soldier', n.x, n.y)];
  g.s.party[0].carry = 12;
  let menu,
    closed = 0;
  const catalog = Menus.create({
    getGame: () => g,
    Campaign: C,
    D: C.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions, back) => {
      menu = { title, description, actions, back };
    },
    closeMenu: () => closed++,
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  const gold = g.hero.gold;
  catalog.supplier(n);
  assert.equal(g.hero.gold - gold, 12);
  const gather = menu.actions.find((a) => a.label === 'Gather resources');
  assert(gather && !gather.disabled);
  gather.action();
  assert(menu.actions.some((a) => /Locate & gather/.test(a.label)));
  const target = g.hiddenTributeNodes()[0];
  menu.actions.find((a) => /Locate & gather/.test(a.label)).action();
  assert.equal(g.s.gatheringTarget.id, target.id);
  assert(g.tributeKnown(target));
  assert.equal(closed, 1);
}
console.log(
  'PASS all-idle dispatch, persistent escort target, ordinary combat/retreat/resume, alternate delivery, capacities, exact pooled payout, Supplies fallback/orders, save compatibility and native Crown multi-load return.',
);
// The Little Treasurer is the sole pet worker; combat remains pet combat.
{
  const g = world(),
    z = g.zone(),
    n = g.visibleResourceNodes()[0];
  z.enemies = [];
  z.nodes = [n];
  g.s.normal.ridge = true;
  g.s.true.ridge = true;
  const pet = g.unit('pet', n.x, n.y, 'ridge');
  g.s.party = [pet];
  assert(g.canGatherTribute(pet));
  assert.equal(g.availableLabor().length, 0, 'pet exception does not turn pets into builders');
  assert(g.gather(n.id));
  g.s.time += 0.1;
  g.updateParty(0.1);
  assert(pet.carry > 0 && pet.order);
  const h = C.restore(g.snapshot(), () => 0.73);
  assert.equal(h.s.party[0].carry, pet.carry);
  assert.equal(h.s.party[0].order.id, n.id);
  for (const family of Object.keys(C.rules.petCompanions))
    if (family !== 'ridge') assert(!g.canGatherTribute(g.unit('pet', n.x, n.y, family)));
}

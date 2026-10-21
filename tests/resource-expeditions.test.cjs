'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine'),
  Menus = require('../src/prototype/menus');
function fixture() {
  const g = new C('normal', 'mage', () => 0.73);
  for (const r of ['vale', 'march', 'highlands', 'frontier']) g.enter(r);
  g.s.expeditionRank = 4;
  g.s.party = [g.unit('soldier', g.hero.x, g.hero.y), g.unit('archer', g.hero.x + 20, g.hero.y)];
  g.s.party[1].active = false;
  g.zone().enemies = [];
  assert(g.build());
  const b = g.zone().buildings.at(-1);
  b.progress = 4;
  b.full = true;
  g.s.party[0].order = null;
  Object.assign(g.hero, { x: b.x, y: b.y });
  for (const boss of C.data.bosses.filter(
    (b) => b.captive && ['vale', 'march', 'highlands'].includes(b.region),
  ))
    g.s.rescued[boss.id] = true;
  g.checkQuests();
  return { g, b };
}
{
  const { g, b } = fixture(),
    u = g.s.party[0];
  assert.equal(g.resourceExpeditionDuration(), 300);
  assert.equal(g.resourceExpeditionRegions().length, 3);
  b.full = false;
  assert(!g.startResourceExpedition(b.id, 'vale', u.id));
  b.full = true;
  assert(!g.startResourceExpedition(b.id, 'frontier', u.id));
  assert(!g.startResourceExpedition(b.id, 'crown', u.id));
  g.s.rescued.crypt = false;
  assert(!g.startResourceExpedition(b.id, 'vale', u.id));
  g.s.rescued.crypt = true;
  u.hp = 0;
  assert(!g.startResourceExpedition(b.id, 'vale', u.id));
  u.hp = u.maxHp;
  u.order = { type: 'gather', id: 'busy' };
  assert(!g.startResourceExpedition(b.id, 'vale', u.id));
  u.order = null;
  const total = g.s.zones.vale.nodes.reduce((s, n) => s + n.amount, 0),
    gold = g.hero.gold;
  assert.equal(total, 640);
  assert(g.startResourceExpedition(b.id, 'vale', u.id));
  assert(!u.active);
  assert(u.expeditionId);
  assert(!g.dismissCompanion(u.id), 'away worker stays linked to their mission');
  assert(g.companionActivationReason(u.id, b.id).includes('away'));
  assert(!g.startResourceExpedition(b.id, 'vale', g.s.party[1].id));
  assert(!g.startResourceExpedition(b.id, 'march', u.id));
  const end = g.s.resourceExpeditions[0].finishAt;
  g.s.time = end - 0.1;
  g.advanceResourceExpeditions();
  assert.equal(g.hero.gold, gold);
  let h = C.restore(g.snapshot(), () => 0.73);
  assert.equal(h.s.resourceExpeditions.length, 1);
  assert(!h.s.party[0].active);
  h.enter('highlands');
  h.s.time = end;
  h.advanceResourceExpeditions();
  assert.equal(h.hero.gold, gold + 640);
  assert.equal(
    h.s.zones.vale.nodes.reduce((s, n) => s + n.amount, 0),
    0,
  );
  assert.equal(h.s.resourceExpeditions.length, 0);
  assert(!h.s.party[0].expeditionId);
  assert(h.s.party[0].active);
  h.advanceResourceExpeditions();
  assert.equal(h.hero.gold, gold + 640);
  h = C.restore(h.snapshot(), () => 0.73);
  assert.equal(h.hero.gold, gold + 640);
  assert.equal(h.s.resourceExpeditions.length, 0);
}
{
  const { g, b } = fixture(),
    reserve = g.s.party[1],
    gold = g.hero.gold;
  assert(g.startResourceExpedition(b.id, 'march', reserve.id));
  const end = g.s.resourceExpeditions[0].finishAt;
  // Manual gathering while the companion is away cannot duplicate that tribute.
  g.s.zones.march.nodes[0].amount -= 25;
  g.s.gathered.march = (g.s.gathered.march || 0) + 25;
  g.s.time = end;
  g.advanceResourceExpeditions();
  assert.equal(g.hero.gold, gold + 615);
  assert.equal(reserve.active, false, 'a reserve worker returns to reserve');
}
{
  const { g, b } = fixture();
  assert(g.startResourceExpedition(b.id, 'vale', g.s.party[0].id));
  assert(g.startResourceExpedition(b.id, 'march', g.s.party[1].id));
  const gold = g.hero.gold,
    end = Math.max(...g.s.resourceExpeditions.map((e) => e.finishAt));
  g.s.time = end;
  const h = C.restore(g.snapshot(), () => 0.73);
  assert.equal(h.hero.gold, gold + 1280, 'due missions finish exactly once on restore');
  assert.equal(h.s.resourceExpeditions.length, 0);
  const old = h.snapshot();
  delete old.resourceExpeditions;
  assert.equal(C.restore(old, () => 0.73).s.resourceExpeditions.length, 0);
}
{
  const { g, b } = fixture();
  g.startResourceExpedition(b.id, 'vale', g.s.party[0].id);
  const s = g.snapshot();
  s.resourceExpeditions.push({ ...s.resourceExpeditions[0] });
  assert.throws(() => C.restore(s, () => 0.73));
  const bad = g.snapshot();
  bad.resourceExpeditions[0].workerId = 'missing';
  assert.throws(() => C.restore(bad, () => 0.73));
}
{
  const { g, b } = fixture();
  let menu;
  const catalog = Menus.create({
    getGame: () => g,
    Campaign: C,
    D: C.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions, back) => {
      menu = { title, description, actions, back };
    },
    closeMenu() {},
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  b.full = false;
  catalog.barracksMenu(b);
  assert(!menu.actions.some((a) => a.label === 'Resource expeditions'));
  b.full = true;
  catalog.barracksMenu(b);
  menu.actions.find((a) => a.label === 'Resource expeditions').action();
  assert.equal(menu.title, 'Resource expeditions');
  menu.actions.find((a) => a.label === C.data.regions[0].name).action();
  assert.equal(menu.title, 'Choose expedition companion');
  menu.actions[0].action();
  assert.equal(g.s.resourceExpeditions.length, 1);
}
console.log(
  'PASS Full-only prior-region specialist gates, chosen living worker/reserves, absence, 300s clock, save/travel/return, all hidden tribute, concurrent manual gathering, duplicate prevention, due restore and catalog flow.',
);
{
  const { g, b } = fixture();
  g.s.normal.ridge = true;
  g.s.true.ridge = true;
  g.checkQuests();
  const pet = g.unit('pet', g.hero.x, g.hero.y, 'ridge');
  g.s.party.push(pet);
  assert(g.startResourceExpedition(b.id, 'vale', pet.id));
  let h = C.restore(g.snapshot(), () => 0.73);
  const gold = h.hero.gold,
    end = h.s.resourceExpeditions[0].finishAt;
  h.s.time = end;
  h.advanceResourceExpeditions();
  assert.equal(h.hero.gold, gold + 640);
  assert(!h.s.party.find((u) => u.id === pet.id).expeditionId);
  const other = h.unit('pet', h.hero.x, h.hero.y, 'thorn');
  h.s.party.push(other);
  assert.equal(h.resourceExpeditionWorkerReason(other), 'This companion cannot gather resources.');
}

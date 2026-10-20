'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine'),
  Menus = require('../src/prototype/menus');
for (const mode of ['normal', 'nightmare'])
  for (const cls of ['paladin', 'mage', 'ranger'])
    for (let i = 0; i < 4; i++)
      for (const coins of [0, 57]) {
        const g = new C(mode, cls, () => 0.9),
          region = C.data.regions[i];
        g.s.zone = region.id;
        g.zone();
        g.hero.level = 40;
        g.hero.gold = Math.min(coins, region.fare - 1);
        g.s.party = [];
        g.zone().nodes.forEach((n) => (n.amount = 0));
        assert.equal(g.passageWorkQuote(), null, 'rescues required');
        for (const b of C.data.bosses.filter((b) => b.region === region.id && b.captive))
          g.s.rescued[b.id] = g.s.normal[b.id] = true;
        g.checkQuests();
        g.hero.gold = Math.min(coins, region.fare - 1);
        const q = g.passageWorkQuote();
        assert(q);
        assert.equal(q.work + q.payment, region.fare);
        const hp = g.hero.hp,
          gold = g.hero.gold;
        assert(!g.travel(1), 'ordinary paid travel remains insufficient');
        const restored = C.restore(g.snapshot(), () => 0.9);
        assert.deepEqual(restored.passageWorkQuote(), q, 'old saves need no new unlock field');
        assert(g.travel(1, { workPassage: true }));
        assert.equal(g.zoneId, C.data.regions[i + 1].id);
        assert.equal(g.hero.gold, 0);
        assert.equal(g.hero.hp, hp);
        assert(g.s.tickets[region.id]);
        assert.equal(g.s.party.length, 0);
        assert(g.travel(-1), 'normal free return');
        assert.equal(g.hero.gold, 0);
        assert.equal(
          g.passageWorkQuote().payment,
          0,
          'can never become trapped after a later return either',
        );
        assert.equal(q.payment, gold);
      }
{
  const g = new C('normal', 'mage', () => 0.9);
  g.s.zone = 'frontier';
  g.zone();
  g.s.rescued.warlord = g.s.normal.warlord = true;
  g.s.rescued.abyss = g.s.normal.abyss = true;
  g.checkQuests();
  g.hero.gold = 57;
  let menu,
    closed = false;
  const m = Menus.create({
    getGame: () => g,
    Campaign: C,
    D: C.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions) => (menu = { title, description, actions }),
    closeMenu: () => (closed = true),
  });
  m.transport(g.zone().npcs.find((n) => n.id === 'outbound'));
  assert(menu.actions[0].disabled);
  const work = menu.actions.find((a) => a.label.startsWith('Work for passage'));
  assert(work && !work.disabled);
  assert(work.detail.includes('123'));
  work.action();
  assert(closed);
  assert.equal(g.zoneId, 'crown');
  assert.equal(g.hero.gold, 0);
}
{
  const g = new C('normal', 'mage', () => 0.9);
  g.s.zone = 'frontier';
  g.zone();
  g.s.rescued.warlord = g.s.normal.warlord = true;
  g.s.rescued.abyss = g.s.normal.abyss = true;
  g.checkQuests();
  g.hero.gold = 57;
  const before = g.snapshot();
  g.enter = function () {
    this.hero.gold = 999;
    this.s.zone = 'crown';
    throw Error('fixture');
  };
  assert(!g.travel(1, { workPassage: true }));
  assert.deepEqual(
    g.snapshot(),
    before,
    'failed passage rolls back all money, tickets and progress',
  );
}
{
  const g = new C('normal', 'mage', () => 0.9);
  g.s.zone = 'frontier';
  g.zone();
  g.s.rescued.warlord = g.s.normal.warlord = true;
  g.s.rescued.abyss = g.s.normal.abyss = true;
  g.checkQuests();
  g.hero.gold = 180;
  assert.equal(g.passageWorkQuote(), null, 'affordable fares use normal payment');
  assert(!g.travel(1, { workPassage: true }));
  g.hero.gold = 57;
  g.s.recovery.frontier = true;
  assert.equal(g.passageWorkQuote(), null, 'death recovery waiver stays free');
  assert(g.travel(1));
  assert.equal(g.hero.gold, 57);
}
console.log(
  'PASS 48 penniless/outleveled/no-party/depleted-region passages, rescue gates, existing saves, normal fares, return, recovery, UI and rollback',
);

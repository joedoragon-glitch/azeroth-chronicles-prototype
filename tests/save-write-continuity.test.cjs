'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const Persistence = require('../src/prototype/persistence');

const memory = () => {
  const saved = new Map();
  return {
    saved,
    storage: {
      getItem: (key) => saved.get(key) ?? null,
      setItem: (key, value) => saved.set(key, String(value)),
      removeItem: (key) => saved.delete(key),
    },
  };
};

// Check actual authored campaign worlds, the side dungeons and training arena:
// neither a normal zone visit nor a serialize/restore/revisit loop may create
// an invalid primary. The profile/cache layer is not mocked as a validator.
const routes = [
  ...Campaign.data.regions.map((region) => region.id),
  ...Campaign.dungeonIds,
  ...(Campaign.rules.sideDungeons || []).map((side) => side.id),
];
assert.equal(new Set(routes).size, routes.length, 'zone catalog is distinct');
let visits = 0;
for (const mode of ['normal', 'nightmare', 'developer']) {
  for (const zoneId of routes) {
    const c = new Campaign(mode, 'paladin', () => 0.5);
    c.enter(zoneId);
    for (let pass = 0; pass < 2; pass++) {
      const snapshot = c.snapshot();
      Campaign.validate(snapshot);
      const restored = Campaign.restore(snapshot, () => 0.5);
      Campaign.validate(restored.snapshot());
      assert.equal(restored.s.zone, zoneId);
      const { storage } = memory();
      const persist = Persistence.create({ Campaign, storage });
      assert(persist.save(restored, {}), mode + ':' + zoneId + ' pass ' + pass);
      c.s = restored.s;
      c.enter(zoneId);
      visits++;
    }
  }
}
{
  const arena = new Campaign('arena', 'paladin', () => 0.5);
  Campaign.validate(arena.snapshot());
  assert(Persistence.create({ Campaign, storage: memory().storage }).save(arena, {}));
}

// Once the authoritative v4 primary has written successfully, an optional
// profile write failure cannot be reported as failed campaign progress.
{
  const { saved, storage } = memory();
  const messages = [];
  const game = new Campaign();
  const io = {
    ...storage,
    setItem(key, value) {
      if (key === Persistence.profileKey) throw Error('Only profile preferences storage is blocked');
      storage.setItem(key, value);
    },
  };
  const adapter = Persistence.create({ Campaign, storage: io, status: (s) => messages.push(s) });
  game.hero.gold += 25;
  assert.equal(adapter.save(game, {}), true, 'the primary save success is authoritative');
  assert.equal(JSON.parse(saved.get(Persistence.saveKey('normal'))).hero.gold, game.hero.gold);
  assert.match(messages.at(-1), /Saved locally.*preference storage unavailable/);
  game.hero.gold += 35;
  assert(adapter.save(game, {}), 'future campaign progress is still writeable');
  assert.equal(adapter.load('normal').hero.gold, game.hero.gold);
}

// Validation refusal and browser quota failure must preserve the last durable
// good primary. Both are distinct from the optional profile failure above.
{
  const { saved, storage } = memory();
  const adapter = Persistence.create({ Campaign, storage });
  const game = new Campaign();
  assert(adapter.save(game, {}));
  const lastGood = saved.get(Persistence.saveKey('normal'));
  game.hero.cd[0] = Infinity;
  assert.equal(adapter.save(game, {}), false);
  assert.equal(saved.get(Persistence.saveKey('normal')), lastGood);
  const refusing = Persistence.create({
    Campaign,
    storage: {
      ...storage,
      setItem(key, value) {
        if (key === Persistence.saveKey('normal')) {
          const e = Error('Quota full');
          e.name = 'QuotaExceededError';
          throw e;
        }
        storage.setItem(key, value);
      },
    },
  });
  const fresh = new Campaign();
  fresh.hero.gold += 1;
  assert.equal(refusing.save(fresh, {}), false);
  assert.equal(saved.get(Persistence.saveKey('normal')), lastGood);
}

// A second tab or stale writer must not roll back a newer primary.
{
  const { saved, storage } = memory();
  const a = Persistence.create({ Campaign, storage });
  const b = Persistence.create({ Campaign, storage });
  const live = new Campaign();
  assert(a.save(live, {}));
  const written = saved.get(Persistence.saveKey('normal'));
  const stale = new Campaign();
  stale.hero.gold += 99;
  assert.equal(b.save(stale, {}), false);
  assert.equal(saved.get(Persistence.saveKey('normal')), written);
}

// Existing producer-side limits already prevent other otherwise fatal writes.
{
  const c = new Campaign('normal', 'paladin', () => 0.5);
  for (let i = 0; i < 410; i++) c.event('gold');
  assert.equal(c.s.statistics.events.length, 400);
  Campaign.validate(c.snapshot());
  c.s.rescued.archive = true;
  c.hero.tonicStock = 10000;
  const gold = c.hero.gold;
  assert.equal(c.purchasePreparationTonic(), false);
  assert.equal(c.hero.gold, gold, 'no charge at the existing potion-stock ceiling');
}

// High but finite v4 capacities must be enforced *before* a paid action
// mutates the world. These are artificial boundary fixtures, not normal usage.
{
  const c = new Campaign('normal', 'paladin', () => 0.5);
  c.s.rescued.archive = true;
  c.s.companionVitalityRank = 1000000;
  const gold = c.hero.gold;
  assert.equal(c.trainCompanionVitality(), false);
  assert.equal(c.hero.gold, gold, 'training at the v4 ceiling cannot charge the hero');
}
{
  const c = new Campaign('normal', 'paladin', () => 0.5);
  c.zone().buildings = Array.from({ length: 300 }, (_, i) => ({ id: 'fixture-barracks-' + i }));
  const gold = c.hero.gold;
  assert.equal(c.build(), false);
  assert.equal(c.hero.gold, gold, '301st Barracks cannot be purchased');
  assert.match(c.messages.at(-1), /Barracks capacity/);
}

// Historical #605: test the controlled 5,001st reward boundary using the
// game's own award method. Holding XP at zero is deliberately artificial and
// does not prove natural-player incidence; the failure mode remains real.
// The new continuity fallback must retain the first 5,000 physical drops and
// credit only overflow crowns directly, without duplicating paid loot.
{
  const { saved, storage } = memory();
  const c = new Campaign('normal', 'paladin', () => 0.5);
  const p = Persistence.create({ Campaign, storage });
  const ordinary = c.zone().enemies.find((enemy) => enemy.type === 'mob' && !enemy.guard);
  assert(ordinary && ordinary.gold > 0);
  const award = { ...ordinary, gold: ordinary.gold, xp: 0, level: c.hero.level };
  for (let i = 0; i < 5000; i++) c.awardEnemyReward(award);
  assert.equal(c.s.loot.length, 5000);
  Campaign.validate(c.snapshot());
  assert(p.save(c, {}));
  const originalIds = c.s.loot.map((drop) => drop.id);
  const originalTotal = c.s.loot.reduce((sum, drop) => sum + drop.gold, 0);
  const before = c.hero.gold;
  c.awardEnemyReward(award);
  assert.equal(c.s.loot.length, 5000, 'the 5,001st reward cannot overrun the v4 validator');
  assert.deepEqual(c.s.loot.map((drop) => drop.id), originalIds);
  assert.equal(c.s.loot.reduce((sum, drop) => sum + drop.gold, 0), originalTotal,
    'all existing physical drops remain available at their original positions');
  assert.equal(c.hero.gold, before + ordinary.gold,
    'overflow currency is neither lost nor duplicated');
  Campaign.validate(c.snapshot());
  assert.equal(p.save(c, {}), true, 'the same native saver keeps writing');
  const exported = Persistence.prepareExternalExport(c, Campaign);
  assert(Campaign.restore(JSON.parse(exported.text)), 'external export remains reloadable');
  assert.equal(JSON.parse(saved.get(Persistence.saveKey('normal'))).hero.gold, c.hero.gold);
}
console.log('PASS save-continuity audit: ' + visits +
  ' native zone visits, v4 save/restore, optional profile, bad-data/quota/second-tab protection and bounded controlled loot overflow');

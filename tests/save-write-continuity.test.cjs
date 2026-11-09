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

// Historical #605: the 5,000-loot constraint still has a producible technical
// failure boundary. This fixture intentionally holds XP at zero and is *not*
// evidence of 5,001 rewards through ordinary play; preserve real money and
// require an explicit design decision before changing drop pickup semantics.
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
  const durable = saved.get(Persistence.saveKey('normal'));
  c.awardEnemyReward(award);
  assert.equal(c.s.loot.length, 5001);
  assert.throws(() => Campaign.validate(c.snapshot()), /Invalid reward state/);
  assert.equal(p.save(c, {}), false, 'the same validator also blocks continued local saving');
  assert.throws(() => Persistence.prepareExternalExport(c, Campaign), /Invalid reward state/);
  assert.equal(saved.get(Persistence.saveKey('normal')), durable, 'last valid primary remains');
}
console.log('PASS save-continuity audit: ' + visits +
  ' native zone visits, v4 save/restore, optional profile, bad-data/quota/second-tab protection and controlled loot boundary');

'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const Persistence = require('../src/prototype/persistence');

const game = new Campaign('normal', 'paladin', () => 0.2);
const zone = game.zone();
const initialIds = new Set(zone.enemies.map((e) => e.id));
const packs = new Map();
for (const enemy of zone.enemies) {
  if (!enemy.pack || enemy.guard || enemy.type !== 'mob' || enemy.form !== 'normal') continue;
  const list = packs.get(enemy.pack) || [];
  list.push(enemy);
  packs.set(enemy.pack, list);
}
const members = [...packs.values()].find(
  (list) =>
    list.length >= 2 &&
    list.every((e) => e.species === list[0].species) &&
    Math.hypot(list[0].home.x - game.hero.x, list[0].home.y - game.hero.y) > 350,
);
assert(members, 'native Vale ordinary two-enemy pack');
const storage = new Map();
const persistence = Persistence.create({
  Campaign,
  storage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
});
function defeat(enemy, heroParticipated) {
  enemy.hp = 0;
  enemy.heroParticipated = heroParticipated;
  game.kill(enemy);
  assert.equal(enemy.deathPaid, true);
}
let beforeLimit;
let afterLimit;
let pinnedIds = [];
for (let wave = 1; wave <= 984; wave++) {
  for (const enemy of members) {
    assert(enemy.hp > 0);
    defeat(enemy, true);
  }
  const pending = game.s.pending[members[0].species];
  assert(pending && !pending.active);
  game.s.time += 2.1;
  game.updateElites(2.1);
  assert(pending.active);
  const leaders = zone.enemies.filter(
    (enemy) =>
      enemy.form === 'ringleader' &&
      enemy.hp > 0 &&
      enemy.eliteKey === members[0].species,
  );
  assert.equal(leaders.length, 2);
  if (wave === 1) {
    // Real outstanding references are stronger than retirement eligibility.
    game.s.projectiles.push({ sourceId: leaders[0].id });
    game.s.heroTarget = leaders[1].id;
    pinnedIds = leaders.map((enemy) => enemy.id);
  }
  defeat(leaders[0], false);
  if (wave === 1) {
    game.updateElites(0.01);
    assert(pending.active, 'one living leader keeps its entire cohort active');
    assert(zone.enemies.some((enemy) => enemy.id === leaders[0].id));
  }
  defeat(leaders[1], false);
  game.updateElites(0.01);
  assert(!game.s.pending[members[0].species]);
  if (wave === 1) {
    assert(
      pinnedIds.every((id) => zone.enemies.some((enemy) => enemy.id === id)),
      'projectile and hero-target references protect paid corpses',
    );
    game.s.projectiles = [];
    game.s.heroTarget = null;
  }
  if (wave === 2) {
    assert(
      pinnedIds.every((id) => !zone.enemies.some((enemy) => enemy.id === id)),
      'fully released old references retire on the next completed cohort',
    );
  }
  assert(
    zone.enemies.length < 64,
    'repeatable Ringleaders must not accumulate towards the 2,000-record save limit',
  );
  game.s.time += 60;
  game.updatePacks(60);
  assert(members.every((enemy) => enemy.hp > 0));
  if (wave === 30) {
    const restored = Campaign.restore(game.snapshot(), () => 0.2);
    assert.equal(restored.zone().enemies.length, zone.enemies.length);
    assert([...initialIds].every((id) => restored.zone().enemies.some((enemy) => enemy.id === id)));
  }
  if (wave === 983) {
    Campaign.validate(game.snapshot());
    beforeLimit = zone.enemies.length;
    assert(persistence.save(game, {}));
  }
  if (wave === 984) {
    Campaign.validate(game.snapshot());
    afterLimit = zone.enemies.length;
    assert(persistence.save(game, {}), 'v4 persistence succeeds after the formerly failing wave');
  }
}
assert(beforeLimit < 64 && afterLimit < 64, 'population stays bounded across 984 genuine waves');
assert.equal(game.s.statistics.kills, 984 * 4, 'normal enemy and elite kill receipts persist');
assert(game.hero.level >= 2, 'normal earned hero progression is unchanged');
assert(game.s.loot.length > 0, 'uncollected loot remains independent of retired bodies');
assert([...initialIds].every((id) => zone.enemies.some((enemy) => enemy.id === id)));
const durable = JSON.parse(storage.get(Persistence.saveKey('normal')));
assert.equal(durable.zones.vale.enemies.length, afterLimit);
assert.equal(durable.statistics.kills, game.s.statistics.kills);
assert(Campaign.restore(durable, () => 0.2), 'the latest durable v4 primary reloads');

function verifyGuardAndNight(zoneId, species, guard) {
  const c = new Campaign('normal', 'paladin', () => 0.2);
  c.enter(zoneId);
  if (zoneId === 'march') {
    c.s.clock = 500;
    c.updateNight();
  }
  const z = c.zone();
  const originals = z.enemies.filter(
    (enemy) =>
      enemy.species === species &&
      enemy.type === 'mob' &&
      enemy.form === 'normal' &&
      !!enemy.guard === guard,
  ).slice(0, 2);
  assert.equal(originals.length, 2, zoneId + ' has its authored native pair');
  for (const enemy of originals) {
    enemy.hp = 0;
    enemy.heroParticipated = true;
    c.kill(enemy);
  }
  const pending = c.s.pending[species];
  assert(pending, zoneId + ' generated its normal leader cohort');
  c.s.time += 2.1;
  c.updateElites(2.1);
  const leaders = z.enemies.filter(
    (e) => e.form === 'ringleader' && e.hp > 0 && e.eliteKey === species,
  );
  assert.equal(leaders.length, 2);
  for (const leader of leaders) {
    assert.equal(!!leader.guard, guard);
    if (zoneId === 'march') assert.equal(!!leader.nightOnly, true);
    leader.hp = 0;
    c.kill(leader);
  }
  c.updateElites(0.01);
  assert(!c.s.pending[species]);
  assert(leaders.every((leader) => !z.enemies.some((e) => e.id === leader.id)));
  assert(originals.every((enemy) => z.enemies.some((e) => e.id === enemy.id)));
  Campaign.validate(c.snapshot());
  assert(Campaign.restore(c.snapshot(), () => 0.2));
}
verifyGuardAndNight('crypt', 'skeleton', true);
verifyGuardAndNight('march', 'wraith', false);
console.log(
  'PASS #634 native 984-wave bound, live-reference protection, original packs, rewards, dungeon/night leaders and v4 save/restore',
);

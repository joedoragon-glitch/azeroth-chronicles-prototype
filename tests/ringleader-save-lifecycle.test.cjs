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
let overLimit;
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
  for (const enemy of leaders) defeat(enemy, false);
  game.updateElites(0.01);
  assert(!game.s.pending[members[0].species]);
  game.s.time += 60;
  game.updatePacks(60);
  assert(members.every((enemy) => enemy.hp > 0));
  if (wave === 983) {
    Campaign.validate(game.snapshot());
    beforeLimit = zone.enemies.length;
    assert(persistence.save(game, {}));
  }
  if (wave === 984) {
    overLimit = zone.enemies.length;
    assert.throws(() => Campaign.validate(game.snapshot()), /Invalid population/);
    assert.equal(persistence.save(game, {}), false);
  }
}
assert.equal(beforeLimit, 1999);
assert.equal(overLimit, 2001);
assert([...initialIds].every((id) => zone.enemies.some((enemy) => enemy.id === id)));
console.log(
  'BASELINE REPRODUCTION: 984 native repeat waves reach 2001 zone enemy records; v4 save refuses while original 1999-record save remains',
);

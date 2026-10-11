'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const D = Campaign.data;
const R = Campaign.rules;
const crypt = D.bosses.find((b) => b.id === 'crypt');

assert(crypt, 'original crypt boss family remains present');
assert.equal(D.bosses.filter((b) => b.id === 'crypt').length, 1);
assert(!D.bosses.some((b) => /Great Lifekeeper/i.test(b.name)), 'no duplicate boss');
assert.equal(crypt.name, 'Lifebinder');
assert.equal(crypt.region, 'vale');
assert.equal(crypt.kind, 'dungeon');
assert.equal(crypt.place, 'Forest Crypt');
assert.equal(crypt.captive, 'Borin the Village Smith');
assert.equal(crypt.level, 3);
assert.equal(crypt.hp, 650, 'original early-dungeon HP must not inflate');
assert.equal(crypt.damage, 16, 'original early-dungeon damage must not inflate');
assert.equal(crypt.gold, 65);
assert.equal(crypt.xp, 55);
assert(Campaign.dungeonIds.includes('crypt'));
assert.deepEqual(R.attacks.crypt.map((a) => a.kind), ['cone', 'volley', 'summon', 'circle']);
assert.equal(R.attacks.crypt[2].species, 'skeleton', 'incomplete #230 mechanics remain separate');
assert.equal(R.bossSummoning.normalCap, 3);
assert.equal(R.bossSummoning.trueCap, 6);
assert.equal(R.trueBossSummons.families.crypt.species, 'skeleton');
assert(D.species[0].some(([id]) => id === 'skeleton'));
assert(R.nightEnemyCombat.wraith, 'Lantern Wraith remains an independent night combat species');
assert.equal(R.attacks.archive[3].species, 'wraith', 'Keeper wraith behavior remains distinct');

const quest = D.quests[3];
assert.equal(quest[1], 'An Unfinished Retreat');
assert.match(quest[2], /^Defeat Lifebinder; free Borin$/);
assert.deepEqual(quest.slice(3), [45, 137], 'quest reward unchanged');
assert.match(D.regions[0].exploration, /former adventuring companion/);
assert.match(R.dungeonLore.crypt, /winter table/);
assert.match(R.dungeonWorkstations.crypt.context, /BOUND and RELEASED/);

const game = new Campaign('normal', 'paladin', () => 0.87);
assert(game.enter('crypt'));
assert(
  Object.keys(game.s.discovered).some((key) => key.endsWith(':dungeon-lore:crypt')),
  'existing one-time dungeon narration path exposes the estate clue',
);
const normal = game.zone().enemies.find((e) => e.family === 'crypt' && e.type === 'boss');
assert(normal, 'normal Lifebinder remains spawned in the original dungeon');
assert.equal(normal.name, 'Lifebinder');
assert.equal(normal.form, 'normal');
assert.equal(normal.baseHp, 650);
assert.equal(normal.baseDamage, 16);
const trueBoss = game.bossEnemy(crypt, 'true', { x: 1000, y: 1100 });
assert.equal(trueBoss.name, 'TRUE Lifebinder');
assert.equal(trueBoss.form, 'true');
assert.equal(trueBoss.baseHp, Math.round(crypt.hp * 1.8));
assert.equal(trueBoss.baseDamage, crypt.damage * 1.25);

normal.name = 'Crypt Guardian'; // Simulate the live entity stored in an older v4 save.
const stats = {
  hp: normal.hp,
  maxHp: normal.maxHp,
  baseHp: normal.baseHp,
  damage: normal.damage,
  baseDamage: normal.baseDamage,
};
const restored = Campaign.restore(game.snapshot(), () => 0.87);
const loaded = restored.s.zones.crypt.enemies.find(
  (e) => e.family === 'crypt' && e.type === 'boss' && e.form === 'normal',
);
assert(loaded);
assert.equal(loaded.name, 'Lifebinder', 'legacy displayed name migrates on restore');
for (const [key, value] of Object.entries(stats))
  assert.equal(loaded[key], value, 'save import changes no boss stat: ' + key);
for (const key of ['normal', 'true', 'keys', 'rescued', 'victories', 'earlyRoll'])
  assert.deepEqual(restored.s[key], game.s[key], 'save identity is stable: ' + key);

const legacyTrue = new Campaign('normal', 'paladin', () => 0.87);
legacyTrue.enter('crypt');
const prior = legacyTrue.zone().enemies.find((e) => e.family === 'crypt' && e.type === 'boss');
Object.assign(prior, legacyTrue.bossEnemy(crypt, 'true', prior.home));
prior.name = 'Crypt Guardian TRUE';
const revived = Campaign.restore(legacyTrue.snapshot(), () => 0.87);
const loadedTrue = revived.s.zones.crypt.enemies.find(
  (e) => e.family === 'crypt' && e.type === 'boss' && e.form === 'true',
);
assert(loadedTrue);
assert.equal(loadedTrue.name, 'TRUE Lifebinder', 'legacy TRUE entity is renamed in place');
assert.equal(loadedTrue.baseHp, Math.round(crypt.hp * 1.8));
assert.equal(loadedTrue.baseDamage, crypt.damage * 1.25);
console.log('PASS Lifebinder canon, early balance, legacy names, normal/TRUE and save identity');

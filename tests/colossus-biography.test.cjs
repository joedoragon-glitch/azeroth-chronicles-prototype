'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const boss = Campaign.data.bosses.find((b) => b.id === 'mine');
const ridge = Campaign.data.bosses.find((b) => b.id === 'ridge');
const R = Campaign.rules;
const fresh = () => new Campaign('normal', 'paladin', () => 0.9);

assert.equal(boss.kind, 'dungeon');
assert.equal(boss.region, 'highlands');
assert.equal(boss.name, 'Stone Colossus');
assert.equal(boss.captive, 'Dara the Highland Smith');
assert.match(boss.role, /Kharun.*First Wall.*Bastion/);
for (const fact of [
  'Ogre bastion-mason',
  'heartstone',
  'diamond-shaped core',
  'Dark Lord',
  'Crown Peace',
  'Dara',
  'Ridge Tyrant',
  'compulsory shelter',
])
  assert(boss.history.includes(fact), 'biography covers ' + fact);
assert.doesNotMatch(boss.history, /ancient guardian|exposed by.*workings/i);
assert.equal(ridge.role, "The Dark Lord's Master of Coin");
assert.equal(boss.hp, 3200);
assert.equal(boss.damage, 42);
assert.equal(boss.gold, 300);
assert.equal(boss.xp, 375);
assert.equal(boss.attacks.length, 5);
assert.deepEqual(
  R.attacks.mine.map((a) => [a.kind, a.warning, a.recovery]),
  [
    ['circle', 1.6, 2.5],
    ['circle', 1.7, 1.5],
    ['ring', 1.6, 1.6],
    ['line', 1.7, 3],
    ['summon', 1.8, 1.5],
  ],
);
assert.equal(R.attacks.mine[0].opening, 2.5);
assert.equal(R.attacks.mine[3].opening, 3);
assert.equal(R.attacks.mine[3].charge, true);
assert.equal(R.attacks.mine[4].species, 'ogre');
assert.equal(R.tacticalFoundation.rogueSignatures.bosses.mine.effect, 'sweep');
console.log('PASS Colossus identity leaves Ridge authority, attack slots and vulnerability windows intact');

const c = fresh();
assert(c.enter('mine'));
const mineLore = R.dungeonLore.mine;
assert.match(mineLore, /Kharun.*First Wall/);
assert(c.messages.includes(mineLore), 'mine-entry clue is visible to the player');
assert(c.s.discovered['highlands:dungeon-lore:mine'], 'lore is recorded without a schema bump');
const z = c.zone();
assert.equal(z.dungeonVersion, 3);
assert.equal(z.enemies.filter((e) => e.guard).length, 18);
assert.equal(c.traps().length, 18);
assert(z.props.some((p) => p.structure === 'mine-old-markings'));
assert(z.props.some((p) => p.structure === 'ore-sorting-bay'));
const normal = z.enemies.find((e) => e.type === 'boss' && e.family === 'mine');
assert(normal && normal.form === 'normal');
const dara = z.npcs.find((n) => n.family === 'mine' && n.kind === 'cage');
assert(dara);
assert.equal(dara.workstation, 'equipment-repair');
assert.match(dara.context, /diamond seal/);
c.hero.x = dara.x;
c.hero.y = dara.y;
assert.equal(c.interact(dara), false, 'narrative change must not unlock the captive');
assert(c.messages.some((m) => m.includes('diamond seal')));
assert(!c.s.rescued.mine);
assert(!c.s.keys.mine);
const messages = [];
const say = c.say.bind(c);
c.say = (line) => {
  messages.push(line);
  say(line);
};
c.enter('highlands');
c.enter('mine');
assert(!messages.includes(mineLore), 'entry clue should not repeat after discovery');
const old = Campaign.restore(c.snapshot());
assert(old.s.discovered['highlands:dungeon-lore:mine']);
assert(!old.s.rescued.mine);
assert.equal(old.s.keys.mine, undefined);
assert.equal(old.zone().npcs.find((n) => n.family === 'mine').workstation, 'equipment-repair');
assert.equal(old.zone().enemies.filter((e) => e.guard).length, 18);
console.log('PASS player-visible Mine and Dara clues, locked rescue, old-save-compatible first discovery');

for (const phase of ['adventure', 'awakening']) {
  const game = fresh();
  game.s.normal.mine = true;
  game.s.phase = phase;
  if (phase === 'awakening') {
    game.s.awakeningLevel = 21;
    game.s.normal.darklord = true;
    game.s.true.darklord = true;
  }
  game.s.pending.mine = { kind: 'dungeon', count: 1 };
  assert(game.enter('mine'));
  const trueBoss = game.zone().enemies.find((e) => e.family === 'mine' && e.form === 'true');
  assert(trueBoss, phase + ' TRUE Colossus exists under unchanged family');
  assert.equal(trueBoss.family, 'mine');
  game.summonBossAdds(trueBoss, game.trueSummonPlan(trueBoss), game.bossSummonCap(trueBoss));
  const adds = game.zone().enemies.filter((e) => e.owner === trueBoss.id && e.summon);
  assert.equal(adds.length, 6);
  assert(adds.every((e) => e.species === 'ogre'));
  const restored = Campaign.restore(game.snapshot());
  assert(restored.zone().enemies.some((e) => e.family === 'mine' && e.form === 'true'));
}
console.log('PASS early TRUE and Awakening Colossus retain six Ogre warband and save family');

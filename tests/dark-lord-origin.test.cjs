'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const Archive = require('../src/prototype/archive');
const narration = require('../src/prototype/narration');

const pillars = ['crypt', 'archive', 'mine', 'abyss', 'citadel'];
assert.deepEqual(Campaign.dungeonIds, pillars, 'Existing dungeon successor IDs remain unchanged');
assert.deepEqual(
  Campaign.data.regions.map((region) => region.id),
  ['vale', 'march', 'highlands', 'frontier', 'crown'],
  'The story must not add or remove provinces',
);

const ruler = Campaign.data.bosses.find((boss) => boss.id === 'darklord');
assert(ruler && ruler.kind === 'final');
const cryptClue = narration[3];
assert.equal(cryptClue.kind, 'narration', 'Crypt quest retains its existing announcement type');
assert(cryptClue.text.includes('six signatures'));
assert(cryptClue.text.includes('winter home'));
assert(cryptClue.text.includes('forced to build'));
assert(cryptClue.text.length <= 180, 'Existing compact quest card limit is preserved');
assert(Campaign.rules.dungeonLore.abyss.includes('purple dragon'), 'Flight canon is intact');

for (const mode of ['normal', 'nightmare']) {
  const game = new Campaign(mode, 'paladin', () => 0.9);
  const cryptQuest = game.s.quests['quest-3'];
  assert(cryptQuest && !cryptQuest.paid, 'Existing crypt rescue quest has not paid yet');
  cryptQuest.done = true;
  const beforeCrowns = game.hero.gold;
  game.checkQuests();
  assert.equal(cryptQuest.paid, true, 'Lore is an existing quest payoff, not a new gate');
  assert(game.hero.gold >= beforeCrowns, 'Quest economy is unchanged');
  assert.equal(
    game.notices.filter((notice) => notice.text === cryptClue.text).length,
    1,
    "Borin's clue is delivered exactly once through the existing card",
  );
  const saved = Campaign.restore(game.snapshot(), () => 0.9);
  saved.checkQuests();
  assert.equal(saved.s.quests['quest-3'].paid, true);
  assert.equal(
    saved.notices.filter((notice) => notice.text === cryptClue.text).length,
    0,
    'Previously paid quest lore is not replayed after restoring a save',
  );

  const before = JSON.stringify(saved.snapshot());
  const shelves = Archive.sections(saved, { D: Campaign.data, R: Campaign.rules });
  const adversaries = shelves.find((section) => section.title === 'Adversaries and their attacks');
  const entry = adversaries.topics.find(([name]) => name === ruler.name);
  assert(entry, 'Dark Lord history is available via the existing Archive');
  const prose = entry[1];
  assert(prose.includes('five companions'));
  assert(prose.includes('rival peoples could trade'));
  assert(prose.includes('captive labor'));
  assert(prose.includes("'Freedom has a price,'"));
  assert(!/sixth companion|new hero is|must kill to level/i.test(prose));
  assert.equal(JSON.stringify(saved.snapshot()), before, 'Archive lookup is read-only');
}
console.log('PASS #233 story clue in Crypt quest, Keeper Archive, five pillars and save safety');

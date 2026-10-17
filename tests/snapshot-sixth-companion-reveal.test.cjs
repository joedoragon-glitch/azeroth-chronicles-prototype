'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Archive = require('../src/prototype/archive.js');
const topics = (game) => {
  const shelf = Archive.sections(game, { D: Campaign.data, R: Campaign.rules })
    .find((entry) => entry.title === 'The Crown and its institutions');
  assert(shelf);
  return shelf.topics.map(([name]) => name);
};
for (const mode of ['normal', 'nightmare']) {
  for (const cls of ['paladin', 'mage', 'ranger']) {
    const game = new Campaign(mode, cls, () => 0.9);
    assert(game.enter('crown'));
    assert(!game.zone().npcs.some((n) => n.kind === 'throne'));
    assert(!topics(game).some((name) => name.includes('last mark')),
      cls + ' should not learn the reveal from the initial Archive');
    const initialClass = game.hero.class;
    const initialSkills = JSON.stringify(game.hero.skills);
    game.s.true.darklord = true;
    game.s.normal.darklord = true;
    game.awaken();
    const throne = game.zone().npcs.find((n) => n.id === 'dark-crown-throne');
    assert(throne);
    for (const enemy of game.zone().enemies)
      if (enemy.family === 'darklord') enemy.hp = 0;
    Object.assign(game.hero, { x: throne.x + 20, y: throne.y });
    assert(game.interact(throne), cls + ' can claim the throne');
    assert(game.messages.some((message) => message.includes('missing sixth companion')),
      'one concise explicit reveal occurs only after coronation');
    assert(topics(game).some((name) => name.includes('last mark')),
      'the recovered identity is available from the read-only Archive');
    assert.equal(game.hero.class, initialClass);
    assert.equal(JSON.stringify(game.hero.skills), initialSkills);
    const firstCount = game.messages.filter((message) =>
      message.includes('missing sixth companion')).length;
    assert(game.interact(throne), 'revisiting claimed throne is safe');
    assert.equal(game.messages.filter((message) =>
      message.includes('missing sixth companion')).length, firstCount,
      'the reveal does not duplicate on second interaction');
    assert.equal(game.s.version, 4);
  }
}
const rules = Campaign.rules;
assert.equal(rules.dungeonDecor.crypt.length, 40, 'retained Crypt is not removed for false salvage');
const originalCryptKinds = new Set([
  'supply-stack', 'tool-rack', 'torch', 'woodpile', 'coffin', 'ossuary',
  'grave-marker', 'grave-lamp', 'forge', 'weapon-rack', 'sleep-roll',
  'warm-brazier', 'banner', 'game-table', 'caretaker-table',
  'scroll-stack', 'stone-seat',
]);
const currentCryptKinds = new Set(rules.dungeonDecor.crypt.map((r) => r[2]));
for (const kind of originalCryptKinds) assert(currentCryptKinds.has(kind), kind + ' remains active');
assert.equal(rules.supplyRooms.find((r) => r.id === 'supply-vale').count, 2,
  'no third Scornfang cache is permitted');
assert.equal(rules.treasuryDecor['supply-vale'].length, 14,
  'three actual reclamation-work props, not fictitious retired-Crypt artwork, join Treasury');
console.log('PASS six class/mode throne reveal cases and negative Crypt-art provenance guard');

'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const narration = require('../src/prototype/narration');

const dragon = Campaign.data.bosses.find((boss) => boss.id === 'abyss');
assert(dragon, 'Abyss dungeon boss keeps its stable family');
assert.equal(dragon.name, 'Abyss Dragon', 'Public combat identity does not change');
assert.equal(dragon.role, 'Veyrith, Loyal Air Marshal');
assert.match(dragon.history, /purple personal mount/);
assert.equal(dragon.captive, 'Eren the Runewright', 'Eren rescue remains intact');

const firstEntry = Campaign.rules.dungeonLore.abyss;
for (const phrase of [
  'purple dragon is his personal flying mount',
  'future air force',
  'royal launch platform is still being built',
])
  assert(firstEntry.includes(phrase), 'Existing air project lore must remain: ' + phrase);

const clue = narration[20];
assert.equal(clue.kind, 'narration');
assert(clue.text.startsWith('Eren is free. The dragons bred at Abyss Bastion are meant for an army.'));
for (const phrase of ['loyal Air Marshal', 'Veyrith', 'aerial supremacy', 'lasting peace'])
  assert(clue.text.includes(phrase), 'Missing new character clue: ' + phrase);
assert(clue.text.length <= 180, 'Eren quest payoff remains a compact narrative card');
assert(!/prisoner|imprisoned|captive dragon|completed fleet/i.test(firstEntry + clue.text));

const fresh = new Campaign('normal', 'paladin', () => 0.9);
fresh.enter('abyss');
const zone = fresh.zone();
assert.equal(fresh.messages.filter((m) => m === firstEntry).length, 1);
const structures = new Set(zone.props.map((p) => p.structure));
for (const kind of [
  'flight-planning-table',
  'flight-harness-station',
  'egg-cradle',
  'royal-flight-standard',
  'royal-launch-platform',
])
  assert(structures.has(kind), 'Visible Bastion flight project remains: ' + kind);
assert(zone.npcs.some((n) => n.kind === 'cage'), 'Eren remains in the dungeon');
assert(zone.enemies.some((e) => e.type === 'boss' && e.family === 'abyss'));
assert.equal(fresh.traps().length, 18);

const quest = fresh.questDefs().find((q) => q.id === 'quest-20');
assert(quest && quest.name === 'Wings of War', 'Existing specialist rescue quest keeps its identity');
fresh.s.quests[quest.id].done = true;
fresh.checkQuests();
assert.equal(fresh.s.quests[quest.id].paid, true);
assert.equal(fresh.notices.filter((n) => n.text === clue.text).length, 1);
fresh.checkQuests();
assert.equal(fresh.notices.filter((n) => n.text === clue.text).length, 1, 'Rescue cue is once-only');

fresh.enter('frontier');
fresh.enter('abyss');
assert.equal(fresh.messages.filter((m) => m === firstEntry).length, 1, 'Return does not replay first-entry project lore');
const restored = Campaign.restore(fresh.snapshot(), () => 0.9);
restored.enter('abyss');
restored.checkQuests();
assert(!restored.messages.includes(firstEntry), 'Reload preserves original dungeon lore discovery gate');
assert.equal(restored.notices.filter((n) => n.text === clue.text).length, 0, 'Paid Eren clue never replays after reload');

const rules = Campaign.rules;
assert.deepEqual(
  rules.attacks.abyss.map(({ kind, warning, recovery }) => [kind, warning, recovery]),
  [
    ['cone', 1.5, 1.5],
    ['ring', 1.7, 1.6],
    ['circle', 1.8, 2],
    ['summon', 2, 1.6],
  ],
  'No timing or telegraph retuning belongs to the identity change',
);
assert.equal(rules.attacks.abyss[2].count, 2);
assert.equal(rules.attacks.abyss[2].sequential, true);
assert.equal(rules.attacks.abyss[2].landing, true);
assert.equal(rules.attacks.abyss[3].species, 'ashbeast');
assert.deepEqual(rules.bossBehavior.abyss.close, [0, 1]);
assert.deepEqual(rules.bossBehavior.abyss.far, [2]);
assert.equal(rules.bossRecovery.abyss.healFraction, 0.08);
assert.equal(rules.dungeonArchitecture.abyss.version, 1);
console.log('PASS Veyrith rescue clue, original Bastion lore, saved quest/discovery gates, Eren, 18 traps and unchanged normal attack contract');

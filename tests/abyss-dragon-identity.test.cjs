'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');

const dragon = Campaign.data.bosses.find((boss) => boss.id === 'abyss');
assert(dragon, 'Abyss dungeon boss keeps its stable family');
assert.equal(dragon.name, 'Abyss Dragon', 'Public combat identity does not change');
assert.equal(dragon.captive, 'Eren the Runewright', 'Eren rescue remains intact');

const lore = Campaign.rules.dungeonLore.abyss;
for (const phrase of [
  'purple dragon, Veyrith',
  'personal flying mount',
  'already flown together',
  'future air force',
  'royal launch platform is still being built',
  'flight-planning table',
  'claw marks',
  'route home',
]) assert(lore.includes(phrase), 'Missing approved foundation or new character cue: ' + phrase);
assert(!/prisoner|imprisoned|captive dragon|completed fleet/i.test(lore));

const fresh = new Campaign('normal', 'paladin', () => 0.9);
fresh.enter('abyss');
const zone = fresh.zone();
assert.equal(fresh.messages.filter((m) => m === lore).length, 1);
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

fresh.enter('frontier');
fresh.enter('abyss');
assert.equal(fresh.messages.filter((m) => m === lore).length, 1, 'Return does not replay first-visit clue');
const restored = Campaign.restore(fresh.snapshot(), () => 0.9);
restored.enter('abyss');
assert(!restored.messages.includes(lore), 'Reload preserves existing once-only discovery gate');

const rules = Campaign.rules;
assert.deepEqual(
  rules.attacks.abyss.map(({ kind, warning, recovery }) => [kind, warning, recovery]),
  [
    ['cone', 1.5, 1.5],
    ['ring', 1.7, 1.6],
    ['circle', 1.8, 2],
    ['summon', 2, 1.6],
  ],
  'No damage, timing or telegraph retuning belongs to the identity change',
);
assert.equal(rules.attacks.abyss[2].count, 2);
assert.equal(rules.attacks.abyss[2].sequential, true);
assert.equal(rules.attacks.abyss[2].landing, true);
assert.equal(rules.attacks.abyss[3].species, 'ashbeast');
assert.deepEqual(rules.bossBehavior.abyss.close, [0, 1]);
assert.deepEqual(rules.bossBehavior.abyss.far, [2]);
assert.equal(rules.bossRecovery.abyss.healFraction, 0.08);
assert.equal(rules.dungeonArchitecture.abyss.version, 1);
console.log('PASS Veyrith lore, existing-Bastion clue, normal combat contract, Eren, 18 hazards, and saved discovery');

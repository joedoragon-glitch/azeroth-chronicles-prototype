'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');
const Menus = require('../src/prototype/menus.js');

const source = fs.readFileSync(path.join(__dirname, '../src/prototype/menus.js'), 'utf8');
const snippet = source.match(/const questStories = (\[[\s\S]*?\]);\s*\/\/ One first in-person/);
assert(snippet, 'The thirty short bilingual story notes remain in the existing quest menu');
const quests = JSON.parse(snippet[1]);
assert.equal(quests.length, 30);
for (const [i, pair] of quests.entries()) {
  assert.equal(pair.length, 2, 'Quest ' + i + ' has two locales');
  for (const text of pair)
    assert(text.length >= 35 && text.length <= 450, 'Quest ' + i + ' is readable and concise');
}

const clues = {
  thorn: ['patrol', 'patrulla'],
  crypt: ['skeleton', 'esqueletos'],
  mire: ['Direjaw', 'Direjaw'],
  archive: ['Lantern Wraiths', 'Lantern Wraiths'],
  ridge: ['Master of Coin', 'Maestro de la Moneda'],
  mine: ['Garun', 'Garun'],
  warlord: ['Cinder Warlord', 'Cinder Warlord'],
  abyss: ['air force', 'fuerza aérea'],
  cindermaw: ['Dreadmaw', 'Dreadmaw'],
  citadel: ['Garun', 'Garun'],
};

for (const boss of Campaign.data.bosses.filter((b) => b.captive)) {
  const game = new Campaign('normal', 'paladin', () => 0.5);
  game.s.keys[boss.id] = true;
  assert(game.rescue(boss.id), boss.id + ' rescue is available');
  assert(game.enter(boss.region));
  const npc = game.zone().npcs.find((n) => n.id === 'service-' + boss.id);
  assert(npc, boss.id + ' is physically present after rescue');
  Object.assign(game.hero, { x: npc.x, y: npc.y });
  let language = 'en';
  let saves = 0;
  let view;
  const menu = Menus.create({
    getGame: () => game,
    getLanguage: () => language,
    onStoryRead: () => { saves++; },
    Campaign,
    D: Campaign.data,
    action: (label, act, detail, disabled) => ({ label, act, detail, disabled }),
    openMenu: (title, description, actions) => { view = { title, description, actions }; },
    closeMenu() {},
  });
  const openService = (person) =>
    person.kind === 'teacher' ? menu.teacher(person)
      : person.kind === 'smith' ? menu.smith(person) : menu.supplier(person);
  const flag = 'specialist-first-talk:' + boss.id;
  openService({ ...npc });
  assert(!game.s.discovered[flag], 'Remote Barracks access must not consume first in-person meeting');
  openService(npc);
  assert(game.s.discovered[flag], boss.id + ' introduction is recorded');
  assert(view.description.includes(clues[boss.id][0]), boss.id + ' has personal canonical lore');
  assert(view.actions.length, 'Story never blocks normal specialist services');
  const english = view.description;
  assert.equal(saves, 1, 'First physical conversation is saved once');
  openService(npc);
  assert.notEqual(view.description, english, 'Later visits retain the normal service menu');
  assert.equal(saves, 1, 'Second greeting does not consume another flag');

  delete game.s.discovered[flag];
  language = 'es';
  openService(npc);
  assert(view.description.includes(clues[boss.id][1]), boss.id + ' has translated narrative');
  assert.notEqual(view.description, english, 'Translation must not simply repeat English');
  assert.equal(saves, 2);
  const restored = Campaign.restore(game.snapshot());
  assert(restored.s.discovered[flag], 'First-meeting receipt survives a v4 save round-trip');
}
console.log('PASS 30 bilingual quest stories and 10 specialist first-meeting receipts, remote access, repetition and save persistence');

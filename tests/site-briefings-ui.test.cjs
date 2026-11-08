'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Menus = require('../src/prototype/menus.js');
const { shell } = require('./helpers/production-shell.cjs');

const sites = [
  ...Campaign.rules.supplyRooms.map(({ id, region }) => [id, region, 'Enter Treasury']),
  ...Campaign.data.bosses
    .filter(({ kind }) => kind === 'dungeon')
    .map(({ id, region }) => [id, region, 'Enter dungeon']),
  ...Campaign.rules.sideDungeons.map(({ id, region }) => [id, region, 'Go inside']),
];
const game = new Campaign('normal', 'paladin', () => 0.5);
let briefing;
let language = 'en';
let destination;
const catalog = Menus.create({
  getGame: () => game,
  getLanguage: () => language,
  Campaign,
  D: Campaign.data,
  action: (label, action) => ({ label, action }),
  openMenu: (title, description, actions) => (briefing = { title, description, actions }),
  closeMenu() {},
  sceneTransitionTo: (zone, _name, commit) => {
    destination = zone;
    assert(commit());
  },
});
for (const [id, region, label] of sites) {
  assert(game.enter(region));
  const entrance = game.zone().npcs.find((n) => n.family === id && n.kind === 'dungeon');
  assert(entrance, id);
  Object.assign(game.hero, { x: entrance.x, y: entrance.y });
  language = 'en';
  catalog.dungeonEntranceMenu(entrance);
  const english = catalog.siteBriefing(id);
  assert(english && briefing.description.startsWith(english), id);
  assert.equal(briefing.actions[0].label, label);
  assert.equal(briefing.actions.length, label === 'Go inside' ? 1 : 2);
  assert.equal(game.zoneId, region, 'reading stays outside');
  language = 'es';
  catalog.dungeonEntranceMenu(entrance);
  const spanish = catalog.siteBriefing(id);
  assert(spanish && spanish !== english && briefing.description.startsWith(spanish), id);
  briefing.actions[0].action();
  assert.equal(destination, id);
  assert.equal(game.zoneId, id);
}

for (const language of ['en', 'es']) {
  const { scope, elements } = shell(language);
  const game = scope.Prototype.game;
  const lodge = game.zone().props.find((p) => p.id === 'greenwood-thorn-homestead-lodge');
  assert(lodge);
  const approach = game.safe(lodge.x, lodge.y + 80);
  assert(Math.hypot(approach.x - lodge.x, approach.y - lodge.y) < 115);
  Object.assign(game.hero, approach);
  elements.get('touch-interact-button').click();
  assert.equal(elements.get('modal-title').textContent,
    language === 'en' ? "Thornfang's Homestead" : 'Hogar de Thornfang');
  assert(elements.get('modal-description').textContent.includes('Mira'));
}
console.log('PASS all 14 site briefings, native entry actions and bilingual Homestead interaction');

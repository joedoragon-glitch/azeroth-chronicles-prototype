'use strict';
const assert = require('node:assert/strict'),
  Campaign = require('../src/prototype/engine'),
  Menus = require('../src/prototype/menus');
let game = new Campaign(),
  opened,
  backs = 0;
const back = () => {
  backs++;
};
const catalog = Menus.create({
  getGame: () => game,
  Campaign,
  D: Campaign.data,
  action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
  openMenu: (title, description, actions, back) => {
    opened = { title, description, actions, back };
  },
  closeMenu: back,
  recallSquad() {},
  showMap() {},
  finaleMenu() {},
});
game.s.keys.thorn = true;
game.rescue('thorn');
catalog.teacher({ family: 'thorn', name: game.boss('thorn').captive }, back);
const train = opened.actions.find((a) => a.label.startsWith('Train Expedition Skill'));
assert(train && !train.disabled);
assert.equal(opened.back, back);
const original = game,
  before = original.snapshot();
game = new Campaign('nightmare', 'ranger');
game.s.keys.thorn = true;
game.rescue('thorn');
train.action();
assert.equal(game.s.expeditionRank, 2);
assert.deepEqual(
  original.snapshot(),
  before,
  'delayed menu action must use current Campaign, not the old run',
);
assert.equal(opened.back, back);
opened.back();
assert.equal(backs, 1);
catalog.inventory(back);
assert.equal(opened.title, 'Inventory');
assert.equal(opened.back, back);
catalog.partyMenu(back);
assert.equal(opened.title, game.definition().town + ' Captain');
assert.equal(opened.description, '');
assert(opened.actions.some((a) => a.label.includes('Recover fallen companion')));
assert(!opened.actions.some((a) => /Build|Barracks|Construction & resources/i.test(a.label)));
assert.strictEqual(Campaign.classes, Campaign.rules.balance.classes);
assert.strictEqual(Campaign.talentProfiles, Campaign.rules.balance.disciplines.profiles);
assert.strictEqual(Campaign.talentMaxRanks, Campaign.rules.balance.disciplines.maxRanks);
console.log(
  'PASS catalog actions follow the current run, preserve injected Back callbacks and retain public balance aliases',
);

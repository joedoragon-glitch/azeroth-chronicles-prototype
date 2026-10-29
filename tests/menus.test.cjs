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
assert.equal(opened.back, back);
opened.actions.find((a) => a.label.startsWith('Expedition training')).action();
const train = opened.actions.find((a) => a.label.startsWith('Train Expedition Skill'));
assert(train && !train.disabled);
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
opened.back();
assert.equal(opened.back, back);
opened.back();
assert.equal(backs, 1);
catalog.inventory(back);
assert.equal(opened.title, 'Inventory');
assert.equal(opened.back, back);
catalog.partyMenu(back);
assert.equal(opened.title, game.definition().town + ' Captain');
assert.match(opened.description, /Recruit companions, treat party wounds for 30 crowns/);
assert(opened.description.split(/\s+/).length <= 32);
assert(opened.actions.some((a) => a.label.includes('Recover fallen companion')));
assert(!opened.actions.some((a) => /Build|Barracks|Construction & resources/i.test(a.label)));
assert.strictEqual(Campaign.classes, Campaign.rules.balance.classes);
assert.strictEqual(Campaign.talentProfiles, Campaign.rules.balance.disciplines.profiles);
assert.strictEqual(Campaign.talentMaxRanks, Campaign.rules.balance.disciplines.maxRanks);
console.log(
  'PASS catalog actions follow the current run, preserve injected Back callbacks and retain public balance aliases',
);

// A confirmation from another run or an old rank is a refreshed quote, never a purchase.
game.hero.gold = 1000;
catalog.teacher({ family: 'thorn', name: game.boss('thorn').captive }, back);
opened.actions.find((a) => a.label === 'Hero skills').action();
opened.actions.find((a) => a.detail.startsWith('Skill 1 ·')).action();
const quoted = opened.actions[0];
game = new Campaign('normal', 'mage');
game.s.rescued.thorn = true;
game.hero.gold = 1000;
const fresh = game.snapshot();
quoted.action();
assert.deepEqual(game.snapshot(), fresh, 'stale cross-run confirmation only refreshes');
const confirmation = opened.actions[0];
game.hero.gold = 0;
confirmation.action();
assert.equal(game.hero.skills[0], 1);
assert.equal(game.hero.gold, 0);
assert(opened.actions[0].disabled, 'native funds guard and refreshed disabled state');
console.log('PASS instructor confirmations refresh stale campaign quotes and recheck native funds');

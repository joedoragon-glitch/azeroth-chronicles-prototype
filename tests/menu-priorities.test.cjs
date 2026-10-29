'use strict';
const assert = require('node:assert/strict'),
  Campaign = require('../src/prototype/engine'),
  Menus = require('../src/prototype/menus');
const game = new Campaign();
game.hero.gold = 10000;
game.recruit('soldier');
game.recruit('archer');
game.refugeThreat = () => false;
let opened, gathered;
const back = () => {},
  ui = Menus.create({
    getGame: () => game,
    Campaign,
    D: Campaign.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions, onBack) => {
      opened = { title, description, actions, back: onBack };
    },
    closeMenu() {},
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
const b = { id: 'priority-camp', kind: 'barracks', name: 'Barracks', x: 800, y: 800, progress: 4, queue: 0, full: false };
game.zone().buildings.push(b);
const click = (label) => {
  const entry = opened.actions.find((a) => a.label.startsWith(label));
  assert(entry, label + ' missing in ' + opened.title);
  assert(!entry.disabled, label + ' disabled: ' + entry.detail);
  entry.action();
};
const rootLabels = ['Company', 'Recovery', 'Training', 'Operations'];
for (const full of [false, true]) {
  b.full = full;
  game.hero.gold = 10000;
  game.s.expeditionRank = 2;
  const [fallen, wounded] = game.s.party;
  fallen.hp = 0;
  wounded.hp = wounded.maxHp / 2;
  ui.barracksMenu(b, back);
  const title = full ? 'Full Barracks' : 'Basic Barracks';
  assert.equal(opened.title, title);
  assert.equal(opened.back, back);
  assert.deepEqual(
    opened.actions.slice(0, 4).map((a) => a.label),
    rootLabels,
    'Basic and Full expose the same top-level service order',
  );
  assert(!opened.actions.some((a) =>
    /^(Recover fallen companion|Treat wounds|Gather resources|Rescued specialists|Skill journal|Resource expeditions)$/.test(a.label),
  ), 'all detailed services remain inside their appropriate category');
  click('Recovery');
  assert.equal(opened.title, 'Recovery');
  assert(opened.description.includes(full ? 'Local death loss: 5%' : 'Local death loss: 15%'));
  click('Recover fallen companion');
  assert.equal(fallen.hp, fallen.maxHp);
  assert(opened.actions[0].disabled, 'cannot pay twice to recover same companion');
  click('Treat wounds');
  assert.equal(wounded.hp, wounded.maxHp);
  assert(opened.actions[1].disabled, 'cannot pay twice to treat same companions');
  assert(opened.actions.some((a) => /death recovery point/.test(a.label)));
  opened.back();
  assert.equal(opened.title, title);

  click('Training');
  assert.equal(opened.title, 'Training');
  assert(opened.actions.some((a) => a.label.startsWith('Expedition Skill')));
  assert(opened.actions.some((a) => a.label === 'Skill journal'));
  click('Rescued specialists');
  assert.equal(opened.title, 'Rescued specialists');
  opened.back();
  assert.equal(opened.title, 'Training');
  opened.back();
  assert.equal(opened.title, title);

  game.visibleResourceNodes = () => [{ id: 'priority-tribute', name: 'Tribute', amount: 50 }];
  game.hiddenTributeNodes = () => [];
  game.gather = (id) => { gathered = id; };
  click('Operations');
  assert.equal(opened.title, 'Operations');
  assert(opened.actions.some((a) => a.label === 'Local objectives'));
  assert.equal(opened.actions.some((a) => a.label === 'Resource expeditions'), full,
    'remote expeditions are available only at Full Barracks');
  click('Gather resources');
  assert.equal(opened.title, 'Resources & labor');
  click('Recover Dark Lord Tribute');
  assert.equal(gathered, 'priority-tribute');
  opened.back();
  assert.equal(opened.title, 'Operations');
  if (full) {
    click('Resource expeditions');
    assert.equal(opened.title, 'Resource expeditions');
    opened.back();
    assert.equal(opened.title, 'Operations');
  }
  opened.back();
  assert.equal(opened.title, title);

  click('Company');
  assert.equal(opened.title, 'Company');
  assert(!opened.actions.some((a) => a.label === 'Recovery'),
    'no duplicate recovery link inside Company for either Barracks type');
  assert(opened.actions.some((a) => a.label === 'Manage active group'));
  assert(opened.actions.some((a) => a.label === 'Boss pet collection'));
  opened.back();
  assert.equal(opened.title, title);
}
b.full = false;
game.s.expeditionRank = 1;
ui.barracksMenu(b, back);
assert(opened.actions.some((a) => a.label === 'Full Barracks — Expedition 4' && a.disabled),
  'Basic keeps the Expedition 4 upgrade gate');
click('Operations');
assert(opened.actions.some((a) => a.label === 'Gather resources' && a.disabled),
  'gathering keeps its Expedition 2 prerequisite');
b.full = true;
game.s.challenge.succession = true;
ui.barracksMenu(b, back);
click('Recovery');
assert(opened.description.includes('class loss replaces crown loss'),
  'Full preserves Succession death recovery contract');
assert(!opened.actions.some((a) => /death recovery/.test(a.label)),
  'Succession does not offer a normal death recovery point');
console.log('PASS Basic/Full Barracks matching roots, service navigation, care, training, operations, remote expeditions, upgrades and Succession gates');

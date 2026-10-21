'use strict';
const assert = require('node:assert/strict'),
  Campaign = require('../src/prototype/engine'),
  Menus = require('../src/prototype/menus');
const game = new Campaign();
game.hero.gold = 10000;
game.recruit('soldier');
game.recruit('archer');
game.refugeThreat = () => false;
let opened,
  closed = 0,
  gathered;
const back = () => {},
  ui = Menus.create({
    getGame: () => game,
    Campaign,
    D: Campaign.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions, back) => {
      opened = { title, description, actions, back };
    },
    closeMenu: () => closed++,
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
const b = { id: 'priority-camp', x: 800, y: 800, progress: 4, queue: 0, full: false };
game.zone().buildings.push(b);
for (const full of [false, true]) {
  b.full = full;
  game.hero.gold = 10000;
  const [fallen, wounded] = game.s.party;
  fallen.hp = 0;
  wounded.hp = wounded.maxHp / 2;
  game.s.expeditionRank = 2;
  ui.barracksMenu(b, back);
  assert.deepEqual(
    opened.actions.slice(0, 4).map((a) => a.label.split(' · ')[0]),
    [
      'Recover fallen companion',
      'Treat wounded companions',
      'Gather resources',
      'Rescued specialists',
    ],
  );
  assert.equal(opened.back, back);
  assert(!opened.actions[0].disabled);
  opened.actions[0].action();
  assert.equal(fallen.hp, fallen.maxHp);
  assert(opened.actions[0].disabled);
  assert(!opened.actions[1].disabled);
  opened.actions[1].action();
  assert.equal(wounded.hp, wounded.maxHp);
  assert(opened.actions[1].disabled);
  game.visibleResourceNodes = () => [{ id: 'priority-tribute', name: 'Tribute', amount: 50 }];
  game.hiddenTributeNodes = () => [];
  game.gather = (id) => {
    gathered = id;
  };
  opened.actions[2].action();
  assert.equal(opened.title, 'Resources & labor');
  opened.actions[0].action();
  assert.equal(gathered, 'priority-tribute');
  opened.back();
  assert.equal(opened.title, full ? 'Full Barracks' : 'Basic Barracks');
  opened.actions[3].action();
  assert.equal(opened.title, 'Rescued specialists');
  opened.back();
  assert.equal(opened.title, full ? 'Full Barracks' : 'Basic Barracks');
}
assert.equal(closed, 2);
game.s.expeditionRank = 1;
ui.barracksMenu(b, back);
assert(opened.actions[2].disabled, 'gather shortcut preserves Expedition 2 requirement');
console.log(
  'PASS Basic/Full Barracks priorities, recovery/healing refresh, gathering and specialist navigation',
);

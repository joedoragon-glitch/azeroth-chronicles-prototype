'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Menus = require('../src/prototype/menus.js');

const c = new Campaign('normal', 'paladin', () => 0.9);
c.hero.gold = 500;
const startHp = c.hero.maxHp;
let opened;
const menus = Menus.create({
  getGame: () => c,
  Campaign,
  D: Campaign.data,
  action: (label, action, detail = '', disabled = false) => ({
    label,
    action,
    detail,
    disabled,
  }),
  openMenu: (title, description, actions, back) => {
    opened = { title, description, actions, back };
  },
  closeMenu() {},
  recallSquad() {},
  showMap() {},
  finaleMenu() {},
});
const choose = (label) => {
  const item = opened.actions.find((a) => a.label.includes(label));
  assert(item, 'Missing menu action: ' + label + ' in ' + opened.title);
  assert.equal(item.disabled, false, label + ' is enabled');
  item.action();
};
const b = (() => {
  assert(c.build(), 'free starter barracks exists');
  const building = c.zone().buildings.at(-1);
  building.progress = 4;
  return building;
})();
menus.barracksMenu(b);
assert(!opened.actions.some((a) => a.label.includes('Preparation Tonic')));
assert(!c.purchasePreparationTonic(), 'Neri must be rescued to sell tonics');

c.s.rescued.archive = true;
menus.supplier({ kind: 'alchemist', family: 'archive', name: 'Neri the Alchemist' });
assert(opened.actions.some((a) => a.label.includes('Buy Preparation Tonic')));
assert(opened.description.includes('sells Preparation Tonics'));
choose('Buy Preparation Tonic');
assert.equal(c.hero.gold, 430);
assert.equal(c.preparationTonicStock(), 1);
assert.equal(c.hero.tonic, false, 'NPC sale stores tonic without applying buff');
assert(opened.actions.some((a) => a.detail.includes('Owned 1')));
const stockSaved = Campaign.restore(c.snapshot());
assert.equal(stockSaved.preparationTonicStock(), 1, 'inventory survives reload');

menus.barracksMenu(b);
choose('Use Preparation Tonic');
assert.equal(c.preparationTonicStock(), 0, 'using consumes one');
assert.equal(c.hero.maxHp, startHp + Math.ceil(startHp * 0.1));
assert(c.hero.tonic, 'use actually applies tonic');
assert.equal(c.hero.gold, 430, 'using a stored tonic does not charge again');
assert(opened.actions.some((a) => a.label.includes('Preparation Tonic · ACTIVE')));
assert(!c.usePreparationTonic(), 'cannot stack active tonics');

const rest = c.zone().npcs.find((n) => n.kind === 'rest');
c.zone().enemies.forEach((e) => {
  e.aggro = false;
});
Object.assign(c.hero, { x: rest.x, y: rest.y });
assert(c.rest(), 'rest works');
assert(!c.hero.tonic && c.hero.maxHp === startHp, 'rest expires tonic');
menus.barracksMenu(b);
choose('Preparation Tonic · Buy / Use');
assert.equal(opened.title, 'Preparation Tonic');
assert(opened.actions.some((a) => a.label.includes('Buy and use')));
const before = c.hero.gold;
choose('Buy and use');
assert.equal(c.hero.gold, before - 70, 'purchase from barracks charges once');
assert.equal(c.preparationTonicStock(), 0);
assert(c.hero.tonic, 'barracks offers buy-and-use directly');
assert(opened.actions.some((a) => a.label.includes('Preparation Tonic · ACTIVE')));

c.hero.tonicStock = 2;
c.s.challenge = { succession: true, fallen: ['paladin'], pending: true, gameOver: false };
assert(c.successor('mage'), 'succession still works');
assert.equal(c.preparationTonicStock(), 2, 'successor inherits owned tonic stock');
assert(!c.hero.tonic, 'active buff is not carried to new hero');

const legacy = c.snapshot();
delete legacy.hero.tonicStock;
const restoredLegacy = Campaign.restore(legacy);
assert.equal(restoredLegacy.preparationTonicStock(), 0, 'older save without tonicStock works');
assert.equal(restoredLegacy.successor('paladin'), false, 'no accidental succession from a restored run');
const invalid = c.snapshot();
invalid.hero.tonicStock = -1;
assert.throws(() => Campaign.restore(invalid), /Invalid preparation tonic stock/);

const c2 = new Campaign();
c2.s.rescued.archive = true;
c2.hero.gold = 0;
assert(!c2.purchasePreparationTonic(), 'insufficient funds do not add stock');
assert.equal(c2.preparationTonicStock(), 0);
console.log('PASS Neri stock purchases, one-click Barracks buy/use, persistence, rest and Succession');

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Campaign = require('../src/prototype/engine.js');
const Menus = require('../src/prototype/menus.js');

function menuFor(c) {
  let opened;
  const notices = [];
  const m = Menus.create({
    getGame: () => c,
    Campaign,
    D: Campaign.data,
    action: (label, action, detail = '', disabled = false) => ({
      label,
      action,
      detail,
      disabled,
    }),
    openMenu: (title, description, actions) => {
      opened = { title, description, actions };
    },
    status: (text) => notices.push(text),
    closeMenu() {},
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  return { m, current: () => opened, notices };
}
function select(view, prefix) {
  const entry = view.current().actions.find((a) => a.label.startsWith(prefix));
  assert(entry && !entry.disabled, prefix + ' must be usable');
  entry.action();
}

for (const mode of ['normal', 'nightmare']) {
  const c = new Campaign(mode, 'paladin', () => 0.9);
  c.s.rescued.crypt = true;
  c.hero.gold = 2000;
  const ui = menuFor(c);
  ui.m.smith({ family: 'crypt', name: 'Borin' });
  select(ui, 'Weapon tier 1');
  assert.equal(c.hero.weapon, 1, 'purchased weapon tier becomes active');
  assert.equal(ui.notices.at(-1), 'Weapon tier 1 equipped.');
  select(ui, 'Armor tier 1');
  assert.equal(c.hero.armorTier, 1, 'purchased armor tier becomes active');
  assert.equal(ui.notices.at(-1), 'Armor tier 1 equipped.');
}
const legacy = new Campaign('normal', 'paladin', () => 0.9);
legacy.s.rescued.crypt = true;
legacy.s.legacyInventory = ['Arma de las Cumbres'];
legacy.hero.gold = 2000;
const view = menuFor(legacy);
view.m.smith({ family: 'crypt', name: 'Borin' });
select(view, 'Weapon tier 1');
assert(legacy.hero.legacyEquipped, 'better owned legacy weapon stays active');
assert.equal(view.notices.at(-1), 'Weapon bought · stronger one stays equipped.');
view.m.inventory();
select(view, 'Equip Arma de las Cumbres');
assert.equal(view.notices.at(-1), 'Arma de las Cumbres equipped.');
select(view, 'Equip current weapon tier 1');
assert.equal(view.notices.at(-1), 'Weapon tier 1 equipped.');
const app = fs.readFileSync(require.resolve('../src/prototype/app.js'), 'utf8');
assert(app.includes('PrototypeRules.resourceMode?.manaEnabled !== false'),
  'insufficient MP feedback returns automatically with the saved MP mode flag');
assert(app.includes('manaStatus('), 'both normal and charged MP errors use the same guard');
assert(app.includes("type === 'mana' && game.hasSupportEffect(h, 'mana')"),
  'restored Mana Recovery button detects an effect in progress');
assert(app.includes("? 'Restoring'"),
  'restored Mana Recovery button advertises ongoing restoration');
assert(!app.includes('charge canceled safely'), 'routine charge cancellation is quiet');
assert(!app.includes('Training point available · press '), 'duplicate level-up status is removed');
assert(app.includes('Defeat ') && app.includes('before freeing '),
  'premature captive interaction prompts boss defeat');
assert(app.includes('Cannot rest during combat.'), 'failed resting remains actionable');
assert(app.includes('Clear the guards first.'), 'guarded Treasury remains actionable');
console.log('PASS short status failures, truthful auto-equipping, and reversible MP feedback');

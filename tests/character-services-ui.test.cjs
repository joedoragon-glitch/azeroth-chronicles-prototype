'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const Menus = require('../src/prototype/menus');
const { shell } = require('./helpers/production-shell.cjs');

for (const language of ['en', 'es']) {
  const { scope, elements } = shell(language);
  const game = scope.Prototype.game;
  const before = JSON.stringify(game.snapshot());
  const text = (en, es) => language === 'en' ? en : es;
  const catalog = Menus.create({
    getGame: () => game,
    Campaign,
    D: Campaign.data,
    action: (label, fn, detail = '', disabled = false) => ({
      label, action: fn, detail, disabled,
    }),
    openMenu: (title, description, actions, back) => {
      // Render the real catalog against the production dialog and translator.
      scope.Prototype.openMenu(title, description, actions, back);
    },
    closeMenu: () => scope.Prototype.closeMenu(),
    requestName: () => {},
    showMap() {},
    finaleMenu() {},
  });
  const entries = () => elements.get('modal-actions').children;
  const sections = () => entries().filter((x) => x.className === 'menu-section');
  const buttons = () => entries().filter((x) => x.className !== 'menu-section');
  const sectionLabels = () => sections().map((x) => x.textContent);
  const findButton = (prefix) => {
    const found = buttons().find((x) => x.textContent.startsWith(prefix));
    assert(found, 'Missing ' + prefix);
    return found;
  };
  const shop = { kind: 'smith', family: 'thorn', name: 'Test Forge' };
  const tier = Campaign.rules.balance.equipment.tiers.thorn;
  game.hero.gold = 0;
  catalog.smith(shop);
  assert.deepEqual(sectionLabels(), [
    text('Equipment upgrades', 'Mejoras de equipo'),
    text('Reforging', 'Reforja'),
    text('Appearance', 'Apariencia'),
  ]);
  assert.equal(findButton('Weapon tier ' + tier).disabled, true);
  assert.equal(findButton('Armor tier ' + tier).disabled, true);
  assert.equal(findButton('Reforge weapon').disabled, true);
  assert.equal(findButton('Reforge armor').disabled, true);
  assert(findButton('Name weapon'));
  assert(findButton('Name armor'));
  const smithCount = buttons().length;
  assert.equal(smithCount, 6, 'same six native equipment/name actions when support is not unlocked');
  scope.Prototype.closeMenu();

  const neri = { name: 'Neri', kind: 'alchemist', family: 'archive' };
  catalog.supplier(neri);
  assert.deepEqual(sectionLabels(), [
    text('Preparation Tonics', 'Tónicos de preparación'),
    text('Ranger support', 'Apoyo del Ranger'),
    text('Training and resets', 'Entrenamiento y reinicios'),
  ]);
  assert.equal(findButton('Buy Preparation Tonic').disabled, true, 'unaffordable tonic is gated');
  assert.equal(findButton('Upgrade Ranger Heal').disabled, true, 'unaffordable support is gated');
  assert(findButton('Train Companion Vitality'));
  assert(findButton('Reset discipline training'));
  assert(!buttons().some((node) => node.className === 'menu-setting'), 'no changes to purchase widgets');
  scope.Prototype.closeMenu();

  game.hero.gold = 100000;
  catalog.supplier(neri);
  assert.equal(findButton('Buy Preparation Tonic').disabled, false);
  assert.equal(findButton('Upgrade Ranger Heal').disabled, false);
  scope.Prototype.closeMenu();
  game.hero.gold = 0;
  assert.equal(JSON.stringify(game.snapshot()), before, 'catalog viewing changes no campaign state');
}
console.log('PASS bilingual smith/alchemist groups, native action availability, and read-only navigation');

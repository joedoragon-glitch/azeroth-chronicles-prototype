'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const Menus = require('../src/prototype/menus');
const { shell } = require('./helpers/production-shell.cjs');

for (const language of ['en', 'es']) {
  const { scope, elements } = shell(language);
  const game = scope.Prototype.game;
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
  const shop = { kind: 'smith', family: 'crypt', name: 'Test Forge' };
  const tier = Campaign.rules.balance.equipment.tiers.crypt;
  game.hero.gold = 0;
  const before = JSON.stringify(game.snapshot());
  catalog.smith(shop);
  assert.deepEqual(sectionLabels().slice(0, 3), [
    text('Equipment upgrades', 'Mejoras de equipo'),
    text('Reforging', 'Reforja'),
    text('Appearance', 'Apariencia'),
  ]);
  if (sectionLabels().length > 3)
    assert.deepEqual(sectionLabels().slice(3), [
      text('Expedition support', 'Apoyo de Expedición'),
    ], 'existing optional Expedition training remains visible at this smith');
  assert.equal(findButton('Weapon tier ' + tier).disabled, true);
  assert.equal(findButton('Armor tier ' + tier).disabled, true);
  assert.equal(findButton('Reforge weapon').disabled, true);
  assert.equal(findButton('Reforge armor').disabled, true);
  assert(findButton('Name weapon'));
  assert(findButton('Name armor'));
  const smithCount = buttons().length;
  assert(smithCount >= 6, 'all six native equipment and naming actions remain reachable');
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
  const trainingStart = entries().findIndex(
    (node) => node.className === 'menu-section' &&
      node.textContent === text('Training and resets', 'Entrenamiento y reinicios'),
  );
  const trainingActions = entries().slice(trainingStart + 1);
  assert.equal(trainingActions.length, 2, 'vitality and discipline reset remain in their group');
  assert(trainingActions.every((node) => typeof node.onclick === 'function'));
  assert(trainingActions[0].disabled, 'unaffordable vitality training stays disabled');
  assert(trainingActions[1].disabled, 'zero spent talents keep reset unavailable');
  assert(!buttons().some((node) => node.className === 'menu-setting'), 'no changes to purchase widgets');
  scope.Prototype.closeMenu();

  game.hero.gold = 100000;
  catalog.supplier(neri);
  assert.equal(findButton('Buy Preparation Tonic').disabled, false);
  assert.equal(findButton('Upgrade Ranger Heal').disabled, false);
  scope.Prototype.closeMenu();
  game.hero.gold = 0;
  const after = JSON.stringify(game.snapshot());
  if (after !== before) {
    const was = JSON.parse(before), now = JSON.parse(after);
    const changed = Object.keys(was).filter((key) =>
      JSON.stringify(was[key]) !== JSON.stringify(now[key]));
    assert.deepEqual(changed.filter((key) => key !== 'hero'), [],
      'inspection must not mutate nonhero campaign state');
    const heroChanges = Object.keys(was.hero).filter((key) =>
      JSON.stringify(was.hero[key]) !== JSON.stringify(now.hero[key]));
    assert.deepEqual(heroChanges.filter((key) => !['order', 'path'].includes(key)), [],
      'inspection may clear movement input but cannot change hero equipment, currency or progression: ' +
        heroChanges.join(', '));
  }
}
console.log('PASS bilingual smith/alchemist groups, native action availability, and read-only navigation');

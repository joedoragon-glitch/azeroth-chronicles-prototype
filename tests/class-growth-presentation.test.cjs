'use strict';
// Read-only class education through the existing class choice and Character menus.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Campaign = require('../src/prototype/engine');

const source = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
function section(begin, end) {
  const from = source.indexOf('  function ' + begin + '(');
  assert(from >= 0, 'Missing ' + begin);
  const to = source.indexOf('  function ' + end + '(', from + 1);
  assert(to > from, 'Missing boundary ' + end);
  return source.slice(from, to);
}
const growth = section('classGrowthLine', 'chooseClass');
const choices = section('chooseClass', 'awakeningChecklist');
const character = section('characterMenu', 'saveMenu');
const action = (label, callback, detail = '') => ({ label, callback, detail });

function menu(code, language, heroClass = 'paladin', prepare = () => {}) {
  const game = new Campaign('normal', heroClass, () => 0.9);
  prepare(game);
  const before = game.snapshot();
  let shown;
  vm.runInNewContext(growth + code, {
    Campaign,
    language,
    game,
    openMenu: (title, description, actions) => { shown = { title, description, actions }; },
    action,
    openMain() {},
    inventory() {},
    skillBook() {},
    talents() {},
    combatDiagnosticsEnabled: false,
    developerEnabled: false,
  });
  assert(shown, 'Expected native menu to open');
  assert.deepEqual(game.snapshot(), before, 'looking at class growth must not mutate the campaign');
  return shown;
}

const startPaladin = menu(character + '\ncharacterMenu();', 'en');
assert.equal(startPaladin.title, 'Character');
assert.match(startPaladin.description, /Max HP 125 · Power 18 · Armor 8/);
assert.match(startPaladin.description, /Speed 300 · Cooldown reduction 0%/);
assert.match(startPaladin.description, /Damage blocked\/Armor 0\.36/);
assert.match(startPaladin.description, /Fortitude: \+5 max HP and \+0\.01/);
assert.equal(startPaladin.actions.length, 3, 'no extra action or submenu');
assert.deepEqual(startPaladin.actions.map(a => a.label), [
  'Inventory and support', 'Skill journal', 'Talents',
]);

const highRanger = menu(character + '\ncharacterMenu();', 'en', 'ranger', (g) => {
  while (g.hero.level < 15) g.xp(g.xpRequired());
  g.hero.talents[1] = 5;
  g.hero.talents[3] = 3;
});
assert.match(highRanger.description, /Speed 488 · Cooldown reduction 35%/);
assert.match(highRanger.description, /Agility: \+3 movement speed and \+1%/);

const highMage = menu(character + '\ncharacterMenu();', 'en', 'mage', (g) => {
  while (g.hero.level < 15) g.xp(g.xpRequired());
  g.hero.weapon = 4;
  g.hero.talents[0] = 5;
});
assert.match(highMage.description, /Power 167/);
assert.match(highMage.description, /Arcane Power: \+2 Power per level/);

const cappedRanger = menu(character + '\ncharacterMenu();', 'en', 'ranger', (g) => {
  g.hero.level = 100;
  g.hero.talents[1] = 5;
});
assert.match(cappedRanger.description, /Cooldown reduction 60%/, 'show effective capped CDR');

for (const [cls, localized] of [
  ['paladin', /Fortaleza: \+5 PV máximos/],
  ['ranger', /Agilidad: \+3 de velocidad/],
  ['mage', /Poder arcano: \+2 de poder/],
]) {
  const view = menu(character + '\ncharacterMenu();', 'es', cls);
  assert.match(view.description, localized);
  assert.match(view.description, /PV máximos .* · Poder .* · Armadura /);
  assert.match(view.description, /Velocidad .* · Reducción de recuperación /);
}
for (const lang of ['en', 'es']) {
  const view = menu(choices + "\nchooseClass('normal', false);", lang);
  assert.equal(view.actions.length, 3);
  for (const [index, name] of (lang === 'en'
    ? [[0, 'Fortitude'], [1, 'Arcane Power'], [2, 'Agility']]
    : [[0, 'Fortaleza'], [1, 'Poder arcano'], [2, 'Agilidad']]))
    assert(view.actions[index].detail.includes(name), lang + ' ' + name + ' discoverable at selection');
}
for (const [cls, name] of [
  ['paladin', 'Fortitude'],
  ['ranger', 'Agility'],
  ['mage', 'Arcane Power'],
]) {
  const g = new Campaign('normal', cls, () => 0.9);
  g.xp(g.xpRequired());
  assert(g.messages.some((m) => m.includes(name + ' improved.')), name + ' mentioned on level-up');
}
console.log('PASS class selection growth, live Character stats, bilingual UI and level-up cue');

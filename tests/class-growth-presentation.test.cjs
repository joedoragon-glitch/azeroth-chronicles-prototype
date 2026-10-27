'use strict';
// Class discovery and live, read-only stats: test native menu functions and shell markup.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Campaign = require('../src/prototype/engine');
const { shell } = require('./helpers/production-shell.cjs');

const source = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
function section(begin, end) {
  const from = source.indexOf('  function ' + begin + '(');
  const to = source.indexOf('  function ' + end + '(', from + 1);
  assert(from >= 0 && to > from, 'Missing function boundary: ' + begin);
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
    Campaign, language, game,
    openMenu: (title, description, actions, back, options) => {
      shown = { title, description, actions, options };
    },
    action,
    openMain() {},
    inventory() {},
    skillBook() {},
    talents() {},
    appendNameField() {},
    combatDiagnosticsEnabled: false,
    developerEnabled: false,
  });
  assert(shown, 'Expected native menu to open');
  assert.deepEqual(game.snapshot(), before, 'reading class growth must not mutate the campaign');
  return shown;
}
const rowsOf = (view) => Object.fromEntries(
  Array.from(view.description.sections[1].rows, (row) => [row.label, row.value])
);
const first = menu(character + '\ncharacterMenu();', 'en');
assert.equal(first.options.view, 'character');
assert.match(first.description.summary, /Paladin · Level 1\nXP 0 \/ 120/);
assert.equal(first.description.sections.length, 2, 'growth and numbers share one page');
assert.equal(first.description.sections[0].title, 'Class growth');
assert.match(first.description.sections[0].text, /Fortitude · Each level: \+5 max HP and \+0\.01/);
assert.equal(first.description.sections[1].title, 'Current stats');
assert.deepEqual(rowsOf(first), {
  'Max HP': '125', 'Power': '18', 'Armor': '8', 'Speed': '300',
  'Cooldown reduction': '0%', 'Critical chance': '10%', 'Blocked per Armor point': '0.36 damage',
});
assert.deepEqual(Array.from(first.actions, (a) => a.label), [
  'Name your hero', 'Inventory and support', 'Skill journal', 'Talents',
], 'existing actions only');

const ranger = menu(character + '\ncharacterMenu();', 'en', 'ranger', (g) => {
  while (g.hero.level < 15) g.xp(g.xpRequired());
  g.hero.talents[1] = 5;
  g.hero.talents[3] = 3;
});
assert.equal(rowsOf(ranger).Speed, '488');
assert.equal(rowsOf(ranger)['Cooldown reduction'], '35%');
assert.match(ranger.description.sections[0].text, /Agility · Each level: \+3 speed/);
const mage = menu(character + '\ncharacterMenu();', 'en', 'mage', (g) => {
  while (g.hero.level < 15) g.xp(g.xpRequired());
  g.hero.weapon = 4;
  g.hero.talents[0] = 5;
});
assert.equal(rowsOf(mage).Power, '167', 'effective Power includes gear and training');
assert.match(mage.description.sections[0].text, /Arcane Power · Each level: \+2 Power/);
const capped = menu(character + '\ncharacterMenu();', 'en', 'ranger', (g) => {
  g.hero.level = 100;
  g.hero.talents[1] = 5;
});
assert.equal(rowsOf(capped)['Cooldown reduction'], '60%', 'display capped total, not raw sum');
for (const [cls, expected] of [
  ['paladin', /Fortaleza · Cada nivel: \+5 PV máximos/],
  ['ranger', /Agilidad · Cada nivel: \+3 de velocidad/],
  ['mage', /Poder arcano · Cada nivel: \+2 de poder/],
]) {
  const view = menu(character + '\ncharacterMenu();', 'es', cls);
  assert.match(view.description.sections[0].text, expected);
  assert.equal(view.description.sections[0].title, 'Crecimiento de clase');
  const numbers = rowsOf(view);
  assert(numbers['PV máximos'] && numbers.Poder && numbers.Armadura);
  assert(numbers.Velocidad && numbers['Reducción de recuperación']);
}
for (const lang of ['en', 'es']) {
  const view = menu(choices + "\nchooseClass('normal', false);", lang);
  assert.equal(view.options.view, 'class-select');
  assert.equal(view.actions.length, 3);
  assert.match(view.description, lang === 'en' ? /level 1/ : /nivel 1/);
  for (const [index, name] of (lang === 'en'
    ? [[0, 'Fortitude'], [1, 'Arcane Power'], [2, 'Agility']]
    : [[0, 'Fortaleza'], [1, 'Poder arcano'], [2, 'Agilidad']])) {
    const [role, growth] = view.actions[index].detail.split('\n');
    assert(role.length > 8 && growth.includes(name), 'two-line ' + lang + ' choice: ' + name);
  }
}
for (const [cls, name] of [['paladin', 'Fortitude'], ['ranger', 'Agility'], ['mage', 'Arcane Power']]) {
  const g = new Campaign('normal', cls, () => 0.9);
  g.xp(g.xpRequired());
  assert(g.messages.some((m) => m.includes(name + ' improved.')), 'level-up cue: ' + name);
}

// Verify the production menu renderer creates semantic sections and preserves click actions.
for (const lang of ['en', 'es']) {
  const { elements: e } = shell(lang);
  e.get('menu-button').click();
  const pick = (label) => e.get('modal-actions').children.find((item) => item.textContent === label);
  pick(lang === 'en' ? 'Character' : 'Personaje').click();
  const host = e.get('modal-description');
  assert.equal(e.get('modal').getAttribute('data-view'), 'character');
  assert(host.classList.contains('skill-reference'), 'reuse semantic description renderer');
  assert.equal(host.children.length, 2, 'growth and current stats have separate sections');
  assert.equal(host.children[0].children[0].textContent,
    lang === 'en' ? 'Class growth' : 'Crecimiento de clase');
  assert.equal(host.children[1].children[0].textContent,
    lang === 'en' ? 'Current stats' : 'Atributos actuales');
  assert.equal(host.children[1].children[1].children.length, 14, 'seven stat label/value pairs');
  assert(pick(lang === 'en' ? 'Skill journal' : 'Diario de habilidades'),
    'original Character actions remain available');
}
const css = fs.readFileSync(path.join(__dirname, '../styles/prototype.css'), 'utf8');
const phoneCss = fs.readFileSync(path.join(__dirname, '../styles/phone.css'), 'utf8');
assert(css.includes("#modal[data-view='class-select'] #modal-actions .class-growth"));
assert(css.includes("#modal[data-view='character'] #modal-description.skill-reference dl"));
assert(phoneCss.includes("body[data-experience='phone'] #modal[data-view='class-select']"));
assert(phoneCss.includes("body[data-experience='phone'] #modal[data-view='character']"));
console.log('PASS class growth discovery, live bilingual stats, compact semantic menus, actions and style contracts');

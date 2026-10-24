'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const A = require('../src/prototype/archive.js');
const Approved = require('../src/prototype/narration.js').approved;
const { shell } = require('./helpers/production-shell.cjs');
const game = new C('normal', 'paladin', () => 0.93);
const base = JSON.stringify(game.snapshot());
const originalPact = game.s.keeperPact;
const originalEvidence = game.s.keeperEvidence;
let sections = A.sections(game, { D: C.data, R: C.rules });
const baseline = sections.map((s) => ({ title: s.title, count: s.topics.length }));
assert.equal(baseline.length, 8);
assert(!sections.some((s) => s.title === 'The orders among the shelves'));
game.s.keeperPact = true;
assert.equal(A.sections(game, { D: C.data, R: C.rules }).length, 8,
  'Keeper pact alone never enables the historical accusation');
game.s.keeperEvidence = true;
sections = A.sections(game, { D: C.data, R: C.rules });
assert.equal(sections.length, 9, 'Signed ledger alone enables ninth bookshelf');
assert.equal(sections[8].topics[0][1], Approved.P05.en);
if (originalEvidence === undefined) delete game.s.keeperEvidence;
else game.s.keeperEvidence = originalEvidence;
if (originalPact === undefined) delete game.s.keeperPact;
else game.s.keeperPact = originalPact;
assert.equal(A.sections(game, { D: C.data, R: C.rules }).length, 8);
assert.equal(A.translateArchive(Approved.P05.es), Approved.P05.es,
  'Approved Spanish prose is immutable even with the technical glossary');
assert.equal(A.translateArchive(Approved.K03.es), Approved.K03.es);
for (const id of ['D04', 'P05', 'K03', 'K10', 'R05', 'M01']) {
  const original = Approved[id].es;
  assert.equal(A.translateArchive(original), original,
    id + ' exact approved Spanish cannot be changed by technical labels');
}
const mixed = Approved.K03.es + '\nSupport — heals 12.5% of max HP.';
const mixedLocalized = A.translateArchive(mixed);
assert(mixedLocalized.startsWith(Approved.K03.es),
  'A bilingual Archive answer protects its complete approved paragraph');
assert(mixedLocalized.includes('12.5%'),
  'Mixed technical material preserves the live numeric value');
for (const label of ['Return to the answer', 'Show me the figures',
  'Another question', 'All shelves']) {
  const translated = A.translateArchiveLabel(label);
  assert(translated !== label && !/^(Return|Show|Another|All) /.test(translated),
    'Archive navigation controls have complete Spanish labels: ' + label);
}
const encounters = sections.find((entry) =>
  entry.title === 'Adversaries and their attacks').topics;
const trueOverview = encounters.find(([name]) => name === 'The TRUE adversaries')[1];
assert(A.translateArchive(trueOverview).startsWith('Los tiranos de campo'),
  'The complete TRUE encounter overview is available in Spanish');
const rogueOverview = sections.find((entry) =>
  entry.title === 'Battle and protection').topics
  .find(([name]) => name === 'Enemies under pressure')[1];
assert(A.translateArchive(rogueOverview).startsWith('Un enemigo herido'),
  'The long tactical overview is translated as an intact paragraph');
const creatures = encounters.find(([name]) => name === 'Creatures encountered')[1];
assert(A.translateArchive(creatures).startsWith('Estas cifras corresponden'),
  'Dynamic creature tables retain a translated Spanish introduction');
const skillHelp = sections.find((entry) => entry.title === 'Your skills').topics;
assert(skillHelp.every(([title, answer]) => title.startsWith('Skill ') && answer.length > 30));
assert(A.translateArchive(skillHelp[1][1]).startsWith('Toque:'),
  'Full Paladin skill effects have authored technical Spanish UI translations');
const slowRule = sections.find((entry) => entry.title === 'Conditions and recovery')
  .topics.find(([name]) => name === 'Slow');
assert(A.translateArchive(slowRule[2]).includes('héroes y compañeros'),
  'Rule-derived cooldown figures include Spanish explanatory sentences');
for (const number of slowRule[2].match(/\d+(?:\.\d+)?/g) || [])
  assert(A.translateArchive(slowRule[2]).includes(number),
    'Translating condition figures does not change source number ' + number);


for (const language of ['en', 'es']) {
  const { scope, elements } = shell(language);
  const host = scope.Prototype;
  const opened = (title, description, actions, view) => {
    host.openMenu(title, description, actions, host.closeMenu, { view });
    return {
      title: elements.get('modal-title').textContent,
      description: elements.get('modal-description').textContent,
      actions: elements.get('modal-actions').children,
      dialogView: elements.get('modal').getAttribute('data-view'),
    };
  };
  const translate = language === 'es' ? A.translateArchive : (v) => v;
  for (const [index, s] of sections.entries()) {
    const openedShelf = opened(s.title, s.intro,
      s.topics.map(([title]) => ({ label: title, action() {} })), 'archive-shelf');
    assert.equal(openedShelf.title, translate(s.title), 'Shelf localization ' + s.title);
    assert.equal(openedShelf.description, translate(s.intro),
      'Shelf introduction localizes without changing source');
    assert.equal(openedShelf.actions.filter((e) => typeof e.click === 'function').length,
      s.topics.length, 'Every question remains an actionable control');
    assert.equal(openedShelf.dialogView, 'archive-shelf');
  }
  const approved = opened('The orders among the shelves', Approved.P05.en,
    [{ label: 'All shelves', action() {} }], 'archive-reading');
  assert.equal(approved.description, language === 'es' ? Approved.P05.es : Approved.P05.en,
    'Author-approved truth remains byte-for-byte unchanged');
  assert.equal(elements.get('modal-description').getAttribute('role'), 'document',
    'Long answers expose a reader-friendly document landmark');
  assert.equal(elements.get('modal-description').tabIndex, 0,
    'The full answer is available in keyboard Tab order');
  assert.equal(elements.get('modal-description').getAttribute('aria-label'),
    language === 'es' ? 'Lectura del Archivo' : 'Archive reading');
  assert.equal(approved.actions[0].textContent, language === 'es' ? 'Todos los estantes' : 'All shelves');
  const technical = sections.find((s) => s.title === 'Battle and protection').topics[0];
  const technicalAnswer = opened(technical[0], technical[1],
    [{ label: 'Show me the figures', action() {} }], 'archive-reading');
  if (language === 'es') {
    assert.equal(technicalAnswer.title, 'Acero, heridas y armadura');
    assert(technicalAnswer.description.startsWith('La armadura amortigua los golpes'),
      'Non-literary technical exposition has a Spanish counterpart');
    assert.equal(technicalAnswer.actions[0].textContent, 'Muéstrame las cifras');
  } else assert.equal(technicalAnswer.description, technical[1]);
  const figures = opened(technical[0], technical[2],
    [{ label: 'Return to the answer', action() {} }], 'archive-reading');
  for (const digit of technical[2].match(/\d+(?:\.\d+)?/g) || [])
    assert(figures.description.includes(digit), 'Numerical rule values remain ' + digit);
  assert(figures.description.length > 30);
  assert.equal(figures.actions[0].textContent, language === 'es' ?
    'Volver a la respuesta' : 'Return to the answer');
}
assert.equal(JSON.stringify(game.snapshot()), base,
  'Consulting localizations never changes save facts beyond explicit test gates');
console.log('PASS A4 language controls, author-final copy integrity, technical rule values and A5 shelf gates');

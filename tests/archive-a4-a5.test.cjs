'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const A = require('../src/prototype/archive.js');
const Approved = require('../src/prototype/narration.js').approved;
const { shell } = require('./helpers/production-shell.cjs');
const game = new C('normal', 'paladin', () => 0.93);
const base = JSON.stringify(game.snapshot());
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
game.s.keeperEvidence = false;
assert.equal(A.sections(game, { D: C.data, R: C.rules }).length, 8);
assert.equal(A.translateArchive(Approved.P05.es), Approved.P05.es,
  'Approved Spanish prose is immutable even with the technical glossary');
assert.equal(A.translateArchive(Approved.K03.es), Approved.K03.es);

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
assert.equal(JSON.stringify(game.snapshot()), base.replace('"keeperPact":false', '"keeperPact":false'),
  'Consulting localizations never changes save facts beyond explicit test gates');
console.log('PASS A4 language controls, author-final copy integrity, technical rule values and A5 shelf gates');

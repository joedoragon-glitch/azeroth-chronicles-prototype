'use strict';
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');
const A = require('../src/prototype/narration.js').approved;
for (const lang of ['en', 'es']) {
  const { scope: s, elements: e } = shell(lang);
  const rendered = (english) => {
    s.Prototype.openMenu('Narrative verification', english, []);
    return e.get('modal-description').textContent;
  };
  const expected = (entry) => (lang === 'es' ? entry.es : entry.en);
  for (const id of ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07',
    'P07_nomana', 'D01', 'D03', 'D04_entrance',
    'I01', 'I03', 'I04', 'L01', 'L02', 'L03', 'R01', 'R04',
    'M01', 'M02', 'M03', 'Throne_Keeper']) {
    assert.equal(rendered(A[id].en), expected(A[id]),
      id + ' must use its exact author-approved ' + lang + ' text');
  }
  const context = 'Flooded Marches. ' + A.K01.en + '\n\nPassive — current combat details';
  const localized = rendered(context);
  assert(localized.includes(expected(A.K01)), 'Dynamic archive response preserves approved bilingual history');
  assert(localized.includes('Passive — current combat details'),
    'Live reference appended after the author passage is not discarded');
  const evidence = rendered(A.R05.en + '\n\n' + A.R05_append.en);
  assert.equal(evidence, expected(A.R05) + '\n\n' + expected(A.R05_append));
  assert.equal(rendered(A.C04.en), expected(A.C04), 'Chronicle content is language-specific');
}
console.log('PASS author-approved bilingual modal output, dynamic Archive history and evidence append');

'use strict';
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const narration = require('../src/prototype/narration.js');
const approved = narration.approved;
assert(approved, 'The author-approved bilingual master is present');
const ids = Object.keys(approved).filter((id) => /^[CPDILKRM]\d\d$/.test(id));
assert.equal(ids.length, 53, 'Exactly 53 final core manuscripts are retained');
const pairData = ids.map((id) => [id, approved[id].en, approved[id].es]);
const digest = createHash('sha256').update(JSON.stringify(pairData)).digest('hex');
assert.equal(
  digest,
  '257823486c3a015feae278bec5d9124c14e38aa12551dacc6b9fe27897b8b4f2',
  'All 53 EN/ES passages must be exact DOCX transcriptions (including paragraph breaks)',
);
const extras = ['R05_append', 'P07_nomana', 'Throne_Keeper'];
assert.equal(
  createHash('sha256').update(JSON.stringify(extras.map((id) => [id, approved[id].en, approved[id].es]))).digest('hex'),
  '2fa84a1596aede97a99ebe5b5cbc44e356266c6268123866d8540e433b79a48a',
  'All three conditional supplements must remain exact approved copies',
);
for (const item of narration.filter(Boolean)) {
  assert.deepEqual([item.text, item.es], [approved[item.id].en, approved[item.id].es],
    'Every quest Chronicle must use the shared approved master text');
}
assert.equal(narration.filter(Boolean).length, 13);
assert.equal(narration.filter((x) => x === null).length, 17);
console.log('PASS 53 approved English/Spanish entries, conditional supplements, 13 cards and 17 silent slots');

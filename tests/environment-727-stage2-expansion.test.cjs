'use strict';
// #727 Stage 2 extension: source identity, nocturnal individuality and Crown
// comparisons must stay PREVIEWS; never rewrite the current playable catalog.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const book = require('../tools/audio/environment-727-outdoor-expansion.json');
const game = require('../assets/audio/manifest.json');
const original = require('../tools/audio/environment-book.json');
const root = path.resolve(__dirname, '..');

assert.equal(book.schemaVersion, 1);
assert.equal(book.sources.length, 3);
assert.equal(book.studies.length, 4);
assert.equal(original.cues.length, 14);
assert.equal(Object.values(game.assets).filter((v) => v.kind === 'ambience').length, 18);
assert.equal(game.director.environment.rules.length, 18);
assert.equal(Object.keys(game.director.places).length, 19);
const known = new Set();
for (const s of book.sources) {
  assert(!known.has(s.id)); known.add(s.id);
  assert.match(s.sha1, /^[a-f0-9]{40}$/, 'Source SHA-1 unpinned');
  assert.match(s.sha256, /^[a-f0-9]{64}$/, 'Source SHA-256 unpinned');
  assert(Number.isSafeInteger(s.bytes) && s.bytes > 1000 && s.bytes <= s.maxBytes);
  assert(/CC0 1.0/.test(s.license));
  assert(s.evidence && s.url);
  assert(
    s.url.startsWith('https://upload.wikimedia.org/wikipedia/commons/') ||
    s.url.startsWith('https://opengameart.org/sites/default/files/'));
}
assert.deepEqual(book.studies.map(v => [v.id, v.referenceBed, v.mainSource]), [
  ['study-vale-night-727', 'env-woodland-night', 'field-quiet-wind'],
  ['study-march-night-727', 'env-marsh-night', 'field-quiet-wind'],
  ['study-crown-open-727', 'env-crown-courtyard', 'field-quiet-wind'],
  ['study-crown-enclosed-727', 'env-crown-courtyard', 'building-howling-wind']
]);
for (const s of book.studies) {
  assert(known.has(s.mainSource));
  assert(original.cues.some(c => c.id === s.referenceBed));
  assert.equal(game.assets[s.referenceBed].managedBy, 'environment-book');
  assert.equal(game.assets[s.id], undefined, 'No experimental MP3 in runtime catalog');
  assert.equal(fs.existsSync(path.join(root, 'assets/audio/ambience', s.id+'.mp3')), false);
  assert.equal(s.events.length, 0, 'Do not manufacture new permanent creatures or industry');
  assert(s.fieldExcerptStart >= 0);
  assert(s.lowpassHz > s.highpassHz);
  if (s.secondarySource) {
    assert.equal(s.id, 'study-march-night-727', 'Only Marches may layer cautious low water');
    assert.equal(s.secondarySource, 'field-river-step');
    assert(s.secondaryGain <= 0.1, 'Source wildlife waterfall risk; avoid dominant river bed');
  }
}
assert.equal(game.director.environment.rules.find(v => v.id === 'vale-night').asset, 'env-woodland-night');
assert.equal(game.director.environment.rules.find(v => v.id === 'march-night').asset, 'env-marsh-night');
assert.equal(game.director.environment.rules.find(v => v.id === 'crown').asset, 'env-crown-courtyard');
assert.equal(book.constraints.registration, 'NO');
assert.equal(book.constraints.merged, 'NO');
assert.equal(book.constraints.deployed, 'NO');
assert.equal(book.encodedPreviewEvidence.outputs.length, 4,
  'All four recorded candidate masters need immutable source/encoded evidence');
assert.deepEqual(
  book.encodedPreviewEvidence.outputs.map(x=>x.id),book.studies.map(x=>x.id),
  'Freeze the output identities in source-study order');
for (const x of book.encodedPreviewEvidence.outputs) {
  assert.match(x.sha256,/^[0-9a-f]{64}$/);
  assert.equal(x.bytes,1158381,'Mono guarded 72s MP3 identity must remain measurable');
  assert(x.loopEdgeDelta < .005);
  assert(Math.abs(x.firstVsLast1SecDb) < 4.25);
  assert.equal(x.technicalSignal,'PASS');
  assert.equal(x.heard,false);
  assert.equal(x.gameRegistered,false);
}

console.log('PASS #727 nocturnal/Crown 4 studies: pinned physical original bytes, no new fauna, no playable asset edits, original 14 + four #711 masters/19 scenes/rules protected.');
console.log('ARTISTIC HOLD: real source identity/signal tests never certify whether a bird/frog/canyon/building actually fits the game.');

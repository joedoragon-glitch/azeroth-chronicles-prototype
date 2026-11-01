'use strict';
// #727 Stage 2 source/scene contract. These assertions prevent a candidate
// research artifact from silently changing the published game.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const book = require('../tools/audio/environment-727-outdoor-studies.json');
const manifest = require('../assets/audio/manifest.json');
const original = require('../tools/audio/environment-book.json');

assert.equal(book.schemaVersion, 1);
assert.equal(book.sources.length, 2, 'First source pass is deliberately small');
assert.equal(book.studies.length, 2, 'Only two daytime field comparisons are authorized');
assert.equal(original.cues.length, 14, 'All 14 physical original beds remain present');
assert.equal(
  Object.values(manifest.assets).filter((item) => item.kind === 'ambience').length,
  34,
  "16 Stage2–5 new masters must be registered in the game's environment catalog",
);
assert.equal(manifest.director.environment.rules.length, 22);

const ids = new Set();
for (const source of book.sources) {
  assert(!ids.has(source.id), 'duplicate source identity');
  ids.add(source.id);
  assert.match(source.sha1, /^[a-f0-9]{40}$/, 'SHA-1 original pin absent');
  assert.match(source.sha256, /^[a-f0-9]{64}$/, 'SHA-256 original pin absent');
  assert(Number.isSafeInteger(source.bytes) && source.bytes > 1000);
  assert(source.bytes <= source.maxBytes, 'Source exceeds reviewed budget');
  assert.equal(source.license, 'CC0 1.0');
  assert.equal(source.evidence, 'https://opengameart.org/content/park-ambiences');
  assert(source.url.startsWith('https://opengameart.org/sites/default/files/'));
  assert(source.pinnedBy.includes('/actions/runs/'), 'Independent source receipt absent');
  assert(source.durationSeconds > book.constraints.seconds + 3);
  assert.equal(source.codec, 'pcm_s16le 48000Hz stereo');
}
const expected = [
  ['study-vale-day-727', 'vale', 'env-woodland-day', 'vale-copse-field'],
  ['study-march-day-727', 'march', 'env-marsh-day', 'march-low-river-field'],
];
assert.deepEqual(
  book.studies.map((cue) => [
    cue.id,
    cue.region,
    cue.referenceBed,
    cue.mainSource,
  ]),
  expected,
  'Daylight sound design may change only with explicit Stage 2 review',
);
for (const cue of book.studies) {
  assert(ids.has(cue.mainSource));
  assert(original.cues.some((source) => source.id === cue.referenceBed));
  assert(manifest.assets[cue.referenceBed]?.managedBy === 'environment-book');
  assert.equal(manifest.director.environment.rules.find((r) => r.id === cue.region)?.asset, cue.id);
  assert.equal(manifest.assets[cue.id]?.kind, 'ambience');
  assert.equal(manifest.assets[cue.id].sha256,book.encodedPreviews.outputs.find(x=>x.id===cue.id).sha256);
  assert(fs.existsSync(path.join(root,'assets/audio/ambience',cue.id+'.mp3')));
  assert(Array.isArray(cue.events) && cue.events.length === 0, 'No surprise permanent fauna/oneshots');
}
assert.equal(
  manifest.director.environment.rules.find((r) => r.id === 'vale-night').asset,
  'study-vale-night-727',
  'Greenwood night bed and its event behavior remain protected',
);
assert.equal(
  manifest.director.environment.rules.find((r) => r.id === 'march-night').asset,
  'study-march-night-727',
  'Marches night bed and its water details remain protected',
);
assert.equal(
  manifest.director.environment.rules.find((r) => r.id === 'crown').asset,
  'study-crown-open-727',
  'Dark Crown remains protected until a suitable source exists',
);
assert.equal(book.constraints.registration, 'NO');
assert.equal(book.constraints.merged, 'NO');
assert.equal(book.constraints.deployed, 'NO');
console.log('PASS #727 Stage 2 source contract: exact dual digests/bytes, 2 verified daytime source masters registered, all 14 original environmental recordings retained; night and Crown preserved.');
console.log('ARTISTIC HOLD: file, codec and source declarations do not certify a human-heard source or game mix.');

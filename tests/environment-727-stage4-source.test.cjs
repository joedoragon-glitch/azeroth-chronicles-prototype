'use strict';
// The #727 five-dungeon study has no authority to alter published audio.
// Only add observations based on original recordings and keep exact hashes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const ledger = require('../tools/audio/environment-727-side-interiors.json');
const manifest = require('../assets/audio/manifest.json');
const book = require('../tools/audio/environment-book.json');
const {audio} = require('./helpers/audio-context.cjs');

assert.equal(ledger.schemaVersion, 1);
assert.equal(ledger.studies.length, 3);
assert.equal(ledger.sources.length, 6);
assert.equal(book.cues.length, 14);
assert.equal(Object.values(manifest.assets).filter(x=>x.kind==='ambience').length, 34);
assert.equal(Object.keys(manifest.assets).length,147);
assert.equal(manifest.director.environment.rules.length,22);
assert.equal(Object.keys(manifest.director.places).length,19);
assert.equal(ledger.hardConstraints.registered,false);
assert.equal(ledger.hardConstraints.merged,false);
assert.equal(ledger.hardConstraints.deployed,false);
assert.match(ledger.hardConstraints.inGamePlayback, /^NOT TESTED(?:\b|$)/, 'Candidate has never played in the game; explanatory detail is allowed');
const sources = new Set();
for (const s of ledger.sources) {
  assert(!sources.has(s.id),'Original source identity duplicated');
  sources.add(s.id);
  assert.match(s.sha1,/^[a-f0-9]{40}$/,s.id+': actual SHA-1 absent');
  assert.match(s.sha256,/^[a-f0-9]{64}$/,s.id+': actual SHA-256 absent');
  assert(Number.isSafeInteger(s.bytes)&&s.bytes>500&&s.bytes<=s.maxBytes);
  assert(s.url.startsWith('https://opengameart.org/sites/default/files/') ||
         s.url.startsWith('https://upload.wikimedia.org/wikipedia/commons/'));
  assert(/CC0|public domain/i.test(s.license) && s.evidence && s.creator);
}
const expected = [
 ['side-vale-cellars','env-cellar'],
 ['side-march-watchhouse','env-archive'],
 ['side-crown-foundry','env-mine'],
];
assert.deepEqual(ledger.studies.map(x=>[x.sceneId,x.referenceBed]),expected,
 'Three side-interior scene contracts cannot change without explicit review');
const production = audio();
production.enableProduction();
for (const c of ledger.studies) {
  assert(sources.has(c.mainSource));
  assert(c.events.length >= 1 && c.events.length<=2,'Only sparse recorded physical details');
  assert(c.room && c.negative && c.description);
  assert(c.reflectionMs.length === c.reflectionGains.length);
  assert(c.fieldGain>0 && c.windGain>0);
  assert.equal(manifest.assets[c.referenceBed].managedBy,'environment-book');
  assert.equal(manifest.assets[c.id]?.kind,'ambience');
  assert.equal(manifest.assets[c.id].sha256,ledger.encodedPreviewEvidence.outputs.find(x=>x.id===c.id).sha256);
  assert(fs.existsSync(path.join(root,'assets/audio/ambience',c.id+'.mp3')));
  assert.equal(manifest.director.environment.rules.find(x=>x.id===c.sceneId).asset,c.id);
  for(const ev of c.events) assert(sources.has(ev.source) && ev.peak<.05,
      c.id+': loud/unverified foley event');
  const cue=production.environmentCue({zone:c.sceneId,region:c.sceneId.includes('march')?'march':c.sceneId.includes('crown')?'crown':'vale',interior:'side',
    started:true,gameOver:false,night:false,situation:'world'});
  assert.equal(cue.asset,c.id,'Registered location must play new recorded bed '+c.sceneId);
}
production.dispose();
if (ledger.encodedPreviewEvidence) {
  const e=ledger.encodedPreviewEvidence.outputs;
  assert.equal(e.length,3);
  assert.deepEqual(e.map(x=>x.id),ledger.studies.map(x=>x.id));
  for(const c of e) {
    assert.match(c.sha256,/^[0-9a-f]{64}$/);
    assert.equal(c.bytes,1158381);
    assert.equal(c.techSignal,'PASS');
    assert.equal(c.heard,false);
    assert.equal(c.gameRegistered,false);
  }
}
console.log('PASS #727 Stage4: six original physical sources have dual hashes, three contextual side-interior masters now playable; all 18 original+prior masters, 18 rules/19 playable scenes, score and night effects protected.');
console.log('ARTISTIC HOLD: source identity and decoder QA do not prove an actual sound-designer or owner hearing decision.');

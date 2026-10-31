'use strict';
// #709 audit of the audit: a deliberately strict inventory, not artistic approval.
// Separate (1) real registered playable recordings, (2) real produced candidate
// evidence, (3) 19 actual location routes, and (4) missing replacement/ear gates.
// Any new source/render/scene count requires an explicit updated audit.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {audio} = require('./helpers/audio-context.cjs');
const root = path.resolve(__dirname, '..');
const manifest = require('../assets/audio/manifest.json');
const book = require('../tools/audio/environment-book.json');
const former = require('../tools/audio/environment-curated-pilots.json');
const regional = require('../tools/audio/environment-regional-studies.json');
const {publishedFiles} = require('../scripts/audio-assets.cjs');

function equalSets(actual, expected, reason) {
  assert.deepEqual([...new Set(actual)].sort(), [...new Set(expected)].sort(), reason);
  assert.equal(actual.length, new Set(actual).size, reason + ': duplicate identities');
}
function sha(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
const registered = Object.entries(manifest.assets).filter(([,a]) => a.kind === 'ambience');
const registeredIds = registered.map(([id]) => id);
assert.equal(registered.length, 14, 'A change to shipped ambience count requires explicit inventory reconciliation');
assert.equal(Object.keys(manifest.assets).length, 127, 'Entire catalog changed: audit audio release contract first');
assert.equal(book.cues.length, 14);
equalSets(registeredIds, book.cues.map(c=>c.id), 'Original source book versus playable recordings');

// Source file listing must equal the manifest, not merely contain it. Any
// forgotten MP3 in assets/audio/ambience makes this inventory test fail.
const folder = path.join(root, 'assets/audio/ambience');
const physical = fs.readdirSync(folder).filter(x=>/\.(mp3|ogg|wav)$/i.test(x)).sort();
const referenced = registered.map(([,a]) => path.basename(a.src)).sort();
equalSets(physical, referenced, 'Physical ambient files and catalog registration');
for (const [id,asset] of registered) {
  assert.equal(asset.managedBy, 'environment-book', id+' changes source method: reconsider audit');
  assert.equal(asset.loop.start,.15);
  assert.equal(asset.loop.end,24.15);
  const bytes = fs.readFileSync(path.join(root,asset.src.slice(2)));
  assert.equal(sha(bytes),asset.sha256,id+' actual registered bytes differ from catalog');
  assert(asset.credits?.license && asset.credits?.author,id+' credits absent');
}
assert(publishedFiles(root).includes('assets/audio/manifest.json'));
assert.equal(manifest.director.environment.rules.length,18);
assert.equal(Object.keys(manifest.director.places).length,19);

// Explicit complete 19-place reconciliation. Note that one shared sound
// serves four Treasuries: 19 scene contexts != 19 unique authored tracks.
const scenes = [
  ['vale','vale','outdoors','env-woodland-day'],
  ['march','march','outdoors','env-marsh-day'],
  ['highlands','highlands','outdoors','env-highland-wind'],
  ['frontier','frontier','outdoors','env-frontier-air'],
  ['crown','crown','outdoors','env-crown-courtyard'],
  ['crypt','vale','dungeon','env-retreat'],
  ['archive','march','dungeon','env-archive'],
  ['mine','highlands','dungeon','env-mine'],
  ['abyss','frontier','dungeon','env-dragon-hall'],
  ['citadel','crown','dungeon','env-citadel'],
  ['supply-vale','vale','treasury','env-home'],
  ['supply-march','march','treasury','env-home'],
  ['supply-highlands','highlands','treasury','env-home'],
  ['supply-crown','crown','treasury','env-home'],
  ['side-vale-cellars','vale','side-dungeon','env-cellar'],
  ['side-march-watchhouse','march','side-dungeon','env-archive'],
  ['side-highlands-signal','highlands','side-dungeon','env-cellar'],
  ['side-frontier-shrine','frontier','side-dungeon','env-retreat'],
  ['side-crown-foundry','crown','side-dungeon','env-mine'],
];
equalSets(scenes.map(s=>s[0]),Object.keys(manifest.director.places),'All authored playable scenes represented');
const a=audio();
a.enableProduction();
for(const [zone,region,interior,expected] of scenes) {
  const route=a.environmentCue({zone,region,interior,night:false,
    started:true,gameOver:false,situation:'world'});
  assert(route,zone+' has no playable ambient route');
  assert.equal(route.asset,expected,'PLAYABLE route changed without audit update: '+zone);
  assert(registeredIds.includes(route.asset),zone+' references a missing audio master');
  console.log('INVENTORY_SCENE '+JSON.stringify({zone,bed:route.asset,status:'registered-original'}));
}
for(const [region,id] of [['vale','env-woodland-night'],['march','env-marsh-night']]){
  assert.equal(a.environmentCue({zone:region,region,interior:'outdoors',night:true,
    started:true,situation:'world'}).asset,id,'separate night recording route');
}
a.dispose();

// The candidate projects have distinct final identifiers. Early experiments
// (including intermediate 24-second and pre-correction takes) are documented
// separately and are not silently counted as approved/registered audio.
const firstIds=['side-highlands-signal-preview','side-frontier-shrine-preview'];
const currentIds=['regional-ironroot-autumn','regional-frontier-recovery',
  'regional-signal-occupied','regional-shrine-occupied'];
equalSets(former.pilots.map(p=>p.id),firstIds,'Two retained historical pilot master identities');
equalSets((former.evidence?.outputs||[]).map(x=>x.id),firstIds,'Two pilot encoded evidence entries');
equalSets(regional.studies.map(p=>p.id),currentIds,'Four newer authoring studies');
equalSets((regional.finalRecordedOutputs?.candidateFiles||[]).map(x=>x.id),
  currentIds,'Four newer actually rendered MP3 evidence entries');
const both=[...(former.evidence?.outputs||[]),...(regional.finalRecordedOutputs?.candidateFiles||[])];
equalSets(both.map(x=>x.id), [...firstIds,...currentIds], 'All six retained audit outputs');
for(const output of both){
  const digest=output.sha256;
  assert(/^[0-9a-f]{64}$/.test(digest),'Candidate MP3 SHA missing '+output.id);
  assert.equal(output.encodedBytes ?? output.bytes,1158381,output.id+' encoded byte size drift');
  assert(!registeredIds.includes(output.id),output.id+' accidentally registered without design review');
  assert(!fs.existsSync(path.join(folder,output.id+'.mp3')),
    output.id+' untracked candidate entered game assets');
  console.log('INVENTORY_CANDIDATE '+JSON.stringify({id:output.id,
    sha256:digest,status:currentIds.includes(output.id)?'new-studio-only':'superseded-studio-only'}));
}
for(const item of regional.sources) {
  assert(/^[a-f0-9]{40}$/.test(item.sha1),item.id+' external source SHA-1 is not pinned');
  assert(Number.isSafeInteger(item.bytes)&&item.bytes>1000,item.id+' source bytes absent');
  assert(item.evidence&&item.license&&item.creator,item.id+' provenance absent');
}
assert.equal(former.status.registered,'NO');
assert.equal(regional.status.sourceInGame,'NO');
assert.equal(regional.status.artisticAcousticHearing.startsWith('UNVERIFIED'),true);
assert.equal(regional.status.ownerFinalAcceptance.startsWith('HOLD'),true);
assert.equal(regional.status.merged,'NO');
assert.equal(regional.status.published,'NO');
assert.equal(regional.finalRecordedOutputs.candidateFiles.length,4);
console.log('PASS #709 completeness audit: 14/14 shipped actual MP3 hashes and no orphan source; ' +
  '19/19 explicit playable scene routes, 18 ordering rules, 2 nights; ' +
  '2 superseded + 4 newer studio masters have identities/hashes/provenance/evidence.');
console.log('HOLD #709 delivery: 0/4 new intended sounds registered, 0/19 locations use a '+
  'new studio master, 14/14 existing MP3s unchanged. No genuine listening, integrated '+
  'new-recording music/warning QA or owner acceptance. NOT MERGE READY AS REPLACEMENT.');

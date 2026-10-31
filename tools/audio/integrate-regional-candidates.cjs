'use strict';
// Issue #709: promote ONLY four pinned, already-produced 72s masters to the
// unmerged draft game catalog. Original files stay physically registered for
// reversible before/after comparisons. This script never merges or deploys.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { registerBatch } = require('../../scripts/audio-library.cjs');
const { publishedFiles } = require('../../scripts/audio-assets.cjs');
const root = path.resolve(__dirname, '../..');
const studio = JSON.parse(fs.readFileSync(path.join(root,'tools/audio/environment-regional-studies.json'), 'utf8'));
const original = JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json'), 'utf8'));
const input = process.argv[2];
if (!input || !fs.statSync(input).isDirectory()) throw Error('Provide extracted, pinned studio artifact directory');
const mapping = [
  { study:'regional-ironroot-autumn', id:'env-highlands-autumn', route:'highlands',
    title:'Ironroot Highlands — autumn hardwood air',
    author:'Wilfredor (CC0 original field recording); SIBDLP environmental sound design',
    guide:'72-second recorded autumn forest air and hardwood leaves with subdued spatial texture. Original source: Wilfredor, Commons CC0, SHA-1 b10826f1c65d4c1bea131fc93592baf6e4829fe6. Guarded mono MP3, not heard-approved. Keep music, footsteps and warnings legible.' },
  { study:'regional-frontier-recovery', id:'env-frontier-recovery', route:'frontier',
    title:'Ashen Frontier — recovering open fields',
    author:'Thimras (CC0 original wind recording); SIBDLP environmental sound design',
    guide:'72-second independently sourced open-field wind in recovering Frontier. Original source: Thimras OpenGameArt CC0, SHA-1 b518ae8ad9a5e83f6a1479d3f9190d962af52673. Not generic constant fire. Guarded mono MP3, not heard-approved.' },
  { study:'regional-signal-occupied', id:'env-signal-occupied', route:'side-highlands-signal',
    title:'Old Signal Keep — occupied timber refuge',
    author:'Wilfredor (CC0 forest); stephan (public-domain timber recording); SIBDLP sound design',
    guide:'72-second enclosed Old Signal Keep: highland field air filtered as exterior leakage with one rare physical timber object creak. Sources: Wilfredor and stephan; Commons SHA-1 b10826f1c65d4c1bea131fc93592baf6e4829fe6 and d0fcb9a572c27ddf16892c6bd65a52156d1ad0a1. Object origin casket, timbral fit UNHEARD.' },
  { study:'regional-shrine-occupied', id:'env-shrine-occupied', route:'side-frontier-shrine',
    title:'Ruined Shrine Barracks — lived-in shelter',
    author:'Thimras (CC0 field); thore (public-domain wood); SIBDLP sound design',
    guide:'72-second enclosed occupied shrine/barracks: Frontier wind filtered through structure, one rare actual wood-and-cutlery recording (possible recognizable utensil risk). Sources: Thimras and thore; SHA-1 b518ae8ad9a5e83f6a1479d3f9190d962af52673 and 9ca9ab8edadd4671cd67f36ea6ae37365db6d26e. First/last 1s RMS boundary about 4.011 dB; listening HOLD.' },
];
const expectedOld = {
  highlands:'env-highland-wind', frontier:'env-frontier-air',
  'side-highlands-signal':'env-highland-wind',
  'side-frontier-shrine':'env-frontier-air'
};
const actual = studio.finalRecordedOutputs.candidateFiles;
if (mapping.length !== 4 || actual.length !== 4 ||
    original.director.environment.rules.length !== 18 ||
    Object.values(original.assets).filter(a=>a.kind==='ambience').length !== 14)
  throw Error('Unexpected original source/game inventory; stop rather than guessing');
for (const {route} of mapping) {
  const rule = original.director.environment.rules.find(x=>x.id===route);
  if (!rule || rule.asset!==expectedOld[route]) throw Error('Existing route changed: '+route);
}
const registrations=[];
for (const item of mapping){
  const entry=actual.find(x=>x.id===item.study);
  if (!entry || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw Error('Unpinned audio '+item.study);
  const source=path.join(input,item.study+'.mp3');
  if (!fs.statSync(source).isFile()) throw Error('Missing physical master '+source);
  const bytes=fs.readFileSync(source);
  const actualSha=crypto.createHash('sha256').update(bytes).digest('hex');
  if(actualSha!==entry.sha256 || bytes.length!==entry.bytes)
    throw Error('Original artifact MP3 hash/byte mismatch '+item.study);
  const dest='assets/audio/ambience/'+item.id+'.mp3';
  const absolute=path.join(root,dest);
  if (fs.existsSync(absolute)) throw Error('Never overwrite sound assets: '+dest);
  fs.copyFileSync(source,absolute);
  registrations.push({id:item.id,file:dest,kind:'ambience',author:item.author,
    license:'CC0-1.0 / public domain',title:item.title,'loop-start':0.15,'loop-end':72.15});
}
const manifest=registerBatch(root,registrations);
for (const item of mapping) {
  const entry=manifest.assets[item.id];
  entry.generationGuide=item.guide;
  entry.creativeSource='Licensed real field recordings, pinned in tools/audio/environment-regional-studies.json; authored mix/encode by environmental studio.';
  const rule=manifest.director.environment.rules.find(x=>x.id===item.route);
  rule.asset=item.id;
}
if(Object.keys(manifest.assets).length!==131 ||
  Object.values(manifest.assets).filter(a=>a.kind==='ambience').length!==18 ||
  manifest.director.environment.rules.length!==18)
  throw Error('Post-integration asset or scene count unexpectedly changed');
publishedFiles(root,manifest);
fs.writeFileSync(path.join(root,'assets/audio/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
// Preserve the original provenance and artistic cautions. Mark only the
// registration fact as complete; technical acceptance is tested separately.
studio.constraints.registered=true;
studio.status.sourceInGame='YES; four exact MP3 candidates installed as additional independent scene-specific environment IDs on unmerged draft; all 14 original bed files retained';
studio.status.playableSourceTesting='PENDING at integration; CI real-game tests must independently confirm';
studio.status.integratedSourceHead='determined by GitHub merge/CI run; script does not claim final acceptance';
fs.writeFileSync(path.join(root,'tools/audio/environment-regional-studies.json'),JSON.stringify(studio,null,2)+'\n');
for(const item of mapping) console.log('INTEGRATED '+JSON.stringify({
  scene:item.route,old:expectedOld[item.route],new:item.id,
  sha256:manifest.assets[item.id].sha256,loop:manifest.assets[item.id].loop
}));
console.log('PASS four source-verified masters added; all 14 originals retained; no nocturnal event changes; no merge/deploy');

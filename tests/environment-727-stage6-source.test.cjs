'use strict';
// #727 Stage 6 nonmutating source gate before temporary CI overlay. No audio registration.
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const original=require('../assets/audio/manifest.json');
assert.equal(Object.keys(original.assets).length,131);
assert.equal(original.director.environment.rules.length,18);
assert.equal(Object.keys(original.director.places).length,19);
const homes=original.director.environment.rules.find(x=>x.id==='homes');
assert.equal(homes.when.interior,'treasury');
assert.equal(homes.asset,'env-home');
assert.equal(original.director.environment.combatGain,.45);
assert.equal(original.director.environment.bossGain,.25);
execFileSync(process.execPath,['tools/audio/environment-727-stage6-lab.cjs','--preflight'],{cwd:root,stdio:'inherit'});
// Once the studio masters are pinned, the permanent source archive becomes
// self-authenticating. Their hashes are not game manifest registrations.
const fs=require('node:fs');
const crypto=require('node:crypto');
const pinned=path.join(root,'tools/audio/frozen-preview');
if(fs.existsSync(pinned)){
  const specs=[
    ['environment-727-outdoor-studies.json','encodedPreviews'],
    ['environment-727-outdoor-expansion.json','encodedPreviewEvidence'],
    ['environment-727-dungeon-studies.json','encodedPreviewEvidence'],
    ['environment-727-side-interiors.json','encodedPreviewEvidence'],
    ['environment-727-treasury-studies.json','encodedPreviewEvidence'],
  ];
  const outputs=specs.flatMap(([file,key])=>{
    const ledger=JSON.parse(fs.readFileSync(path.join(root,'tools/audio',file),'utf8'));
    return ledger[key].outputs;
  });
  assert.equal(outputs.length,16,'All 16 frozen source-studio outputs required');
  const expected=outputs.map(x=>x.id+'.mp3').sort();
  const files=fs.readdirSync(pinned).filter(x=>x.endsWith('.mp3')).sort();
  assert.deepEqual(files,expected,'Pinned preview set must match frozen source ledgers');
  for(const output of outputs){
    const bytes=fs.readFileSync(path.join(pinned,output.id+'.mp3'));
    assert.equal(bytes.length,output.bytes,output.id+' archive byte length');
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),
      output.sha256,output.id+' archive SHA-256 mismatch');
  }
  console.log('PASS #727 Stage6 durable source preview archive: 16/16 exact SHA-256 and byte length, all deliberately unregistered.');
}
// The owner-only listening room is another non-game source component; ensure
// every linked script parses and the on-disk HTML exposes the controls used by
// the isolated comparison. Its full source/data packaging runs after CI import.
for(const p of [
  'tools/audio/environment-727-audition-pack.cjs',
  'tools/audio/environment-727-audition/player.js'
]){
  assert(fs.existsSync(path.join(root,p)),p+' must be tracked');
  execFileSync(process.execPath,['--check',p],{cwd:root,stdio:'inherit'});
}
const audition=fs.readFileSync(path.join(root,'tools/audio/environment-727-audition/index.html'),'utf8');
for(const id of ['scene','original','candidate','amb','score','critical','warning','decision','notes','export'])
  assert(audition.includes('id="'+id+'"'),'Audition control missing: '+id);
assert(audition.includes('src="data.js"')&&audition.includes('src="player.js"'),
  'Portable listening room must load embedded manifest and local player scripts');
console.log('PASS #727 owner-only offline A/B listening room source syntax/control inventory, no playable-registration change.');

console.log('PASS #727 Stage6 source preflight: all archived studio candidates remain outside the playable original catalog.');

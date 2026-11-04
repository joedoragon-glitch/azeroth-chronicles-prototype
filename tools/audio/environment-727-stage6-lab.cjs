'use strict';
// #727 permanent source-locked game and independent Sound Library promotion QA.
// Historic A/B masters are registered already; NEVER modify a playable file
// in this test. This script writes only its disposable evidence report.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),
  assert=require('node:assert/strict'),cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const live=read('assets/audio/manifest.json'),map=read('tools/audio/environment-727-production-routing.json');
const ledgers=[
 ['outdoors-day','environment-727-outdoor-studies.json','encodedPreviews'],
 ['outdoors-night-crown','environment-727-outdoor-expansion.json','encodedPreviewEvidence'],
 ['dungeons','environment-727-dungeon-studies.json','encodedPreviewEvidence'],
 ['side-interiors','environment-727-side-interiors.json','encodedPreviewEvidence'],
 ['treasuries','environment-727-treasury-studies.json','encodedPreviewEvidence']
];
const studies=[];
for(const [stage,file,key] of ledgers){
 const ledger=read('tools/audio/'+file),output=ledger[key]?.outputs;
 assert.equal(output?.length,ledger.studies.length,'Incomplete archival source ledger '+file);
 for(const s of ledger.studies){
  const proof=output.find(v=>v.id===s.id);
  const asset=live.assets[s.id],fileName=s.id+'.mp3';
  assert(proof && proof.bytes===1158381 && /^[a-f0-9]{64}$/.test(proof.sha256));
  assert(asset?.kind==='ambience' && asset.sha256===proof.sha256);
  assert.equal(asset.src,'./assets/audio/ambience/'+fileName);
  assert.equal(asset.creationMethod,'imported-recording');
  assert.equal(asset.loop.start,0.15);
  assert.equal(asset.loop.end,72.15);
  for(const folder of ['assets/audio/ambience','tools/audio/frozen-preview']){
   const bytes=fs.readFileSync(path.join(ROOT,folder,fileName));
   assert.equal(bytes.length,proof.bytes,'Changed frozen MP3 byte length '+fileName);
   assert.equal(sha(bytes),proof.sha256,'Changed frozen MP3 hash '+fileName);
  }
  const sourceIds=[s.mainSource,s.secondarySource,...(s.events||[]).map(e=>e.source)].filter(Boolean);
  const inputs=sourceIds.map(id=>{
   const original=ledger.sources.find(x=>x.id===id);
   assert(original&&/CC0|public domain/i.test(original.license));
   assert(/^[a-f0-9]{64}$/.test(original.sha256));
   return {id,creator:original.creator||original.author,license:original.license,
     sha256:original.sha256,evidence:original.evidence||original.url};
  });
  if(process.argv.includes('--materialize')){
   const result=JSON.parse(cp.execFileSync('ffprobe',['-v','error','-show_entries',
     'format=duration:stream=codec_name,channels,sample_rate','-of','json',
     path.join(ROOT,'assets/audio/ambience',fileName)],{encoding:'utf8'}));
   assert(result.streams[0].codec_name==='mp3'&&result.streams[0].channels===1);
   assert(Number(result.format.duration)>=72.15&&Number(result.format.duration)<74);
  }
  studies.push({id:s.id,stage,sceneId:s.sceneId||s.region||null,referenceBed:s.referenceBed,
    sha256:proof.sha256,bytes:proof.bytes,inputs});
 }
}
assert.equal(studies.length,16);
assert.equal(Object.keys(live.assets).length,147);
assert.equal(live.director.environment.rules.length,22);
assert.equal(Object.keys(live.director.places).length,19);
assert.equal(Object.values(live.assets).filter(x=>x.kind==='ambience').length,34);
assert.equal(Object.values(live.assets).filter(x=>x.kind==='music').length,83);
assert.equal(Object.values(live.assets).filter(x=>x.kind==='effect').length,30);
assert.equal(live.director.environment.combatGain,.45);
assert.equal(live.director.environment.bossGain,.25);
assert.deepEqual(Object.keys(map.treasuryReuse).sort(),['supply-highlands','supply-vale']);
for(const [rule,asset] of Object.entries(map.existingRuleReplacements)){
 assert.equal(live.director.environment.rules.find(r=>r.id===rule)?.asset,asset,
   'Promoted playable route did not match source-locked study '+rule);
}
for(const [rule,asset] of Object.entries(map.treasurySpecificRules)){
 const spec=live.director.environment.rules.find(r=>r.id===rule);
 assert(spec&&spec.when.zone===rule&&spec.asset===asset,'Missing new Treasury route '+rule);
 assert.notEqual(asset,'env-home','No existing Treasury uses old home bed');
}
assert.equal(live.director.environment.rules.find(r=>r.id==='homes')?.asset,'env-home',
 'Only unknown future Treasury routes retain original generic fallback');
const isolated=require('../../scripts/audio-assets.cjs').publishedFiles(ROOT,live);
assert.equal(isolated.filter(x=>x.startsWith('assets/audio/ambience/')&&x.endsWith('.mp3')).length,34);
console.log('PASS #727 PERMANENT SOURCE PREFLIGHT: 16 frozen SHA-verified physical MP3s now game-registered, 19/19 places and 22 rules, original 14 preserved, both missing Treasuries accounted for; no deploy.');
if(!process.argv.includes('--materialize'))process.exit(0);
const baselinePath=' _site-env727-baseline/assets/audio/manifest.json'.trim();
const previous=read(baselinePath);
assert.equal(Object.keys(previous.assets).length,131);
assert.equal(previous.director.environment.rules.length,18);
for(const [id,old] of Object.entries(previous.assets))
 assert.equal(live.assets[id]?.sha256,old.sha256,'Old recordings and all new music changed '+id);
const originalRouting=previous.director.environment.rules.map(r=>({
 id:r.id,when:r.when,asset:r.asset,gain:r.gain,fade:r.fade
}));
const trialsSelected=[];
for(const [rule,trial] of Object.entries(map.existingRuleReplacements)){
 const initial=previous.director.environment.rules.find(r=>r.id===rule);
 const final=live.director.environment.rules.find(r=>r.id===rule);
 assert(initial&&final&&final.asset===trial);
 trialsSelected.push({rule,original:initial.asset,trial,gain:initial.gain,fade:initial.fade});
}
for(const rule of ['supply-march','supply-crown']){
 const now=live.director.environment.rules.find(r=>r.id===rule);
 const home=previous.director.environment.rules.find(r=>r.id==='homes');
 trialsSelected.push({rule:'stage6-'+rule,original:'env-home',trial:now.asset,gain:home.gain,fade:home.fade});
}
assert.equal(trialsSelected.length,15);
const report={project:'SIBDLP #727 REGISTERED Stage 6/7 game+Sound Library build (NO DEPLOY)',
 sourceBase:'Published dev.248 main; new game candidate dev.249',
 studies,trialsSelected,retainedTreasuries:['supply-vale','supply-highlands'],
 reusedTreasuries:map.treasuryReuse,unselectedAlternative:[map.crownAlt],
 originalRouting,originalManifestSha256:sha(Buffer.from(JSON.stringify(previous))),
 gameRegistered:true,merged:false,deployed:false,humanHeard:false,deviceVerified:false,
 publishedMusicPreserved:true,originalAssetCount:131,registeredAssetCount:147,
 registeredEnvironmentRules:22,registeredPlayablePlaces:19,
 browserCacheBudgetBytes:128*1024*1024,browserCacheRetentionBudgetBytes:96*1024*1024,
 browserCacheMaximumOverrideBytes:192*1024*1024,
 status:'Permanent game source and Sound Library registration in review branch; CI only, not merged or deployed; owner perceptual listening NOT certified'};
const output=path.join(ROOT,'test-results/environment-727-stage6-trial.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log('PASS #727 Stage 6/7 production registry 147 assets / 22 rules, exact pinned MP3 + published-score hashes, 19 location identities and no old assigned Treasury beds; report only, no mutation/deploy.');
